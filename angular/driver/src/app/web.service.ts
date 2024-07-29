import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, } from '@angular/common/http';
import { Observable } from 'rxjs'; import { HttpClientModule } from '@angular/common/http';
import { map } from 'rxjs/operators';

import { environment } from '../environments/environment';
import Utils from '../assets/utils';
@Injectable({
  providedIn: 'root'
})
export class WebService {
  constructor(private http: HttpClient) { }

  getReverse(lat: string, lng: string): Observable<any[]> {
    return this.http.get<any[]>(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {})
  }
  getForward(params: object) {
    return this.http.get<any[]>(`https://api.pickpoint.io/v1/forward?addressdetails=1&countrycodes=${params['country_code']}&key=${params['key']}&limit=15&q=${params['term']}&viewBox=${params['bbox']}`)
  }
  getMapillaryImages(token: string, bbox: string): Observable<any[]> {
    let limit = 200
    return this.http.get<any[]>(`https://graph.mapillary.com/images?access_token=${token}&fields=id,geometry&limit=${limit}&bbox=${bbox}`)
  }
  getHistoryWeather(what: any) {
    let url = 'https://api.openweathermap.org/data/2.5/weather'
    return this.http.get<any[]>(url, { params: what })
  }
}
