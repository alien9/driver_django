import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'orderBy',
    pure: false
})
export class OrderPipe implements PipeTransform {
    transform(items: any[]): any {
        return items.sort((a, b) => {
            if(a.value.propertyOrder>b.value.propertyOrder)
                return 1
            if(a.value.propertyOrder<b.value.propertyOrder)
                return -1
            return 0
        })
    }
}