import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'related',
    pure: false
})
export class RelatedPipe implements PipeTransform {
    transform(all: object[], id:string): any {
        return all.filter(fu=>fu['_localId']==id).pop()
    }
}