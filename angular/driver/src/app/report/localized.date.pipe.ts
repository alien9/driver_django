import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'localizedDate',
  pure: false
})
export class LocalizedDatePipe implements PipeTransform {

  constructor(private translateService: TranslateService) {
  }

  transform(value: any, pattern: string = 'mediumDate', locale: string, timezone:string = null): any {
    const datePipe: DatePipe = new DatePipe(locale);
    const opt={}
    if (!value || value == "")
      return this.translateService.instant("Date")
    switch (pattern) {
      case "dd/MM/yyyy":
        return (new Date(value)).toLocaleDateString(locale, opt);
      case "shortTime":
        return (new Date(value)).toLocaleTimeString(locale, opt);
    }
    return datePipe.transform(value, pattern, '', locale);

  }

}