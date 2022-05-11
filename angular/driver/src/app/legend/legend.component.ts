import { Component, OnInit, Input } from '@angular/core';
import { RecordService } from '../record.service'

@Component({
  selector: 'app-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.scss']
})
export class LegendComponent implements OnInit {
  @Input() legends
  @Input() config: object
  backend:string
  constructor(private recordService: RecordService) { }
  ngOnInit(): void {
    this.backend=this.recordService.getBackend()
  }
}
