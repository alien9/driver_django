import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {Observable } from 'rxjs';import { HttpClientModule } from '@angular/common/http';

import { environment }  from '../environments/environment';
import Utils from '../assets/utils';
@Injectable({
  providedIn: 'root'
})
export class RecordService {

  constructor(private http: HttpClient) { }

  getBackend():string {
    return localStorage.getItem("backend")||environment.api
  }
  getRecordType(): Observable<any[]> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    })
    return this.http.get<any[]>(this.getBackend()+'/api/recordtypes/?active=True', { headers: headers })
  }
  getRecordSchema(s: string): Observable<any[]> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    })
    return this.http.get<any[]>(this.getBackend()+'/api/recordschemas/'+s+'/', { headers: headers })
  }
  upload(obj: Object): Observable<any[]> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    })
    return this.http.post<any[]>(this.getBackend()+'/api/records/', obj, { headers: headers })
  }
  

  getTileKey(o: Object, q:any): Observable<any[]>{
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    })
    var parameters={
      archived:false,
      details_only:true,
      limit:50,
      record_type: o['uuid'],
      tilekey:true,
      active:true
    }
    if(q){
      for(var k in q){
        parameters[k]=q[k];
      }

    }
    return this.http.get<any[]>(this.getBackend()+'/api/records/?'+Utils.toQueryString(parameters), { headers: headers })
  }

}
