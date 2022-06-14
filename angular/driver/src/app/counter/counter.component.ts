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

/*     if (this.filter['jsonb']) {
      this.fields = []
      let j = JSON.parse(this.filter['jsonb'])
      Object.values(j).forEach(value => {
        Object.entries(value).forEach(fields => {
          if (fields[1].contains) {
            this.fields.push(`${fields[0]}: ${fields[1].contains.join(", ")}`)
          }
        })
      })
    } */
  }
  flipTotals() {
    this.subtotals = !this.subtotals
  }

}
