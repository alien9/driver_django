import { Component, OnInit, Input } from '@angular/core';
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
<<<<<<< HEAD
  public record: object
  @Input() options: any
  @Input() layers: any
  @Input() layersControl: any
  @Input() fitBounds: any
  @Input() boundary_polygon_uuid: any
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

=======
  public options: any
public layersControl: any
  constructor(private router: Router) { }
>>>>>>> c2c2bcd0518aa5903084e314fdd0fd5305d3319e
  ngOnInit(): void {
    let cu = document.cookie.split(/; /).map(k => k.split(/=/)).filter(k => k[0] == "AuthService.token")
    if (!cu.length) {
      this.router.navigateByUrl('/login')
      return
    }
<<<<<<< HEAD
    this.recordSchema = JSON.parse(localStorage.getItem("record_schema"))
    let config = JSON.parse(localStorage.getItem("config"))
    let bp = localStorage.getItem("boundary_polygon")
    if(bp) this.boundary_polygon_uuid=bp
    let fu = localStorage.getItem("current_filter")

=======
    let config=JSON.parse(localStorage.getItem("config"))
    let osm=L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
    let sat = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {});

    this.layersControl = {
      baseLayers: {
        'Open Street Map': osm,
        'Satellite Map': sat
      },
      overlays: {
        'Big Circle': L.circle([ 46.95, -122 ], { radius: 5000 }),
        'Big Square': L.polygon([[ 46.8, -121.55 ], [ 46.9, -121.55 ], [ 46.9, -121.7 ], [ 46.8, -121.7 ]])
      }
    }
    this.options = {
      zoom: config.MAP_ZOOM,
      center: [config.MAP_CENTER_LATITUDE, config.MAP_CENTER_LONGITUDE],
      layers:[
        osm
      ]
    }
>>>>>>> c2c2bcd0518aa5903084e314fdd0fd5305d3319e
  }
  logout() {
    document.cookie.split(/; /).map(k => k.split(/=/)).forEach(k => {
      document.cookie = `${k[0]}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`
    })
    this.router.navigateByUrl('/login')
  }
<<<<<<< HEAD

  onDrawCreated(e: any) {
    const layer = (e as DrawEvents.Created).layer;
    this.drawnItems.addLayer(layer);
  }
=======
>>>>>>> c2c2bcd0518aa5903084e314fdd0fd5305d3319e
}
