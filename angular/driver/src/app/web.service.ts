import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class WebService {

  getReverse(lat: string, lng: string): Promise<any> {
    return axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {})
  }
  getForward(params: object): Promise<any>  {
    return axios.get(`https://api.pickpoint.io/v1/forward?addressdetails=1&countrycodes=${params['country_code']}&key=${params['key']}&limit=15&q=${params['term']}&viewBox=${params['bbox']}`)
  }
  getMapillaryImages(token: string, bbox: string): Promise<any> {
    let limit = 200
    return axios.get(`https://graph.mapillary.com/images?access_token=${token}&fields=id,geometry&limit=${limit}&bbox=${bbox}`)
  }
  getHistoryWeather(what: any): Promise<any>  {
    let url = 'https://api.openweathermap.org/data/2.5/weather'
    return axios.get<any[]>(url, { params: what })
  }
}
