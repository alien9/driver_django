import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fieldfilter'
})
export class FieldfilterPipe implements PipeTransform {
  transform(value: unknown[], ...args: unknown[]): unknown {
    return value.filter((fu)=>{
      return (fu["key"]!=args[0])&&(fu["value"].fieldType&&(fu["value"].fieldType=="selectlist"))
    });
  }

}
