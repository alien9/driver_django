import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-irap-popup',
  templateUrl: './irap-popup.component.html',
  styleUrls: ['./irap-popup.component.scss']
})
export class IrapPopupComponent implements OnInit {
  roadName: string
  inspectionDate: string
  active = 1
  rating={
    'pedestrian':1,
    'bicycle':1,
    'car':1,
    'motorcycle':1,
  }
  fe={
    'pedestrian':0,
    'bicycle':0,
    'car':0,
    'motorcycle':0,
  }
  
  irapColor = [
    '',
    '#000000',
    '#ff0000',
    '#ff9900',
    '#ffaa00',
    '#ffff44',
    '#009900',
  ]
  constructor() { }

  ngOnInit(): void {
  }

}
