import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { Subscription } from 'rxjs';
import { IChartData, ICamMessage, ITestResults } from 'src/app/models/charts.model';
import { RequestService } from 'src/app/shared/requestService';
import { JsonService } from 'src/app/shared/jsonService';
import { SmoothPursuitMergedChartServiceService } from '../../services/smoothPursuitMergedChartService';
import { SmoothPursuitParsingServiceService } from '../../services/smoothPursuitParsingService';
import { SmoothSaccadeHoryzontalChartComponent } from './smooth-saccade-horyzontal-chart/smooth-saccade-horyzontal-chart.component';
import { SmoothSaccadeMovementChartComponent } from './smooth-saccade-movement-chart/smooth-saccade-movement-chart.component';
import { SmoothSaccadeVelocityChartComponent } from './smooth-saccade-velocity-chart/smooth-saccade-velocity-chart.component';
import { SmoothSaccadeVerticalChartComponent } from './smooth-saccade-vertical-chart/smooth-saccade-vertical-chart.component';

@Component({
  selector: 'app-smooth-saccade-merged-test-chart',
  templateUrl: './smooth-saccade-merged-test-chart.component.html'
})
export class SmoothSaccadeMergedTestChartComponent implements OnInit, OnDestroy {

    @ViewChild('horizontalVelocityElement') horizontalVelocityChild: SmoothSaccadeVelocityChartComponent;
    @ViewChild('verticalVelocityElement') verticalVelocityChild: SmoothSaccadeVelocityChartComponent;
    @ViewChild('verticalMovementElement') verticalMovementChild: SmoothSaccadeVerticalChartComponent;
    @ViewChild('horizontalMovementElement') horizontalMovementChild: SmoothSaccadeHoryzontalChartComponent;
    @ViewChild('movementElement') movementChild: SmoothSaccadeMovementChartComponent;

    public testResults: ITestResults;
    private subscriptions: Subscription[] = [];
    private frames: ICamMessage[];
    private velocityData: IChartData;
    private clonedFrames: ICamMessage[];

    constructor(private chartService: SmoothPursuitMergedChartServiceService, private requestService: RequestService,
      private sharedService: JsonService,
      private smoothParsingService: SmoothPursuitParsingServiceService) {}

    ngOnInit() {
        this.subscriptions.push(this.requestService.getSmoothPursuitData()
          .subscribe(data => {
              this.frames = this.sharedService.parseStringToJson(data) as ICamMessage[];
        }));
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    public buildRecordedCharts(): void {
        if (this.frames !== null) {
            const parsedFrames = this.smoothParsingService.parseFrames(this.frames);

			this.velocityData = this.chartService.setCamData([ ...parsedFrames ]);

            const verticalFrames = this.smoothParsingService.removeHorizontalFrames([ ...parsedFrames ]);
            const horizontalFrames = this.smoothParsingService.removeVerticalFrames([ ...parsedFrames ]);

            const verticalChartData: IChartData = { framesData: verticalFrames };
            const horizontalChartData: IChartData = { framesData: horizontalFrames };
            const movementChartData: IChartData = { framesData: [ ...parsedFrames ] };

            this.verticalVelocityChild.buildRecordedChart(this.velocityData.verticalVelocityFrames, this.velocityData.pursuitVerticalTestResults);
            this.horizontalVelocityChild.buildRecordedChart(this.velocityData.horizontalVelocityFrames, this.velocityData.pursuitHorizontalTestResults);
            this.verticalMovementChild.buildRecordedChart(verticalChartData);
            this.horizontalMovementChild.buildRecordedChart(horizontalChartData);
            this.movementChild.buildRecordedChart(movementChartData);
        }
    }

    public clearCharts(): void {
		this.chartService.clearData();
		this.testResults = null;
    }
}
