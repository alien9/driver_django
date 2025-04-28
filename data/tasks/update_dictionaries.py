from data.models  import Dictionary, RecordType, Boundary, RecordSchema, BlackSpotSet
from constance import config
import re
from celery import shared_task

def add_term(l, t, ot):
    t = re.sub("\n", "", t)
    try:
        a = l.index(t)
    except ValueError:
        l.append(t)
        ot[t] = len(ot.keys())
    return l

@shared_task(track_started=True)
def update_dictionaries():
    for dictionary in Dictionary.objects.all():    
        dictionary.update_terms()
        dictionary.save()