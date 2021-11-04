import { Component, OnInit, Input } from '@angular/core';
import { RecordService } from './../record.service'
import { first } from 'rxjs/operators';
import { inputCursor } from 'ngx-bootstrap-icons';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {
  @Input() recordSchema: object
  @Input() reportParameters: object
  @Input() report: object
  public colPath:string
  @Input() config:any
  @Input() boundaries:any[]
  path:object={}
  locale:string
  timezone:any
  constructor(
    private recordService: RecordService
  ) { }

  ngOnInit(): void {

    this.timezone=(new Date()).getTimezoneOffset()
    this.locale=localStorage.getItem("Language") || "en"
    /* 
    (['col','row']).forEach(tab=>{
      if(this.reportParameters[`${tab}_choices_path`]){
        let p=this.reportParameters[`${tab}_choices_path`]
        this.path[tab]=p.match(/[^,]+,[^,]+,(.+)$/).pop()
      }
      if(this.reportParameters[`${tab}_period_type`]){
        this.path[tab]=this.reportParameters[`${tab}_period_type`]
      }
      if(this.reportParameters[`${tab}_boundary_id`]){
        let boundary=this.boundaries.filter(bu=>bu['uuid']==this.reportParameters[`${tab}_boundary_id`]).pop()
        this.path[tab]=boundary['label']
      }
      
    })
    this.report=null
    if (this.reportParameters) {
      this.recordService.getCrossTabs(this.recordSchema["record_type"], this.reportParameters).pipe(first()).subscribe(
        crosstabs => {
          this.report = crosstabs
        }
      )
    } */
  }

}
