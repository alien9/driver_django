import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { RecordService } from '../record.service'
import { first } from 'rxjs/operators';
import { NgxSpinnerService } from "ngx-spinner";

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  @Input() filter: object
  @Input() boundary_polygon_uuid: string
  @Input() recordSchema: object
  @Input() recordList: object
  @Input() listPage: number
  @Output() viewRecord = new EventEmitter<string>()
  @Output() setListPage=new EventEmitter<number>()
  public page: number = 0
  public fieldname: string = "Header"
  public table: string
  public field: string
  math = Math
  constructor(
    private recordService: RecordService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.spinner.show();
    let tables = Object.entries(this.recordSchema['schema']['properties']).sort((a, b) => (a[1]['propertyOrder'] < b[1]['propertyOrder']) ? -1 : 1).filter(k => !k[1]['multiple'])
    if (tables.length) {
      let fields = Object.entries(this.recordSchema['schema']['definitions'][tables[0][0]]['properties']).sort((a, b) => (a[1]['propertyOrder'] < b[1]['propertyOrder']) ? -1 : 1).filter(k => !(k[1]['options'] && k[1]['options']['hidden']))
      if (fields.length) {
        this.table = tables[0][0]
        this.field = fields[0][0]
      }
    }
    this.loadRecords()
  }
  loadRecords() {
    if (this.boundary_polygon_uuid) this.filter["polygon_id"] = this.boundary_polygon_uuid
    //if (!this.recordList) {
    this.recordService.getRecords({ 'uuid': this.recordSchema["record_type"] }, { filter: this.filter }).then(
      data => {
        this.recordList = data.data
        this.spinner.hide();
      })
    //}
  }
  view(uuid: string) {
    this.viewRecord.emit(uuid)
  }
  setPage(){
    this.setListPage.emit(this.listPage)
  }

}
