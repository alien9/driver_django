import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'referenceName'
})
export class ReferenceNamePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    const refe=(args[0]['watch'])?args[0]['watch'].target:args[0]
    const deno=args[1]['definitions'][refe].denominations || []
    const names=[]
    let i=0
    while(i<deno.length){
      if(value[deno[i]] && value[deno[i]].length)
      names.push(value[deno[i]])
      i++
    }
    if(names.length) return names.join(" ")
    return "" //value["_localId"];
  }
}
