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
    if (obj['uuid']) {
      return this.http.patch<any[]>(`${this.getBackend()}/api/records/${obj['uuid']}/`, obj, { headers: this.getHeaders() })
    } else {
      return this.http.post<any[]>(this.getBackend() + '/api/records/', obj, { headers: this.getHeaders() })
    }
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
  getToddow(filter: any): Observable<any[]> {
    let params = new HttpParams()
      .set('archived', 'false')
      .set('details_only', 'true')
      .set('limit', '50')
      .set('active', 'true')
    for (var k in filter) {
      if (filter[k]) params = params.set(k, filter[k])
    }
    //http://192.168.1.101:8000/api/records/toddow/?archived=False&details_only=True&occurred_max=2021-11-13T01:59:59.999Z&occurred_min=2011-08-04T03:00:00.000Z&polygon_id=60b09207-2d82-49a8-92fc-b80f1fdc67ae&record_type=264a5cb5-6f2c-4817-ae1b-226f5e779ac9
    return this.http.get<any[]>(this.getBackend() + '/api/records/toddow/', { headers: this.getHeaders(), params: params })
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
  getCrossTabs(o: string, q: object) {
    let params = new HttpParams()
      .set('archived', 'False')
      .set('record_type', o)
      .set('calendar', 'gregorian')
    Object.keys(q).forEach(k => {
      params = params.set(k, q[k])
    })
    return this.http.get<any[]>(`${this.getBackend()}/api/records/crosstabs/`, { headers: this.getHeaders(), params: params })
  }
  getQuantiles(o: string, q: object) {
    let params = new HttpParams()
      .set('archived', 'False')
      .set('record_type', o)
      .set('calendar', 'gregorian')
    Object.keys(q).forEach(k => {
      params = params.set(k, q[k])
    })
    return this.http.get<any[]>(`${this.getBackend()}/api/records/quantiles/`, { headers: this.getHeaders(), params: params })
  }
  iRapLogin(data) {
    return this.http.post(`${this.getBackend()}/api/irap-login/`, data, { headers: this.getHeaders() });
  }
  getIRapDataset(data: object) {
    return this.http.post(`${this.getBackend()}/api/irap-getdataset/`, data, { headers: this.getHeaders() });
  }
  getIRapData(data: object) {
    console.log(data)
    return this.http.post(`${this.getBackend()}/api/irap-getlat_lon/`, data, { headers: this.getHeaders() });
  }
  getIRapFatalityData(data: object) {
    return this.http.post(`${this.getBackend()}/api/irap-fatalitydata/`, data, { headers: this.getHeaders() });
  }
  getBoundaryMapfile(o: Object, q: any): Observable<any[]> {
    let params = new HttpParams()
      .set('archived', 'false')
      .set('active', 'true')
      .set('theme', true)
    if (q) {
      if (q.filter) {
        for (var k in q.filter) {
          if (q.filter[k]) params = params.set(k, q.filter[k])
        }
      }
    }
    return this.http.get<any[]>(`${this.getBackend()}/api/records/?${Utils.toQueryString(q)}`, { headers: this.getHeaders() })
  }
  getSavedFilters(q: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.getBackend()}/api/userfilters/?${Utils.toQueryString(q)}`, { headers: this.getHeaders() })
  }
  saveFilter(data: any): Observable<object> {
    return this.http.post(`${this.getBackend()}/api/userfilters/`, data, { headers: this.getHeaders() })
  }
  deleteFilter(fud: string) {
    return this.http.delete(`${this.getBackend()}/api/userfilters/${fud}/`, { headers: this.getHeaders() })
  }
  getConfig(): Observable<any[]> {
    return this.http.get<any[]>(`${this.getBackend()}/get_config/`, { headers: this.getHeaders() })
  }
  getDuplicates(r, page): Observable<any[]> {
    let q = {
      record_type: r,
      offset: page,
      limit: 50,
      resolved: 'False'
    }
    return this.http.get<any[]>(`${this.getBackend()}/api/duplicates/?${Utils.toQueryString(q)}`, { headers: this.getHeaders() })
  }
  resolveDuplicate(uuid: string, record_uuid: string) {
    let params = {
      'uuid': uuid
    }
    if(record_uuid) params['recordUUID']=record_uuid
    let q = { limit: 'all', resolved: 'False' }
    return this.http.patch(`${this.getBackend()}/api/duplicates/${uuid}/resolve/?${Utils.toQueryString(q)}`, params, { headers: this.getHeaders() })
  }
}
