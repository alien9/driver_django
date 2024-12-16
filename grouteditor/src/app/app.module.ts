import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { JSONEditorComponent } from './jsoneditor/jsoneditor.component';
import { SortedhashPipe } from './sortedhash.pipe';
import { FieldfilterPipe } from './fieldfilter.pipe';
import { ConditionvaluesPipe } from './conditionvalues.pipe';
import { NgbModule, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    AppComponent,
    JSONEditorComponent,
    SortedhashPipe,
    FieldfilterPipe,
    ConditionvaluesPipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule, 
    NgbModule,
    NgbAccordionModule
  ],
  providers: [],
  bootstrap: [JSONEditorComponent],
  entryComponents: [JSONEditorComponent]
})
export class AppModule { }
