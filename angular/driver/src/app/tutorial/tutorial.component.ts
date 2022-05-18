import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrls: ['./tutorial.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TutorialComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
