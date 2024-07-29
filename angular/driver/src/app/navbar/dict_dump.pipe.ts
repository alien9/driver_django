import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'dict_dump',
    pure: false
})
export class DictDumpPipe implements PipeTransform {
    transform(item: any, table: string, index: number, field:string): any {
        if(item && item[table]){
            if(index !== null){
                if(item[table][index] && item[table][index][field]) return item[table][index][field]
            }
            if(item[table][field]) return item[table][field]
        }
        return ""
    }
}