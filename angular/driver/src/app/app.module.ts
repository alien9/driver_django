import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LOCALE_ID } from '@angular/core';
import { QRCodeModule } from 'angularx-qrcode';

import { HttpClientModule, HttpClient } from '@angular/common/http'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { InputComponent } from './input/input.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletDrawModule } from '@asymmetrik/ngx-leaflet-draw';

import { SocialLoginModule, SocialAuthServiceConfig } from 'angularx-social-login';
import { GoogleLoginProvider } from 'angularx-social-login';

import { LoginComponent } from './login/login.component';

import { NavbarComponent } from './navbar/navbar.component';
import { OrderedFieldsPipe } from './ordered-fields.pipe';
import { SearchableFilterPipe } from './navbar/search-field.pipe'
import { OrderPipe } from './navbar/order-field.pipe'
import { EnumPipe } from './enum.pipe'
import { DisplayPipe } from './navbar/display.pipe'
import { FormatPipe } from './navbar/format.pipe'
import { FilterAsTextPipe } from './report/filterAsText.pipe'

import { DictDumpPipe } from './navbar/dict_dump.pipe'
import { FirstPipe } from './list/first.pipe'
import { RelatedPipe } from './input/related.pipe'
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ModalModule } from 'ngx-bootstrap/modal';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { filter, funnel, threeDots, threeDotsVertical, calendar, x, textParagraph, pencilSquare, pinMapFill, arrowRepeat, questionLg } from 'ngx-bootstrap-icons';

import { NgxBootstrapIconsModule } from 'ngx-bootstrap-icons';
import { ListComponent } from './list/list.component';
import { IndexComponent } from './index/index.component';
import { RouterModule } from '@angular/router';

import { IsDatePipe } from './report/isdate.pipe';
import { ArrayJoinPipe } from './input/arrayjoin.pipe';
import { LocalizedDatePipe } from './report/localized.date.pipe';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';

import { ArrayFirstPipe } from './input/first.pipe'
import { SafePipeModule } from 'safe-pipe';
import { ReportComponent } from './report/report.component';
import { environment } from '../environments/environment';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import localeEs from '@angular/common/locales/es';
import localeFr from '@angular/common/locales/fr';
import localeEn from '@angular/common/locales/en';
import { NgxSpinnerModule } from "ngx-spinner";
import { ChartsComponent } from './charts/charts.component';
import { IrapPopupComponent } from './irap-popup/irap-popup.component';
import { AuthService } from './auth.service'
import { map } from 'rxjs/operators';
import { DuplicateComponent } from './duplicate/duplicate.component';
import { LegendComponent } from './legend/legend.component';
import { CounterComponent } from './counter/counter.component';
import { TutorialComponent } from './tutorial/tutorial.component';

const socialConfigFactory = (restService: AuthService) => {
  return restService.getGoogleClientId().pipe(map(config => {
    let providers = [];

    if (config['clientId'].length > 0) {
      providers.push({
        id: GoogleLoginProvider.PROVIDER_ID,
        provider: new GoogleLoginProvider(
          config['clientId']
        ),
      });
    }

    return {
      autoLogin: false,
      providers: providers,
    } as SocialAuthServiceConfig;
  })).toPromise();
};
registerLocaleData(localePt);
registerLocaleData(localeEs);
registerLocaleData(localeFr);
registerLocaleData(localeEn);
export function HttpLoaderFactory(httpClient: HttpClient) {
  let b = localStorage.getItem("backend") || (('api' in environment) ? environment.api : '')
  return new MultiTranslateHttpLoader(httpClient, [
    { prefix: "./assets/i18n/", suffix: ".json" },
    { prefix: `${b}/dictionary/`, suffix: "/" },
  ]);
}

const icons = {
  filter,
  funnel,
  threeDots,
  threeDotsVertical,
  calendar,
  x,
  textParagraph,
  pencilSquare,
  pinMapFill,
  arrowRepeat,
  questionLg
};

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    InputComponent,
    LoginComponent,
    NavbarComponent,
    OrderedFieldsPipe,
    SearchableFilterPipe,
    OrderPipe,
    RelatedPipe,
    EnumPipe,
    DisplayPipe,
    FormatPipe,
    DictDumpPipe,
    FilterAsTextPipe,
    FirstPipe,
    ArrayFirstPipe,
    IsDatePipe,
    ArrayJoinPipe,
    LocalizedDatePipe,
    ListComponent,
    IndexComponent,
    ReportComponent,
    ChartsComponent,
    IrapPopupComponent,
    DuplicateComponent,
    LegendComponent,
    CounterComponent,
    TutorialComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    LeafletModule,
    LeafletDrawModule,
    BsDropdownModule,
    TooltipModule,
    ModalModule,
    NgbModule,
    SafePipeModule,
    NgxBootstrapIconsModule.pick(icons),
    NgxSpinnerModule,
    QRCodeModule,
    RouterModule,
    SocialLoginModule,
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt' },
    { provide: LOCALE_ID, useValue: 'fr' },
    { provide: LOCALE_ID, useValue: 'es' },
    { provide: LOCALE_ID, useValue: 'en' },
    {
      provide: 'SocialAuthServiceConfig',
      useFactory: socialConfigFactory,
      deps: [AuthService]
    }
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule { }

