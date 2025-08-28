import { Injectable } from '@angular/core';
import { environment } from '../environments/environment'
import axios from 'axios';

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
  constructor() { }
  login(user, pass) {
    let headers = {
      'Content-Type': 'application/json'
    }
    let b = this.getBackend()
    let a = `${b}/api-token-auth/`
    return axios.post(a, { username: user, password: pass }, { headers: headers });
  }
}
