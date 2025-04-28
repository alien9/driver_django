import { Component, OnInit } from '@angular/core';
import { Input, NgZone, Output, EventEmitter, ApplicationRef, TemplateRef } from '@angular/core'
import { Observable, OperatorFunction } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { RecordService } from './../record.service'
import { first } from 'rxjs/operators';
import * as L from 'leaflet';

import * as uuid from 'uuid';

@Component({
  selector: 'app-input-field',
  templateUrl: './input-field.component.html',
  styleUrls: ['./input-field.component.scss']
})
export class InputFieldComponent implements OnInit {
  @Input() fieldName: string
  @Input() tableName: string
  @Input() editing: boolean
  @Input() index: number
  @Input() prop: any
  @Input() data: any
  @Input() locale: string
  @Input() canvasmode: any
  @Input() autocomplete_terms: any[] = []
  @Input() schema: any
  @Input() record_uuid: any
  @Output() startDrawing = new EventEmitter<any>()
  @Output() setDateFieldValueChanged = new EventEmitter<any>()
  @Output() setFieldCheckFieldChanged = new EventEmitter<any>()
  @Output() setFileChanged = new EventEmitter<any>()
  @Output() fieldChanged = new EventEmitter<any>()
  @Output() turnOnAutoComplete = new EventEmitter<any>()
  public fontFamily = document.body.style.fontFamily
  public value: any = ""
  fileFieldId: any;
  previousBounds: string;
  constructor(private translateService: TranslateService, private recordService: RecordService
  ) { }

  ngOnInit(): void {
    if ((!this.value) && (this.prop.value.fieldType == "unique"))
      this.getUniqueId()
    if ((!this.value) && (this.prop.value.fieldType == "boundary"))
      this.getUniqueIdBoundary()
    if (!this.value && this.prop.value.def) {
      switch (this.prop.value.fieldType) {
        case "integer":
          this.value = parseInt(this.prop.value.def)
          break
        case "unique":
          this.getUniqueId()
          break
        case "boundary":
          this.getUniqueIdBoundary()
          break
        default:
          this.value = this.prop.value.def

      }
      if (this.index >= 0) {
        this.data[this.tableName][this.index][this.fieldName] = this.value
      } else {
        this.data[this.tableName][this.fieldName] = this.value
      }
      this.data = JSON.parse(JSON.stringify(this.data))
    }
  }

  getValue(): any {
    if (this.index >= 0) {
      if (!(this.tableName in this.data)) {
        this.data[this.tableName] = []
      }
      while (this.data[this.tableName].length < this.index + 1) {
        this.data[this.tableName].push({ "_localId": uuid.v4() })
      }
      if (!(this.fieldName in this.data[this.tableName][this.index])) {
        this.data[this.tableName][this.index][this.fieldName] = ""
      }
      this.value = this.data[this.tableName][this.index][this.fieldName]
    } else {
      if (!(this.tableName in this.data)) {
        this.data[this.tableName] = { "_localId": uuid.v4() }
      }
      if (!(this.fieldName in this.data[this.tableName])) {
        this.data[this.tableName][this.fieldName] = ""
      }
      this.value = this.data[this.tableName][this.fieldName]
    }
    if (this.value === undefined || this.value === null || this.value === "") return ""
    if ((typeof this.value) != 'string') return this.value
    return this.value
  }

  startDraw(what: any) {
    let current: string = this.getValue()
    if (current != "")
      what.value = current
    what.format = this.prop.value["imageSource"]
    what.extra = this.prop.value["extra"]
    this.startDrawing.emit(what)
  }
  setFieldValue(e: any) {
    let v = e.srcElement.value
    if (this.prop.value.fieldType == 'integer') {
      v = parseInt(v)
      if (this.prop.value.min && (v < this.prop.value.min)) v = this.prop.value.min
      if (this.prop.value.max && (v > this.prop.value.max)) v = this.prop.value.max
    }
    this.fieldChanged.emit({ "event": { srcElement: { value: v, id: e.srcElement.id } }, "table": this.tableName, "field": this.fieldName, "index": this.index })
  }
  setDateField(e: any, table: string, field: string, index: number = -1) {
    let d = null
    if (e) {
      d = new Date()
      d.setFullYear(e['year'], e['month'] - 1, e['day'])
    }
    this.setDateFieldValueChanged.emit({ "table": table, "field": field, "index": index, "value": d })
  }
  setTimeField(e: any, table: string, field: string, index: number = -1, part: string = "hour") {
    let current = this.getValue()
    if (part == "hour") {
      let h = ''
      if (e.srcElement.value.length) {
        let hour = ((e.srcElement.value > 23) || (e.srcElement.value < 0)) ? '0' : e.srcElement.value
        h = String(hour).padStart(2, '0');
      }
      current = current.replace(/^([^:]*):?/, `${h}:`);
    }
    else {
      let m = ''
      if (e.srcElement.value.length) {
        let min = ((e.srcElement.value > 59) || (e.srcElement.value < 0)) ? '0' : e.srcElement.value
        m = String(min).padStart(2, '0');
      }
      current = current.replace(/:?([^:]*)$/, `:${m}`);
    }
    this.fieldChanged.emit({ "event": { srcElement: { value: current } }, "table": this.tableName, "field": this.fieldName, "index": this.index })
  }
  setFieldAutoCompleteTerms(e: any, words: any, extra: any) {
    this.turnOnAutoComplete.emit({ "event": e, "words": words, "extra": extra })
  }
  search: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map((term) =>
        term.length < 2 ? [] : this.autocomplete_terms.filter((v) => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10)
      )
    );

  setCheckField(e: any, t: string, f: string, i: number = null) {
    this.setFieldCheckFieldChanged.emit({ "event": e, "table": t, "field": f, "index": i, id: e.srcElement.id })
  }
  loadFile(e: any, table: any, field: string, index: number) {
    this.setFileChanged.emit({ "event": e, "table": table, "field": field, "index": index })
  }
  uploadAttachment(e: any, table: any, field: string, index: number) {
    console.log("uploading a file:")
    this.recordService.uploadAttachment(e, uuid.v4()).pipe(first()).subscribe(data => {
      console.log(data)
    })
  }
  getIllustra(i) {
    if (this.prop.value["illustrations"] && (this.prop.value["illustrations"].length > i))
      return this.prop.value["illustrations"][i]
  }

  rememberImageField() {
    localStorage.setItem("image-field", this.getImageFieldId())
  }
  getImageFieldId() {
    return `${this.tableName}_${this.fieldName}_${(this.index && (this.index >= 0)) ? this.index : ""}`
  }
  getFieldId() {
    return `${this.tableName}_${this.fieldName}_${this.index}`.replace(/[^\w]/g, "_")
  }
  submit(e) {
    console.log(e)
  }
  getUniqueId() {
    if (!this.record_uuid) return
    this.recordService.getUniqueId(this.record_uuid, this.tableName, this.fieldName).pipe(first()).subscribe((d) => {
      this.value = d['result']
      this.data[this.tableName][this.fieldName] = this.value
    })
  } 
  getUniqueIdBoundary() {
    if (!this.record_uuid) return
    this.recordService.getUniqueIdBoundary(this.record_uuid, this.tableName, this.fieldName).pipe(first()).subscribe((d) => {
      this.value = d['result']
      this.data[this.tableName][this.fieldName] = this.value
    })
  }


}