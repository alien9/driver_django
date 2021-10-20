import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'isSearchable',
    pure: false
})
export class SearchableFilterPipe implements PipeTransform {
    transform(items: any[]): any {
        return items.filter(item => {
            return item.value['isSearchable']
        })
    }
}