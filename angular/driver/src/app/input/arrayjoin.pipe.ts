import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
    name: 'arrayjoin',
    pure: false
})
export class ArrayJoinPipe implements PipeTransform {
    constructor(private translateService: TranslateService) {
    }
    transform(all: string[]): string {
        if (!all.length)
            return ""
        if(Array.isArray(all))
            return all.filter((k)=>k.length).map(k => this.translateService.instant(k)).join(", ")
        else
            return this.translateService.instant(all)
    }
}