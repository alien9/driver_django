import { Component, OnInit, Input } from '@angular/core';
import { RecordService } from './../record.service'
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {
  @Input() recordSchema: object
  @Input() reportParameters: object
  public report: object
  public path:object={}
  public colPath:string
  constructor(
    private recordService: RecordService
  ) { }

  ngOnInit(): void {
    console.log("initializing report")
    let config = JSON.parse(localStorage.getItem('config') || '{}')
    (['col','row']).forEach(tab=>{
      if(this.reportParameters[`${tab}_choices_path`]){
        this.path[tab]=this.reportParameters[`${tab}_choices_path`]
      }
    })

    if (this.reportParameters) {
      this.recordService.getCrossTabs(this.recordSchema["record_type"], this.reportParameters).pipe(first()).subscribe(
        crosstabs => {
          this.report = crosstabs
        }
      )
    }
  }

}
