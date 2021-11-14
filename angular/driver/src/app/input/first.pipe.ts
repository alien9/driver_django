import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'arrayfirst',
    pure: false
})
export class ArrayFirstPipe implements PipeTransform {
    transform(items: any[]): string {
        if(items && items.length){
            return items[0]['key']
        }
        return ""
    }
}
