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
import { Observable, of, OperatorFunction } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap } from 'rxjs/operators';

import "leaflet.vectorgrid";
import { DYNAMIC_TYPE } from '@angular/compiler';
import { textChangeRangeIsUnchanged } from 'typescript';

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
  @Input() locale: string
  @Input() roadmap_uuid: string
  @Output() mapillaryId = new EventEmitter<string>()
  @Output() reloadRecords = new EventEmitter<object>()
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
  weatherValues = [
    '',
    'clear-day',
    'clear-night',
    'cloudy',
    'fog',
    'hail',
    'partly-cloudy-day',
    'partly-cloudy-night',
    'rain',
    //'sleet',
    //'snow',
    'thunderstorm',
    //'tornado',
    'wind'
  ]
  geocoding = false
  geocodeFailed = false
  constructor(
    private webService: WebService,
    private zone: NgZone,
    private recordService: RecordService,
    private spinner: NgxSpinnerService,
  ) { }

  ngOnInit(): void {
    this.schema = this.recordSchema['schema']
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
          let lt = []
          if (address['address']['road']) lt.push(address['address']['road'])
          if (address['address']['city']) lt.push(address['address']['city'])
          this.record['location_text'] = lt.join(", ")
        }
      })
    }

    let du = new Date(this.record['occurred_from'])
    this.occurred_date_ngb = this.asNgbDateStruct(du)
    this.occurred_time = {
      hour: parseInt(du.toLocaleTimeString(this.locale, { hour: '2-digit', hour12: false })),
      minute: parseInt(du.toLocaleTimeString(this.locale, { minute: '2-digit' })),
      second: 0
    }
    let c = this.record['geom'].coordinates
    let latlng = new L.latLng([c[1], c[0]])
    this.setMarker(latlng)
    if (!this.record['weather']) {
      this.webService.getHistoryWeather({ lat: c[1], lon: c[0], appid: this.config['OPENWEATHER_RAPID_KEY'] })
        .pipe(first()).subscribe(weatherData => {
          if (weatherData['current'] && weatherData['current']['weather'] && weatherData['current']['weather'].length)
            this.record['weather'] = weatherData['current']['weather']['description']
        })
    }

    let bl = localStorage.getItem("input_baselayer") || 'CartoDB'
    if (this.layersControl.baseLayers[bl])
      this.layers = [this.layersControl.baseLayers[bl]]
    else
      this.layers = [str]
    this.options = {
      layers: this.layers
    }

    this.options = {
      layers: this.layers,
      zoom: 17,
      center: latlng
    }
    $(window).trigger('resize');
    let mapillary
    if (this.record['mapillary'] && this.record['mapillary'].length) {
      try {
        mapillary = JSON.parse(this.record['mapillary'])
        this.layersControl.overlays['Mapillary'] = L.layerGroup()
        this.options.layers.push(this.layersControl.overlays['Mapillary'])
        this.loadMapillary(mapillary)
      } catch (error) {
        console.log("Mapillary parse Error")
      }
    }
    if (!mapillary && this.config['MAPILLARY_TOKEN']) {
      let c = this.record['geom'].coordinates
      this.webService.getMapillaryImages(this.config['MAPILLARY_TOKEN'], `${c[0] - 0.005},${c[1] - 0.0015},${c[0] + 0.005},${c[1] + 0.0015}`).pipe(first()).subscribe(imagery => {
        //this.record['mapillary'] = JSON.stringify(imagery)
        this.layersControl.overlays['Mapillary'] = L.layerGroup()
        this.options.layers.push(this.layersControl.overlays['Mapillary'])
        this.loadMapillary(imagery)
      })
    }

  }
  loadMapillary(imagery: any) {
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
  }
  asNgbDateStruct(date: Date) {
    return { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() }
  }
  saveRecord(modal: any) {
    this.setDate(null)
    this.spinner.show()
    this.recordService.upload(this.record).pipe(first()).subscribe({
      next: data => {
        this.reloadRecords.emit(this.record)
        modal.dismiss()
        this.spinner.hide()
      }, error: err => {
        console.log(err)
        alert(err['error']['data'])
        this.spinner.hide()
      }
    })
  }
  deleteRecord(modal: any) {
    this.setDate(null)
    this.spinner.show()
    this.record['archived'] = true
    this.recordService.upload(this.record).pipe(first()).subscribe({
      next: data => {
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
        this.zone.run(() => {
          this.webService.getReverse(e.target.getLatLng().lat, e.target.getLatLng().lng).pipe(first()).subscribe(address => {
            if (address && address['address']) {
              let lt = []
              if (address['address']['road']) lt.push(address['address']['road'])
              if (address['address']['city']) lt.push(address['address']['city'])
              this.record['location_text'] = lt.join(", ")
            }
          })
          this.record['geom'] = { "type": "Point", "coordinates": [e.target.getLatLng().lng, e.target.getLatLng().lat] }
        })
      }
    })

  }
  mapReady(e: L.Map) {
    this.map = e
    if (this.marker)
      this.marker.addTo(this.map)
    setTimeout(function () {
      e.invalidateSize();
    }, 10);
    e.on('overlayadd', e => {
    })
    e.on('baselayerchange', l => {
      localStorage.setItem("input_baselayer", l.name)
    })
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
    let o = { '_localId': uuid.v4() }
    Object.keys(this.recordSchema['schema']['definitions'][what]['properties']).forEach(k => {
      console.log(k)
    })
    this.record['data'][what].push(o)
  }
  setDate(e: any) {
    let d = new Date()
    d.setFullYear(this.occurred_date_ngb['year'], this.occurred_date_ngb['month'] - 1, this.occurred_date_ngb['day'])
    d.setHours(this.occurred_time.hour)
    d.setMinutes(this.occurred_time.minute)
    d.setSeconds(0)
    this.record['occurred_from'] = d
    this.record['occurred_to'] = d
  }
  geocode: OperatorFunction<string, readonly { text, lat, lon }[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.geocoding = true),
      switchMap(term =>
        this.recordService.getForward(this.roadmap_uuid, {
          'term': term,
          'bbox': `${this.map.getBounds().getSouth()},${this.map.getBounds().getEast()},${this.map.getBounds().getNorth()},${this.map.getBounds().getWest()}`,
          'limit': 5
        }).pipe(
          tap(() => this.geocodeFailed = false),
          catchError(() => {
            this.geocodeFailed = true;
            return of([]);
          }))
      ),
      tap(() => this.geocoding = false)
    )
  geoResultFormatter = (x: any) => {
    if (x['address'])
      return x['address']['fullname']
    return " "
  }
  geoInputFormatter = (x: any) => {
    if (typeof x == 'object') {
      if (x['address'])
        return x['address']['fullname']
      return " "
    }
    return x
  }
  loadFile(e: any, table: any, field: string) {
    if (e.srcElement['files'] && e.srcElement['files'].length) {
      let file = e.srcElement['files'][0]
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = event => {
        table[field] = reader.result
      }
    }
  }
  onMultipleCheckChange(e: any, t: string, idx: number, f: any) {
    if (!this.record['data'][t][idx][f])
      this.record['data'][t][idx][f] = []

    let k = e.srcElement.value
    if (e.srcElement.checked) {
      this.record['data'][t][idx][f].push(k)
    } else {
      this.record['data'][t][idx][f].splice(f.indexOf(k), 1)
    }
  }
  onSingleCheckChange(e: any, t: string, f: string) {
    if (!this.record['data'][t][f])
      this.record['data'][t][f] = []
    let k = e.srcElement.value
    if (e.srcElement.checked) {
      this.record['data'][t][f].push(k)
    } else {
      this.record['data'][t][f].splice(f.indexOf(k), 1)
    }
  }
  selectGeocodedOption(e: any): any {
    if (!e.item) return
    if (e.item['address'])
      this.record['location_text'] = e.item['address']['road']
    this.record['geom']['coordinates'] = [e.item.lon, e.item.lat]
    let latlng = new L.latLng(e.item.lat, e.item.lon)
    if (latlng) {
      this.marker.remove()
      this.setMarker(latlng)
      this.marker.addTo(this.map)
      this.map.panTo(latlng)
    }
  }
}
