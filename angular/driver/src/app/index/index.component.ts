import { Component, OnInit, ViewChild } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { RecordService } from '../record.service'
import { first } from 'rxjs/operators';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { DrawEvents, featureGroup, FeatureGroup, icon, latLng, tileLayer } from 'leaflet';
import { utfGrid } from '../UtfGrid';
import { } from 'jquery'
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent implements OnInit {  
  public config:object
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
  public record:object
  public recordList:object
  public map:L.Map
  record_uuid: string
  public critical: object={}
  public report:object
  popContent:any
  constructor(
    private recordService: RecordService,
    private router: Router,
    private modalService: NgbModal,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.state=localStorage.getItem('state') || 'Map'
    this.popContent=$("#popup-content")[0]
    let cu = document.cookie.split(/; /).map(k => k.split(/=/)).filter(k => k[0] == "AuthService.token")
    if (!cu.length) {
      this.router.navigateByUrl('/login')
      return
    }
    this.config=JSON.parse(localStorage.getItem("config"))
    const mapillary_auth: string = this.route.snapshot.queryParamMap.get('code');
    if(mapillary_auth){
      localStorage.setItem('mapillary_auth', mapillary_auth)
    }

    this.recordSchema = JSON.parse(localStorage.getItem("record_schema"))
    this.backend = localStorage.getItem("backend") || (('api' in environment) ? environment.api : '')

    let bp = localStorage.getItem("boundary_polygon")
    if (bp) this.boundary_polygon_uuid = bp
    let fu = localStorage.getItem("current_filter")
    if (fu) {
      this.filter = JSON.parse(fu)
      this.filter['obj']=JSON.parse(this.filter['jsonb'])
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
    this.recordService.getCritical().pipe(first()).subscribe(
      critical_data => {
        if (critical_data['results']) {
          critical_data['results'].forEach(rs => {
            let gl=utfGrid(`${this.backend}/grid/critical/${rs['uuid']}/critical/{z}/{x}/{y}.json/`, {
              resolution: 4,
              pointerCursor: true,
              mouseInterval: 66
            })
            gl.on('mouseover', (e) => {
              if (e.data) {
                $('.leaflet-grab').css('cursor', 'pointer')
              }
              else {
                $('.leaflet-grab').css('cursor', 'grab')
              }
            });
            gl.on('mouseout', (e) => {
              $('.leaflet-grab').css('cursor', 'grab')
            });
            gl.on('click', (e: any) => {

              if(!e.data) return
              let t=this.popContent.innerHTML
              .replace(/-total-/, e.data.num_records)
              .replace(/-name-/, e.data.name)
              .replace(/-cost-/, e.data.cost)

              new L.Popup().setLatLng(e.latlng).setContent(t).openOn(this.map)
              
              
              /* if (e.data) {
                this.record_uuid = e.data.uuid
                gl.openPopup($("#popup-content")[0], e.latlng, {}) 
                $("#map-popup-button").trigger('click')
              } */
            })

            this.layersControl.overlays[rs["title"]] = new L.LayerGroup([
              L.tileLayer(`${this.backend}/maps/critical/${rs['uuid']}/critical/{z}/{x}/{y}.png`, {}),
              gl
            ])
          })
        }
        this.recordService.getBoundaries().pipe(first()).subscribe(
          data => {
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
              this.layersControl.overlays[b.label] = L.tileLayer(`${this.backend}/maps/boundary/${b.uuid}/boundary/{z}/{x}/{y}.png`, {});
            })
          },
          err => {
            console.log("Error: " + err.status)
            if (err.status == 403)
              this.router.navigateByUrl('/login')
          }
        )
      }
    )


  }
  selectState(s: string) {
    this.state = s
  }

  setBoundary(event: any) {
    this.boundary = event
    if(event) {
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
    if(!this.filter) this.filter={}
    this.boundary_polygon_uuid=(b) ? b['uuid'] : null
    if(this.boundary_polygon_uuid){
      this.filter['polygon_id']=this.boundary_polygon_uuid
      localStorage.setItem("boundary_polygon", this.boundary_polygon_uuid)
    }else{
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
    this.loadRecords(true)
    this.recordList=null
    if(this.state=='List'){
      if (this.boundary_polygon_uuid) this.filter["polygon_id"] = this.boundary_polygon_uuid
      this.recordService.getRecords({ 'uuid': this.recordSchema["record_type"] }, { filter: this.filter }).pipe(first()).subscribe(
        data => {
          this.recordList = data
        })
    }
  }
  loadCritical() {
    this.recordService.getCritical().pipe(first()).subscribe(
      critical_data => {
        if (critical_data['results']) {
          critical_data['results'].forEach(rs => {
            let gl=utfGrid(`${this.backend}/grid/critical/${rs['uuid']}/critical/{z}/{x}/{y}.json/`, {
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
          $('.leaflet-grab').css('cursor', 'grab')
        });
        cl.on('click', (e: any) => {
          if (e.data) {
            let du=new Date(Date.parse(e.data['occurred_from']))
            let t=$("#record-popup-content").html()
              .replace(/-date-/, `${du.toLocaleDateString()}, ${du.toLocaleTimeString()}`)
              .replace(/-location-/, e.data['location_text'])
              .replace(/-uuid-/, e.data['uuid'])
            new L.Popup().setLatLng(e.latlng).setContent(t).openOn(this.map)
            var m=this.map
            this.record_uuid = e.data.uuid
            $("#open-record-popup").on('click',function(){
              m.closePopup()
              $('#map-popup-button').trigger('click');
            })
           }
        })
        this.layers = this.layers.filter(k => k != this.recordsLayer)
        this.recordsLayer = new L.LayerGroup([
          L.tileLayer(`${this.backend}/maps/records/${data["mapfile"]}/records/{z}/{x}/{y}.png/?${ts}`, {}),
          cl
        ])
        this.layers.push(this.recordsLayer)
        this.layersControl.overlays['Records'] = this.recordsLayer
      })
  }

  setFilter(e: any) {
    this.filter = e
    this.loadRecords(false)
  }
  viewRecord(content:any, uuid:string){
    this.record_uuid=uuid
    this.mapClick(content)
  }

  mapClick(content: any) {
    if(!this.record_uuid) this.record_uuid=$("#record-uuid").val().toString()
    if (this.record_uuid) {
      this.recordService.getRecord(this.record_uuid).pipe(first()).subscribe(
        data => {
          this.record = data
          this.modalService.open(content, { size: 'lg' });
        })
      this.record_uuid = null
    }

  }
  setMap(e:L.Map){
    this.map=e
  }
  popClick(e:any){
    console.log(e)
  }
  setReport(r:object){
    this.report=r
  }
}
