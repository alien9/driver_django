import { Component, OnInit, Input } from '@angular/core';
import { NgxSpinnerService } from "ngx-spinner";
import { RecordService } from '../record.service'
import { first } from 'rxjs/operators'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as L from 'leaflet'
import { environment } from '../../environments/environment'

@Component({
  selector: 'app-duplicate',
  templateUrl: './duplicate.component.html',
  styleUrls: ['./duplicate.component.scss']
})
export class DuplicateComponent implements OnInit {
  @Input() recordTypeUuid: object
  @Input() recordSchema: object
  duplicates: object[]
  duplicatePage: number = 1
  map: L.Map[] = []
  backend: string
  layersControl: any
  options: any
  layers: any
  record: any // the registry being evaluated
  keys: string[]=['record','duplicate_record']
  markers:object[]
  constructor(
    private spinner: NgxSpinnerService,
    private recordService: RecordService,
    private modalService: NgbModal,
  ) { }

  ngOnInit(): void {
    this.loadDuplicates()
  }
  loadDuplicates() {
    console.log(this.recordSchema)
    this.spinner.show()
    this.recordService.getDuplicates(this.recordTypeUuid, (this.duplicatePage - 1) * 50).pipe(first()).subscribe({
      next: data => {
        this.duplicates = data
        console.log(data)
        this.spinner.hide()
      },
      error: err => {
        this.spinner.hide()
      }
    })
  }
  view(r: object, modal: any) {
    console.log(r)
    this.record = r
    this.modalService.open(modal, { size: 'lg', animation: true, keyboard: false, backdrop: "static" });
    this.showMap()
    return
  }
  setPage() {
    this.loadDuplicates()
  }
  showMap() {
    let latlng = [this.record['record'],this.record['duplicate_record']].map(r => r['geom'].coordinates).map(c => new L.latLng([c[1], c[0]]))
    this.markers = latlng.map(l=>L.marker(l, {
      icon: L.icon({
        iconSize: [25, 45],
        iconAnchor: [13, 45],
        iconUrl: 'assets/marker-icon-2x.png',
      }),
      draggable: false
    }))
    let osm = [
      [L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }), this.markers[0]],
      [L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }), this.markers[1]]
    ]
    let sat = [
      L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {}),
      L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {})
    ]
    this.backend = localStorage.getItem("backend") || (('api' in environment) ? environment.api : '')
    this.layersControl = this.keys.map((k, i)=>{ console.log(i);return {
      baseLayers: {
        'Open Street Map': osm[i][0],
        'Satellite Map': sat[i]
      },
      overlays: {
      }
    }})
    
    this.layers=osm
    
    this.options = [{
      layers: [osm[0][0], sat[0]],
      zoom: 17,
      center: latlng[0]
    },{
      layers: [osm[1][0], sat[1]],
      zoom: 17,
      center: latlng[1]
    }]

  }
  mapReady(e: L.Map) {
    this.map = e
    setTimeout(function () {
      e.invalidateSize();
    }, 10);
  }
  useRecord(m, k){
    console.log('using this'+k)
    this.spinner.show()
    m.dismiss()
    this.recordService.resolveDuplicate(this.record['uuid'], this.record[k]['uuid']).pipe(first()).subscribe({next:data=>{
      console.log(data)
      this.loadDuplicates()
    },error:err=>{
      console.log(err)
    }})
  }
  useBoth(m){
    console.log('using both')
    this.spinner.show()
    m.dismiss()
    this.recordService.resolveDuplicate(this.record['uuid'], null).pipe(first()).subscribe({next:data=>{
      console.log(data)
      this.loadDuplicates()
    },error:err=>{
      console.log(err)
      this.spinner.hide()
    }})
  } 
  modifyRecord(uuid, data){

  }
}
