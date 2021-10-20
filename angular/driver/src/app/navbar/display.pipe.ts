import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'display',
    pure: false
})
export class DisplayPipe implements PipeTransform {
    transform(items: any[]): any {
        return items.filter((a) => {
            return a.key!="_localId"
        })
    }
}