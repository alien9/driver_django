import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.scss']
})
export class CounterComponent implements OnInit {
  @Input() counts: object
  @Input() filter: object
  @Input() config: object
  @Input() fields: any[]
  subtotals: boolean = false
  constructor() { }
  
  ngOnInit(): void {
  }
  flipTotals() {
    this.subtotals = !this.subtotals
  }

}
