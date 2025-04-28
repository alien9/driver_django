import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

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
  @Input() irapLayer: any
  @Output() iRapChange = new EventEmitter<string>()
  @Output() iRapCenterChange = new EventEmitter<object>()
  public fontFamily=document.body.style.fontFamily

  subtotals: boolean = false
  language: string = "en-gb"
  constructor() { }

  ngOnInit(): void {
    this.language = localStorage.getItem("Language") || "en-gb"
  }
  flipTotals() {
    this.subtotals = !this.subtotals
  }
  drawIrap(e) {
    if (e && e.srcElement)
      this.iRapChange.emit(e.srcElement.value)
  }
  iRapCenter(e){
    this.iRapCenterChange.emit(e)
  }

}
