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

  transform(value: any, pattern: string = 'mediumDate', locale:string): any {
    const datePipe: DatePipe = new DatePipe(locale);
    if(!value || value=="")
      return this.translateService.instant("Date")
    return datePipe.transform(value, pattern);
  }

}