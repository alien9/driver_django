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
import { FormatTimePipe } from './format-time.pipe';
import { OrderedFieldsPipe } from './ordered-fields.pipe';
import { SearchableFilterPipe } from './navbar/search-field.pipe'
import { OrderPipe } from './navbar/order-field.pipe'
import { EnumPipe } from './enum.pipe'
import { DisplayPipe } from './navbar/display.pipe'
import { FormatPipe } from './navbar/format.pipe'
import { FilterAsTextPipe } from './report/filterAsText.pipe'

import { DictDumpPipe } from './navbar/dict_dump.pipe'

import { ByPassSecurityPipe } from './irap-popup/sanitize.pipe'
import { FirstPipe } from './list/first.pipe'
import { RelatedPipe } from './input/related.pipe'
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ModalModule } from 'ngx-bootstrap/modal';
import { NgbModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { gearFill, filter, funnel, threeDots, threeDotsVertical, calendar, x, textParagraph, pencilSquare, pinMapFill, arrowRepeat, questionLg, map as mapinski, filePlusFill, geoFill, globe, plusSquareFill, arrowClockwise, listCheck } from 'ngx-bootstrap-icons';

import { NgxBootstrapIconsModule } from 'ngx-bootstrap-icons';
import { ListComponent } from './list/list.component';
import { IndexComponent } from './index/index.component';
import { RouterModule } from '@angular/router';

import { IsDatePipe } from './report/isdate.pipe';
import { ArrayJoinPipe } from './input/arrayjoin.pipe';
import { LocalizedDatePipe } from './report/localized.date.pipe';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';
import { LocalCurrencyPipe } from './counter/localcurrency.pipe';
import { ArrayFirstPipe } from './input/first.pipe'
import { SafePipeModule } from 'safe-pipe';
import { ReportComponent } from './report/report.component';
import { environment } from '../environments/environment';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import localeEs from '@angular/common/locales/es';
import localeFr from '@angular/common/locales/fr';
import localeEn from '@angular/common/locales/en';
import localeLo from '@angular/common/locales/lo';
import localeAr from '@angular/common/locales/ar';
import localeFa from '@angular/common/locales/fa';
import { NgxSpinnerModule } from "ngx-spinner";
import { ChartsComponent } from './charts/charts.component';
import { IrapPopupComponent } from './irap-popup/irap-popup.component';
import { AuthService } from './auth.service'
import { map } from 'rxjs/operators';
import { DuplicateComponent } from './duplicate/duplicate.component';
import { LegendComponent } from './legend/legend.component';
import { CounterComponent } from './counter/counter.component';
import { geoBounds } from 'd3';
import { InputFieldComponent } from './input-field/input-field.component';
import { LocalListComponent } from './local-list/local-list.component';
import { ConditionPipe } from './condition.pipe';
import { SplitlinesPipe } from './splitlines.pipe';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { ReferenceNamePipe } from './reference-name.pipe';
import { UnbreakPipe } from './unbreak.pipe'

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
registerLocaleData(localeFa);
registerLocaleData(localeEs);
registerLocaleData(localeFr);
registerLocaleData(localeEn);
registerLocaleData(localeLo);
registerLocaleData(localeAr);
export function HttpLoaderFactory(httpClient: HttpClient) {
  let b = localStorage.getItem("backend") || (('api' in environment) ? environment.api : '')
  return new MultiTranslateHttpLoader(httpClient, [
    { prefix: "./assets/i18n/", suffix: ".json" },
    { prefix: `${b}/dictionary/`, suffix: "/" },
  ]);
}

const icons = {
  filePlusFill,
  geoFill, plusSquareFill, arrowClockwise, listCheck,
  globe,
  mapinski,
  filter,
  funnel,
  threeDots,
  gearFill,
  threeDotsVertical,
  calendar,
  x,
  textParagraph,
  pencilSquare,
  pinMapFill,
  arrowRepeat,
  questionLg
};
let lang = localStorage.getItem("Language") || "en"

let providers: any[] = [
  {
    provide: 'SocialAuthServiceConfig',
    useFactory: socialConfigFactory,
    deps: [AuthService]
  }
]
switch (lang) {
  case 'pt-BR':
    providers.push({ provide: LOCALE_ID, useValue: 'pt-BR' })
    break
  case 'ar':
    providers.push({ provide: LOCALE_ID, useValue: 'ar' })
    break
  case 'ar-lb':
    providers.push({ provide: LOCALE_ID, useValue: 'ar-b' })
    break
  case 'fr':
    providers.push({ provide: LOCALE_ID, useValue: 'fr' })
    break
  case 'es':
    providers.push({ provide: LOCALE_ID, useValue: 'es' })
    break
  case 'lo':
    providers.push({ provide: LOCALE_ID, useValue: 'lo' })
    break;
  case 'fa':
    providers.push({ provide: LOCALE_ID, useValue: 'fa' })
    break
  default:
    providers.push({ provide: LOCALE_ID, useValue: 'en' })

}

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    InputComponent,
    LoginComponent,
    NavbarComponent,
    ByPassSecurityPipe,
    LocalCurrencyPipe,
    OrderedFieldsPipe,
    FormatTimePipe,
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
    InputFieldComponent,
    LocalListComponent,
    ConditionPipe,
    SplitlinesPipe,
    ReferenceNamePipe,
    UnbreakPipe
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
    NgbTypeaheadModule,
    SafePipeModule,
    NgxBootstrapIconsModule.pick(icons),
    NgxSpinnerModule,
    QRCodeModule,
    RouterModule,
    SocialLoginModule,
    AccordionModule.forRoot()
  ],
  providers: providers,
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule { }

