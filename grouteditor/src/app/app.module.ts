import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { JSONEditorComponent } from './jsoneditor/jsoneditor.component';
import { SortedhashPipe } from './sortedhash.pipe';

@NgModule({
  declarations: [
    AppComponent,
    JSONEditorComponent,
    SortedhashPipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [JSONEditorComponent],
  entryComponents: [JSONEditorComponent]
})
export class AppModule { }
