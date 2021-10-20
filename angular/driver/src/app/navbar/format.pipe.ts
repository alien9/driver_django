import { createOfflineCompileUrlResolver } from '@angular/compiler';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'format',
    pure: false
})
export class FormatPipe implements PipeTransform {
    transform(item: any[], field:object): any {
        if(field['media'])
            return ""
        /* for future implementation of translations */
        return item
    }
}