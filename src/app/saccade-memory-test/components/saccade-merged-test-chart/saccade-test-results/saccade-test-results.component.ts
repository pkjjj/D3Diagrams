import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ITestResults } from 'src/app/saccade-memory-test/models/charts.model';

@Component({
  selector: 'app-saccade-test-results',
  templateUrl: './saccade-test-results.component.html',
  styleUrls: ['./saccade-test-results.component.css']
})
export class SaccadeTestResultsComponent implements OnInit, OnChanges {

    @Input() public testResults: ITestResults;
    public noReponseErrorsCount: string;
    public inhibitoryErrorsCount: string;
    public correctResponseCount: string;
    public averageLatency: number;

    constructor() { }

    ngOnInit() {
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.noReponseErrorsCount = this.testResults.noReponseError + '/' + this.testResults.totalCount;
        this.inhibitoryErrorsCount = this.testResults.inhibitoryError + '/' + this.testResults.totalCount;
        this.correctResponseCount = this.testResults.correctResponseCount + '/' + this.testResults.totalCount;
        this.averageLatency = Math.round(this.testResults.averageLatency * 1000);
    }

}
