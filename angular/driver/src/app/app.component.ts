import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FontLoaderService } from './font-load-service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private translate: TranslateService, private fontLoader: FontLoaderService) {
    let lang=localStorage.getItem("Language") || 'en'
    translate.setDefaultLang(lang);
    const currentLang = this.translate.currentLang || this.translate.defaultLang;
    this.fontLoader.loadFont(currentLang);
  }
  title = 'driver';
  useLanguage(language: string): void {
    this.translate.use(language);
  }
}
