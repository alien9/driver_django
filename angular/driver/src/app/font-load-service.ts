// src/app/services/font-loader.service.ts
import { Injectable } from '@angular/core';
import * as WebFont from 'webfontloader';

@Injectable({
  providedIn: 'root',
})
export class FontLoaderService {
  loadFont(language: string) {
    let fontFamily: string;
    switch (language) {
      case 'en':
        fontFamily = 'Roboto';
        break;
      case 'lo':
        fontFamily = 'Phetsarath';
        break;
      default:
        fontFamily = 'Roboto'; // Default font
    }
    WebFont.load({
      google: {
        families: [fontFamily],
      }
    });

    document.body.style.fontFamily = fontFamily;
  }
}