import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'localcurrency',
    pure: false
})
export class LocalCurrencyPipe implements PipeTransform {
    transform(v: number, code: string, lang: string): string {
        if(!code || code==""){
            code="USD"
        }
        let formatter = new Intl.NumberFormat(lang, {
            style: 'currency',
            currency: code,
        });
        return formatter.format(v);
    }
}
