import { Component, OnInit, Input, OnChanges, ChangeDetectorRef, NgZone, SimpleChanges } from '@angular/core';
import { RecordService } from '../record.service'
import { first } from 'rxjs/operators';
import * as d3 from 'd3'
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
  active = 1
  toddow: any
  locale: string
  weekdays: object
  monthnames: object
  tip = 0
  barChart: object
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
    this.monthnames={}
    let d = new Date()
    d.setDate(1)
    for (let i = 0; i < 7; i++) {
      this.weekdays[d.getDay()] = d.toLocaleDateString(this.locale, { weekday: 'short' })
      d.setDate(d.getDate() + 1)
    }
    for (let i = 0; i < 12; i++) {
      d.setMonth(i)
      this.monthnames[i+1] = d.toLocaleDateString(this.locale, { month: 'short' })
    }
    this.loadChart(1)
  }
  ngOnChanges(changes: SimpleChanges) {
    this.loadChart(this.active)
  }
  loadChart(activeTab: any) {
    if (!this.filter) {
      this.filter = JSON.parse(localStorage.getItem("current_filter") || '{}')
    }
    this.filter['record_type'] = this.recordSchema['record_type']
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
                console.log("counting " + d.count)
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
                console.log(d)
                console.log(i)
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
          let ts = this.translateService
          parameters['row_period_type'] = this.barChart['interval']
          parameters['col_choices_path'] = this.barChart['field']
          parameters['relate'] = this.barChart['field'] // the total count of related
          this.recordService.getCrossTabs(this.recordSchema['record_type'], parameters).pipe(first()).subscribe({
            next: data => {
              this.spinner.hide()
              let h = []
              let m = 0
              Object.entries(data['tables'][0].data).forEach(k => {
                let sum = Object.values(k[1]).reduce((a, b) => a + b)
                if (sum > m) m = sum
                k[1]['group'] = k[0]
                h.push(k[1])
              })
              let subgroups = data['col_labels'].map(k => k.key) // field value
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
                    }else{
                      if(parameters['row_period_type'] == 'week'){
                        let my = hg.match(/\((\d+), (\d+)\)/)
                        return `${my[2]} / ${my[1]}`
                      }else{
                        if(parameters['row_period_type'] == 'day'){
                          let myd = hg.match(/\((\d+), (\d+), (\d+)\)/)
                          let d=new Date(parseInt(myd[1]), parseInt(myd[2])-1, parseInt(myd[3]))
                          return d.toLocaleDateString(this.locale)
                        }
                      }
                    }
                    return hg
                  }
                }));
              let y = d3.scaleLinear()
                .domain([0, m])
                .range([height_bar, 0]);
              svg_bar.append("g")
                .call(d3.axisLeft(y));
              const color = d3.scaleOrdinal()
                .domain(subgroups)
                .range([
                  parseInt('e41a1c', 16),
                  parseInt('377eb8', 16),
                  parseInt('4daf4a', 16),
                  parseInt('d55e00', 16),
                  parseInt('2db9c7', 16),
                  parseInt('9972b2', 16),
                  parseInt('c0d442', 16),
                  parseInt('449e73', 16),
                  parseInt('32e4cc', 16),
                  parseInt('e52a1d', 16),

                ])
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
                .attr("y", function (d, i) { return 13 + i * 25 }) // 100 is where the first dot appears. 25 is the distance between dots
                .text(function (d) { return ts.instant(d.toString()) })
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")

            }, error: err => {
              console.log(err)
              this.spinner.hide()
            }
          })
        }
        break;
    }
  }
  activeIdChange(e: any) {
    this.loadChart(e.nextId)
  }

}
