import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  getBackend():string {
    return localStorage.getItem("backend")||(('api' in environment)?environment.api:'')
  }
  logout() {
    localStorage.removeItem('config');
    localStorage.removeItem('token');
    localStorage.removeItem('record_schema');
    return;
  }
  constructor(private http: HttpClient) { }
  login(user, pass) {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    })
    let b=this.getBackend()
    let a=`${b}/api-token-auth/`
    return this.http.post(a, { username: user, password: pass }, { headers: headers });
  }
}
