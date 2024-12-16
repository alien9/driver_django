import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'condition'
})
export class ConditionPipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    console.log("filtering valiue")
    console.log(value)
    console.log(args)
    let data
    if(args.length==3){
      data = args[0][args[1]][args[2]]
    }else{
      data = args[0][args[1]]
    }
    console.log(data)
    return value.filter((k: any) => {
      if (k.value.condition) {
        if (data[k.value.condition]) {
          return data[k.value.condition] == k.value.conditionValue
        } else {
          return false
        }
      }
      return true
    });
  }

}
