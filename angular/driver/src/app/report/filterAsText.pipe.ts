import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
@Pipe({
  name: 'filterAsText',
  pure: false
})
export class FilterAsTextPipe implements PipeTransform {

  constructor(private translateService: TranslateService) {
  }

  transform(value: any): string {
    if(value['jsonb']){
      let jf=JSON.parse(value['jsonb'])
      return Object.entries(jf).map((item)=>{
        return Object.entries(item[1]).map(field=>{
          let t=[]
          if(field[1]['contains']){
            t.push(field[1][ 'contains'].map(fk=>this.translateService.instant(fk)).reduce((o,p)=>`${o}, ${p}`,"").replace(/^\,/,''))
          }
          if(field[1]['min']!=null){
            t.push(`${this.translateService.instant('from')} ${field[1]['min']}`)
          }
          if(field[1]['max']!=null){
            t.push(`${this.translateService.instant('upto')} ${field[1]['max']}`)
          }
          return `${this.translateService.instant(field[0])}: ${t.reduce((l,m)=>`${l} ${m}`,"").replace(/^\,/,'')}`
        }).reduce((p,q)=>`${p}; ${q}`,"").replace(/^;/,'')
      }).reduce((a,b)=>`${a}; ${b}`,"").replace(/^;/,'')
    }
  }

}