import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'firstpart',
    pure: false
})
export class FirstPipe implements PipeTransform {
    transform(item: string): string {
        if(item && item.length) return item.split(', ').shift()
        return ""
    }
}