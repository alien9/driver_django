import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-local-list',
  templateUrl: './local-list.component.html',
  styleUrls: ['./local-list.component.scss']
})
export class LocalListComponent implements OnInit {
  @Input() records: any[]
  @Output() editRecord = new EventEmitter<any>()
  constructor() { }

  ngOnInit(): void {
  }
  edit(record) {
    console.log(record)
    this.editRecord.emit(record)
  }

}
