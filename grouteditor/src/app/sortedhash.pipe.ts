import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sortedhash'
})
export class SortedhashPipe implements PipeTransform {

  transform(value: any, ...args: unknown[]): unknown {
    let keys = [];
    for (let key in value) {
        if(value[key].options && value[key].options.hidden==true){
        }else{
          keys.push(key);
        }
    }
    keys.sort((n1,n2) => {
        if (value[n1].propertyOrder > value[n2].propertyOrder) {
            return 1;
        }
        if (value[n1].propertyOrder < value[n2].propertyOrder) {
            return -1;
        }
        return 0;
    })
    return keys.map(k => ({key: k, value: value[k]}));
  }

}
