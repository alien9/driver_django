import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'unbreak'
})
export class UnbreakPipe implements PipeTransform {

  transform(value: string, ...args: string[]): string {

    return value.replace(new RegExp("\n", "g"), "");
  }

}
