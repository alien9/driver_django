import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'condition'
})
export class ConditionPipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    let data
    if (args.length == 3) {
      data = args[0][args[1]][args[2]]
    } else {
      data = args[0][args[1]]
    }
    return value.filter((k: any) => {
      if (k.value.condition) {
        if (data[k.value.condition]) {
          if (k.value.conditionRegex && k.value.conditionRegex.length) {
            const rex = new RegExp(k.value.conditionRegex)
            if (Array.isArray(data[k.value.condition])) {
              return data[k.value.condition].map((o) => o.match(rex)).filter((j) => !!j).length > 0
            }
            return data[k.value.condition].match(new RegExp(k.value.conditionRegex))
          }
          return data[k.value.condition] == k.value.conditionValue
        } else {
          return false
        }
      }
      return true
    });
  }

}
