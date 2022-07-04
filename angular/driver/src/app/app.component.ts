import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private translate: TranslateService) {
    let lang=localStorage.getItem("Language") || 'en'
    translate.setDefaultLang(lang);
  }
  title = 'driver';
  useLanguage(language: string): void {
    this.translate.use(language);
  }
}
