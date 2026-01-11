import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import Utils from '../assets/utils';
import axios from 'axios';
import { AxiosResponse } from 'axios';

@Injectable({
  providedIn: 'root'
})
export class RecordService {
  getTokenFromCookie() {
    let g = document.cookie.split(/; /).map(k => k.split(/=/)).filter(k => k[0] == "AuthService.token")
    if ((g.length > 0) && (g[0].length > 1)) return g[0][1]
    return null
  }

  getAxiosHeaders(): object {
    let h = {
      'Content-Type': 'application/json'
    }
    let t = this.getTokenFromCookie()
    if (t) h['Authorization'] = `Token ${this.getTokenFromCookie()}`
    return h
  }

  getAxiosSpecialHeaders(): any {
    return {
      'Accept': 'application/json, text/plain, */*',
      "Content-Type": "application/json",
    }
  }

  getBlobAxiosHeaders(): any {
    return {
      'Content-Type': 'application/octet-stream',
      'Authorization': 'Token ' + (document.cookie.split(/; /).map(k => k.split(/=/)).filter(k => k[0] == "AuthService.token")[0][1])
    }
  }
  getNames(url: string, lang: string): Promise<any> {
    return axios.get(`${url}?lang=${lang}`, { headers: this.getAxiosHeaders() })
  }

  getBackend(): string {
    return (localStorage.getItem("backend") || (('api' in environment) ? environment.api : '')).replace(/\/\?.*$/, '')
  }
  getAPI(): Promise<any> {
    return axios.get(`${this.getBackend()}/api/`, { headers: this.getAxiosHeaders() })
  }
  getUniqueId(record_uuid, table: string, field: string): Promise<any> {
    return axios.get(`${this.getBackend()}/api/escwa_unique_id/${record_uuid}/?table_name=${table}&field_name=${field}`, { headers: this.getAxiosHeaders() })
  }
  getUniqueIdBoundary(record_uuid, table: string, field: string): Promise<any> {
    return axios.get(`${this.getBackend()}/api/escwa_unique_id/${record_uuid}/?table_name=${table}&field_name=${field}&boundary=1`, { headers: this.getAxiosHeaders() })
  }
  getSiteHeader(lang: string): Promise<any> {
    return axios.get(`${this.getBackend()}/dictionary/header/${lang}/`, { headers: this.getAxiosSpecialHeaders() })
  }
  getSiteFooter(lang: string): Promise<any> {
    return axios.get(`${this.getBackend()}/dictionary/footer/${lang}/`, { headers: this.getAxiosSpecialHeaders() })
  }
  getSiteLogo(lang: string): Promise<any> {
    return axios.get(`${this.getBackend()}/dictionary/logo/${lang}/`, { headers: this.getAxiosHeaders() })
  }
  getRecordType(): Promise<any> {
    return axios.get(this.getBackend() + '/api/recordtypes/?active=True', { headers: this.getAxiosHeaders() })
  }
  getRecord(s: string): Promise<any> {
    return axios.get(`${this.getBackend()}/api/records/${s}/`, { headers: this.getAxiosHeaders() })
  }
  getAbout(lang: string): Promise<any> {
    return axios.get(`${this.getBackend()}/about/${lang}/`, { headers: this.getAxiosHeaders() })
  }
  getRecordSchema(s: string): Promise<any> {
    return axios.get(this.getBackend() + '/api/recordschemas/' + s + '/', { headers: this.getAxiosHeaders() })
  }
  upload(obj: Object): Promise<any> {
    if (obj['uuid']) {
      return axios.patch(`${this.getBackend()}/api/records/${obj['uuid']}/`, obj, { headers: this.getAxiosHeaders() })
    } else {
      return axios.post(this.getBackend() + '/api/records/', obj, { headers: this.getAxiosHeaders() })
    }
  }
  uploadAttachment(obj: Object, uuid: string): Promise<any> {
    const head = {}
    head["Accept"] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
    let t = this.getTokenFromCookie()
    if (t) head['Authorization'] = `Token ${t}`
    const formData = new FormData()
    formData.append("file", obj["srcElement"].files[0], obj["srcElement"].files[0].name)
    formData.append("uuid", uuid)
    formData.append("csrfmiddlewaretoken", t)
    return axios.post(this.getBackend() + '/api/files/', formData, { headers: head })
  }
  getRecords(o: Object, q: any): Promise<any> {
    let params = {
      'archived': 'false',
      'details_only': 'false',
      'limit': o['limit'] ? o['limit'] : '50',
      'record_type': o['uuid'],
      'active': 'true'
    }
    if (q) {
      if (q.filter) {
        Object.keys(q.filter).forEach(k => {
          if (q.filter[k]) params[k] = q.filter[k]
        })
      }
    }
    return axios.get<any[]>(this.getBackend() + '/api/records/', { headers: this.getAxiosHeaders(), params: params })
  }

  getMapFileKey(o: Object, q: any): Promise<any> {
    const parameters = { 'archived': 'false', 'details_only': 'true', 'limit': '50', 'record_type': o['uuid'], 'mapfile': 'true', 'active': 'true' }
    if (q) {
      if (q.filter) {
        Object.keys(q.filter).forEach(k => {
          if (q.filter[k]) parameters[k] = q.filter[k]
        })
      }
    }
    return axios.get(this.getBackend() + '/api/records/', { headers: this.getAxiosHeaders(), params: parameters })
  }
  getToddow(filter: any): Promise<any> {
    let params = {
      'archived': 'false',
      'details_only': 'true',
      'limit': '50',
      'active': 'true'
    }
    Object.keys(filter).forEach(k => {
      if (filter[k]) params[k] = filter[k]
    })
    //http://192.168.1.101:8000/api/records/toddow/?archived=False&details_only=True&occurred_max=2021-11-13T01:59:59.999Z&occurred_min=2011-08-04T03:00:00.000Z&polygon_id=60b09207-2d82-49a8-92fc-b80f1fdc67ae&record_type=264a5cb5-6f2c-4817-ae1b-226f5e779ac9
    return axios.get(this.getBackend() + '/api/records/toddow/', { headers: this.getAxiosHeaders(), params: params })
  }

  getTileKey(o: Object, q: any): Promise<any> {
    var parameters = {
      archived: false,
      details_only: true,
      limit: 50,
      record_type: o['uuid'],
      tilekey: true,
      active: true
    }
    if (q) {
      Object.keys(q).forEach(k => {
        parameters[k] = q[k];
      })

    }
    return axios.get(this.getBackend() + '/api/records/?' + Utils.toQueryString(parameters), { headers: this.getAxiosHeaders() })
  }
  getBoundaries(): Promise<any> {
    return axios.get(this.getBackend() + '/api/boundaries/?limit=all', { headers: this.getAxiosHeaders() })
  }
  getBoundaryPolygons(boundary: any, location: string = null): Promise<any> {
    if (boundary) {
      return axios.get(`${this.getBackend()}/api/boundarypolygons/?active=True&boundary=${boundary.uuid}&limit=all&nogeom=true`, { headers: this.getAxiosHeaders() })
    }
    if (location) {
      return axios.get(`${this.getBackend()}/api/boundarypolygons/?active=True&location=${location}&limit=all&nogeom=true`, { headers: this.getAxiosHeaders() })
    }

  }
  getFilteredBoundaryPolygons(boundary: any, filter: string): Promise<AxiosResponse<any, any>> {
    return axios.get(`${this.getBackend()}/api/boundarypolygons/?active=True&boundary=${boundary.uuid}&limit=all&nogeom=true&filter=${filter}`, { headers: this.getAxiosHeaders() })
  }
  getBoundaryPolygon(b: string): Promise<any> {
    return axios.get(`${this.getBackend()}/api/boundarypolygons/${b}/`, { headers: this.getAxiosHeaders() })
  }
  getCritical(): Promise<any> {
    return axios.get(`${this.getBackend()}/api/blackspotsets/`, { headers: this.getAxiosHeaders() })
  }
  getCrossTabs(o: string, q: object): Promise<any> {
    let params = {
      'archived': 'False',
      'record_type': o,
      'calendar': 'gregorian'
    }
    Object.keys(q).forEach(k => {
      params[k] = q[k]
    })
    return axios(`${this.getBackend()}/api/records/crosstabs/`, { headers: this.getAxiosHeaders(), params: params })
  }
  getQuantiles(o: string, q: object): Promise<any> {
    let params = {
      'archived': 'False',
      'record_type': o,
      'calendar': 'gregorian',
      'language': localStorage.getItem("Language") || 'en-gb'
    }
    Object.keys(q).forEach(k => {
      params = params[k] = q[k]
    })
    return axios.get(`${this.getBackend()}/api/records/quantiles/`, { headers: this.getAxiosHeaders(), params: params })
  }
  getSegmentQuantiles(o: string, q: object): Promise<any> {
    let params = {
      'archived': 'False',
      'record_type': o,
      'calendar': 'gregorian',
      'language': localStorage.getItem("Language") || 'en-gb'
    }
    Object.keys(q).forEach(k => {
      params = params[k] = q[k]
    })
    return axios.get(`${this.getBackend()}/api/records/quantiles/`, { headers: this.getAxiosHeaders(), params: params })
  }
  getBoundaryMapfile(o: Object, q: any): Promise<any> {
    let params = {
      'archived': 'false',
      'active': 'true',
      'theme': true
    }
    if (q) {
      if (q.filter) {
        Object.keys(q.filter).forEach(k => {
          if (q.filter[k]) params[k] = q.filter[k]
        })
      }
    }
    return axios.get(`${this.getBackend()}/api/records/?${Utils.toQueryString(q)}`, { headers: this.getAxiosHeaders() })
  }
  getSavedFilters(q: any): Promise<any> {
    return axios.get(`${this.getBackend()}/api/userfilters/?${Utils.toQueryString(q)}`, { headers: this.getAxiosHeaders() })
  }
  saveFilter(data: any): Promise<any> {
    return axios.post(`${this.getBackend()}/api/userfilters/`, data, { headers: this.getAxiosHeaders() })
  }
  deleteFilter(fud: string): Promise<any> {
    return axios.delete(`${this.getBackend()}/api/userfilters/${fud}/`, { headers: this.getAxiosHeaders() })
  }
  getConfig(): Promise<any> {
    return axios.get(`${this.getBackend()}/get_config/`, { headers: this.getAxiosSpecialHeaders() })
  }
  getDuplicates(r, page): Promise<any> {
    let q = {
      record_type: r,
      offset: page,
      limit: 50,
      resolved: 'False'
    }
    return axios.get(`${this.getBackend()}/api/duplicates/?${Utils.toQueryString(q)}`, { headers: this.getAxiosHeaders() })
  }
  resolveDuplicate(uuid: string, record_uuid: string): Promise<any> {
    let params = {
      'uuid': uuid
    }
    if (record_uuid) params['recordUUID'] = record_uuid
    let q = { limit: 'all', resolved: 'False' }
    return axios.patch(`${this.getBackend()}/api/duplicates/${uuid}/resolve/?${Utils.toQueryString(q)}`, params, { headers: this.getAxiosHeaders() })
  }
  postCsv(tilekey: string): Promise<any> {
    let data = { "tilekey": tilekey }
    return axios.post(`${this.getBackend()}/api/csv-export/`, data, { headers: this.getAxiosHeaders() })
  }
  getCsv(tilekey: string): Promise<any> {
    return axios.get(`${this.getBackend()}/api/csv-export/${tilekey}/`, { headers: this.getAxiosHeaders() })
  }
  getRecordCosts(o: Object, q: any): Promise<any> {
    let params = {
      'archived': 'false',
      'details_only': 'true',
      'record_type': o['uuid'],
      'active': 'true'
    }
    if (q) {
      if (q.filter) {
        Object.keys(q.filter).forEach(k => {
          if (q.filter[k]) params[k] = q.filter[k]
        })
      }
    }
    return axios.get(this.getBackend() + '/api/records/costs/', { headers: this.getAxiosHeaders(), params: params })
  }
  getRoadMap(): Promise<any> {
    return axios.get(`${this.getBackend()}/api/roadmaps/`, { headers: this.getAxiosHeaders() })
  }
  getRoadMapByCords(params: any): Promise<any> {
    return axios.get(`${this.getBackend()}/api/roadmaps/ab06162a-8ccd-4cc6-a3b4-ec097bfbc8dc/map/?latlong=${params.latlng[1]},${params.latlng[0]}`, { headers: this.getBlobAxiosHeaders() },)
  }
  getForward(roadmap: string, params: object): Observable<any> {
    if (window['android']) {
      return new Observable((subscriber) => {
        const roads = window['android'].getRoadsByName(params['term'], params['bbox'])
        subscriber.next(JSON.parse(roads))
      })
    }
    else {
      let e = null
      return new Observable((subscriber) => {
        axios.get(`${this.getBackend()}/api/roadmaps/${roadmap}/forward/?limit=15&q=${params['term']}&viewBox=${params['bbox']}`, { headers: this.getAxiosHeaders() }).then(d => {
          subscriber.next(d.data)
        })
      })
    }
  }
  getReverse(roadmap: string, lat: string, lng: string): Promise<any> {
    return axios.get(`${this.getBackend()}/api/roadmaps/${roadmap}/reverse/?lat=${lat}&lon=${lng}&format=json`, { headers: this.getAxiosHeaders() })
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
