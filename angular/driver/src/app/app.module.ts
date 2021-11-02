import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { HttpClientModule, HttpClient } from '@angular/common/http'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { InputComponent } from './input/input.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletDrawModule } from '@asymmetrik/ngx-leaflet-draw';

import { LoginComponent } from './login/login.component';

import { NavbarComponent } from './navbar/navbar.component';
import { OrderedFieldsPipe } from './ordered-fields.pipe';
import { SearchableFilterPipe } from './navbar/search-field.pipe'
import { OrderPipe } from './navbar/order-field.pipe'
import { EnumPipe } from './enum.pipe'
import { DisplayPipe } from './navbar/display.pipe'
import { FormatPipe } from './navbar/format.pipe'
import { DictDumpPipe } from './navbar/dict_dump.pipe'
import { FirstPipe } from './list/first.pipe'

import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ModalModule } from 'ngx-bootstrap/modal';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { filter, funnel, threeDots, threeDotsVertical, calendar, x, textParagraph } from 'ngx-bootstrap-icons';

import { NgxBootstrapIconsModule } from 'ngx-bootstrap-icons';
import { ListComponent } from './list/list.component';
import { IndexComponent } from './index/index.component';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';

import { SafePipeModule } from 'safe-pipe';
import { ReportComponent } from './report/report.component';
import { environment } from '../environments/environment';
import { ReportViewComponent } from './report-view/report-view.component';

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
  textParagraph
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
    EnumPipe,
    DisplayPipe,
    FormatPipe,
    DictDumpPipe,
    FirstPipe,
    ListComponent,
    IndexComponent,
    ReportComponent,
    ReportViewComponent
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
    HttpClientModule,
    NgbModule,
    SafePipeModule,
    NgxBootstrapIconsModule.pick(icons)
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

