import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-local-list',
  templateUrl: './local-list.component.html',
  styleUrls: ['./local-list.component.scss']
})
export class LocalListComponent implements OnInit {
  @Input() records: any[]
  @Output() editLocalRecord = new EventEmitter<any>()
  constructor() { }

  ngOnInit(): void {
  }
  edit(record, i) {
    console.log(record)
    this.editLocalRecord.emit({"data":record, "index":i})
  }

}
