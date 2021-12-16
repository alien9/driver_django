import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { RecordService } from './../record.service'
import { first } from 'rxjs/operators';
import { inputCursor } from 'ngx-bootstrap-icons';
import { NgxSpinnerService } from "ngx-spinner";

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {
  @Input() recordSchema: object
  @Input() reportParameters: object
  @Input() report: object
  public colPath: string
  @Input() config: any
  @Input() boundaries: any[]
  @Input() relatable: object //the alternate table for countings, as opposed to the registry count
  @Output() goBack = new EventEmitter<string>()
  @Output() reloadReport = new EventEmitter<string>()
  path: object = {}
  locale: string
  timezone: any
  weekdays: object
  relate: string = ""
  constructor(
    private recordService: RecordService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.timezone = (new Date()).getTimezoneOffset()
    this.locale = localStorage.getItem("Language") || "en"
    this.weekdays = {}
    let d = new Date()
    for (let i = 0; i < 7; i++) {
      this.weekdays[d.getDay()] = d.toLocaleDateString(this.locale, { weekday: 'long' })
      d.setDate(d.getDate() + 1)
    }
    if (!this.report) {
      setTimeout(function () { $("#report_button").trigger('click') }, 100)
    }
  }
  setRelate() { //tell the system to reload the report "as is" - with the new setting for relate
    this.reloadReport.emit(this.report['parameters']['relate'])
  }
  showMap() {
    if (!this.report['crosstabs']) {
      console.log("Report doesnt exist")
      return
    }
    let totals = Object.entries(Object.values(this.report["crosstabs"]['tables'][0]['data']).reduce((e, d) => {
      Object.entries(d).forEach(f => {
        if (!e[f[0]])
          e[f[0]] = f[1]
        else
          e[f[0]] += f[1]
      })
      return e
    })).filter(m => m[0] != 'None').map(m => { return { 'key': m[0], 'value': m[1] } }).sort((a, b) => a['value'] - b['value'])
    let quantiles = [{ min: totals[0]['value'] }]
    let am = 5
    let inc = totals.length / am
    for (let i = 0; i < 5; i++) {
      let max = totals[Math.round(i * inc)]['value']
      quantiles[i]['max'] = max
      if (i < 4)
        quantiles.push({ 'min': max })
    }
    this.recordService.getBoundaryMapfile(this.report['parameters']['col_boundary_id'], {
      occurred_min: this.report['parameters']['occurred_min'],
      jsonb: this.report['parameters']['jsonb'],
      occurred_max: this.report['parameters']['occurred_max'],
      quantiles:quantiles,
      boundary_id:this.report["parameters"]['col_boundary_id']
    }).pipe(first()).subscribe({
      next: data => {
        console.log(data)
        console.log("napfile was created")
      }, error: err => {
        console.log("errror in mapfile")
        console.log(err)
      }
    })
  }
}
