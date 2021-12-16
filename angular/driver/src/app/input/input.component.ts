import { Component, OnInit, Input, NgZone, Output, EventEmitter } from '@angular/core'
import * as L from 'leaflet'
import { environment } from '../../environments/environment'
import { WebService } from '../web.service'
import { first } from 'rxjs/operators';
import { getSunrise, getSunset } from 'sunrise-sunset-js';
import { RecordService } from '../record.service'
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap'
import { NgxSpinnerService } from "ngx-spinner";
import * as uuid from 'uuid';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';

import "leaflet.vectorgrid";

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
  @Input() modal: any
  @Output() mapillaryId = new EventEmitter<string>()
  public schema: object
  public options: any
  public layersControl: any
  public layers: any
  public edit: boolean = false
  private marker: L.marker
  private map: L.Map
  backend: string
  latitude: number
  longitude: number
  occurred_date_ngb: NgbDateStruct
  occurred_time: any
  constructor(
    private webService: WebService,
    private zone: NgZone,
    private recordService: RecordService,
    private spinner: NgxSpinnerService,

  ) { }

  ngOnInit(): void {
    let locale = localStorage.getItem("Language") || "en"
    console.log(this.record)
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
    if (!light && this.record['geom'].coordinates) {
      this.record['light'] = this.getLight(this.record['geom'].coordinates, new Date(this.record['occurred_from']))
    }

    if (this.record['geom']) {
      console.log(this.record['geom'])
    }

    if (this.record['geom'].coordinates && !this.record['location_text']) {
      this.webService.getReverse(this.record['geom'].coordinates[1], this.record['geom'].coordinates[0]).pipe(first()).subscribe(address => {
        if (address && address['address']) {
          this.record['location_text'] = `${address['address']['road']}, ${address['address']['city']}`
        }
      })
    }
    let d = this.record['occurred_from']
    console.log("chega occurred from")
    let du = new Date(this.record['occurred_from'])
    this.occurred_date_ngb = this.asNgbDateStruct(du)
    this.occurred_time = {
      hour: parseInt(du.toLocaleTimeString(locale, { hour: '2-digit', hour12: false })),
      minute: parseInt(du.toLocaleTimeString(locale, { minute: '2-digit' })),
      second: 0
    }
    let c = this.record['geom'].coordinates
    let latlng = new L.latLng([c[1], c[0]])
    this.setMarker(latlng)
    if (!this.record['weather']) {
      this.webService.getHistoryWeather({ lat: c[1], lon: c[0], appid:this.config['OPENWEATHER_RAPID_KEY'] })
        .pipe(first()).subscribe(weatherData => {
          if (weatherData['current'] && weatherData['current']['weather'] && weatherData['current']['weather'].length)
            this.record['weather'] = weatherData['current']['weather']['description']
        })
    }


    this.layers = [osm,
      this.marker
    ]
    this.options = {
      layers: this.layers,
      zoom: 17,
      center: latlng
    }
    $(window).trigger('resize');
    if (this.config['MAPILLARY_TOKEN']) {
      let c = this.record['geom'].coordinates
      this.webService.getMapillaryImages(this.config['MAPILLARY_TOKEN'], `${c[0] - 0.005},${c[1] - 0.0015},${c[0] + 0.005},${c[1] + 0.0015}`).pipe(first()).subscribe(imagery => {
        this.record['mapillary'] = JSON.stringify(imagery)
        this.layersControl.overlays['Mapillary'] = L.layerGroup()
        this.options.layers.push(this.layersControl.overlays['Mapillary'])
        imagery['data'].forEach(img => {
          let l = new L.CircleMarker(img.geometry['coordinates'].reverse(), {
            radius: 5,
            stroke: false,
            fillColor: '#009933',
            fillOpacity: 0.3
          }).on('click', (e) => {
            console.log(`ckicked on ${img.id}`)
            e.sourceTarget.setStyle({ 'fillColor': "#ff0000", fillOpacity: 1 })
            this.zone.run(() => {
              this.setMapillaryId(img.id)
              this.layersControl.overlays['Mapillary'].getLayers().filter(k => k != e.sourceTarget).forEach(l => {
                l.setStyle({ 'fillColor': "#009933", fillOpacity: 0.3 })
              })
            })
          })
          this.layersControl.overlays['Mapillary'].addLayer(l)
        })
      })
    }
  }
  asNgbDateStruct(date: Date) {
    return { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() }
  }
  saveRecord(modal: any) {
    console.log('Saving the model')
    console.log(this.record)
    this.spinner.show()
    this.recordService.upload(this.record).pipe(first()).subscribe({
      next: data => {
        console.log('data')
        console.log(data)
        modal.dismiss()
        this.spinner.hide()
      }, error: err => {
        console.log(err)
        this.spinner.hide()
      }
    })
  }

  setMapillaryId(id: string) {
    this.mapillaryId.emit(id)
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
          if (address && address['address']) {
            this.record['location_text'] = `${address['address']['road']}, ${address['address']['city']}`
          }
        })
        this.record['geom'] = { "type": "Point", "coordinates": [e.target.getLatLng().lng, e.target.getLatLng().lat] }
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
    let light = 'day'
    let sunrise = getSunrise(c[1], c[0], d).getTime()
    if (Math.abs(sunrise - d.getTime()) < 3600000) {
      light = 'dawn'
    } else {
      let sunset = getSunset(c[1], c[0], d).getTime()
      if (Math.abs(sunset - d.getTime()) < 3600000) {
        light = 'dusk'
      } else {
        if ((d.getTime() < sunrise) || (d.getTime() > sunset)) light = 'night'
      }
    }
    return light
  }
  closeModal(m: any) {
    this.mapillaryId.emit(null)
    m.close('Cancel')
  }
  addElement(what: string) {
    let o = { 'localId': uuid.v4() }
    Object.keys(this.recordSchema['schema']['definitions'][what]['properties']).forEach(k => {
      console.log(k)
    })
    this.record['data'][what].push(o)
  }
  setDate() {
    console.log('setting date')
  }
}
