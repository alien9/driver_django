import { Component, OnInit, Input } from '@angular/core';
import * as L from 'leaflet';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent implements OnInit {
  @Input() record: object
  @Input() recordSchema: object
  @Input() config:object
  public schema:object
  public options: any
  public layersControl: any
  public layers: any
  public edit:boolean=false
  backend: string
  constructor() { }

  ngOnInit(): void {
    this.schema=this.recordSchema['schema']
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
    let latlng=this.record['geom'].coordinates.reverse()
    this.layers = [osm,
      L.marker(latlng, {
        icon: L.icon({
          iconSize: [ 25, 45 ],
          iconAnchor: [ 13, 45 ],
          iconUrl: 'assets/marker-icon-2x.png',
       }),
        draggable: true,

      })
    ]
    this.options = {
      layers: this.layers,
      zoom:16,
      center:latlng
    }

  }

}
