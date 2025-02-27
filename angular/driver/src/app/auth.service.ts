import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  getBackend(): string {
  return (localStorage.getItem("backend") || (('api' in environment) ? environment.api : '')).replace(/\/\?.*$/, '')
  }
  logout() {
    document.cookie.split(/;\s?/).map(k => k.split(/=/)).forEach(k => {
      document.cookie = `${k[0]}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`
    })
    localStorage.removeItem("AuthService.token")
    let next = encodeURIComponent("/login")
    window.location.href=`${this.getBackend()}/api-auth/logout/?next=${next}`
  }
  constructor(private http: HttpClient) { }
  login(user, pass) {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    })
    let b = this.getBackend()
    let a = `${b}/api-token-auth/`
    return this.http.post(a, { username: user, password: pass }, { headers: headers });
  }
  getGoogleClientId() {
    return this.http.get(`${this.getBackend()}/openid/googleclientid/`)
  }
}
