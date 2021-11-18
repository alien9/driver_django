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
  @Output() reloadReport=new EventEmitter<string>() 
  path: object = {}
  locale: string
  timezone: any
  weekdays: object
  relate:string=""
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
  setRelate(){ //tell the system to reload the report "as is" - with the new setting for relate
    this.reloadReport.emit(this.report['parameters']['relate'])
  }
}
