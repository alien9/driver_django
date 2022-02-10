import { Component, OnInit, ViewChild, NgZone, Injector, ComponentFactoryResolver, HostListener } from '@angular/core';
import * as L from 'leaflet';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { RecordService } from '../record.service'
import { first } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { utfGrid } from '../UtfGrid';
import { } from 'jquery'
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner";
import { NavbarComponent } from '../navbar/navbar.component'
import { ChartsComponent } from '../charts/charts.component';
import { IrapPopupComponent } from '../irap-popup/irap-popup.component';

import * as uuid from 'uuid';
import { of} from 'rxjs' 
@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent implements OnInit {
  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.key && event.key == 'Escape') {
      this.navbar.inserting=false
      this.listening = false
      $('.leaflet-container').css('cursor', 'grab');
    }
  }
  public config: object={}
  public boundaries: any[] = []
  public boundary: any
  public boundaryPolygons: any[]
  public boundaryPolygon: any
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
  record_uuid: string
  recordtype_uuid:string
  public critical: object = {}
  public report: object
  public editing: boolean = false
  public canWrite: boolean = false
  private isDrawing: boolean = false
  private lastState: string
  public mapillary_id: string
  public irapDataset
  listPage: number = 1
  listening: boolean=false
  hasIrap: boolean
  locale: string
  weekdays: object
  reportFilters: object[]
  legends:object[]
  private irapColor = [
    '#000000',
    '#ff0000',
    '#ff9900',  
    '#ffaa00',  
    '#ffff44',  
    '#009900',
  ]
  theme:object={}
  @ViewChild(NavbarComponent) navbar!: NavbarComponent;
  @ViewChild(ChartsComponent) charts!: ChartsComponent;
  popContent: any
  iRap: object
  iraplayer: object = { when: 'after', what: 'pedestrian' }
  constructor(
    private recordService: RecordService,
    private router: Router,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private zone: NgZone,
    private injector: Injector,
    private resolver: ComponentFactoryResolver
  ) { }

  ngOnInit(): void {
    let cu = document.cookie.split(/; /).map(k => k.split(/=/)).filter(k => k[0] == "AuthService.token")
    if (!cu.length) {
      this.router.navigateByUrl('/login')
      return
    }
    this.recordService.getConfig().pipe(first()).subscribe(data => {
      localStorage.setItem('config', JSON.stringify(data));
      this.recordService.getRecordType().subscribe(
        rata => {
          if (rata['results']) {
            let schema_uuid;
            for (let i = 0; i < rata['results'].length; i++) {
              if (rata['results'][i]['label'] == data['PRIMARY_LABEL']) {
                schema_uuid = rata['results'][i]['current_schema'];
                this.recordtype_uuid=rata['results'][i]['uuid']
              };
            }
            if (schema_uuid) {
              this.recordService.getRecordSchema(schema_uuid).subscribe(
                sata => {
                  localStorage.setItem('record_schema', JSON.stringify(sata));
                  this.recordSchema=sata
                  //this.entering.emit(null)
                  //this.router.navigateByUrl('/')
                  this.afterInit()
                }
              )
            } else {
              alert("record schema not found for " + data['PRIMARY_LABEL']);
            }
          } else {
            alert(data['PRIMARY_LABEL'] + " record type not found")
          }
        })
    })
  }
  afterInit() {
    let w = document.cookie.match(/AuthService\.canWrite=([^;]*);/)
    if (w && w.length && w[1]=='true') this.canWrite = true
    this.state = localStorage.getItem('state') || 'Map'
    this.popContent = $("#popup-content")[0]
    this.config = (localStorage.getItem("config")) ? JSON.parse(localStorage.getItem("config")) : {}
    const mapillary_auth: string = this.route.snapshot.queryParamMap.get('code');
    if (mapillary_auth) {
      localStorage.setItem('mapillary_auth', mapillary_auth)
    }
    this.iRap = (this.config['IRAP_KEYS']) ? { "data": this.config['IRAP_KEYS'], "settings": this.config['IRAP_SETTINGS'] } : null
    if (localStorage.getItem("irapDataset")) {
      this.irapDataset = JSON.parse(localStorage.getItem("irapDataset"))
      if (!this.irapDataset['selected']) this.irapDataset['selected'] = {}
    }
    this.locale = localStorage.getItem("Language") || "en"
    this.weekdays = {}
    let d = new Date()
    for (let i = 0; i < 7; i++) {
      this.weekdays[d.getDay()] = d.toLocaleDateString(this.locale, { weekday: 'long' })
      d.setDate(d.getDate() + 1)
    }
    //this.recordSchema = JSON.parse(localStorage.getItem("record_schema"))
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
      this.filterObject = JSON.parse(this.filter['jsonb'])
    }

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
    let osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
    let sat = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {});

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
    this.layers = [str]
    this.options = {
      layers: this.layers
    }
    this.recordService.getCritical().pipe(first()).subscribe({
      next: critical_data => {
        if (critical_data['results']) {
          critical_data['results'].forEach(rs => {
            let gl = utfGrid(`${this.backend}/grid/critical/${rs['uuid']}/critical_offset/{z}/{x}/{y}.json/`, {
              resolution: 4,
              pointerCursor: true,
              mouseInterval: 66
            })
            gl.on('mouseover', (e) => {
              if (e.data) {
                $('.leaflet-grab').css('cursor', 'pointer')
              }
              else {
                this.zone.run(()=>{
                  $('.leaflet-grab').css('cursor', (this.listening)?'crosshair':'grab')
                })   
              }
            });
            gl.on('mouseout', (e) => {
              this.zone.run(()=>{
                $('.leaflet-grab').css('cursor', (this.listening)?'crosshair':'grab')
              })              
            });
            gl.on('click', (e: any) => {
              if (!e.data) return
              let t = this.popContent.innerHTML
                .replace(/-total-/, e.data.num_records)
                .replace(/-name-/, e.data.name)
                .replace(/-cost-/, e.data.cost)
              new L.Popup().setLatLng(e.latlng).setContent(t).openOn(this.map)
            })
            this.layersControl.overlays[rs["title"]] = new L.LayerGroup([
              L.tileLayer(`${this.backend}/maps/critical/${rs['uuid']}/critical/{z}/{x}/{y}.png`, {}),
              gl
            ])
          })
        }
        this.recordService.getBoundaries().pipe(first()).subscribe({
          next: data => {
            if (!data["results"]) {
              alert("Geometries not found")
              return
            }
            this.boundaries = data["results"]
            let current_boundary = localStorage.getItem("boundary")
            if (current_boundary) {
              this.boundary = (this.boundaries.filter(bu => bu.uuid == current_boundary).pop())
            }
            if (!current_boundary) {
              this.boundary = this.boundaries[0]
            }
            this.setBoundary(this.boundary)
            this.boundaries.forEach(b => {
              let gl = utfGrid(`${this.backend}/grid/boundary/${b['uuid']}/boundary/{z}/{x}/{y}.json/`, {
                resolution: 4,
                pointerCursor: true,
                mouseInterval: 66
              })
              console.log(b)
              gl.on('mouseover', (e) => {
                if (e.data) {
                  $('.leaflet-grab').css('cursor', 'pointer')
                  this.zone.run(()=>{
                    let t=e.data['name'].replace(/^"|"$/g, "")
                    if(this.theme && this.theme[b['uuid']] && this.theme[b['uuid']]['data'][e.data['uuid']] && this.theme[b['uuid']]['data'][e.data['uuid']]['data']){
                      t=`${t} (${this.theme[b['uuid']]['data'][e.data['uuid']]['data']})`
                    }
                    e.sourceTarget.bindTooltip( t, {sticky:true});
                  })
                }
                else {
                  this.zone.run(()=>{
                    $('.leaflet-grab').css('cursor', (this.listening)?'crosshair':'grab')
                  })
                }
              });
              gl.on('mouseout', (e) => {
                this.zone.run(()=>{
                  $('.leaflet-grab').css('cursor', (this.listening)?'crosshair':'grab')
                })   
              });
              //let l=L.tileLayer(`${this.backend}/maps/boundary/${b.uuid}/boundary/{z}/{x}/{y}.png`, {})
              gl.on('click', (e)=>{
                console.log(e)
              })
              gl.on('add', lo=>{
                this.zone.run(()=>{
                  this.addThematic(b.uuid, b.label)
                })
              })
              gl.on('remove', lo=>{
                this.zone.run(()=>{
                  delete this.theme[b.uuid]
                  this.setLegends()
                })
              })
              let g=new L.LayerGroup([gl])
              this.layersControl.overlays[b.label] = g
            })
          }
        })
      },
      error: err => {
        console.log("Error: " + err.status)
        if (err.status == 403)
          this.router.navigateByUrl('/login')
      }
    })
  }
  addThematic(uuid, label){
    let f=this.filter
    f['aggregation_boundary']=uuid
    let d=(new Date()).getTime()
    this.recordService.getQuantiles(this.recordtype_uuid,f).pipe(first()).subscribe({
      next: data=>{
        console.log(data)
        let l=L.tileLayer(`${this.backend}/maps/theme/${data['mapfile']}/theme/{z}/{x}/{y}.png?ts=${d}`, {})
        console.log(this.layersControl.overlays[label])
        if(this.layersControl.overlays[label].getLayers().length>1){
          this.layersControl.overlays[label].removeLayer(this.layersControl.overlays[label].getLayers()[1])
        }
        this.layersControl.overlays[label].addLayer(l)
        this.layersControl.overlays[label].setZIndex(999)
        this.theme[uuid]={'label':label, 'data':{}, 'mapfile': data['mapfile']}
        data['sample'].forEach(k => {
          this.theme[uuid]['data'][k[0]] = {'label':k[2], 'data':k[1]}
        })
        this.setLegends()
      },error:err=>console.log(err)
    })
  }
  selectState(s: string) {
    this.lastState = this.state
    this.state = s
  }
  setLegends(){
    this.legends=[]
    Object.keys(this.theme).forEach(kt=>{
      let imagePath="/legend/"
      this.legends.push({"title":this.theme[kt]['label'], "mapfile":this.theme[kt]['mapfile'], "uuid":kt, "layers":"theme", "ts":(new Date()).getTime()})
    })

  }

  setBoundary(event: any) {
    this.boundary = event
    if (event) {
      localStorage.setItem("boundary", this.boundary.uuid)
      this.recordService.getBoundaryPolygons(this.boundary).pipe(first()).subscribe(
        data => {
          if (data["results"]) {
            this.boundaryPolygons = data["results"]
            /*
            let bu = localStorage.getItem("boundary_polygon")
            if (bu) this.applyBoundaryPolygon(this.boundaryPolygons.filter(k => k['uuid'] == bu)[0]) 
            else */
            this.setBoundaryPolygon(null)
          }
        })
    }
  }
  setBoundaryPolygon(b: any) {
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
          // set filter: last 3 months from latest found data
          if (data['results'] && data['results'].length) {
            let di = new Date(data['results'][0].occurred_from)
            let df = new Date(data['results'][0].occurred_from)
            df.setMonth(di.getMonth() - 3)
            let fu = {
              'occurred_max': di.toISOString(),
              'occurred_min': df.toISOString()
            }
            this.setFilter(fu)
          } else {
            //nothing to show
            this.loadRecords(true)
            this.refreshList()
          }
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
            this.layersControl.overlays[rs["title"]] = new L.LayerGroup([
              L.tileLayer(`${this.backend}/maps/critical/${rs['uuid']}/critical/{z}/{x}/{y}.png`, {}),
              gl
            ])
          })
        }
      }
    )
  }
  loadRecords(show: boolean) {
    this.recordService.getMapFileKey({ 'uuid': this.recordSchema["record_type"] }, {
      filter: this.filter
    }).pipe(first()).subscribe(
      data => {
        this.spinner.hide()
        let ts = (new Date()).getTime()
        this.layersControl.overlays['Heatmap'] = L.tileLayer(`${this.backend}/maps/records/${data["mapfile"]}/heatmap/{z}/{x}/{y}.png/?${ts}`, {})
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
          this.zone.run(()=>{
            $('.leaflet-grab').css('cursor', (this.listening)?'crosshair':'grab')
          })
        });
        cl.on('click', (e: any) => {
          if (e.data) {
            if (this.isDrawing) return
            let du = new Date(Date.parse(e.data['occurred_from']))
            let t = $("#record-popup-content").html()
              .replace(/-date-/, `${du.toLocaleDateString()}, ${du.toLocaleTimeString()}`)
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
        cl.on('remove', (e:any)=>{
          this.zone.run(()=>{
            delete this.recordsLayer
          })
        })
        this.layers = this.layers.filter(k => k != this.recordsLayer)
        this.recordsLayer = new L.LayerGroup([
          L.tileLayer(`${this.backend}/maps/records/${data["mapfile"]}/records/{z}/{x}/{y}.png/?${ts}`, {}),
          cl
        ])
        this.recordsLayer.setZIndex(1000)
        if(show)
          this.layers.push(this.recordsLayer)
        this.layersControl.overlays['Records'] = this.recordsLayer
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
    console.log('setting filter')
    this.filter = e
    this.filterObject = (this.filter && this.filter['jsonb']) ? JSON.parse(this.filter['jsonb']) : {}
    console.log("this.layers")
    console.log(this.layers)
    console.log(this.layers.length)
    this.loadRecords(false)
    this.refreshList()
    Object.keys(this.theme).forEach(tk=>{
      this.addThematic(tk,this.theme[tk]['label'])
    })
    this.setLegends()
    console.log(this.theme)
  }
  viewRecord(content: any, uuid: string) {
    this.record_uuid = uuid
    this.mapClick(content)
  }
  startRecord(l:any) {
    this.listening = l
  }
  newRecord(v: any, content: any) {
    console.log('new record')
    console.log(v)
    this.listening = false
    this.navbar.inserting=false
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
  setMap(e: L.Map) {
    this.map = e
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
      this.filter['polygon'] = JSON.stringify(p.toGeoJSON()['geometry'])
      this.polygon = p
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
      this.iRap = e['iRap']
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
      let j = 0;
      for (let i = 0; i < this.layers.length; i++) {
        if (this.layers[i] == this.layersControl.overlays['iRap']) {
          j = i
        }
      }
      this.layers.splice(j)
      delete this.layersControl.overlays['iRap']
    }
  }
  drawIrap() {
    this.removeIrapLayer()
    let lg = L.layerGroup(this.iraplayer['data'].map(seg => {
      let l = L.polyline([[seg.latitude, seg.longitude], [seg.latitude_to, seg.longitude_to]], { location_id: seg['location_id'], dataset_id: seg['dataset_id'], color: this.irapColor[parseInt(seg[`${this.iraplayer['what']}_star_${this.iraplayer['when']}`]) - 1] })
      l.on('click', e => {
        let yl = e.sourceTarget
        let component = this.resolver.resolveComponentFactory(IrapPopupComponent).create(this.injector);
        component.changeDetectorRef.detectChanges();
        L.popup({ minWidth: 600, maxHeight: 420 })
          .setLatLng(e.latlng)
          .setContent(component.location.nativeElement)
          .openOn(this.map);
        this.zone.run(() => {
          let b = this.iRap['data']
          b.language_code = this.locale
          b.dataset_id = yl.options['dataset_id']
          let l = yl.getLatLngs()
          b.latitude = l[0]['lat']
          b.longitude = l[0]['lng']
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
            console.log(data)
            component.changeDetectorRef.detectChanges()
          })
        })
      })
      return l
    }))
    this.layersControl.overlays['iRap'] = lg
    this.layers.push(lg)
  }
  removeIrap() {
    console.log('removeIrap')
    this.hasIrap = false
    this.removeIrapLayer()
  }
  reloadRecords(e: any) {
    console.log("Reloading everything")
    console.log(e)
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
}
