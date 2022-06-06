import { AfterViewInit, Component, ElementRef, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { BehaviorSubject, first, Subscription } from 'rxjs';
import { IChartEdit } from '../../components/haploChart.component';
import { CHART_TYPE } from '../../constants/types';
import { ICamMessage, IChartData, ITestResults } from '../../models/charts.model';
import { ChartService } from '../../services/chartService';
import { RequestService } from '../../services/request.service';
import { SaccadesMergedChartService } from '../../services/saccadesMergedChartService';
import { SharedService } from '../../services/shared.service';
import { BulbicamChartComponent } from '../haploChart.component';
import { SaccadeMovementChartComponent } from './saccade-movement-chart/saccade-movement-chart.component';
import { SaccadeVelocityChartComponent } from './saccade-velocity-chart/saccade-velocity-chart.component';

@Component({
    selector: 'saccade-merged-test-chart',
    templateUrl: 'saccade-merged-test-chart.component.html',
    styleUrls: ['saccade-merged-test-chart.component.scss'],
})
export class SaccadeMergedBulbicamTestChartComponent extends BulbicamChartComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('velocityElement') velocityChild: SaccadeVelocityChartComponent;
    @ViewChild('movementElement') movementChild: SaccadeMovementChartComponent;

    public testResults: ITestResults;
    private subscriptions: Subscription[] = [];
    private frames: ICamMessage[];
    private velocityData: IChartData;
    private movementData: IChartData;
    private clonedFrames: ICamMessage[];

    constructor(private chartService: SaccadesMergedChartService, private requestService: RequestService,
      private sharedService: SharedService) {
        super();
    }

    ngOnInit(): void {
        this.requestService.getMemoryData()
          .subscribe(data => {
              this.frames = this.sharedService.parseStringToJson(data) as ICamMessage[];
              this.clonedFrames = [ ...this.frames ];
        });
    }

    ngAfterViewInit(): void {}

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    public buildRecordedCharts(): void {
        if (this.frames !== null) {
            this.velocityData = this.chartService.setCamData([ ...this.clonedFrames ],
              CHART_TYPE.VELOCITY) as IChartData;
            this.velocityChild.buildRecordedChart(this.velocityData);

            this.movementData = this.chartService.setCamData([ ...this.clonedFrames ],
              CHART_TYPE.MOVEMENT) as IChartData;
            this.movementData.testResults = this.velocityData.testResults;
            this.movementChild.buildRecordedChart(this.movementData);

            this.testResults = this.velocityData.testResults;
        }
    }

    public clearCharts(): void {
        d3.select('#velocityChartPoints').selectChildren().remove();
        d3.select('#chartPoints').selectChildren().remove();
        this.testResults = null;
    }

    public showVelocityOnMotionChart(event: Event) {
        const isChecked = (<HTMLInputElement>event.target).checked;

        if (isChecked) {
            const data = this.chartService.setCamData([ ...this.clonedFrames ], CHART_TYPE.VELOCITY) as IChartData;
            this.velocityChild.buildRecordedPointsOnMovementChart(data.framesData);
        }
        else {
            d3.select('#velocityline').remove();
        }
    }

    public showDashedLines(event: Event): void {
      const isChecked = (<HTMLInputElement>event.target).checked;
      const frames = this.chartService.setCamData([ ...this.clonedFrames]) as ICamMessage[];

      if (isChecked && frames !== null) {
          this.velocityChild.showDashedLines([ ...frames ]);
          this.movementChild.showDashedLines([ ...frames ]);
      }
      else if (!isChecked){
          d3.selectAll('#velocityDashedLine').remove();
          d3.selectAll('#movementDashedLine').remove();
      }
    }
    // функция для очистки данных перед загрузкой новых
    public clearData(): void {}
    // пока не парься
    public setEdits(edits: IChartEdit[]): void {}
    // функция для внесения данных частично (передача данных с кама в реальном времени)
    public async addData(frames: ICamMessage[]): Promise<void> {}
    // функция для внесения данных в полном объеме за раз (передача данных из БД)
    public setCamData(frames: ICamMessage[]): void {}
}
