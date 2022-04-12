import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment'
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  getBackend(): string {
    return localStorage.getItem("backend") || (('api' in environment) ? environment.api : '')
  }
  logout() {
    localStorage.clear()
    let next = encodeURIComponent("/login")
    window.location.href = `${this.getBackend()}/api-auth/logout/?next=${next}`
  }
  constructor(private http: HttpClient) { }
  login(user, pass) {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    })
    let b = this.getBackend()
    let a = `${b}/api-token-auth/`
    return this.http.post(a, { username: user, password: pass }, { headers: headers });
  }
  getGoogleClientId() {
    return this.http.get(`${this.getBackend()}/openid/googleclientid/`)
  }
  getSignupForm(): Observable<any> {
    let headers = new HttpHeaders({
      'responseType': 'text',
      'Content-Type': 'text/plain; charset=utf-8'
    })
    return this.http.get(`${this.getBackend()}/signup`, { 'responseType': 'text' })
  }
  createUser(data: object): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    })
    return this.http.post(`${this.getBackend()}/api-token-auth/`, data, { headers: headers });
  }
}
