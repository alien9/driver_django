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
  @Output() newRecord = new EventEmitter<object>()
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
    let bp = localStorage.getItem("boundary_polygon")
    if (bp) this.boundary_polygon_uuid = bp
    //if (this.polygon) this.drawnItems.addLayer(this.polygon)
    this.drawOptions = {
      position: 'topright',
      draw: {
        marker: false,
        polyline: false,
        circlemarker: false,
        circle: false,
        rectangle: { showArea: false, repeatMode: false }
      },
      edit: {
        featureGroup: this.drawnItems
      }
    };
  }
  logout() {
    document.cookie.split(/;\s?/).map(k => k.split(/=/)).forEach(k => {
      document.cookie = `${k[0]}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`
    })
    localStorage.removeItem("AuthService.token")
    this.router.navigateByUrl('/login')
  }
  onDrawCreated(e: any) {
    let layer = (e as DrawEvents.Created).layer;
    this.drawnItems.addLayer(layer);
    this.onSetPolygon.emit(this.drawnItems)
    this.setDrawing.emit(false)
  }
  onDrawDeleted(e: any) {
    let layer = (e as DrawEvents.Deleted).layer;
    this.drawnItems.removeLayer(layer);
    this.onSetPolygon.emit(this.drawnItems)
    this.setDrawing.emit(false)
  }
  onMapReady(e: any) {
    this.map.emit(e)
    e.on('overlayadd', e => {
    })
    e.on('baselayerchange', l => {
      localStorage.setItem("baselayer", l.name)
    })
  }
  startDraw(e: any) {
    this.setDrawing.emit(true)
  }
  addLayerEvent(e: any) {
    console.log(e)
  }
  removeLayer(e: any) {
    console.log(e)
  }
  clickMap(e: any) {
    $('.leaflet-container').css('cursor', 'grab');
    if (this.mapListening) {
      $('.leaflet-container').css('cursor', 'grab');
      this.newRecord.emit({
        'latlng': e.latlng
      })
    }
  }
}