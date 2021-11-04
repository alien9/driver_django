import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'isdate',
    pure: false
})
export class IsDatePipe implements PipeTransform {
    transform(item: string): string {
        let t=null
        if(t=item.match(/\((\d+), (\d+), (\d+)\)/)){
            let d=new Date(t[1],t[2]-1, t[3])
            return d.toLocaleDateString(localStorage.getItem("Language")||'en')
        }



        return item
    }
}