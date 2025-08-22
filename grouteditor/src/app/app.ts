import { Component,ElementRef, signal } from '@angular/core';
import { Jsoneditor } from './jsoneditor/jsoneditor';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grouteditor',
  imports: [Jsoneditor, FormsModule, CommonModule],
  templateUrl: './app.html', inputs: ['textarea_id', 'currentvalue'],
  styleUrl: './app.css'
})
export class App {
  textarea:string;
  protected readonly title = signal('grouteditor');
  constructor(private elementRef: ElementRef) {
    this.textarea = this.elementRef.nativeElement.getAttribute('textarea_id');
  }
}
