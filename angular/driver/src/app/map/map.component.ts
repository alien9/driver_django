import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
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
  @Output() map=new EventEmitter<L.Map>()

  public polygon: any
  public drawnItems: FeatureGroup = featureGroup();
  public drawOptions = {
    position: 'topright',
    draw: {
      marker: false,
      polyline: false,
      circlemarker: true,
      rectangle: {showArea: false}
    },
    edit: {
      featureGroup: this.drawnItems
    }
  };

  public recordSchema: any;
  backend: string
  record_uuid: any;
  popup: L.Popup
  
  private recordsLayer: L.LayerGroup
  constructor(
    private router: Router,
    private recordService: RecordService,
    private modalService: NgbModal
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
    if(bp) this.boundary_polygon_uuid=bp
    let fu = localStorage.getItem("current_filter")

  }
  logout() {
    document.cookie.split(/; /).map(k => k.split(/=/)).forEach(k => {
      document.cookie = `${k[0]}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`
    })
    this.router.navigateByUrl('/login')
  }
  onDrawCreated(e: any) {
    const layer = (e as DrawEvents.Created).layer;
    this.drawnItems.addLayer(layer);
  }
  onMapReady(e: any){
    this.map.emit(e)
  }
}
