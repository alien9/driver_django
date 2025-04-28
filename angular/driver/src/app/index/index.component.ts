import { Component, OnInit, ViewChild, NgZone, Injector, ComponentFactoryResolver, HostListener, TemplateRef } from '@angular/core';
import * as L from 'leaflet';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { RecordService } from '../record.service'
import { first } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { utfGrid } from '../UtfGrid';
import { } from 'jquery'
import { ActivatedRoute } from '@angular/router';
import { getLocaleDirection } from '@angular/common';
import { NgxSpinnerService } from "ngx-spinner";
import { NavbarComponent } from '../navbar/navbar.component'
import { ChartsComponent } from '../charts/charts.component';
import { IrapPopupComponent } from '../irap-popup/irap-popup.component';
import writeXlsxFile from 'write-excel-file'
import { TranslateService } from '@ngx-translate/core';
import * as uuid from 'uuid';
import "leaflet.locatecontrol";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import sha256 from 'crypto-js/sha256';
import { Title } from "@angular/platform-browser";
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent implements OnInit {
  @ViewChild('blocker') blockerDialog;
  iRapBounds: L.LatLngBounds;
  about_content: string;
  screenTimeout: any;
  lockTimeout: any;
  locked: boolean = false;
  geoloading: boolean;
  roadmapsLayer: any;
  gettingRoadMap: boolean;
  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.key && event.key == 'Escape') {
      this.navbar.inserting = false
      this.listening = false
      $('.leaflet-container').css('cursor', 'grab');
    }
  }
  public fontFamily = document.body.style.fontFamily
  public ready: boolean = false
  public config: object = {}
  public boundaries: any[] = []
  public boundary: any
  public boundaryPolygons: any[]
  public boundaryPolygonsObject = {}
  public selectedBoundaryPolygon: any = {}
  protected boundaryGeometries: any = []
  public boundaryPolygon: any
  public currentLanguage: string
  public polygon: any
  public state: string
  public fitBounds: any
  public layersControl: any
  public layers: any[]
  public options: any
  public recordSchema: object
  private backend: string
  public recordsLayer: L.LayerGroup
  public boundary_polygon_uuid: string
  public filter: object
  filterObject: object;
  public record: object
  public recordList: object
  public map: L.Map
  public showCounter = true
  public showLegend = true
  record_uuid: string
  recordtype_uuid: string
  public critical: object = {}
  public report: object
  public editing: boolean = false
  public canWrite: boolean = false
  private isDrawing: boolean = false
  private lastState: string
  public mapillary_id: string
  public irapDataset;
  public localRecordIndex = -1
  supportsLocalDate: boolean
  roadmap_uuid: string
  listPage: number = 1
  listening: boolean = false
  hasIrap: boolean
  locale: string
  weekdays: object
  reportFilters: object[]
  legends: object[] = []
  counts: object
  filterAsText: any[] = []
  subtitles: object[] = []
  loading: object = {
    "segment": [],
    "theme": []
  }

  private irapColor = [
    '#000000',
    '#ff0000',
    '#ff9900',
    '#ffaa00',
    '#ffff44',
    '#009900',
  ]
  theme: object = {}
  segment: object = {}
  @ViewChild(NavbarComponent) navbar!: NavbarComponent;
  @ViewChild(ChartsComponent) charts!: ChartsComponent;
  popContent: any
  iRapData: object
  iraplayer: object = { when: 'after', what: 'pedestrian' }
  localRecords: any[] = JSON.parse(localStorage.getItem("records") || "[]")
  constructor(
    private recordService: RecordService,
    private router: Router,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private zone: NgZone,
    private injector: Injector,
    private resolver: ComponentFactoryResolver,
    private translateService: TranslateService,
    private titleService: Title
  ) {

  }

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('language')) {
      let lang = this.route.snapshot.queryParamMap.get('language')
      this.locale = this.route.snapshot.queryParamMap.get('language')
      localStorage.setItem("Language", this.locale)
      this.router.navigateByUrl('/').finally(() => {
        this.setLanguage(this.locale)
      })
    }
    let cu = document.cookie.split(/; /).map(k => k.split(/=/)).filter(k => k[0] == "AuthService.token")
    if (!cu?.length) {
      this.router.navigateByUrl('/login')
      return
    }
    this.locale = localStorage.getItem("Language") || navigator.language
    localStorage.setItem("Language", this.locale)
    let du = (new Date()).toLocaleDateString(this.locale)
    document.getElementsByTagName('html')[0].setAttribute("dir",getLocaleDirection(this.locale))
    this.supportsLocalDate = !du.match(/^Invalid/)
    if (window['android']) {
      this.showLegend = false
      this.showCounter = false
    }
    this.recordService.getConfig().pipe(first()).subscribe(data => {
      this.config = data
      this.titleService.setTitle(this.config["APP_NAME"]);
      if (data['DEFAULT_LANGUAGE']?.length) {
        let current = localStorage.getItem("Language") || navigator.language
        let langs = data['LANGUAGES'] || []
        if (langs.map((k) => k.code).indexOf(current) < 0) {
          this.setLanguage(data['DEFAULT_LANGUAGE'])
        }
      }
      this.locale = localStorage.getItem("Language")
      if (this.route.snapshot.queryParamMap.get('language') && (this.route.snapshot.queryParamMap.get('language') != this.locale)) {
        if (this.config['LANGUAGES'] && (this.config['LANGUAGES'].map((k) => k.code).indexOf(this.route.snapshot.queryParamMap.get('language')) >= 0)) {
          localStorage.setItem("Language", this.route.snapshot.queryParamMap.get('language'))
          let lang = this.route.snapshot.queryParamMap.get('language')
          this.locale = this.route.snapshot.queryParamMap.get('language')
          localStorage.setItem("Language", this.locale)
          this.router.navigateByUrl('/').finally(() => {
            this.setLanguage(this.locale)
          })
        }
      }

      this.recordService.getRecordType().subscribe({
        next: rata => {
          if (rata['results']) {
            let schema_uuid;
            for (let i = 0; i < rata['results']?.length; i++) {
              if (rata['results'][i]['label'] == data['PRIMARY_LABEL']) {
                schema_uuid = rata['results'][i]['current_schema'];
                this.recordtype_uuid = rata['results'][i]['uuid']
                this.config['PRIMARY_LABEL_PLURAL'] = rata['results'][i]['plural_label']
              };
            }
            if (schema_uuid) {
              this.recordService.getRecordSchema(schema_uuid).subscribe(
                sata => {
                  localStorage.setItem('record_schema', JSON.stringify(sata));
                  this.recordSchema = sata
                  this.afterInit()
                }
              )
            } else {
              alert("record schema not found for " + data['PRIMARY_LABEL']);
            }
          } else {
            alert(data['PRIMARY_LABEL'] + " record type not found")
          }
        }, error: err => {
          this.router.navigateByUrl('/login')
        }
      })
    })
  }
  startLock(blocker) {
    this.modalService.open(blocker, { size: 's', backdrop: 'static' });
  }
  checkLockPassword(event, blocker) {
    if (sha256(event.srcElement.value) == localStorage.getItem("password")) {
      blocker.close('unlocked')
      this.locked = false
      this.resetTimeout()
    }
  }
  resetTimeout() {
    if (!this.config["IDLE_TIMEOUT"] || this.config["IDLE_TIMEOUT"] == "0") return
    if (this.lockTimeout) clearTimeout(this.lockTimeout)
    this.lockTimeout = window.setTimeout(() => {
      $("#blocked-trigger").trigger('click')
      this.locked = true
    }, this.config["IDLE_TIMEOUT"] * 1000)
  }
  afterInit() {
    if (this.config["IDLE_TIMEOUT"]) {
      let bode = window.document.getElementsByTagName('body')[0]
      let fu = () => {
        if (!this.locked)
          this.resetTimeout()
      }
      bode.onmousemove = fu
      bode.onkeydown = fu
      bode.ontouchstart = fu
    }
    this.resetTimeout()
    let w = document.cookie.match(/AuthService\.canWrite=([^;]*);/)
    if (w && w.length && w[1] == 'true') this.canWrite = true
    this.state = localStorage.getItem('state') || 'Map'
    this.popContent = $("#popup-content")[0]

    if (!this.config['LANGUAGES'])
      this.config['LANGUAGES'] = []
    const mapillary_auth: string = this.route.snapshot.queryParamMap.get('code');
    if (mapillary_auth) {
      localStorage.setItem('mapillary_auth', mapillary_auth)
    }
    this.iRapData = (this.config['IRAP_KEYS']) ? { "data": this.config['IRAP_KEYS'], "settings": this.config['IRAP_SETTINGS'] } : null
    if (localStorage.getItem("irapDataset")) {
      this.irapDataset = JSON.parse(localStorage.getItem("irapDataset"))
      if (!this.irapDataset['selected']) this.irapDataset['selected'] = {}
    }

    this.weekdays = {}
    let d = new Date()
    if (this.supportsLocalDate) {
      for (let i = 0; i < 7; i++) {
        this.weekdays[d.getDay()] = d.toLocaleDateString(this.locale, { weekday: 'long' })
        d.setDate(d.getDate() + 1)
      }
    } else {
      this.weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    }
    this.backend = localStorage.getItem("backend") || (('api' in environment) ? environment.api : '')

    let tables = Object.keys(this.recordSchema['schema']['properties'])
      .sort((k, j) => { return this.recordSchema['schema']['properties'][k].propertyOrder - this.recordSchema['schema']['properties'][j].propertyOrder })
    this.reportFilters = []
    tables.forEach(t => {
      Object.entries(this.recordSchema['schema']['definitions'][t]['properties'])
        .sort((k, j) => { return k[1]['propertyOrder'] - j[1]['propertyOrder'] })
        .filter(k => k[1]['isSearchable'] && (k[1]['enum']))
        .forEach(element => {
          this.reportFilters.push({ title: element[0], table: t })
        });
    })

    let bp = localStorage.getItem("boundary_polygon")
    if (bp) this.boundary_polygon_uuid = bp
    let fu = localStorage.getItem("current_filter")
    if (fu) {
      this.filter = JSON.parse(fu)
      this.filterObject = (this.filter['jsonb']) ? JSON.parse(this.filter['jsonb']) : {}
    }
    let geoserver = this.config["GEOSERVER"] || "https://vidasegura.cetsp.com.br/geoserver"
    let str = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
      {
        attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors, &copy; <a href='https://cartodb.com/attributions'>CartoDB</a>",
        detectRetina: false,
        zIndex: 1
      })
    let str_nolabel = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}.png',
      {
        attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors, &copy; <a href='https://cartodb.com/attributions'>CartoDB</a>",
        detectRetina: false,
        zIndex: 1
      })
    let osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
    let sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {});

    this.backend = localStorage.getItem("backend") || (('api' in environment) ? environment.api : '')
    this.layersControl = {
      baseLayers: {
        'CartoDB': str,
        'No Labels': str_nolabel,
        'Open Street Map': osm,
        'Satellite Map': sat
      },
      overlays: {
      }
    }
    if (!!window['android']) {
      this.roadmapsLayer = new L.geoJSON()
      this.layersControl.baseLayers["Local Road Map"] = new L.LayerGroup([this.roadmapsLayer])
    }



    let bl = localStorage.getItem("baselayer") || 'CartoDB'

    if (this.layersControl.baseLayers[bl])
      this.layers = [this.layersControl.baseLayers[bl]]
    else
      this.layers = [str]
    this.options = {
      layers: this.layers
    }

    this.recordService.getCritical().pipe(first()).subscribe({
      next: critical_data => {
        if (critical_data['results']) {
          critical_data['results'].forEach(rs => {

            let gl = utfGrid(`${this.backend}/grid/critical/${rs['uuid']}/segments/{z}/{x}/{y}.json/`, {
              resolution: 4,
              pointerCursor: true,
              mouseInterval: 66
            })
            gl.on('mouseover', (e) => {
              if (e.data) {
                $('.leaflet-grab').css('cursor', 'pointer')
              }
              else {
                this.zone.run(() => {
                  $('.leaflet-grab').css('cursor', (this.listening) ? 'crosshair' : 'grab')
                })
              }
            });
            gl.on('mouseout', (e) => {
              this.zone.run(() => {
                $('.leaflet-grab').css('cursor', (this.listening) ? 'crosshair' : 'grab')
              })
            });
            gl.on('add', (e: any) => {
              this.zone.run(() => {
                this.addSegment(rs['uuid'], rs['title'])
                this.loading['segment'].push(rs['uuid'])
                $('.leaflet-grab').css('cursor', 'progress')
              })
            })
            this.layersControl.overlays[this.translateService.instant(rs["title"])] = new L.LayerGroup([
              gl
            ])
          })
        }
        if (window['android']) {
          this.afterBoundaries(JSON.parse(window['android'].getBoundaries()))
        } else {
          this.recordService.getBoundaries().pipe(first()).subscribe({
            next: this.afterBoundaries
          })
        }
      },
      error: err => {
        console.log("Error: " + err.status)
        if (err.status == 403)
          this.router.navigateByUrl('/login')
      }
    })
  }

  afterBoundaries = (data) => {
    if (!data["results"]) {
      alert("Geometries not found")
      return
    }
    this.boundaries = data["results"]
    let current_boundary = localStorage.getItem("boundary")
    if (current_boundary) {
      this.boundary = (this.boundaries.filter(bu => bu.uuid == current_boundary).pop())
    }
    if (!this.boundary) {
      this.boundary = this.boundaries[0]
    }
    this.setBoundary(this.boundary)
    this.boundaries.forEach(b => {
      let gl = utfGrid(`${this.backend}/grid/boundary/${b['uuid']}/boundary/{z}/{x}/{y}.json/`, {
        resolution: 4,
        pointerCursor: true,
        mouseInterval: 66
      })
      gl.on('mouseover', (e) => {
        if (e.data) {
          $('.leaflet-grab').css('cursor', 'pointer')
          this.zone.run(() => {
            let t = e.data['name'].replace(/^"|"$/g, "")
            if (this.theme && this.theme[b['uuid']] && this.theme[b['uuid']]['data'][e.data['uuid']] && this.theme[b['uuid']]['data'][e.data['uuid']]['data']) {
              t = `${t} (${this.theme[b['uuid']]['data'][e.data['uuid']]['data']})`
            }
            let m = this.map
            this.map.eachLayer(function (layer) {
              if (layer.options.pane === "tooltipPane") layer.removeFrom(m);
            });
            e.sourceTarget.bindTooltip(t, { sticky: true, permanent: false });
          })
        }
        else {
          this.zone.run(() => {
            $('.leaflet-grab').css('cursor', (this.listening) ? 'crosshair' : 'grab')
          })
        }
      });
      gl.on('mouseout', (e) => {
        this.zone.run(() => {
          $('.leaflet-grab').css('cursor', (this.listening) ? 'crosshair' : 'grab')
        })
      });
      gl.on('click', (e) => {
      })
      gl.on('add', lo => {
        this.zone.run(() => {
          $('.leaflet-grab').css('cursor', 'progress')
          this.addThematic(b.uuid, b.label)
        })
      })
      gl.on('remove', lo => {
        this.zone.run(() => {
          delete this.theme[b.uuid]
          this.setLegends()
        })
      })
      let g = new L.LayerGroup([gl])
      this.layersControl.overlays[this.translateService.instant(b.label)] = g
    })
  }

  addSegment(uuid, l) {
    let label = this.translateService.instant(l)
    let f = JSON.parse(JSON.stringify(this.filter || {}))
    f['critical'] = uuid
    let d = (new Date()).getTime()
    this.recordService.getSegmentQuantiles(this.recordtype_uuid, f).pipe(first()).subscribe({
      next: data => {
        let gl = utfGrid(`${this.backend}/grid/critical/${data['mapfile']}/critical/{z}/{x}/{y}.json/?ts=${d}`, {
          resolution: 4,
          pointerCursor: true,
          mouseInterval: 66
        })
        gl.on('mouseover', (e) => {
          if (e.data) {
            $('.leaflet-grab').css('cursor', 'pointer')
            this.zone.run(() => {
              let t = e.data['name'].replace(/^"|"$|^null$/g, "")
              if (e.data['num_records']) t = `${t} (${e.data['num_records']})`
              let m = this.map
              this.map.eachLayer(function (layer) {
                if (layer.options.pane === "tooltipPane") layer.removeFrom(m);
              });
              e.sourceTarget.bindTooltip(t, { sticky: true, permanent: false });
            })
          }
          else {
            this.zone.run(() => {
              $('.leaflet-grab').css('cursor', (this.listening) ? 'crosshair' : 'grab')
            })
          }
        });
        gl.on('mouseout', (e) => {
          this.zone.run(() => {
            $('.leaflet-grab').css('cursor', (this.listening) ? 'crosshair' : 'grab')
          })
        });
        gl.on('remove', (e) => {
          this.zone.run(() => {
            delete this.segment[uuid]
            this.setLegends()
          })
        });
        gl.on('add', (e) => {
          this.zone.run(() => {
            // add to the legends as well
            this.segment[uuid] = { 'label': label, 'data': {}, 'mapfile': data['mapfile'] }
            this.setLegends()
            this.loading['segment'] = this.loading['segment'].filter(jt => jt != uuid)
            if (!this.loading['segment'].length && !this.loading['theme'].length)
              $('.leaflet-grab').css('cursor', (this.listening) ? 'crosshair' : 'grab')
          })
        });

        gl.on('click', (e: any) => {
          if (!e.data) return
          let t = this.popContent.innerHTML
            .replace(/-total-/, e.data.num_records)
            .replace(/-name-/, e.data.name)
          //            .replace(/-cost-/, e.data.cost)
          new L.Popup().setLatLng(e.latlng).setContent(t).openOn(this.map)
        })
        let l = L.tileLayer(`${this.backend}/maps/critical/${data['mapfile']}/critical/{z}/{x}/{y}.png?ts=${d}`, {})
        while (this.layersControl.overlays[label].getLayers().length > 0) {
          this.layersControl.overlays[label].removeLayer(this.layersControl.overlays[label].getLayers()[0])
        }
        this.layersControl.overlays[label].addLayer(gl)
        this.layersControl.overlays[label].addLayer(l)
        this.layersControl.overlays[label].setZIndex(999)
      }, error: err => console.log(err)
    })
  }
  addThematic(uuid, l) {
    let label = this.translateService.instant(l)
    let f = JSON.parse(JSON.stringify(this.filter || {}))
    f['aggregation_boundary'] = uuid
    let d = (new Date()).getTime()
    this.recordService.getQuantiles(this.recordtype_uuid, f).pipe(first()).subscribe({
      next: data => {
        let l = L.tileLayer(`${this.backend}/maps/theme/${data['mapfile']}/theme%20border/{z}/{x}/{y}.png?ts=${d}`, {})
        if (this.layersControl.overlays[label].getLayers().length > 1) {
          this.layersControl.overlays[label].removeLayer(this.layersControl.overlays[label].getLayers()[1])
        }
        l.on('add', (e) => {
          this.zone.run(() => {
            this.loading['theme'] = this.loading['theme'].filter(jt => jt != uuid)
            if (!this.loading['segment'].length && !this.loading['theme'].length)
              $('.leaflet-grab').css('cursor', (this.listening) ? 'crosshair' : 'grab')
          })
        })
        this.layersControl.overlays[label].addLayer(l)
        this.layersControl.overlays[label].setZIndex(999)
        this.theme[uuid] = { 'label': label, 'data': {}, 'mapfile': data['mapfile'] }
        data['sample'].forEach(k => {
          this.theme[uuid]['data'][k[0]] = { 'label': k[2], 'data': k[1] }
        })
        this.setLegends()
      }, error: err => console.log(err)
    })
  }
  selectState(s: string) {
    this.lastState = this.state
    this.state = s
    if (s == 'Map') {
      this.loadRecords(true)
    }
    this.ready = true
  }
  setLegends() {
    this.legends = []
    this.subtitles = []
    Object.keys(this.theme).forEach(kt => {
      let imagePath = "/legend/"
      this.legends.push({ "title": this.theme[kt]['label'], "mapfile": this.theme[kt]['mapfile'], "uuid": kt, "layers": "theme", "ts": (new Date()).getTime() })
    })
    Object.keys(this.segment).forEach(kt => {
      this.subtitles.push({ "title": this.segment[kt]['label'], "mapfile": this.segment[kt]['mapfile'], "uuid": kt, "layers": "theme", "ts": (new Date()).getTime() })
    })

  }

  setBoundary(event: any) {
    this.boundary = event
    if (event) {
      localStorage.setItem("boundary", this.boundary.uuid)
      this.geoloading = true
      const afterGetBoundaryPolygons = (data) => {
        if (data["results"]) {
          this.boundaryPolygons = data["results"]
          this.setBoundaryPolygon(null)
        }
        this.geoloading = false
      }
      if (window['android']) {
        afterGetBoundaryPolygons(JSON.parse(window['android'].getBoundaryPolygons(this.boundary.uuid)))
      } else {
        this.recordService.getBoundaryPolygons(this.boundary).pipe(first()).subscribe(
          afterGetBoundaryPolygons)
      }
    }
  }
  setBoundaryPolygon(b: any, boundary_uuid = null) {
    this.boundaryGeometries.forEach((p) => {
      p.remove()
    })
    if (b) {
      this.geoloading = true
      const afterGetBoundaryPolygon = (k) => {
        var drawnItems = new L.FeatureGroup();
        for (let o = 0; o < k["geometry"].coordinates.length; o++) {
          const co = (k["geometry"].coordinates[o].length == 1) ? k["geometry"].coordinates[o][0] : k["geometry"].coordinates[o];
          var polygon = L.polygon(co.map((c) => [c[1], c[0]]), { color: 'gray', fillOpacity: 0, dashArray: '5,10', interactive: false });
          polygon.addTo(this.map);
          this.boundaryGeometries.push(polygon)
        }
        this.geoloading = false
      }
      if (window['android']) {
        afterGetBoundaryPolygon(JSON.parse(window['android'].getBoundaryPolygon(b.uuid, boundary_uuid)))
      } else {
        this.recordService.getBoundaryPolygon(b.uuid).subscribe(afterGetBoundaryPolygon)
      }
    }

    this.ready = false
    this.boundary_polygon_uuid = (b) ? b['uuid'] : null
    if (this.boundary_polygon_uuid) {
      if (!this.filter) {
        this.filter = {}
      }
      this.filter['polygon_id'] = this.boundary_polygon_uuid
      localStorage.setItem("boundary_polygon", this.boundary_polygon_uuid)
    } else {
      if (this.filter)
        delete this.filter['polygon_id']
      localStorage.removeItem("boundary_polygon")
    }
    this.applyBoundaryPolygon(b)
  }
  applyBoundaryPolygon(b: any) {
    this.boundaryPolygon = b
    if (b) {
      this.fitBounds = b.bbox
    } else {
      if (this.boundaryPolygons.length) {
        let bbox = this.boundaryPolygons[0].bbox
        this.boundaryPolygons.forEach(k => {
          if (k.bbox[0].lon < bbox[0].lon) bbox[0].lon = k.bbox[0].lon
          if (k.bbox[0].lat < bbox[0].lat) bbox[0].lat = k.bbox[0].lat
          if (k.bbox[1].lon > bbox[1].lon) bbox[1].lon = k.bbox[1].lon
          if (k.bbox[1].lat > bbox[1].lat) bbox[1].lat = k.bbox[1].lat
        })
        this.fitBounds = bbox
      }
    }
    if (!this.filter) {
      this.recordService.getRecords({ 'uuid': this.recordSchema['record_type'] }, { 'filter': { 'limit': 1 } }).pipe(first()).subscribe({
        next: data => {
          if (!this.counts) this.counts = {}
          this.counts["total_crashes"] = data["count"]
          // set filter: last 3 months from latest found data
          if (data['results']) {
            let di: Date
            let df: Date
            if (data['results'].length) {
              di = new Date(data['results'][0].occurred_from)
              df = new Date(data['results'][0].occurred_from)
            } else {
              di = new Date()
              di.setDate(di.getDate() + 1)
              df = new Date()
            }

            df.setMonth(di.getMonth() - 3)
            let fu = {
              'occurred_max': di.toISOString(),
              'occurred_min': df.toISOString()
            }
            //localStorage.setItem("current_filter", JSON.stringify(fu))
            this.setFilter(fu)
          } else {
            this.refreshList()
          }
          this.loadRecords(true)
        }
      })
    } else {
      this.loadRecords(true)
      this.refreshList()
    }
  }
  loadCritical() {
    this.recordService.getCritical().pipe(first()).subscribe(
      critical_data => {
        if (critical_data['results']) {
          critical_data['results'].forEach(rs => {
            let gl = utfGrid(`${this.backend}/grid/critical/${rs['uuid']}/critical/{z}/{x}/{y}.json/`, {
              resolution: 4,
              pointerCursor: true,
              mouseInterval: 66
            })
            /* this.layersControl.overlays[rs["title"]] = new L.LayerGroup([
              L.tileLayer(`${this.backend}/maps/critical/${rs['uuid']}/segments/{z}/{x}/{y}.png`, {}),
              gl
            ]) */
          })
        }
      }
    )
  }
  loadRecords(show: boolean) {
    this.counts = { 'total': null, 'total_crashes': null, 'subtotals': [] }
    this.recordService.getMapFileKey({ 'uuid': this.recordSchema["record_type"] }, {
      filter: this.filter
    }).pipe(first()).subscribe(
      data => {
        this.ready = true
        this.spinner.hide()
        let ts = (new Date()).getTime()
        this.layersControl.overlays[this.translateService.instant('Heatmap')] = L.tileLayer(`${this.backend}/maps/records/${data["mapfile"]}/heatmap/{z}/{x}/{y}.png/?${ts}`, {})
        let cl = utfGrid(`${this.backend}/grid/records/${data["mapfile"]}/records_offset/{z}/{x}/{y}.json/?${ts}`, {
          resolution: 4,
          pointerCursor: true,
          mouseInterval: 66
        })
        cl.on('mouseover', (e) => {
          if (e.data) {
            $('.leaflet-grab').css('cursor', 'pointer')
          }
          else {
            $('.leaflet-grab').css('cursor', 'grab')
          }
        });
        cl.on('mouseout', (e) => {
          this.zone.run(() => {
            $('.leaflet-grab').css('cursor', (this.listening) ? 'crosshair' : 'grab')
          })
        });
        cl.on('click', (e: any) => {
          if (e.data) {
            if (this.isDrawing) return
            let du = new Date(Date.parse(e.data['occurred_from']))
            let t = $("#record-popup-content").html()
              .replace(/-date-/, `${this.toLocaleDateString(du)} ${this.toLocaleTimeString(du).replace(/:00$/, '')}`)
              .replace(/-location-/, e.data['location_text'])
              .replace(/-uuid-/, e.data['uuid'])
            new L.Popup().setLatLng(e.latlng).setContent(t).openOn(this.map)
            var m = this.map
            this.record_uuid = e.data.uuid
            $("#open-record-popup").on('click', function () {
              m.closePopup()
              $('#map-popup-button').trigger('click');
            })
          }
        })
        cl.on('remove', (e: any) => {
          this.zone.run(() => {
            delete this.recordsLayer
          })
        })
        if (this.recordsLayer && this.map && this.map.hasLayer(this.recordsLayer))
          this.map.removeLayer(this.recordsLayer)
        this.recordsLayer = new L.LayerGroup([
          L.tileLayer(`${this.backend}/maps/records/${data["mapfile"]}/records/{z}/{x}/{y}.png/?${ts}`, {}),
          cl
        ])
        this.recordsLayer.setZIndex(8000)
        this.layersControl.overlays[this.translateService.instant(this.config['PRIMARY_LABEL_PLURAL'])] = this.recordsLayer
        if (show && this.map) {
          this.map.addLayer(this.recordsLayer)
        }
        if (!this.map) {
          console.log('error:no map yet')
          this.layers.push(this.recordsLayer)
        }
        if (this.filter['jsonb']) {
          this.filterAsText = []
          let j = JSON.parse(this.filter['jsonb'])
          Object.values(j).forEach(value => {
            Object.entries(value).forEach(fields => {
              if (fields[1].contains) {
                this.filterAsText.push(`${this.translateService.instant(fields[0])}: ${fields[1].contains.map(k => this.translateService.instant(k)).join(", ")}`)
              }
            })
          })
        }
        this.getRoadMap()
        this.recordService.getRecordCosts({ 'uuid': this.recordSchema["record_type"] }, {
          filter: this.filter
        }).pipe(first()).subscribe({
          next: data => {
            this.counts = data
            
          }, error: err => {
            this.recordService.getRecords({ 'uuid': this.recordSchema["record_type"], 'limit': 1 }, { filter: this.filter }).pipe(first()).subscribe(
              data => {
                this.counts = {
                  "total_crashes": data["count"]
                }
              }
            )
            console.log(err)
          }
        })
      })
  }
  toLocaleDateString(d: Date) {
    return (this.supportsLocalDate) ? d.toLocaleDateString(this.locale) : d.toLocaleDateString()

  }
  toLocaleTimeString(d: Date) {
    return (this.supportsLocalDate) ? d.toLocaleTimeString(this.locale) : d.toLocaleTimeString()
  }
  getRoadMap() {
    if(this.gettingRoadMap) return
    this.gettingRoadMap=true
    this.recordService.getRoadMap().pipe(first()).subscribe({
      next: data => {
        this.gettingRoadMap=false
        if (data['result'])
          this.roadmap_uuid = data['result'][0]['uuid']
      }
    })
  }
  refreshList() {
    this.recordList = null
    if (this.state == 'List') {
      this.spinner.show()
      if (this.boundary_polygon_uuid) this.filter["polygon_id"] = this.boundary_polygon_uuid
      if (this.listPage && this.listPage > 1) {
        this.filter['offset'] = (this.listPage - 1) * 50
      } else {
        delete this.filter['offset']
      }
      this.recordService.getRecords({ 'uuid': this.recordSchema["record_type"] }, { filter: this.filter }).pipe(first()).subscribe(
        data => {
          this.spinner.hide()
          this.recordList = data
        }
      )
    }
  }
  setFilter(e: any) {
    this.spinner.show
    this.filter = e
    this.filterObject = (this.filter && this.filter['jsonb']) ? JSON.parse(this.filter['jsonb']) : {}
    this.loadRecords(this.map && this.map.hasLayer(this.recordsLayer))
    this.refreshList()
    Object.keys(this.theme).forEach(tk => {
      this.addThematic(tk, this.theme[tk]['label'])
    })
    Object.keys(this.segment).forEach(tk => {
      this.addSegment(tk, this.segment[tk]['label'])
    })
    this.setLegends()
  }
  expandFilter(e: any) {
    var d = e
    if (this.filter && this.filter['occurred_min'] && this.filter['occurred_max']) {
      if (Date.parse(this.filter['occurred_min']) > e) {
        d.setDate(d.getDate() - 1)
        this.filter['occurred_min'] = d.toISOString()
      }
      if (Date.parse(this.filter['occurred_max']) < e) {
        d.setDate(d.getDate() + 1)
        this.filter['occurred_max'] = d.toISOString()
      }
    }
    this.setFilter(this.filter)
  }
  viewRecord(content: any, uuid: string) {
    this.record_uuid = uuid
    this.mapClick(content)
  }
  setMapCursor(e: any) {
    $('.leaflet-container').css('cursor', (this.listening) ? 'crosshair' : 'grab');
  }

  startRecord(l: boolean) {
    this.listening = l
  }
  createRecord(content: any) {
    this.recordService.getPosition().then((p) => {
      this.newRecord({ "latlng": p }, content)
    })
  }
  newRecord(v: any, content: any) {
    this.listening = false
    //this.navbar.inserting = false
    let d = new Date()
    this.record = {
      'geom': { "type": "Point", "coordinates": [v.latlng.lng, v.latlng.lat] },
      'occurred_from': d,
      'occurred_to': d,
      'data': {},
      "schema": this.recordSchema["uuid"]
    }
    Object.entries(this.recordSchema['schema']['definitions']).forEach(k => {
      if (this.recordSchema['schema']['definitions'][k[0]].multiple) {
        this.record['data'][k[0]] = []
      } else {
        this.record['data'][k[0]] = { '_localId': uuid.v4() }
        Object.keys(k[1]['properties']).forEach(l => {
          //this.record['data'][k[0]][l] = null
        })
      }
    })
    this.editing = true
    this.modalService.open(content, { size: 'lg', animation: false, keyboard: false, backdrop: "static" });
  }
  setRecords(r) {
    this.localRecords = r
  }
  localRefresh(remove) {
    //refresh the local database
    if (remove) {
      if (this.localRecordIndex > -1) {
        if (this.localRecords && this.localRecords.length > this.localRecordIndex) {
          this.localRecords.splice(this.localRecordIndex, 1)
          localStorage.setItem("records", JSON.stringify(this.localRecords))
        }
      }
      this.localRecordIndex = -1
    }
  }

  applyGeometry(e: any) {
    e.close()
    let i = this.boundaries.length
    let p = null
    while (i > 0) {
      i--
      if (this.selectedBoundaryPolygon[this.boundaries[i].uuid] && (this.selectedBoundaryPolygon[this.boundaries[i].uuid] != "null")) {
        p = this.selectedBoundaryPolygon[this.boundaries[i].uuid]
        if (p) {
          let q = this.boundaryPolygonsObject[this.boundaries[i].uuid].filter((k) => k.uuid == p).pop()
          if (q) {
            this.setBoundaryPolygon(q, this.boundaries[i].uuid)
            return
          }
        }
        i = 0
      }
    }
    this.setBoundaryPolygon(null)
  }
  startGeometry(content: TemplateRef<any>) {
    this.boundaries.forEach((b) => {
      this.boundaryPolygonsObject[b.uuid] = []
      if (!(b.uuid in this.selectedBoundaryPolygon)) this.selectedBoundaryPolygon[b.uuid] = null
    })
    this.modalService.open(content, { size: 'lg' });
    if (this.boundaries.length) {
      this.downloadGeometries(this.boundaries.sort((a, b) => a['order'] - b['order'])[0])
    }
    let i = 1
    while (i < this.boundaries.length) {
      if (this.selectedBoundaryPolygon[this.boundaries[i - 1].uuid]) {
        this.downloadGeometries(this.boundaries[i], this.selectedBoundaryPolygon[this.boundaries[i - 1].uuid], i - 1)
      }
      i++
    }
  }
  selectPolygon(event: Event, cid: string, level = 0) {
    let reset = false
    //this.setBoundaryPolygon(null)
    let j = 0
    this.boundaries.forEach((bp) => {
      j++
      if (j > level) {
        if (reset) {
          this.selectedBoundaryPolygon[bp.uuid] = null
          this.boundaryPolygonsObject[bp.uuid] = []
          reset = true
        }
        if (!this.selectedBoundaryPolygon[bp.uuid] || (this.selectedBoundaryPolygon[bp.uuid] == "null") || cid == bp.uuid) {
          reset = true
        }
      }
    })
    //download the last missing 
    let i = this.boundaries.length
    let filter = null
    while (!filter && (i > 0)) {
      i--
      filter = this.selectedBoundaryPolygon[this.boundaries[i].uuid]
    }
    if (i < this.boundaries.length - 1) { // vou baixar o próximo nivel de boundary se existe
      if (filter && filter != "null")
        this.downloadGeometries(this.boundaries[i + 1], filter, i + 1)
    }
  }


  downloadGeometries(boundary: any, filter: string = null, order: number = 0) {
    if (!filter) {
      this.geoloading = true
      const aft = (res) => {
        this.boundaryPolygonsObject[boundary.uuid] = res["results"].sort((u, v) => (this.getBoundaryPolygonLabel(u, order, true) > this.getBoundaryPolygonLabel(v, order, true)) ? 1 : -1)
        this.geoloading = false
      }
      if (window['android']) {
        aft(JSON.parse(window['android'].getBoundaryPolygons(this.boundary.uuid)))
      } else {
        this.recordService.getBoundaryPolygons(boundary).subscribe(aft)
      }
    } else {
      if (boundary) {
        this.geoloading = true
        this.recordService.getFilteredBoundaryPolygons(boundary, filter).subscribe((res) => {
          this.boundaryPolygonsObject[boundary.uuid] = res["results"].sort((u, v) => (this.getBoundaryPolygonLabel(u, order, true) > this.getBoundaryPolygonLabel(v, order, true)) ? 1 : -1)
          if (res["results"].length > 0) {
            this.geoloading = false
          } else {
            this.geoloading = true
            this.downloadGeometries(this.boundaries[order + 1], filter, order + 1)
          }
        })
      } else
        this.geoloading = false
    }
  }
  resetGeometry() {
    console.log("reset geometry")
  }
  getBoundaryPolygonLabel(b: any, i: number, padded: boolean) {
    let l = b.data[localStorage.getItem("Language")] || b.data[this.boundaries[i].display_field]
    if(!l){
      return ""
    }
    if (!padded) return l;
    const prefix = l.match(/^\d+/)
    if (!prefix) return l
    return l.replace(/^\d+/, prefix.pop().padStart(11, '0'))
  }
  selectBoundaryPolygon(e: any) {
    console.log(e)
  }
  mapClick(content: any) {
    this.editing = false
    if (!this.record_uuid) this.record_uuid = $("#record-uuid").val().toString()
    if (this.record_uuid) {
      this.recordService.getRecord(this.record_uuid).pipe(first()).subscribe(
        data => {
          this.record = data
          this.modalService.open(content, { size: 'lg', animation: false, keyboard: false, backdrop: "static" });
        })
      this.record_uuid = null
    }
  }
  openRecord(content, e: any) {
    this.record = e.data
    this.localRecordIndex = e.index
    this.modalService.open(content, { size: 'lg', animation: false, keyboard: false, backdrop: "static" });
    if (this.canWrite) this.editRecord()
  }
  setMap(e: L.Map) {
    this.map = e
    L.control.locate({ drawMarker: false }).addTo(this.map)
  }
  popClick(e: any) {
    console.log(e)
  }
  setReport(r: object) {
    this.report = r
    if (this.report['parameters']['col_choices_path'] && !this.report['parameters']['row_choices_path']) {
      let rel = this.report['parameters']['col_choices_path'].split(',')
      if (this.recordSchema['schema'].definitions[rel[0]]['multiple']) {
        this.report['relatable'] = rel
      }
    } else {
      if (this.report['parameters']['row_choices_path'] && !this.report['parameters']['col_choices_path']) {
        let rel = this.report['parameters']['row_choices_path'].split(',')
        if (this.recordSchema['schema'].definitions[rel[0]]['multiple']) {
          this.report['relatable'] = rel
        }
      }
    }
  }
  editRecord() {
    this.editing = true
    return false
  }
  setPolygon(p: any) {
    if (!p) delete this.filter['polygon']
    else {
      let ply = {
        "type": "MultiPolygon",
        "coordinates": []
      }
      p.getLayers().forEach(lk => {
        let co = lk.toGeoJSON()['geometry']
        ply["coordinates"].push([co["coordinates"][0]])
      })
      if (!ply["coordinates"].length) delete this.filter['polygon']
      else this.filter['polygon'] = JSON.stringify(ply)
    }

    this.loadRecords(true)
  }
  setDrawing(e: boolean) {
    this.isDrawing = e
  }
  goBack(from: string) {
    if (!this.lastState || (this.lastState == from)) {
      this.selectState('Map')
    } else {
      this.selectState(this.lastState)
    }
  }
  reloadReport(relate: string) {
    this.report['parameters']['relate'] = relate
    this.navbar.loadReport(this.report['parameters'])
  }
  setMapillary(e) {
    this.mapillary_id = e
  }
  closeRecord(m: any) {
    m.dismiss('Cross click')
    this.mapillary_id = null
  }
  setIrap(e: object) {
    if (e['iRap']) {
      this.iRapData = e['iRap']
    }
    if (e['user']) {
      this.config['IRAP_KEYS'] = e['user']['data']
      this.config['IRAP_SETTINGS'] = e['user']['settings']
      localStorage.setItem('config', JSON.stringify(this.config))
    }
    if (e['dataset']) {
      this.irapDataset = e['dataset']
      if (!this.irapDataset['selected']) this.irapDataset['selected'] = {}
      localStorage.setItem('irapDataset', JSON.stringify(this.irapDataset))
    }
    if (e['layer']) {
      if (e['layer']['data'] && e['layer']['data']['startdata']) {
        this.iraplayer['data'] = e['layer']['data']['startdata']
        this.drawIrap()
        this.hasIrap = true
        this.iraplayer['title'] = this.irapDataset['data'].map(ds => {
          return { 'name': ds['name'], 'dataset_data': ds['dataset_data'].filter(dsd => this.irapDataset['selected'][dsd['id']]) }
        }).filter(ds => ds['dataset_data'].length)
      }
    }
  }
  removeIrapLayer() {
    if (this.layersControl.overlays['iRap']) {
      this.map.removeLayer(this.layersControl.overlays['iRap'])
      delete this.layersControl.overlays['iRap']
    }
  }
  iRapCenter(e) {
    if (this.iRapBounds) {
      this.map.fitBounds(this.iRapBounds)
    }
  }
  drawIrap(what = null) {
    this.removeIrapLayer()
    if (what) {
      this.iraplayer['what'] = what // which road user is this
    } else {
      if (!this.iraplayer['what']) this.iraplayer['what'] = 'car'
    }
    let bds
    let lg = L.layerGroup(this.iraplayer['data'].map(seg => {
      let l = L.polyline([[seg.latitude, seg.longitude], [seg.latitude_to, seg.longitude_to]], { location_id: seg['location_id'], dataset_id: seg['dataset_id'], color: this.irapColor[parseInt(seg[`${this.iraplayer['what']}_star_${this.iraplayer['when']}`]) - 1] })
      if (!bds) bds = l.getBounds()
      else {
        bds.extend(l.getBounds())
      }
      l.on('click', e => {
        let yl = e.sourceTarget
        let component = this.resolver.resolveComponentFactory(IrapPopupComponent).create(this.injector);
        component.changeDetectorRef.detectChanges();
        L.popup({ minWidth: 600, maxHeight: 420 })
          .setLatLng(e.latlng)
          .setContent(component.location.nativeElement)
          .openOn(this.map);
        this.zone.run(() => {
          let b = {
            language_code: this.locale,
            dataset_id: yl.options['dataset_id']
          }
          let l = yl.getLatLngs()
          b["latitude"] = l[0]['lat']
          b["longitude"] = l[0]['lng']
          component.instance.loading = true
          component.changeDetectorRef.detectChanges()
          this.recordService.getIRapFatalityData({ "body": b }).pipe(first()).subscribe(data => {
            component.instance.roadName = data['data']['road_name']
            component.instance.inspectionDate = data['data']['road_survey_date']
            component.instance.rating = {
              'pedestrian': Math.round(data['data']['pedestrian_star_rating_star']),
              'bicycle': Math.round(data['data']['bicycle_star_rating_star']),
              'car': Math.round(data['data']['car_star_rating_star']),
              'motorcycle': Math.round(data['data']['motorcycle_star_rating_star']),
            }
            component.instance.fe = {
              'pedestrian': data['data']['pedestrian_fe'],
              'bicycle': data['data']['bicycle_fe'],
              'car': data['data']['car_fe'],
              'motorcycle': data['data']['motorcycle_fe'],
            }
            component.instance.roadFeatures = data['data'].road_features
            component.instance.loading = false


            component.changeDetectorRef.detectChanges()
          })
        })
      })
      return l
    }))
    this.iRapBounds = bds
    this.layersControl.overlays['iRap'] = lg
    this.map.addLayer(lg)
    if (!what)
      this.iRapCenter(null)
  }
  removeIrap() {
    this.hasIrap = false
    this.removeIrapLayer()
  }
  reloadRecords(e: any) {
    if (this.localRecordIndex > -1) {
      if (this.localRecords && this.localRecords.length > this.localRecordIndex) {
        this.localRecords.splice(this.localRecordIndex, 1)
        localStorage.setItem("records", JSON.stringify(this.localRecords))
      }
      this.localRecordIndex = -1
    }
    switch (this.state) {
      case 'List':
        this.refreshList()
        break
      case 'Map':
        this.loadRecords(true)
        break
    }
  }
  setListPage(e: any) {
    this.listPage = e
    this.refreshList()
  }

  async download(e: any) {
    switch (this.state) {
      case 'Reports':
        let filename = this.translateService.instant(this.config['PRIMARY_LABEL'])
        if (this.report['parameters']['relate'])
          filename = this.translateService.instant(this.report['parameters']['relate'].split(/,/).pop())
        filename = `${filename} by ${this.report['path']['row']} by ${this.report['path']['col']}`
        let book = []
        this.report['crosstabs']['tables'].forEach(t => {
          //Sheet header
          let line = 0
          let data: Object[][] = [[
          ]]
          data['title'] = this.report['crosstabs']['table_labels'][t['tablekey']]
          // Table Headers
          data[line].push({ 'value': this.translateService.instant(this.report['path']['row']), 'type': String })
          this.report['crosstabs']['col_labels'].forEach(gk => {
            data[line].push({
              value: this.translateService.instant(gk['label'][0]['text']), type: String
            })
          })
          if (!this.report['parameters']['relate'] || !this.report['parameters']['relate'].length) {
            data[line].push({
              value: this.translateService.instant('Total'),
              type: String
            })
          }
          line++
          //table content
          this.report['crosstabs']['row_labels'].forEach(l => {
            data.push([{ value: this.translateService.instant(l['label'][0]['text']), type: String }])
            this.report['crosstabs']['col_labels'].forEach(col => {
              let v: Number
              if (t['data'][l.key] && t['data'][l.key][col.key])
                v = t['data'][l.key][col.key]
              data[line].push({
                value: (v) ? v : 0,
                type: Number
              })
            })
            if (!this.report['parameters']['relate'] || !this.report['parameters']['relate'].length) {
              let v: Number
              if (t['row_totals'][l.key])
                v = t['row_totals'][l.key]
              data[line].push({
                value: (v) ? v : 0,
                type: Number
              })
            }
            line++
          })
          book.push(data)
        })
        await writeXlsxFile(book, {
          fileName: `${filename}.xlsx`,
          sheets: (book.length > 1) ? book.map(b => b['title']) : ['Sheet 1']
        })
        break
      case 'Map':
      case 'List':
        break
    }
  }
  setLanguage(code: string) {
    localStorage.setItem("Language", code)
    location.reload()
  }
  startLanguageSelector(element: any) {
    this.modalService.open(element, { size: 's', backdrop: 'static' });
  }
  startFilters() {
    this.navbar.triggerStartFiltgers()
  }
  logout() {
    this.navbar.logout()
  }
  about(a: any) {
    this.modalService.open(a, { size: 'lg', animation: false, keyboard: false, backdrop: "static" });
    this.recordService.getAbout(this.locale).subscribe((d) => {
      this.about_content = d["result"]
    })

  }
  showLocalRoads(e: any) {
    this.roadmapsLayer = e
    this.layersControl.baseLayers["Local Road Map"].clearLayers()
    this.layersControl.baseLayers["Local Road Map"].addLayer(this.roadmapsLayer)
  }

}

