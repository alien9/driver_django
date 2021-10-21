import { EmitterVisitorContext } from '@angular/compiler';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap'
import { SearchableFilterPipe } from './search-field.pipe'
import { EnumPipe } from './../enum.pipe'
import { JSDocTagName } from '@angular/compiler/src/output/output_ast';
import { Router } from '@angular/router';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  @Input() config:object
  @Input() boundaries: any[] = []
  @Input() boundary: any
  @Input() boundaryPolygons: any[] = []
  @Input() boundaryPolygon: any
  @Input() filter: object
  public filterPage: object
  @Output() boundaryChange = new EventEmitter<object>()
  @Output() boundaryPolygonChange = new EventEmitter<object>()
  @Output() filterChange = new EventEmitter<object>()
  @Output() stateChange = new EventEmitter<string>()
  public recordSchema: object
  public stateSelected = 'Map'
  public authenticated: boolean = true
  public occurred_min: Date
  public occurred_max: Date
  public occurred_min_ngb: NgbDateStruct
  public occurred_max_ngb: NgbDateStruct
  public schema: any
  public tables: any[]
  language:string
  constructor(
    private router: Router,
    private modalService: NgbModal) {      
    }

  ngOnInit(): void {
    this.recordSchema = JSON.parse(localStorage.getItem('record_schema'))
    this.schema = this.recordSchema['schema']
    this.language=localStorage.getItem("Language") || 'en'
    console.log(this.schema)
    this.initDataFrame()
  }
  onStateSelected(state) {
    this.stateSelected = state
    this.stateChange.emit(state)
  }
  selectBoundary(b) {
    this.boundaryChange.emit(b)
  }
  getBoundaryPolygonLabel(b: any) {
    return b.data[this.boundary.display_field]
  }
  selectBoundaryPolygon(b: any) {
    this.boundaryPolygonChange.emit(b)
  }
  startFilters(content: any) {
    this.modalService.open(content, { size: 'lg' });
  }
  asNgbDateStruct(date: Date) {
    return { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() }
  }
  setOccurredFrom(t) {
    console.log(t)
  }

  fromNgb(ngb: NgbDateStruct) {
    let d = new Date()
    d.setFullYear(ngb.year)
    d.setMonth(ngb.month - 1)
    d.setDate(ngb.day)
    d.setHours(0)
    d.setMinutes(0)
    return d.toISOString()
  }
  apply() {
    //jsonb={"driverVehiculo":{"Tipo":{"_rule_type":"containment_multiple","contains":["Motocicleta",["Motocicleta"]]}},"driverPersona":{"Edad":{"_rule_type":"intrange","min":3,"max":7},"Tipo":{"_rule_type":"containment_multiple","contains":["Conductor","Pasajero",["Conductor"],["Pasajero"]]},"Estado":{"_rule_type":"containment_multiple","contains":["Herido",["Herido"]]}},"driverUbicacionTemporal":{"Estado+meteorol\xc3\xb3gico":{"_rule_type":"containment","contains":["Granizo","Nieve","Niebla+/+neblina",["Granizo"],["Nieve"],["Niebla+/+neblina"]]}}}&occurred_max=2021-09-30T23:59:59.999Z&occurred_min=2021-07-02T00:00:00.000Z&record_type=10a31c60-f0b8-499d-9c79-3cb351278144&weather=cloudy'
    let jsonb = {}
    this.tables.forEach(t => {
      let jt = {}
      let defs = this.schema['definitions'][t]
      Object.entries(defs.properties).forEach((k) => {
        let e = (k[1]['enum']) ? k[1]['enum'] : (k[1]['items']) ? k[1]['items'].enum : []
        console.log(this.filterPage[t][k[0]])
        let selected = Object.entries(this.filterPage[t][k[0]]).filter(m => m[1]).map(m => m[0])
        if (e.length && selected.length) {
          let j = {}
          if (this.schema['definitions'][t]['multiple']) {
            j = { "_rule_type": "containment_multiple" }
          } else {
            j = { "_rule_type": "containment" }
          }
          console.log(selected)
          j["contains"] = selected
          jt[k[0]] = j
        }
        if (k[1]['type'] && k[1]['type'] == 'integer') {
          if (this.filterPage[t][k[0]].maximum && this.filterPage[t][k[0]].minimum) {
            jt[k[0]] = {
              "_rule_type": "intrange",
              "min": this.filterPage[t][k[0]].minimum,
              "max": this.filterPage[t][k[0]].maximum
            }
          }
        }
      })
      if (Object.keys(jt).length)
        jsonb[t] = jt
    })

    let result = {
      jsonb: JSON.stringify(jsonb)
    }
    if (this.occurred_min_ngb) {
      result['occurred_min'] = this.fromNgb(this.occurred_min_ngb)
    }
    if (this.occurred_max_ngb) {
      result['occurred_max'] = this.fromNgb(this.occurred_max_ngb)
    }
    this.filterChange.emit(result)
    localStorage.setItem("current_filter", JSON.stringify(result))
  }
  initDataFrame() {
    this.tables = Object.keys(this.schema['properties'])
      .sort((k, j) => { return this.schema['properties'][k].propertyOrder - this.schema['properties'][j].propertyOrder })
    let fu = localStorage.getItem('current_filter')

    this.loadFilter(fu)
  }
  loadFilter(fu) {
    let f: object
    if (fu) {
      let h = JSON.parse(fu)
      f = JSON.parse(h.jsonb)
      this.occurred_max = new Date(h.occurred_max)
      this.occurred_min = new Date(h.occurred_min)
    } else {
      this.occurred_max = new Date()
      this.occurred_min = new Date()
      this.occurred_min.setMonth(this.occurred_max.getMonth() - 3);
      f = {}
    }
    this.occurred_min_ngb = this.asNgbDateStruct(this.occurred_min)
    this.occurred_max_ngb = this.asNgbDateStruct(this.occurred_max)


    this.tables.forEach(t => {
      if (!f[t]) {
        f[t] = {}
      }
      let defs = this.schema['definitions'][t]
      Object.entries(defs.properties).forEach((k) => {
        let e = (k[1]['enum']) ? k[1]['enum'] : (k[1]['items']) ? k[1]['items'].enum : []
        if (!f[t][k[0]]) f[t][k[0]] = {}
        e.forEach(element => {
          if (f[t][k[0]]['contains']) f[t][k[0]][element] = f[t][k[0]]['contains'].indexOf(element) >= 0
        });
        if ((k[1]['type'] == "number") || (k[1]['type'] == "integer")) {
          f[t][k[0]].minimum = f[t][k[0]]['min']
          f[t][k[0]].maximum = f[t][k[0]]['max']
        }
      })
      this.filterPage = f
    })

  }
  logout() {
    document.cookie.split(/; /).map(k => k.split(/=/)).forEach(k => {
      document.cookie = `${k[0]}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`
    })
    this.router.navigateByUrl('/login')
  }
  download() {

  }
  setlang(code:string){
    localStorage.setItem("Language",code)
    location.reload()
  }
  mapillaryAuth(){
    window.location.href=this.config['MAPILLARY.URL']
  }
}
