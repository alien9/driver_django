import { EmitterVisitorContext } from '@angular/compiler';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap'
import { SearchableFilterPipe } from './search-field.pipe'
import { EnumPipe } from './../enum.pipe'
import { JSDocTagName } from '@angular/compiler/src/output/output_ast';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { translate } from '@angular/localize/src/translate';
import { RecordService } from './../record.service'
import { first } from 'rxjs/operators';
import { NgxSpinnerService } from "ngx-spinner";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  @Input() config: object
  @Input() boundaries: any[] = []
  @Input() boundary: any
  @Input() boundaryPolygons: any[] = []
  @Input() boundaryPolygon: any
  @Input() filter: object
  @Input() iRap:object
  @Input() irapDataset:object
  public filterPage: object
  @Output() boundaryChange = new EventEmitter<object>()
  @Output() boundaryPolygonChange = new EventEmitter<object>()
  @Output() filterChange = new EventEmitter<object>()
  @Output() stateChange = new EventEmitter<string>()
  @Output() reportChange = new EventEmitter<object>()
  @Output() goBack = new EventEmitter<string>()
  @Output() iRapChange=new EventEmitter<object>()
  public recordSchema: object
  @Input() stateSelected
  public authenticated: boolean = true
  public occurred_min: Date
  public occurred_max: Date
  public occurred_min_ngb: NgbDateStruct
  public occurred_max_ngb: NgbDateStruct
  public schema: any
  public tables: any[]
  public reportFilters: any[]
  public tabs = [

  ]
  public reportHeaders: object
  reportParameters: object
  public report: object
  private header: object = { row: null, col: null, aggregation_boundary: null }// the type of row_ / col_ period_type,boundary_id,choices_path
  public crosstabsFilters: object
  private hasGeography: boolean = false
  private hasTime: object = { 'row': false, 'col': false }
  language: string
  irap_email: string
  irap_password: string
  irap_err: string
  constructor(
    private recordService: RecordService,
    public readonly translate: TranslateService,
    private router: Router,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService) {
  }

  ngOnInit(): void {
    this.tabs = [
      { "label": 'Rows', "key": 'row' },
      { "label": 'Columns', "key": 'col' }
    ]
    this.reportHeaders = {

    }
    this.recordSchema = JSON.parse(localStorage.getItem('record_schema'))
    if (!this.recordSchema) {
      this.router.navigateByUrl('/login')
      return
    }
    this.schema = this.recordSchema['schema']
    this.language = localStorage.getItem("Language") || 'en'
    console.log(this.schema)
    this.initDataFrame()
  }
  onStateSelected(state) {
    this.stateSelected = state
    localStorage.setItem('state', state)
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
  startIrap(content: any) {
    this.modalService.open(content, {});
    if(this.iRap){
      this.spinner.show()
      this.loadIrapDataset()
    }
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
  applyFilter(m) {
    //jsonb={"driverVehiculo":{"Tipo":{"_rule_type":"containment_multiple","contains":["Motocicleta",["Motocicleta"]]}},"driverPersona":{"Edad":{"_rule_type":"intrange","min":3,"max":7},"Tipo":{"_rule_type":"containment_multiple","contains":["Conductor","Pasajero",["Conductor"],["Pasajero"]]},"Estado":{"_rule_type":"containment_multiple","contains":["Herido",["Herido"]]}},"driverUbicacionTemporal":{"Estado+meteorol\xc3\xb3gico":{"_rule_type":"containment","contains":["Granizo","Nieve","Niebla+/+neblina",["Granizo"],["Nieve"],["Niebla+/+neblina"]]}}}&occurred_max=2021-09-30T23:59:59.999Z&occurred_min=2021-07-02T00:00:00.000Z&record_type=10a31c60-f0b8-499d-9c79-3cb351278144&weather=cloudy'
    let jsonb = {}
    this.tables.forEach(t => {
      let jt = {}
      let defs = this.schema['definitions'][t]
      Object.entries(defs.properties).forEach((k) => {
        let e = (k[1]['enum']) ? k[1]['enum'] : (k[1]['items']) ? k[1]['items'].enum : []
        let selected = Object.entries(this.filterPage[t][k[0]]).filter(m => m[1]).map(m => m[0])
        if (e.length && selected.length) {
          let j = {}
          if (this.schema['definitions'][t]['multiple']) {
            j = { "_rule_type": "containment_multiple" }
          } else {
            j = { "_rule_type": "containment" }
          }
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

    localStorage.setItem("current_filter", JSON.stringify(result))
    result['obj'] = jsonb
    this.filterChange.emit(result)
    this.applyReport(null)
    m.close()
  }
  initDataFrame() {
    this.tables = Object.keys(this.schema['properties'])
      .sort((k, j) => { return this.schema['properties'][k].propertyOrder - this.schema['properties'][j].propertyOrder })
    let fu = localStorage.getItem('current_filter')
    this.reportFilters = []
    this.tables.forEach(t => {
      Object.entries(this.schema['definitions'][t]['properties'])
        .sort((k, j) => { return k[1]['propertyOrder'] - j[1]['propertyOrder'] })
        .filter(k => k[1]['isSearchable'] && (k[1]['enum']))
        .forEach(element => {
          this.reportFilters.push({ title: element[0], table: t })
        });
    })
    this.loadFilter()
  }
  loadFilter() {
    if (!this.filter) this.filter = {}
    if (this.filter['occurred_max']) {
      this.occurred_max = new Date(this.filter['occurred_max'])
    } else {
      this.occurred_max = new Date()
    }
    if (this.filter['occurred_min']) {
      this.occurred_min = new Date(this.filter['occurred_min'])
    } else {
      this.occurred_min = new Date()
      this.occurred_min.setMonth(this.occurred_max.getMonth() - 3);
    }

    this.occurred_min_ngb = this.asNgbDateStruct(this.occurred_min)
    this.occurred_max_ngb = this.asNgbDateStruct(this.occurred_max)

    let f = {}
    this.tables.forEach(t => {
      if (!f[t]) {
        f[t] = {}
      }
      let defs = this.schema['definitions'][t]
      Object.entries(defs.properties).forEach((k) => {
        let e = (k[1]['enum']) ? k[1]['enum'] : (k[1]['items']) ? k[1]['items'].enum : []
        if (!f[t][k[0]]) f[t][k[0]] = {}
        e.forEach(element => {
          if (this.filter && this.filter['obj'] && this.filter['obj'][t] && this.filter['obj'][t][k[0]] && this.filter['obj'][t][k[0]]['contains']) {
            if (this.filter['obj'][t][k[0]]['contains'].indexOf(element) >= 0) {
              f[t][k[0]][element] = true
            } else {
              f[t][k[0]][element] = false
            }
          }
        });
        if ((k[1]['type'] == "number") || (k[1]['type'] == "integer")) {
          if (this.filter && this.filter['obj'] && this.filter['obj'][t] && this.filter['obj'][t][k[0]]) {
            f[t][k[0]].minimum = this.filter['obj'][t][k[0]]['min']
            f[t][k[0]].maximum = this.filter['obj'][t][k[0]]['max']
          }
        }
      })
      this.filterPage = f
    })
  }
  logout() {
    document.cookie.split(/; /).map(k => k.split(/=/)).forEach(k => {
      document.cookie = `${k[0]}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`
    })
    localStorage.clear()
    this.router.navigateByUrl('/login')
  }
  download() {

  }
  setlang(code: string) {
    localStorage.setItem("Language", code)
    location.reload()
  }
  mapillaryAuth() {
    window.location.href = this.config['MAPILLARY.URL']
  }
  setReportHeaders(e: any) {
    this.assembleReport()
  }
  wantsGeography() {
    if (!this.reportHeaders['row'] || !this.reportHeaders['col']) return false
    if (this.hasGeography) return false
    return true
  }
  wantsTime(tab: string) {
    let t = this.tabs.filter(fu => fu.key != tab).pop()['key']
    return !this.hasTime[t]
  }
  resetReport() {
    this.reportHeaders = {}
  }
  assembleReport() {
    this.crosstabsFilters = {}
    this.hasGeography = false
    this.hasTime = { 'row': false, 'col': false }
    this.tabs.forEach(tab => { // row, col
      if (!this.reportHeaders[tab.key]) return
      let m = this.reportHeaders[tab.key].match(/(\w+),(.+)$/)
      if (m.length == 3) {
        this.crosstabsFilters[`${tab.key}_${m[1]}`] = m[2]
        if (m[1] == 'boundary_id') this.hasGeography = true
        if (m[1] == 'period_type') this.hasTime[tab.key] = true
      }
    })
    if (this.reportHeaders['boundary'])
      this.crosstabsFilters['aggregation_boundary'] = this.reportHeaders['boundary']

  }
  applyReport(modal: any) {
    //http://192.168.1.101:8000/api/records/crosstabs/? \
    //  aggregation_boundary=39119147-20a7-44d3-903c-fc83b7b939c9&
    // archived=False&
    // calendar=gregorian&
    // col_period_type=month&
    // occurred_max=2021-10-28T23:59:59.999Z&
    // occurred_min=2021-07-30T00:00:00.000Z&
    // record_type=d3005b08-ce42-4012-9497-65fd82efb11a&
    // row_choices_path=driverDetails,properties,Incident+type
    this.assembleReport()
    let f = JSON.parse(localStorage.getItem("current_filter") || '{}')
    Object.entries(f).forEach(([k, v]) => {
      this.crosstabsFilters[k] = v
    })
    this.loadReport(this.crosstabsFilters)
    if (modal) modal.dismiss('Apply')
  }
  setHeader(tab: string, kind: string) {
    this.header[tab] = kind
  }

  loadReport(p: any) {
    this.reportParameters = p
    let path = {};
    (['col', 'row']).forEach(tab => {
      if (this.reportParameters[`${tab}_choices_path`]) {
        let p = this.reportParameters[`${tab}_choices_path`]
        path[tab] = p.match(/[^,]+,[^,]+,(.+)$/).pop()
      }
      if (this.reportParameters[`${tab}_period_type`]) {
        path[tab] = this.reportParameters[`${tab}_period_type`]
      }
      if (this.reportParameters[`${tab}_boundary_id`]) {
        let boundary = this.boundaries.filter(bu => bu['uuid'] == this.reportParameters[`${tab}_boundary_id`]).pop()
        path[tab] = boundary['label']
      }
    })
    this.report = null
    if (this.reportParameters) {
      if (!this.reportParameters['relate']) this.reportParameters['relate'] = ""

      this.spinner.show()
      this.recordService.getCrossTabs(this.recordSchema["record_type"], this.reportParameters).pipe(first()).subscribe(
        crosstabs => {
          this.reportChange.emit({
            crosstabs: crosstabs,
            path: path,
            parameters: this.reportParameters
          })
          this.spinner.hide()
        }
      )
    }
  }
  resetFilter() {
    this.loadFilter()
  }
  cancelReport(modal: any) {
    this.goBack.emit('Reports')
    modal.close('Go Back')
  }
  iRapLogin(irapModal) {
    this.recordService.iRapLogin({
      "format":"json",
      "body":
      {
        "username": this.irap_email,
        "password": this.irap_password
      }
    }).pipe(first()).subscribe({
      next: data => {
        this.iRapChange.emit({user:data})
        irapModal.close('OK')
      }, error: err => {
        console.log(err)
        if(err['error'] && err['error']['message']){
          this.irap_err=err['error']['message']
        }else{
          if(err['message']) this.irap_err=err['message']
          else  this.irap_err='Unknown error' // never should get here
        }
      }
    })
  }
  loadIrapDataset(){
    if(this.irapDataset) {
      this.spinner.hide()
      return
    }
    this.recordService.getIRapDataset({"body":this.iRap['data']}).pipe(first()).subscribe({
      next: data=>{
        console.log(data)
        this.iRapChange.emit({dataset:data})
        this.spinner.hide()
      },
      error:err=>{
        this.iRapChange.emit({user:null})
        this.spinner.hide()
      }
    })
  }
  applyIrap(modal){
    console.log(this.irapDataset)
  }
}
