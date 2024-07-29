import { Pipe, PipeTransform } from '@angular/core';

var weekdays = {}
let d = new Date()
for (let i = 0; i < 7; i++) {
    weekdays[d.getDay() + 1] = d.toLocaleDateString(localStorage.getItem("Language") || 'en', { weekday: 'long' });
    d.setDate(d.getDate() + 1)
}
@Pipe({
    name: 'isdate',
    pure: false
})
export class IsDatePipe implements PipeTransform {
    transform(item: string, type: string): string {
        let t = null
        switch (type) {
            case 'day':
                if (t = item.match(/\((\d+), (\d+), (\d+)\)/)) {
                    let d = new Date(t[1], t[2] - 1, t[3])
                    return d.toLocaleDateString(localStorage.getItem("Language") || 'en')
                }
                break
            case 'month':
                if (t = item.match(/\((\d+), (\d+)\)/)) {
                    let d = new Date(t[1], t[2] - 1, 15)
                    return `${d.toLocaleString(localStorage.getItem("Language") || 'en', { month: "long" })} ${d.getFullYear()}`;
                }
                break
            case 'year':
                return item
            case 'day_of_week':
                return weekdays[item]
            case 'week':
                t=item.match(/\b\d+\b/g)
                return `${t[0]} / ${t[1]}`

            default:
                return item
        }
        return item
    }
}