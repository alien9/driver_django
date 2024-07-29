import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'arrayfirst',
    pure: false
})
export class ArrayFirstPipe implements PipeTransform {
    transform(items: any[]): string {
        if(items && items.length){
            items.sort((a,b)=>a['value']['propertyOrder']-b['value']['propertyOrder'])
            return items[0]['key']
        }
        return ""
    }
}
