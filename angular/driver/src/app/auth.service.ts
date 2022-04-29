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
    window.document.cookie='AuthService.token=; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    let next = `${window.location.protocol}//${window.location.host}/login`
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
    return this.http.get(`${this.getBackend()}/signup/`, { 'responseType': 'text' })
  }
  createUser(data: object): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    })
    return this.http.post(`${this.getBackend()}/api/create-user/`, data, { headers: headers });
  }
  getResetPasswordForm(): Observable<any>{
    return this.http.get(`${this.getBackend()}/password_reset/`, { 'responseType': 'text' })
  }
  resetPassword(data: object): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'text/html',
      'X-CSRFToken': data['csrfmiddlewaretoken']
    })
    return this.http.post(`${this.getBackend()}/password_reset/`, data, { headers: headers });
  }
  
}
