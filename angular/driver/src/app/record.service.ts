import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


import { environment } from '../environments/environment';
import Utils from '../assets/utils';
import { isJsonObject } from 'node_modules_backup/@angular-devkit/core/src';
import { JsonCompiler } from 'ngx-translate-extract';
@Injectable({
  providedIn: 'root'
})
export class RecordService {
  constructor(private http: HttpClient) { }

  getTokenFromCookie() {
    let g = document.cookie.split(/; /).map(k => k.split(/=/)).filter(k => k[0] == "AuthService.token")
    if ((g.length > 0) && (g[0].length > 1)) return g[0][1]
    return null
  }

  getHeaders(): HttpHeaders {
    let h = {
      'Content-Type': 'application/json'
    }
    let t = this.getTokenFromCookie()
    if (t) h['Authorization'] = `Token ${this.getTokenFromCookie()}`
    return new HttpHeaders(h)
  }

  getSpecialHeaders(): HttpHeaders {
    return new HttpHeaders({

      'Accept': 'application/json, text/plain, */*',
      "Content-Type": "application/json",

    })
  }
  getBlobHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/octet-stream',
      'Authorization': 'Token ' + (document.cookie.split(/; /).map(k => k.split(/=/)).filter(k => k[0] == "AuthService.token")[0][1])
    })
  }
  getNames(url: string, lang: string): Observable<any[]> {
    return this.http.get<any[]>(`${url}?lang=${lang}`, { headers: this.getHeaders() })
  }

  getBackend(): string {
    return (localStorage.getItem("backend") || (('api' in environment) ? environment.api : '')).replace(/\/\?.*$/, '')
  }
  getUniqueId(record_uuid, table: string, field: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.getBackend()}/api/escwa_unique_id/${record_uuid}/?table_name=${table}&field_name=${field}`, { headers: this.getHeaders() })
  }
  getUniqueIdBoundary(record_uuid, table: string, field: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.getBackend()}/api/escwa_unique_id/${record_uuid}/?table_name=${table}&field_name=${field}&boundary=1`, { headers: this.getHeaders() })
  }
  getSiteHeader(lang: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.getBackend()}/dictionary/header/${lang}/`, { headers: this.getSpecialHeaders() })
  }
  getSiteFooter(lang: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.getBackend()}/dictionary/footer/${lang}/`, { headers: this.getSpecialHeaders() })
  }
  getSiteLogo(lang: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.getBackend()}/dictionary/logo/${lang}/`, { headers: this.getHeaders() })
  }
  getRecordType(): Observable<any[]> {
    return this.http.get<any[]>(this.getBackend() + '/api/recordtypes/?active=True', { headers: this.getHeaders() })
  }
  getRecord(s: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.getBackend()}/api/records/${s}/`, { headers: this.getHeaders() })
  }
  getAbout(lang: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.getBackend()}/about/${lang}/`, { headers: this.getHeaders() })
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
  uploadAttachment(obj: Object, uuid: string): Observable<any[]> {
    //head.append('Content-Type', 'application/x-www-form-urlencoded');
    //head.append('Content-Type', 'multipart/form-data; charset=utf-8')
    const head = {}

    head['Content-Type'] = 'multipart/form-data; boundary=----WebKitFormBoundarysHGu3457qgfNxNdQ' //'multipart/form-data; charset=utf-8'
    head["Accept"] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
    let t = this.getTokenFromCookie()
    if (t) head['Authorization'] = `Token ${t}`
    //head['Content-Disposition'] = obj["srcElement"].files[0].name
    const formData = new FormData()
    console.log("WILLLL UPLOAD")
    console.log(obj["srcElement"].files[0])
    formData.append("file", obj["srcElement"].files[0], obj["srcElement"].files[0].name)
    formData.append("uuid", uuid)
    formData.append("csrfmiddlewaretoken", t)

    return this.http.post<any[]>(this.getBackend() + '/api/files/', formData, { headers: new HttpHeaders(head) })
  }
  getRecords(o: Object, q: any): Observable<any[]> {
    let params = new HttpParams()
      .set('archived', 'false')
      .set('details_only', 'false')
      .set('limit', o['limit'] ? o['limit'] : '50')
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
  getBoundaryPolygons(boundary: any, location: string = null) {
    if (boundary) {
      return this.http.get<any[]>(`${this.getBackend()}/api/boundarypolygons/?active=True&boundary=${boundary.uuid}&limit=all&nogeom=true`, { headers: this.getHeaders() })
    }
    if (location) {
      return this.http.get<any[]>(`${this.getBackend()}/api/boundarypolygons/?active=True&location=${location}&limit=all&nogeom=true`, { headers: this.getHeaders() })
    }

  }
  getFilteredBoundaryPolygons(boundary: any, filter: string) {
    return this.http.get<any[]>(`${this.getBackend()}/api/boundarypolygons/?active=True&boundary=${boundary.uuid}&limit=all&nogeom=true&filter=${filter}`, { headers: this.getHeaders() })
  }
  getBoundaryPolygon(b: string) {
    return this.http.get<any[]>(`${this.getBackend()}/api/boundarypolygons/${b}/`, { headers: this.getHeaders() })
  }
  getCritical() {
    return this.http.get<any[]>(`${this.getBackend()}/api/blackspotsets/`, { headers: this.getHeaders() })
  }
  getCrossTabs(o: string, q: object): Observable<object> {
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
      .set('language', localStorage.getItem("Language") || 'en-gb')
    Object.keys(q).forEach(k => {
      params = params.set(k, q[k])
    })
    return this.http.get<any[]>(`${this.getBackend()}/api/records/quantiles/`, { headers: this.getHeaders(), params: params })
  }
  getSegmentQuantiles(o: string, q: object) {
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
    return this.http.get<any[]>(`${this.getBackend()}/get_config/`, { headers: this.getSpecialHeaders() })
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
    if (record_uuid) params['recordUUID'] = record_uuid
    let q = { limit: 'all', resolved: 'False' }
    return this.http.patch(`${this.getBackend()}/api/duplicates/${uuid}/resolve/?${Utils.toQueryString(q)}`, params, { headers: this.getHeaders() })
  }
  postCsv(tilekey: string) {
    let data = { "tilekey": tilekey }
    return this.http.post(`${this.getBackend()}/api/csv-export/`, data, { headers: this.getHeaders() })
  }
  getCsv(tilekey: string) {
    return this.http.get<any[]>(`${this.getBackend()}/api/csv-export/${tilekey}/`, { headers: this.getHeaders() })
  }
  getRecordCosts(o: Object, q: any): Observable<any[]> {
    let params = new HttpParams()
      .set('archived', 'false')
      .set('details_only', 'true')
      .set('record_type', o['uuid'])
      .set('active', 'true')
    if (q) {
      if (q.filter) {
        for (var k in q.filter) {
          if (q.filter[k]) params = params.set(k, q.filter[k])
        }
      }
    }
    return this.http.get<any[]>(this.getBackend() + '/api/records/costs/', { headers: this.getHeaders(), params: params })
  }
  getRoadMap() {
    return this.http.get<any[]>(`${this.getBackend()}/api/roadmaps/`, { headers: this.getHeaders() })
  }
  getRoadMapByCords(params: any) {
    return this.http.get<any[]>(`${this.getBackend()}/api/roadmaps/ab06162a-8ccd-4cc6-a3b4-ec097bfbc8dc/map/?latlong=${params.latlng[1]},${params.latlng[0]}`, { headers: this.getBlobHeaders() },)
  }
  getForward(roadmap: string, params: object): Observable<any> {
    if (window['android']) { 
      return new Observable((subscriber)=>{
        const roads=window['android'].getRoadsByName(params['term'],params['bbox'])
        subscriber.next(JSON.parse(roads))
      })
    }
    else {
      return this.http.get<any[]>(`${this.getBackend()}/api/roadmaps/${roadmap}/forward/?limit=15&q=${params['term']}&viewBox=${params['bbox']}`, { headers: this.getHeaders() })
    }
  }
  getReverse(roadmap: string, lat: string, lng: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.getBackend()}/api/roadmaps/${roadmap}/reverse/?lat=${lat}&lon=${lng}&format=json`, { headers: this.getHeaders() })
  }
  getPosition(): Promise<any> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resp => {
        resolve({ lng: resp.coords.longitude, lat: resp.coords.latitude });
      },
        err => {
          reject(err);
        });
    });
  }
}
