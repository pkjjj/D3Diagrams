import { Component, Input, OnChanges } from '@angular/core';
import { ITestResults } from 'src/app/models/charts.model';

@Component({
  selector: 'app-saccade-test-results',
  templateUrl: './saccade-test-results.component.html',
  styleUrls: ['./saccade-test-results.component.css']
})
export class SaccadeTestResultsComponent implements OnChanges {

    @Input() public testResults: ITestResults;
    public noReponseErrorsCount: string;
    public inhibitoryErrorsCount: string;
    public correctResponseCount: string;
    public averageLatency: number;

    ngOnChanges(): void {
        this.noReponseErrorsCount = this.testResults.noReponseError.toString() +
            '/' + this.testResults.totalCount.toString();
        this.inhibitoryErrorsCount = this.testResults.inhibitoryError.toString() +
            '/' + this.testResults.totalCount.toString();
        this.correctResponseCount = this.testResults.correctResponseCount.toString() +
            '/' + this.testResults.totalCount.toString();
        this.averageLatency = Math.round(this.testResults.averageLatency * 1000);
    }

}
