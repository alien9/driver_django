import { LOCALE_ID, TRANSLATIONS, TRANSLATIONS_FORMAT } from '@angular/core';

 export function getTranslationProviders(): Promise<Object[]> {
    let locale = 'en';
    if (localStorage.getItem('Language') !== undefined) {
     locale = localStorage.getItem('Language');
    }

  // return no providers if fail to get translation file for locale
  const noProviders: Object[] = [];

  // No locale or U.S. English: no translation providers
  if (!locale || locale === 'en') {
    return Promise.resolve(noProviders);
  }

 let translationFile = `../locale/messages.${locale}.xlf`;

 /* if (locale === 'en') {
    translationFile = './messages.xlf';
 }
 */
  return loadTranslationFile(translationFile)
    .then( (translations: string ) => [
        { provide: TRANSLATIONS, useValue: translations },
        { provide: TRANSLATIONS_FORMAT, useValue: 'xlf' },
        { provide: LOCALE_ID, useValue: locale }
    ])
    .catch(() => noProviders); // ignore if file not found
   }

   function loadTranslationFile(file) {
    return new Promise(function (resolve, reject) {
       const   xhr: XMLHttpRequest = new XMLHttpRequest();
       xhr.open('GET', file, false);
       xhr.onreadystatechange = function() {
         if (xhr.readyState === 4) {
            if (xhr.status === 200 || xhr.status === 0) {
                resolve(xhr.responseText);
            } else {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText
                });
            }
        } else {
            reject({
                status: xhr.status,
                statusText: xhr.statusText
            });                }
    };
    xhr.onerror = function () {
        reject({
            status: xhr.status,
            statusText: xhr.statusText
        });
    };
    xhr.send(null);
  });
   }