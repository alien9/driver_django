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
      console.log(k)
      if (k.value.condition) {
        if (data[k.value.condition] && k.value.conditionValue && k.value.conditionValue.length) {
          console.log("condition", data[k.value.condition])
          console.log(data[k.value.condition])

          console.log(typeof k.value.conditionValue)

          console.log(typeof data[k.value.condition])
          if ((typeof data[k.value.condition]) == 'string')
            return k.value.conditionValue.indexOf(data[k.value.condition]) >= 0
          if ((typeof data[k.value.condition]) == 'object') {
            let r: boolean = false
            Array.from(data[k.value.condition]).forEach((u) => {
              if (k.value.conditionValue.indexOf(u) >= 0)
                r = true
            })
            return r
          }
        } else {
          return false
        }
      }
      return true
    });
  }

}
