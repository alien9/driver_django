import { Component, OnInit, Input, Output, EventEmitter, NgZone } from '@angular/core';
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

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  public record: object
  @Input() options: any
  @Input() layers: any
  @Input() layersControl: any
  @Input() fitBounds: any
  @Input() boundary_polygon_uuid: any
  @Input() mapListening: boolean
  @Output() map = new EventEmitter<L.Map>()
  @Output() onSetPolygon = new EventEmitter<object>()
  @Input() polygon: any
  @Output() setDrawing = new EventEmitter<boolean>()
  @Output() newRecord=new EventEmitter<object>()
  public drawnItems: FeatureGroup = featureGroup();
  public drawOptions: any

  public recordSchema: any;
  backend: string
  record_uuid: any;
  popup: L.Popup

  private recordsLayer: L.LayerGroup
  constructor(
    private router: Router,
    private recordService: RecordService,
    private modalService: NgbModal,
    private zone: NgZone
  ) { }

  ngOnInit(): void {
    let cu = document.cookie.split(/; /).map(k => k.split(/=/)).filter(k => k[0] == "AuthService.token")
    if (!cu.length) {
      this.router.navigateByUrl('/login')
      return
    }
    this.recordSchema = JSON.parse(localStorage.getItem("record_schema"))
    let config = JSON.parse(localStorage.getItem("config"))
    let bp = localStorage.getItem("boundary_polygon")
    if (bp) this.boundary_polygon_uuid = bp
    let fu = localStorage.getItem("current_filter")
    if (this.polygon) this.drawnItems.addLayer(this.polygon)
    this.drawOptions = {
      position: 'topright',
      draw: {
        marker: false,
        polyline: false,
        circlemarker: false,
        circle: false,
        rectangle: { showArea: false }
      },
      edit: {
        featureGroup: this.drawnItems
      }
    };
  }
  logout() {
    document.cookie.split(/; /).map(k => k.split(/=/)).forEach(k => {
      document.cookie = `${k[0]}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`
    })
    this.router.navigateByUrl('/login')
  }
  onDrawCreated(e: any) {
    this.drawnItems = featureGroup()
    const layer = (e as DrawEvents.Created).layer;
    this.drawnItems.addLayer(layer);
    this.onSetPolygon.emit(layer)
    this.setDrawing.emit(false)
  }
  onDrawDeleted(e: any) {
    this.onSetPolygon.emit(null)
    this.setDrawing.emit(false)
  }
  onMapReady(e: any) {
    this.map.emit(e)
    e.on('overlayadd', e=>{
      console.log("added an overlay")
      console.log(e)
    })
  }
  startDraw(e: any) {
    this.setDrawing.emit(true)
  }
  addLayerEvent(e: any) {
    console.log('added')
    console.log(e)
  }
  removeLayer(e: any) {
    console.log('removed')
    console.log(e)
  }
  clickMap(e: any) {
    $('.leaflet-container').css('cursor','grab');
    if(this.mapListening){
      $('.leaflet-container').css('cursor','grab');
      this.newRecord.emit({
        'latlng':e.latlng
      })
    }
  }
}