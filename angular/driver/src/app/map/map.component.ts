import { Component, OnInit } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';
import {Router} from '@angular/router';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  public options: any
public layersControl: any
  constructor(private router: Router) { }
  ngOnInit(): void {
    let cu=document.cookie.split(/; /).map(k=>k.split(/=/)).filter(k=>k[0]=="AuthService.token")
    if(!cu.length){
      this.router.navigateByUrl('/login')
      return
    }
    let config=JSON.parse(localStorage.getItem("config"))
    let osm=L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
    let sat = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {});

    this.layersControl = {
      baseLayers: {
        'Open Street Map': osm,
        'Satellite Map': sat
      },
      overlays: {
        'Big Circle': L.circle([ 46.95, -122 ], { radius: 5000 }),
        'Big Square': L.polygon([[ 46.8, -121.55 ], [ 46.9, -121.55 ], [ 46.9, -121.7 ], [ 46.8, -121.7 ]])
      }
    }
    this.options = {
      zoom: config.MAP_ZOOM,
      center: [config.MAP_CENTER_LATITUDE, config.MAP_CENTER_LONGITUDE],
      layers:[
        osm
      ]
    }
  }
  logout(){
    document.cookie.split(/; /).map(k=>k.split(/=/)).forEach(k=>{
      document.cookie=`${k[0]}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`
    })
    this.router.navigateByUrl('/login')
  }
}
