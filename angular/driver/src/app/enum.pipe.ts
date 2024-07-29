import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'enum'
})
export class EnumPipe implements PipeTransform {
  transform(value: any, ...args: unknown[]): unknown {
    if(value.enum)
        return value.enum
    if(value.items)
        return value.items.enum;
    return null
  }
}
