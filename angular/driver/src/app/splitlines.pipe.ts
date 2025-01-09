import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'splitlines'
})
export class SplitlinesPipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): unknown {
    return value.replace(/\n/g, "<br>");
  }

}
