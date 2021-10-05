import uuid
import hashlib
import os 
from django import forms
from django.db import models
from django.contrib.postgres.fields import HStoreField
from django.contrib.auth.models import User
from django.utils.translation import ugettext_lazy as _
from django.contrib.gis.db import models as g
from grout.models import GroutModel, Record, RecordType
from django.db.models.signals import pre_save, post_save
from driver import settings
from django.dispatch import receiver
from django.db import connection
from django.contrib.gis.geos import GEOSGeometry
from constance import config
from model_utils import FieldTracker
from django_redis import get_redis_connection

class SegmentSet(models.Model):
    class Meta(object):
        verbose_name = _('Segment Set')
        verbose_name_plural = _('Segment Sets')
    name = models.TextField(max_length=200,null=True)
    effective_start = models.DateTimeField()
    effective_end = models.DateTimeField(null=True, blank=True)
    record_type = models.ForeignKey('grout.RecordType', on_delete=models.PROTECT)
    
class Segment(models.Model):
    class Meta(object):
        verbose_name = _('Segment')
        verbose_name_plural = _('Segments')
    geom = g.LineStringField(srid=settings.GROUT['SRID'], null=True, blank=True)
    name = models.TextField(max_length=200,null=True)
    data = HStoreField()
    segment_set=models.ForeignKey(SegmentSet, null=True, on_delete=models.SET_NULL)

class RecordSegment(models.Model):
    class Meta(object):
        verbose_name = _('Record Segment')
        verbose_name_plural = _('Record Segments')
    geom = g.LineStringField(srid=settings.GROUT['SRID'], null=True, blank=True)
    name = models.TextField(max_length=200,null=True)
    roadmap=models.ForeignKey('black_spots.RoadMap', on_delete=models.CASCADE, null=True)
    size=models.IntegerField()
    data = HStoreField()
    def calculate_cost(self, recordtype):
        cost=RecordCostConfig.objects.last()
        if cost is not None:
            n=0
            price=0
            for re in self.driverrecord_set.filter(archived=False, schema=recordtype.get_current_schema()):
                data=re.data
                n+=1
                if cost.content_type_key in data:
                    if cost.property_key in data[cost.content_type_key]:
                        if type(data[cost.content_type_key][cost.property_key])==str:
                            if data[cost.content_type_key][cost.property_key] in cost.enum_costs:
                                price+=float(cost.enum_costs[data[cost.content_type_key][cost.property_key]])
                        else:
                            price+=data[cost.content_type_key][cost.property_key]
            if n>0:
                self.data['cost']=price
                self.data['count']=n
                self.save()
            else:
                self.delete()
            return self.data




class DriverRecord(Record):
    """Extend Grout Record model with custom fields"""
    weather = models.CharField(max_length=50, null=True, blank=True)
    light = models.CharField(max_length=50, null=True, blank=True)

    city = models.CharField(max_length=50, null=True, blank=True)
    city_district = models.CharField(max_length=50, null=True, blank=True)
    county = models.CharField(max_length=50, null=True, blank=True)
    neighborhood = models.CharField(max_length=50, null=True, blank=True)
    road = models.CharField(max_length=200, null=True, blank=True)
    state = models.CharField(max_length=50, null=True, blank=True)
    segment = models.ManyToManyField(RecordSegment)
    
    def geocode(self, roadmap_uuid, size):
        with connection.cursor() as cursor:
            if self.geom:
                print("select * from works.find_segment(%s, %s, %s)" % (self.geom.ewkt, size, str(roadmap_uuid)))
                cursor.execute("select * from works.find_segment(%s, %s, %s)", [self.geom.ewkt, size, str(roadmap_uuid)])
                row = cursor.fetchone()
                if row[0] is not None:
                    s=RecordSegment.objects.filter(
                        geom=GEOSGeometry(row[0]),
                        size=size,
                        roadmap_id=roadmap_uuid
                    )
                    if not len(s):
                        seg=RecordSegment(
                            roadmap_id=roadmap_uuid, 
                            data={},
                            size=size,
                            name=row[1],
                            geom=GEOSGeometry(row[0])
                        )
                        seg.save()
                    else:
                        seg=s[0]
                    self.segment.add(seg)
                    return seg
                else:
                    print("Road not found.")
                    return None
"""
    def save(self, *args, **kwargs):
        self.geocode()
        super(DriverRecord, self).save(*args, **kwargs)
        



    cost=RecordCostConfig.objects.last()
    if cost is not None:
        n=0
        price=0
        if instance.tracker.previous('segment') is not None:
            s=RecordSegment.objects.get(pk=instance.tracker.previous('segment'))
            if s != instance.segment:
                s.calculate_cost(instance.data)
        if instance.segment is not None:
            instance.segment.calculate_cost(instance.data)

@receiver(pre_save, sender=DriverRecord)
def record_before_save(sender, instance, **kwargs):
  

"""


def get_image_path(instance, filename):
    return os.path.join('photos', str(instance.id), filename)

class Picture(models.Model):
    image = models.ImageField(upload_to=get_image_path, blank=True, null=True)
    record = models.ForeignKey(DriverRecord, null=True, on_delete=models.SET_NULL)

class RecordForm(forms.ModelForm):
    class Meta:
        model = DriverRecord
        fields = ('geom',)

class RecordAuditLogEntry(models.Model):
    """Records an occurrence of a Record being altered, who did it, and when.

    Note that 'user' and 'record' are maintained as foreign keys for convenience querying,
    but these fields can be set to NULL if the referenced object is deleted. If a user or
    record has been deleted, then 'username' or 'record_uuid' should be used, respectively.
    """
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Store both a foreign key and the username so that if the user is deleted this can still
    # be useful.
    user = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    username = models.CharField(max_length=30, db_index=True)
    # Same for the record; if the record this refers to is deleted we still want to be able to
    # determine which audit log entries pertained to that record.
    record = models.ForeignKey(DriverRecord, null=True, on_delete=models.SET_NULL)
    record_uuid = models.CharField(max_length=36, db_index=True)

    date = models.DateTimeField(auto_now_add=True, db_index=True)

    class ActionTypes(object):
        CREATE = 'create'
        UPDATE = 'update'
        DELETE = 'delete'

        choices = (
            (CREATE, 'Create'),
            (UPDATE, 'Update'),
            (DELETE, 'Delete')
        )

        @classmethod
        def as_list(cls):
            return [cls.CREATE, cls.UPDATE, cls.DELETE]

    action = models.CharField(max_length=6, choices=ActionTypes.choices)

    # The log JSON will contain `old` and `new` state of the model
    log = models.TextField(null=True)
    # Singature will contain an MD5 hash of the log field
    signature = models.CharField(max_length=36, null=True)

    def verify_log(self):
        if self.log is None:
            return True
        return hashlib.md5(self.log).hexdigest() == str(self.signature)


class DedupeJob(models.Model):
    """ Stores information about a celery job
    """

    class Status(object):
        """Status of job"""
        PENDING = 'PENDING'
        STARTED = 'STARTED'
        SUCCESS = 'SUCCESS'
        ERROR = 'ERROR'
        CHOICES = (
            (PENDING, 'Pending'),
            (STARTED, 'Started'),
            (SUCCESS, 'Success'),
            (ERROR, 'Error'),
        )

    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    datetime = models.DateTimeField(auto_now_add=True, db_index=True)
    status = models.CharField(max_length=8, choices=Status.CHOICES, default=Status.PENDING)
    celery_task = models.UUIDField(null=True)

    class Meta(object):
        get_latest_by = 'datetime'


class RecordDuplicate(GroutModel):
    """ Store information about a possible duplicate record pair
    Duplicates are found using a time-distance heuristic
    """
    record = models.ForeignKey(DriverRecord, null=True, related_name="record", on_delete=models.PROTECT)

    duplicate_record = models.ForeignKey(DriverRecord, null=True,
                                         related_name="duplicate_record", on_delete=models.PROTECT)
    score = models.FloatField(default=0)
    resolved = models.BooleanField(default=False)
    job = models.ForeignKey(DedupeJob, on_delete=models.PROTECT)


class RecordCostConfig(GroutModel):
    class Meta(object):
        verbose_name = _('Record Cost Config')
        verbose_name_plural = _('Record Cost Configs')
    """Store a configuration for calculating costs of incidents.

    This takes the form of a reference to an enum field on a RecordType, along with user-
    configurable mapping of societal costs for each possible value of that enum.
    """
    #: The record type whose records should be cost-aggregated
    # This will likely need to be set automatically by the front-end
    record_type = models.ForeignKey(RecordType, on_delete=models.PROTECT)

    #: Key of the schema property to access (Related Content Type, e.g.'accidentDetails')
    # This will also likely need to be set automatically by the front-end, or at least filtered so
    # that users cannot select content types which allow multiple entries
    content_type_key = models.TextField()

    #: Key of the content type property to access (e.g. 'Severity')
    # This will need to be filtered on the front-end to enums.
    property_key = models.TextField()

    #: User-configurable prefix to cost values
    cost_prefix = models.CharField(max_length=6, blank=True, null=True)

    #: User-configurable suffix to cost values
    cost_suffix = models.CharField(max_length=6, blank=True, null=True)

    @property
    def path(self):
        """Gets the field path specified by this object within a schema"""
        return [self.content_type_key, 'properties', self.property_key]

    #: Mappings between enumerations and cost values (e.g. {'Fatal': 1000000,
    #                                                       'Serious injury': 50000, ...})
    # This should be auto-populated by the front-end once a property_key is selected.
    enum_costs = HStoreField()

class Dictionary(models.Model):
    class Meta(object):
        verbose_name = _('Dictionary')
        verbose_name_plural = _('Dictionaries')
    def __str__(self):
        return self.language_code

    language_code=models.TextField(max_length=8)
    name=models.TextField(max_length=100)
    content=HStoreField()