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
        return all.map(k => this.translateService.instant(k)).join(", ")
    }
}