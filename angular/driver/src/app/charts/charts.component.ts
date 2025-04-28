import { Component, OnInit, Input, OnChanges, ChangeDetectorRef, NgZone, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { RecordService } from '../record.service'
import { first } from 'rxjs/operators';
import * as d3 from 'd3'
import { Legend, Swatch } from 'd3-color-legend'
import { arrowLeftRight } from 'ngx-bootstrap-icons';
import { TranslateService } from '@ngx-translate/core';
import { NgxSpinnerService } from "ngx-spinner";

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss']
})
export class ChartsComponent implements OnInit, OnChanges {
  @Input() filter: object
  @Input() boundary_polygon_uuid: string
  @Input() recordSchema: object
  @Input() reportFilters: object[]
  @Input() boundaries: object[]
  @ViewChild('swatchContainer') swatchContainer: ElementRef;

  public fontFamily = document.body.style.fontFamily
  active = 1
  toddow: any
  locale: string
  weekdays: object
  monthnames: object
  tip = 0
  barChart: object
  palette = [
    'e41a1c',
    '377eb8',
    '4daf4a',
    'd55e00',
    '2db9c7',
    '9972b2',
    'c0d442',
    '449e73',
    '32e4cc',
    'e52a1d'
  ]
  barChartParent: any;
  constructor(
    private recordService: RecordService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private translateService: TranslateService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.barChart = { 'interval': 'year' }
    this.locale = localStorage.getItem("Language") || "en"
    this.weekdays = {}
    this.monthnames = {}
    let d = new Date()
    d.setDate(1)
    for (let i = 0; i < 7; i++) {
      this.weekdays[d.getDay()] = d.toLocaleDateString(this.locale, { weekday: 'short' })
      d.setDate(d.getDate() + 1)
    }
    for (let i = 0; i < 12; i++) {
      d.setMonth(i)
      this.monthnames[i + 1] = d.toLocaleDateString(this.locale, { month: 'short' })
    }
    this.loadChart(1)
  }
  ngOnChanges(changes: SimpleChanges) {
    if (this.weekdays) //already initialized
      this.loadChart(this.active)
  }
  loadChart(activeTab: any) {
    //if (!this.filter) {
    this.filter = JSON.parse(localStorage.getItem("current_filter") || '{}')
    //}
    this.filter['record_type'] = this.recordSchema['record_type']
    if (this.boundary_polygon_uuid) {
      this.filter["polygon_id"] = this.boundary_polygon_uuid
    }
    let ts = this.translateService
    switch (activeTab) {
      case 1: // toddow
        this.spinner.show()
        let wod = {}
        Object.entries(this.weekdays).forEach((el, index) => wod[el[1]] = el[0]);
        const margin = { top: 30, right: 30, bottom: 30, left: 30 },
          width = 1050 - margin.left - margin.right,
          height = 350 - margin.top - margin.bottom;

        let hours: string[] = Array.from(Array(24).keys()).map(l => l.toString())
        let dow = Array.from(Array(7).keys()).map(k => k.toString())

        this.recordService.getToddow(this.filter).pipe(first()).subscribe({
          next: data => {
            this.spinner.hide()
            let max = data.map(k => k.count).reduce(function (a, b) {
              return Math.max(a, b);
            })
            this.toddow = data
            d3.select("#toddow").select("svg").remove()
            const svg = d3.select("#toddow").append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")")
            let x = d3.scaleBand()
              .range([0, width])
              .domain(hours)
              .padding(0.01);
            svg.append("g")
              .attr("transform", "translate(0," + height + ")")
              .call(d3.axisBottom(x).tickSize(0)).select(".domain").remove()
            let y = d3.scaleBand()
              .range([0, height])
              .domain(dow)
              .padding(0.01);
            svg.append("g")
              .call(d3.axisLeft(y).tickSize(0).tickFormat((t, i) => this.weekdays[t])).select(".domain").remove()
            const colors = d3.scaleQuantile()
              .range([
                parseInt("FDFBED", 16),
                parseInt("f6edb1", 16),
                parseInt("f7da22", 16),
                parseInt("ecbe1d", 16),
                parseInt("e77124", 16),
                parseInt("d54927", 16),
                parseInt("cf3a27", 16),
                parseInt("a33936", 16),
                parseInt("7f182a", 16),
                parseInt("68101a", 16),
              ])
              .domain([0, max])
            svg.selectAll()
              .data(data, function (d) {
                return d.count
              })
              .enter()
              .append("rect")
              .attr("x", function (d) {
                return x(parseInt(d.tod).toString())
              })
              .attr("y", function (d) {
                return y((parseInt(d.dow) - 1).toString())
              })
              .attr("width", x.bandwidth())
              .attr("height", y.bandwidth())
              .style("fill", function (d) {
                return `#${Math.round(colors(d.count)).toString(16)}`
              }).on('mouseover', function (d, i) {
                $("#record_count_tip").html(i.count)
              })
          }, error: err => {
            console.log(err)
            this.spinner.hide()
          }
        }
        )
        break;
      case 2: // bar graph over time
        const margin_bar = { top: 10, right: 30, bottom: 20, left: 50 },
          width_bar = 460 - margin_bar.left - margin_bar.right,
          height_bar = 400 - margin_bar.top - margin_bar.bottom;

        let parameters = this.filter
        if (this.barChart['interval'] && this.barChart['field']) {
          this.spinner.show()

          parameters['row_period_type'] = this.barChart['interval']
          parameters['col_choices_path'] = this.barChart['field']
          parameters['relate'] = this.barChart['field'] // the total count of related
          this.recordService.getCrossTabs(this.recordSchema['record_type'], parameters).pipe(first()).subscribe({
            next: data => {
              console.log(data)
              let obliterate = {}
              let intervals = []
              Object.entries(data["tables"][0].data).forEach((interval) => {
                intervals.push(interval[0])
                Object.entries(interval[1]).forEach((k) => {
                  if (!obliterate[k[0]]) obliterate[k[0]] = k[1]
                  else obliterate[k[0]] += k[1]
                })
              })
              Object.entries(obliterate).forEach((o) => {
                if (o[1] == 0) {
                  intervals.forEach((t) => {
                    delete data["tables"][0].data[t][o[0]]
                  })
                }
              });
              data["col_labels"] = data["col_labels"].filter((q) => {
                return obliterate[q.key] > 0
              })
              while (data["row_labels"].length > 0 && !data["tables"][0].data[data["row_labels"][0].key]) {
                data["row_labels"].shift()
              }
              while (data["row_labels"].length > 0 && !data["tables"][0].data[data["row_labels"][data["row_labels"].length - 1].key]) {
                data["row_labels"].pop()
              }
              let hue = 0
              let s = 0.65
              let l = 0.5
              let colorRange = []
              while (colorRange.length < data["col_labels"].length) {
                colorRange.push(this.rgbToHex(this.hslToRgb(hue, s, l)))
                hue += 0.375
                hue = hue % 1
                s *= 0.95
                l += ((1 - l) * .05)
              }
              this.palette = colorRange

              this.spinner.hide()
              let h = []
              let m = 0
              let totals = {}
              Object.entries(data['tables'][0].data).forEach(k => {
                let sum = Object.values(k[1]).reduce((a, b) => a + b)
                if (sum > m) m = sum
                k[1]['group'] = k[0]
                if (k[0] != "None")
                  h.push(k[1])
                Object.entries(k[1]).forEach(l => {
                  totals[l[0]] = ((totals[l[0]]) ? totals[l[0]] : 0) + l[1]
                })
              })
              let domain: any = 100
              let t = Object.entries(data['tables'][0]['row_totals']).filter(rt => rt[0] != "None").map(rt => rt[1]).sort()
              if (t.length) {
                domain = t.pop()
              }
              let subgroups = data['col_labels'].map(k => k.key).sort((a, b) => totals[b] - totals[a]) // field value
              let groups = data['row_labels'].map(k => k.key) //interval
              const margin_bar = { top: 10, right: 30, bottom: 20, left: 50 },
                width_bar = (h.length * 100) - margin_bar.left - margin_bar.right,
                height_bar = 400 - margin_bar.top - margin_bar.bottom;
              d3.select("#interval").select("svg").remove()
              const svg_bar = d3.select("#interval")
                .append("svg")
                .attr("width", width_bar + margin_bar.left + margin_bar.right)
                .attr("height", height_bar + margin_bar.top + margin_bar.bottom)
                .append("g")
                .attr("transform", `translate(${margin_bar.left},${margin_bar.top})`);
              let x = d3.scaleBand()
                .domain(groups)
                .range([0, width_bar])
                .padding(0.2)
              svg_bar.append("g")
                .attr("transform", `translate(0, ${height_bar})`)
                .call(d3.axisBottom(x).tickSizeOuter(0).tickFormat(hg => {
                  if (parameters['row_period_type'] == 'day_of_week') {
                    return this.weekdays[parseInt(hg) - 1]
                  } else {
                    if (parameters['row_period_type'] == 'month') {
                      let my = hg.match(/\((\d+), (\d+)\)/)
                      return `${this.monthnames[my[2]]} ${my[1]}`
                    } else {
                      if (parameters['row_period_type'] == 'week') {
                        let my = hg.match(/\((\d+), (\d+)\)/)
                        return `${my[2]} / ${my[1]}`
                      } else {
                        if (parameters['row_period_type'] == 'day') {
                          let myd = hg.match(/\((\d+), (\d+), (\d+)\)/)
                          let d = new Date(parseInt(myd[1]), parseInt(myd[2]) - 1, parseInt(myd[3]))
                          return d.toLocaleDateString(this.locale)
                        }
                      }
                    }
                    return hg
                  }
                }));
              let y = d3.scaleLinear()
                .domain([0, domain])
                .range([height_bar, 0]);
              svg_bar.append("g")
                .call(d3.axisLeft(y));
              const color = d3.scaleOrdinal()
                .domain(subgroups)
                .range(this.palette.map(p => parseInt(p, 16)))
              //stack the data? --> stack per subgroup
              const stackedData = d3.stack()
                .keys(subgroups)
                (h)

              svg_bar.append("g")
                .selectAll("g")
                // Enter in the stack data = loop key per key = group per group
                .data(stackedData)
                .join("g")
                .attr("fill", d => `#${Math.round(parseFloat(color(d.key).toString())).toString(16)}`)
                .selectAll("rect")
                // enter a second time = loop subgroup per subgroup to add all rectangles
                .data(d => d)
                .join("rect")
                .attr("x", d => x(d.data.group.toString()))
                .attr("y", d => y(d[1]))
                .attr("height", d => y(d[0]) - y(d[1]))
                .attr("width", x.bandwidth())
              d3.select("#interval_legend").select("svg").remove()
              const svg_bar_legend = d3.select("#interval_legend")
                .append("svg")
                .attr("width", 500)
                .attr("height", 100 * subgroups.length)
                .append("g")
              svg_bar_legend.selectAll("mydots").data(subgroups).enter().append("circle")
                .attr("cx", 100)
                .attr("cy", function (d, i) { return 13 + i * 25 })
                .attr("r", 7)
                .style("fill", d => `#${Math.round(parseFloat(color(d.toString()).toString())).toString(16)}`)
              svg_bar_legend.selectAll("mydots").data(subgroups).enter().append("text")
                .attr("x", 120)
                .attr("y", function (d, i) { return 13 + i * 25 }) // 13 is where the first dot appears. 25 is the distance between dots
                .text(function (d) { return ts.instant(d.toString()) })
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")

            }, error: err => {
              console.log(err)
              this.spinner.hide()
            }
          })
        }
        break
      case 3: //pieChart        
        const p_margin_bar = { top: 10, right: 10, bottom: 20, left: 10 },
          p_width_bar = 1200,
          p_height_bar = 900

        let parameters_pizza = this.filter
        if (!this.barChart['field']) {
          return
        }
        this.spinner.show()
        parameters_pizza['row_period_type'] = 'all'
        parameters_pizza['col_choices_path'] = this.barChart['field']
        parameters_pizza['relate'] = this.barChart['field'] // the total count of related
        this.recordService.getCrossTabs(this.recordSchema['record_type'], parameters_pizza).pipe(first()).subscribe({
          next: data => {
            $("#pizza").html('')
            this.spinner.hide()
            let h = []
            let m = 0
            var p_data: SimpleDataModel[] = Object.entries(data['tables'][0].data["0"]).filter((k => k[1] != '0'))
              .map(k => { return { "name": ts.instant(k[0]), "value": k[1].toString() } }).sort((a, b) => { return (parseInt(a.value) > parseInt(b.value)) ? 1 : -1 })
            let enablePolylines = false
            let isPercentage = false
            var radius = Math.min(p_width_bar, p_height_bar) / 2 - p_margin_bar.top
            var svg = d3
              .select("#pizza")
              .append("svg")
              .attr("viewBox", `0 0 ${p_width_bar} ${p_height_bar}`)
              .append("g")
              .attr(
                "transform",
                "translate(" + p_width_bar / 2 + "," + p_height_bar / 2 + ")"
              );
            const pie = d3.pie<any>().value((d: any) => Number(d.value));
            const data_ready = pie(p_data);

            let hue = 0
            let s = 0.65
            let l = 0.5
            let colorRange = []
            while (colorRange.length < p_data.length) {
              colorRange.push(this.rgbToHex(this.hslToRgb(hue, s, l)))
              hue += 0.375
              hue = hue % 1
              s *= 0.95
              l += ((1 - l) * .05)
            }
            colorRange.reverse()
            this.palette = colorRange
            let outerArc = d3
              .arc()
              .innerRadius(radius * 0.9)
              .outerRadius(radius * 0.9)
            let arc = d3
              .arc()
              .innerRadius(radius * 0.5)
              .outerRadius(radius * 0.8);
            let colors = d3
              .scaleOrdinal()
              .domain(p_data.map(d => d.value.toString()))
              .range(
                this.palette.map(p => `#${p}`)
              )
            let ark: any = d3
              .arc()
              .innerRadius(0)
              .outerRadius(radius)

            svg
              .selectAll("pieces")
              .data(data_ready)
              .enter()
              .append("path")
              .attr(
                "d",
                ark
              )
              .attr("fill", (d, i) => (d.data.color ? d.data.color : colors(i.toString())))
              .attr("stroke", "#ffffff")
              .style("stroke-width", "1px")

            const labelLocation = d3
              .arc()
              .innerRadius(radius / 2)
              .outerRadius(radius);
            let dy = 0;
            let index = 0;
            svg
              .selectAll("pieces")
              .data(pie(p_data))
              .enter()
              .append("text")
              .text(d => {
                if (
                  ((d.endAngle - d.startAngle) / (2 * Math.PI)) * 100 > 5 ||
                  enablePolylines
                ) {
                  return (
                    d.data.name +
                    " (" +
                    d.data.value +
                    (isPercentage ? "%" : "") +
                    ")"
                  );
                }
              })
              .attr("transform", d => { let e: any = d; return "translate(" + labelLocation.centroid(e) + ")" })
              .style("text-anchor", "middle")
              .style("font-size", 22)
              .attr("fill", "#333333");

          }, error: err => {
            console.log(err)
            this.spinner.hide()
          }
        })
        break;
      case 4: // treemap
        const t_margin_bar = { top: 0, right: 50, bottom: 0, left: 50 },
          t_width_bar = 1100,
          t_height_bar = 600
        let parameters_treemap = this.filter
        if (!this.barChart['field']) {
          return
        }
        this.spinner.show()

        parameters_treemap['col_choices_path'] = this.barChart['field']
        if (this.barChart['parent_field']) {
          parameters_treemap['row_choices_path'] = this.barChart['parent_field']
        } else {
          parameters_treemap['row_period_type'] = 'all'
        }
        parameters_treemap['relate'] = this.barChart['field'] // the total count of related



        this.recordService.getCrossTabs(this.recordSchema['record_type'], parameters_treemap).pipe(first()).subscribe({
          next: data => {
            $("#treemap").html('')
            var svg = d3.select("#treemap")
              .append("svg")
              .attr("width", t_width_bar + t_margin_bar.left + t_margin_bar.right)
              .attr("height", t_height_bar + t_margin_bar.top + t_margin_bar.bottom)
              .append("g")
              .attr("transform",
                `translate(${t_margin_bar.left}, ${t_margin_bar.top})`);
            let du = []
            if (this.barChart['parent_field']) {
              Object.entries(data['tables'][0]['data']).forEach(col => {
                du.push({
                  'name': col[0],
                  'parent': 'all',
                  'value': ''
                })
                Object.entries(col[1]).forEach(row => {
                  if (row[1] > 0) {
                    du.push({
                      'name': row[0],
                      'value': row[1],
                      'parent': col[0]
                    })
                  }
                })
              }

              )
            } else {
              du = Object.entries(data['tables'][0]['data'][0]).filter(k => {
                return k[1] as number > 0
              }).map(k => {
                return {
                  'name': ts.instant(k[0]),
                  'value': k[1],
                  'parent': 'all'
                }
              })
            }
            du.push({ 'name': 'all', 'parent': '', 'value': '' })

            // prepare a color scale
            const color = d3.scaleOrdinal()
              .domain(["boss1", "boss2", "boss3"])
              .range(["#FDFBED",
                "#f6edb1",
                "#f7da22",
                "#ecbe1d",
                "#e77124",
                "#d54927",
                "#cf3a27",
                "#a33936",
                "#7f182a",
                "#68101a",
              ])

            // And a opacity scale
            const opacity = d3.scaleLinear()
              .domain([10, 30])
              .range([.5, 1])
            const root = d3.stratify()
              .id(function (d) {
                return ts.instant(d["name"]);
              })   // Name of the entity (column name is name in csv)
              .parentId(function (d) {
                return d['parent'];
              })   // Name of the parent (column name is parent in csv)
              (du);
            root.sum(function (d) { return +d['value'] })   // Compute the numeric value for each entity

            // Then d3.treemap computes the position of each element of the hierarchy
            // The coordinates are added to the root object above
            d3.treemap()
              .size([t_width_bar, t_height_bar])
              .paddingTop(28)
              .paddingRight(7)
              .paddingInner(3)
              (root);

            // use this information to add rectangles:
            svg
              .selectAll("rect")
              .data(root.leaves())
              .join("rect")
              .attr('x', function (d) { return d['x0']; })
              .attr('y', function (d) { return d['y0']; })
              .attr('width', function (d) { return d['x1'] - d['x0']; })
              .attr('height', function (d) { return d['y1'] - d['y0']; })
              .attr("fill", d => `${color(d.data['name'])}`)
              .style("stroke", "black")
              ;


            // and to add the text labels
            svg
              .selectAll("text")
              .data(root.leaves())
              .join("text")
              .attr("x", function (d) { return d['x0'] + 10 })    // +10 to adjust position (more right)
              .attr("y", function (d) { return d['y0'] + 20 })    // +20 to adjust position (lower)
              .text(function (d) { return d.data['name'] })
              .attr("font-size", "15px")
              .attr("fill", "#ccc")

            // Add title for the 3 groups
            if (this.barChart['parent_field']) {
              svg
                .selectAll("titles")
                .data(root.descendants().filter(function (d) { return d.depth == 1 }))
                .enter()
                .append("text")
                .attr("x", function (d) { return d['x0'] })
                .attr("y", function (d) { return d['y0'] + 21 })
                .text(function (d) { return d.data['name'] })
                .attr("font-size", "19px")
                .attr("fill", d => `${color(d.data['name'])}`)
            }
            const swg = d3.select(this.swatchContainer.nativeElement);
            swg.attr("width", 1000)
            const swatchWidth = 20
            const swatchHeight = 20
            //const textWidth = 30
            swg.selectAll('*').remove();

            const keys = root.descendants().map((e) => e.data['name']).filter((e) => e != 'all');
            if (keys.length) {
              const textWidth = Math.max(...keys.map((w: string) => w.length)) * 10
              swg.attr('width', keys.length * (swatchWidth + textWidth))
                .attr('height', swatchHeight);

              swg.selectAll('rect')
                .data(keys)
                .enter()
                .append('rect')
                .attr('x', (d, i) => 20 + i * (swatchWidth + textWidth))
                .attr('y', 0)
                .attr('width', swatchWidth)
                .attr('height', swatchHeight)
                .style('fill', d => `${color(d)}`)

              swg.selectAll('mydots')
                .data(keys)
                .enter()
                .append('text')
                .attr("x", (d, i) => 22 + swatchWidth + i * (swatchWidth + textWidth))
                .attr('y', swatchHeight / 2)
                .style('fill', (d) => "#111111")
                .text(d => d)
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
            }
            this.spinner.hide()
          }, error: err => {
            console.log(err)
            this.spinner.hide()
          }

        })



    }
  }
  activeIdChange(e: any) {
    this.loadChart(e.nextId)
  }
  hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = this.hueToRgb(p, q, h + 1 / 3);
      g = this.hueToRgb(p, q, h);
      b = this.hueToRgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
  hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  rgbToHex(rgb) {
    return this.componentToHex(rgb[0]) + this.componentToHex(rgb[1]) + this.componentToHex(rgb[2]);
  }

}
export interface SimpleDataModel {
  name: string;
  value: string;
  color?: string;
}