import { Component, OnInit, Input } from '@angular/core'
import * as L from 'leaflet'
import { environment } from '../../environments/environment'
import { WebService } from '../web.service'
import { first } from 'rxjs/operators';
import { getSunrise, getSunset } from 'sunrise-sunset-js';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent implements OnInit {
  @Input() record: object
  @Input() recordSchema: object
  @Input() config: object
  @Input() editing: boolean
  public schema: object
  public options: any
  public layersControl: any
  public layers: any
  public edit: boolean = false
  private marker: L.marker
  private map: L.Map
  backend: string
  constructor(private webService: WebService) { }

  ngOnInit(): void {
    this.record['location_text']='..'
    console.log(this.record)
    this.editing = false
    this.schema = this.recordSchema['schema']
    let osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
    let sat = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {});
    this.backend = localStorage.getItem("backend") || (('api' in environment) ? environment.api : '')
    this.layersControl = {
      baseLayers: {
        'Open Street Map': osm,
        'Satellite Map': sat
      },
      overlays: {
      }
    }
    let light = this.record['light']
    if (!light) {
      this.record['light'] = this.getLight(this.record['geom'].coordinates, new Date(this.record['occurred_from']))
    }
    let c = this.record['geom'].coordinates
    let latlng = new L.latLng([c[1], c[0]])
    this.setMarker(latlng)
    this.layers = [osm,
      this.marker
    ]
    this.options = {
      layers: this.layers,
      zoom: 16,
      center: latlng
    }
    $(window).trigger('resize');
  }
  setMarker(latlng: L.latlng) {
    this.marker = L.marker(latlng, {
      icon: L.icon({
        iconSize: [25, 45],
        iconAnchor: [13, 45],
        iconUrl: 'assets/marker-icon-2x.png',
      }),
      draggable: true,
    }).on('dragend', (e) => {
      if (!this.editing) {
        let c = this.record['geom'].coordinates
        let latlng = new L.latLng(c[1], c[0])
        if (latlng) {
          this.marker.remove()
          this.setMarker(latlng)
          this.marker.addTo(this.map)
        }
      } else {
        this.webService.getReverse(e.target.getLatLng().lat, e.target.getLatLng().lng).pipe(first()).subscribe(address => {
          if (address && address['display_name']) {
            this.record['location_text'] = address['display_name']
          }
        })

        console.log(this.record)
      }
    })
  }
  mapReady(e: L.Map) {
    this.map = e
    setTimeout(function () {
      e.invalidateSize();
    }, 10);
  }
  tabChange(e: any) {
    if (this.schema['definitions'][e.nextId]['details']) {// it's returning to the map pane
      setTimeout(function () {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  }
  getLight(c, d) {
    let light = 'Day'
    let sunrise = getSunrise(c[1], c[0], d).getTime()
    if (Math.abs(sunrise - d.getTime()) < 3600000) {
      light = 'Dawn'
    } else {
      let sunset = getSunset(c[1], c[0], d).getTime()
      if (Math.abs(sunset - d.getTime()) < 3600000) {
        light = 'Dusk'
      }else{
        if((d.getTime() < sunrise) || (d.getTime()>sunset)) light='Night'
      }
    } 
    return light
  }
}
