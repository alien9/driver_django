import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'conditionvalues'
})
export class ConditionvaluesPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
