import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { Location } from '@angular/common';
const __stripTrailingSlash = (Location as any).stripTrailingSlash;
(Location as any).stripTrailingSlash = function _stripTrailingSlash(url: string): string {
  return /[^\/]\/$/.test(url) ? url : __stripTrailingSlash(url);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes)
  ]
};
