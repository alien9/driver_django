import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fieldfilter'
})
export class FieldfilterPipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    return value.filter((fu:any)=>{
      return (fu["key"]!=args[0])&&(fu["value"].fieldType&&(fu["value"].fieldType=="selectlist"))
    });
  }

}
