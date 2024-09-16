import { Component, OnInit } from '@angular/core';
import { Input, NgZone, Output, EventEmitter, ApplicationRef, TemplateRef } from '@angular/core'
import { Observable, OperatorFunction } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap } from 'rxjs/operators';

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
  @Input() schema:any
  @Output() startDrawing = new EventEmitter<any>()
  @Output() setDateFieldValueChanged = new EventEmitter<any>()
  @Output() setFieldCheckFieldChanged = new EventEmitter<any>()
  @Output() setFileChanged = new EventEmitter<any>()
  @Output() fieldChanged = new EventEmitter<any>()
  @Output() turnOnAutoComplete = new EventEmitter<any>()

  public value: any = ""
  constructor() { }

  ngOnInit(): void {
    this.getValue()
  }
  getValue(): any {
    if (this.index >= 0) {
      if (!(this.tableName in this.data)) {
        this.data[this.tableName] = []
      }
      while (this.data[this.tableName].length < this.index + 1) {
        this.data[this.tableName].push({})
      }
      if (!(this.fieldName in this.data[this.tableName][this.index])) {
        this.data[this.tableName][this.index][this.fieldName] = ""
      }
      this.value = this.data[this.tableName][this.index][this.fieldName]
    } else {
      if (!(this.tableName in this.data)) {
        this.data[this.tableName] = {}
      }
      if (!(this.fieldName in this.data[this.tableName])) {
        this.data[this.tableName][this.fieldName] = ""
      }
      this.value = this.data[this.tableName][this.fieldName]
    }
    return this.value
  }

  startDraw(what: any) {
    let current:string = this.getValue()
    if (current != "")
      what.value = current
    what.format=this.prop.value["imageSource"]
    if("imageSource" in this.prop.value){
      console.log("eeeeee")
      console.log(this.data)
    }
    this.startDrawing.emit(what)
  }
  setFieldValue(e: any) {
    this.fieldChanged.emit({ "event": e, "table": this.tableName, "field": this.fieldName, "index": this.index })
  }
  setDateField(e: any, table: string, field: string, index: number = -1) {
    let d = null
    if (e) {
      d = new Date()
      d.setFullYear(e['year'], e['month'] - 1, e['day'])
    }
    this.setDateFieldValueChanged.emit({ "table": table, "field": field, "index": index, "value": d })
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

  setCheckField(e: any, t: string, f: string, i: number=null) {
    console.log("setting check field")
    this.setFieldCheckFieldChanged.emit({ "event": e, "table": t, "field": f, "index": i })
  }
  loadFile(e: any, table: any, field: string) {
    this.setFileChanged.emit({ "event": e, "table": table, "field": field })
  }
}
