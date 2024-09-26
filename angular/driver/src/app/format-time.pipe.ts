import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'format_time'
})
export class FormatTimePipe implements PipeTransform {
  transform(value: any, ...args: unknown[]): unknown {
    console.log(args)
    let hm=value.split(':')
    while(hm.length<2) hm.push('')
    return (args[0]=='h')?hm[0]:hm[1]
  }
}
