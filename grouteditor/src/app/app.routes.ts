import { Routes } from '@angular/router';
import {Jsoneditor} from './jsoneditor/jsoneditor';
export const routes: Routes = [
      { path: '**', component: Jsoneditor },
];
