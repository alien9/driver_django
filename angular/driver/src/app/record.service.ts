import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, } from '@angular/common/http';
import { Observable } from 'rxjs'; import { HttpClientModule } from '@angular/common/http';

import { environment } from '../environments/environment';
import Utils from '../assets/utils';
@Injectable({
  providedIn: 'root'
})
export class RecordService {
  constructor(private http: HttpClient) { }
  getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + (document.cookie.split(/; /).map(k => k.split(/=/)).filter(k => k[0] == "AuthService.token")[0][1])
    })
  }
  getBackend(): string {
    return localStorage.getItem("backend") || (('api' in environment) ? environment.api : '')
  }
  getRecordType(): Observable<any[]> {
    return this.http.get<any[]>(this.getBackend() + '/api/recordtypes/?active=True', { headers: this.getHeaders() })
  }
  getRecord(s: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.getBackend()}/api/records/${s}/`, { headers: this.getHeaders() })
  }
  getRecordSchema(s: string): Observable<any[]> {
    return this.http.get<any[]>(this.getBackend() + '/api/recordschemas/' + s + '/', { headers: this.getHeaders() })
  }
  upload(obj: Object): Observable<any[]> {
    return this.http.post<any[]>(this.getBackend() + '/api/records/', obj, { headers: this.getHeaders() })
  }
  getRecords(o: Object, q: any): Observable<any[]> {
    let params = new HttpParams()
      .set('archived', 'false')
      .set('details_only', 'false')
      .set('limit', '50')
      .set('record_type', o['uuid'])
      .set('active', 'true')
    if (q) {
        if (q.filter) {
          for (var k in q.filter) {
            if (q.filter[k]) params = params.set(k, q.filter[k])
          }
        }
      }
    return this.http.get<any[]>(this.getBackend() + '/api/records/', { headers: this.getHeaders(), params: params })
  }
  getMapFileKey(o: Object, q: any): Observable<any[]> {
    let params = new HttpParams()
      .set('archived', 'false')
      .set('details_only', 'true')
      .set('limit', '50')
      .set('record_type', o['uuid'])
      .set('mapfile', 'true')
      .set('active', 'true')

    if (q) {
      if (q.filter) {
        for (var k in q.filter) {
          if (q.filter[k]) params = params.set(k, q.filter[k])
        }
      }
    }
    return this.http.get<any[]>(this.getBackend() + '/api/records/', { headers: this.getHeaders(), params: params })
  }


  getTileKey(o: Object, q: any): Observable<any[]> {
    var parameters = {
      archived: false,
      details_only: true,
      limit: 50,
      record_type: o['uuid'],
      tilekey: true,
      active: true
    }
    if (q) {
      for (var k in q) {
        parameters[k] = q[k];
      }

    }
    return this.http.get<any[]>(this.getBackend() + '/api/records/?' + Utils.toQueryString(parameters), { headers: this.getHeaders() })
  }
  getBoundaries(): Observable<any[]> {
    return this.http.get<any[]>(this.getBackend() + '/api/boundaries/', { headers: this.getHeaders() })
  }
  getBoundaryPolygons(boundary: any) {
    return this.http.get<any[]>(`${this.getBackend()}/api/boundarypolygons/?active=True&boundary=${boundary.uuid}&limit=all&nogeom=true`, { headers: this.getHeaders() })
  }
  getCritical() {
    return this.http.get<any[]>(`${this.getBackend()}/api/blackspotsets/`, { headers: this.getHeaders() })
  }

}
