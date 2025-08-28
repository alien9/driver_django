import { Component, Input, OnInit, Output, EventEmitter, HostListener } from '@angular/core'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap'
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { RecordService } from './../record.service'
import { first } from 'rxjs/operators';
import { NgxSpinnerService } from "ngx-spinner";
import { AuthService } from '../auth.service';
import { saveAs } from "file-saver"
import { ViewChild } from '@angular/core';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subject, merge, OperatorFunction } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { getLocaleDirection } from '@angular/common';


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
  @Input() iRapData: object
  @Input() irapDataset: object
  public filterPage: object
  @Input() filterObject: object
  @Output() boundaryChange = new EventEmitter<object>()
  @Output() boundaryPolygonChange = new EventEmitter<object>()
  @Output() filterChange = new EventEmitter<object>()
  @Output() stateChange = new EventEmitter<string>()
  @Output() reportChange = new EventEmitter<object>()
  @Output() goBack = new EventEmitter<string>()
  @Output() iRapChange = new EventEmitter<object>()
  @Output() newRecord = new EventEmitter<boolean>()
  @Output() startDownload = new EventEmitter<object>()
  @Output() startGeography = new EventEmitter<object>()
  @Output() aboutCaller = new EventEmitter()
  @Input() recordSchema: object
  @Input() stateSelected
  @Input() locale: string
  @ViewChild('viewpoint') filterContent: any;
  public fontFamily = document.body.style.fontFamily
  public authenticated: boolean = true
  public occurred_min: Date
  public occurred_max: Date
  public occurred_min_ngb: NgbDateStruct
  public occurred_max_ngb: NgbDateStruct
  public schema: any
  public tables: any[]
  public reportFilters: any[]
  public savedFilters: any[]
  public filterLabel: string = ""
  public filtering: boolean = false
  public iRapSearchTerm = null
  @Input() canWrite: boolean
  public tabs = [

  ]
  @Input() inserting: boolean
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
  qrvalue: string
  downloading: boolean;
  iRapLayerName: string
  searchIrapLayer: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) => {
    let t: string[] = []
    this.irapDataset["data"].forEach((d) => {
      t.push(d.name)
    })
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : t.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10)))
  }
  logoHTML: string;
  constructor(
    private authService: AuthService,
    private recordService: RecordService,
    public readonly translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
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
    this.schema = this.recordSchema['schema']
    let l = localStorage.getItem("Language") || navigator.language
    this.locale = l
    this.initDataFrame()
    this.qrvalue = this.recordService.getBackend()
    if (!this.qrvalue.length) this.qrvalue = window.document.location.href.replace(/\/$/, '')
    this.qrvalue = `${this.qrvalue}/static/driver.apk?language=${localStorage.getItem("Language")}`
    this.logoHTML = this.config["APP_NAME"]
    this.recordService.getSiteLogo(localStorage.getItem("Language")).then((g) => {
      if (g.data && g.data['result'] && (g.data['result'].length > 3)) {
        this.logoHTML = g.data['result'].replace(/<\/?p>/g, "")
      }
    })
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
    return b.data[localStorage.getItem("Language")] || b.data[this.boundary.display_field]
  }
  selectBoundaryPolygon(b: any) {
    this.boundaryPolygonChange.emit(b)
  }
  startHelp(content: any) {
    this.modalService.open(content, { size: 'xl', scrollable: true });
  }
  triggerStartFiltgers() {
    this.startFilters(this.filterContent)
  }

  startFilters(content: any) {
    this.modalService.open(content, { size: 'lg' });
    this.recordService.getSavedFilters({ limit: 50 }).then(next => {
      this.savedFilters = next.data['results']
      this.spinner.hide()
    })
  }
  startGeometry() {
    this.startGeography.emit()
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
        if (k[1]['type'] && (k[1]['type'] == 'integer') || (k[1]['type'] == 'number')) {
          if (this.filterPage[t][k[0]].maximum || this.filterPage[t][k[0]].minimum) {
            jt[k[0]] = {
              "_rule_type": (this.schema['definitions'][t]['multiple']) ? "intrange_multiple" : "intrange"
            }
            if (this.filterPage[t][k[0]].maximum) jt[k[0]]["max"] = this.filterPage[t][k[0]].maximum
            if (this.filterPage[t][k[0]].minimum) jt[k[0]]["min"] = this.filterPage[t][k[0]].minimum
          }
        }
      })
      if (Object.keys(jt).length)
        jsonb[t] = jt
    })
    this.filterObject = jsonb
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
    this.filterChange.emit(result)
    this.applyReport(null)
    if (m)
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
          if (this.filter && this.filterObject && this.filterObject[t] && this.filterObject[t][k[0]] && this.filterObject[t][k[0]]['contains']) {
            if (this.filterObject[t][k[0]]['contains'].indexOf(element) >= 0) {
              f[t][k[0]][element] = true
            } else {
              f[t][k[0]][element] = false
            }
          }
        });
        if ((k[1]['type'] == "number") || (k[1]['type'] == "integer")) {
          if (this.filter && this.filterObject && this.filterObject[t] && this.filterObject[t][k[0]]) {
            f[t][k[0]].minimum = this.filterObject[t][k[0]]['min']
            f[t][k[0]].maximum = this.filterObject[t][k[0]]['max']
          }
        }
      })
      this.filterPage = f
    })
  }
  logout() {
    this.authService.logout()
  }
  collectCsv(task: string) {
    this.recordService.getCsv(task).then(du => {
      const d = du.data
      if (d['status'] != "SUCCESS") {
        if (d['status'] == 'FAILURE') {
          this.downloading = false
          alert("Server error while downloading")
        } else {
          setTimeout(() => this.collectCsv(task), 3000)
        }
      } else {
        this.downloading = false
        window.location.href = d['result'].replace(/^\w+:/, window.location.protocol)
      }
    })
  }
  preDownload() {
    switch (this.stateSelected) {
      case 'Reports':
        this.startDownload.emit({ "state": this.stateSelected })
        break
      case 'List':
      case 'Map':
        if (this.downloading)
          return
        this.downloading = true
        setTimeout('$("#navbarDropdown")[0].click()', 200)
        this.recordService.getTileKey({ 'uuid': this.recordSchema["record_type"] }, {
          filter: this.filter
        }).then(t => {
          this.recordService.postCsv(t.data['tilekey']).then(data => {
            if (data.data['success']) {
              setTimeout(() => this.collectCsv(data.data['taskid']), 1000)
            }
          })

        })
        break
    }
  }
  hasDownload() {
    return ['List', 'Map', 'Reports'].indexOf(this.stateSelected) >= 0
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
    if (this.reportParameters && path['col'] && path['row']) {
      if (!this.reportParameters['relate']) this.reportParameters['relate'] = ""
      this.spinner.show()
      this.recordService.getCrossTabs(this.recordSchema["record_type"], this.reportParameters).then(
        crosstabs => {
          this.reportChange.emit({
            crosstabs: crosstabs.data,
            path: path,
            parameters: this.reportParameters
          })
          this.spinner.hide()
        }
      )
    }
  }
  setFilter(fj: any, m: any) {
    let f = fj['filter_json']
    Object.entries(this.filterPage).forEach(v => {
      Object.keys(v[1]).forEach(k => {
        v[1][k] = {}
        if (f[`${v[0]}#${k}`]) {
          if (f[`${v[0]}#${k}`]['contains']) {
            f[`${v[0]}#${k}`]['contains'].forEach(tx => {
              v[1][k][tx] = true
            })
          }
          if (f[`${v[0]}#${k}`]['max']) {
            v[1][k]['maximum'] = f[`${v[0]}#${k}`]['max']
          }
          if (f[`${v[0]}#${k}`]['min']) {
            v[1][k]['minimum'] = f[`${v[0]}#${k}`]['min']
          }

        }
      })
    })
    //['filter_json']
    //this.applyFilter(m)
  }
  loadSavedFilters() {
    this.recordService.getSavedFilters({ limit: 50 }).then(next => {
      this.savedFilters = next.data['results']
      this.spinner.hide()
      this.filtering = false
    })
  }
  saveFilter(m: any) {
    this.applyFilter(null)
    this.spinner.show()
    this.filtering = true
    var p = {}
    Object.keys(this.filterObject).forEach(k => {
      Object.keys(this.filterObject[k]).forEach(j => {
        p[`${k}#${j}`] = this.filterObject[k][j]
      })
    })
    this.recordService.saveFilter({ 'label': this.filterLabel, filter_json: p }).then(data => {
      this.loadSavedFilters()
    })
  }

  deleteFilter(fu: object) {
    this.filtering = true
    this.recordService.deleteFilter(fu['uuid']).then(
      data => {
        this.loadSavedFilters()
      })
  }

  resetFilter() {
    localStorage.removeItem("current_filter")
    this.recordService.getRecords({ 'uuid': this.recordSchema['record_type'] }, { 'filter': { 'limit': 1 } }).then(
      next => {
        const data = next.data
        // set filter: last 3 months from latest found data
        if (data['results'] && data['results'].length) {
          let di = new Date(data['results'][0].occurred_from)
          let df = new Date(data['results'][0].occurred_from)
          df.setMonth(di.getMonth() - 3)
          this.occurred_min = df
          this.occurred_max = di
          this.occurred_min_ngb = this.asNgbDateStruct(this.occurred_min)
          this.occurred_max_ngb = this.asNgbDateStruct(this.occurred_max)
          this.filter = {
            'occurred_max': di.toISOString(),
            'occurred_min': df.toISOString()
          }
          jQuery('.modal-content input[type=checkbox]').prop('checked', false)
          this.filterObject = {}
          this.loadFilter()
        }
      }
    )
  }
  searchIrap(event) {
    let tu = this.irapDataset["data"].filter(k => k.name === this.iRapSearchTerm).pop()
    if (tu) {
      let el: HTMLElement = document.getElementById(`accordion-irap-${tu['id']}-header`);
      el.scrollIntoView();
      (el.childNodes[0] as HTMLButtonElement).click()
    }
  }
  cancelReport(modal: any) {
    this.goBack.emit('Reports')
    modal.close('Go Back')
  }

  createRecord(e: any) {
    this.newRecord.emit(this.inserting)
    $('.leaflet-container').css('cursor', (this.inserting) ? 'crosshair' : 'grab');
  }
  qrCode(mod) {
    this.modalService.open(mod, { size: 'lg' });
  }
  about(event: any) {
    this.aboutCaller.emit()
  }
  getLangPosition() {
    if (getLocaleDirection(localStorage.getItem("Language")) == 'rtl')
      return "dropdown-menu dropdown-menu-start"
    else return "dropdown-menu dropdown-menu-end"
  }
  getCheckBoxClass() {
    if (getLocaleDirection(localStorage.getItem("Language")) == 'rtl')
      return "ordinary"
    else return "form-check"
  }
}
