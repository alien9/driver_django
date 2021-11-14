import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, } from '@angular/common/http';
import { Observable } from 'rxjs'; import { HttpClientModule } from '@angular/common/http';

import { environment } from '../environments/environment';
import Utils from '../assets/utils';
@Injectable({
  providedIn: 'root'
})
export class WebService {
  constructor(private http: HttpClient) { }

  getReverse(lat:string,lng:string): Observable<any[]> {
    return this.http.get<any[]>(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { })
  }
}
