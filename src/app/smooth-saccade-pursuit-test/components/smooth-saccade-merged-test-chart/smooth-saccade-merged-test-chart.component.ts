import { Component, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { Subscription } from 'rxjs';
import { CHART_TYPE } from 'src/app/saccade-memory-test/constants/types';
import { IChartData, ICamMessage, ITestResults } from 'src/app/saccade-memory-test/models/charts.model';
import { RequestService } from 'src/app/saccade-memory-test/services/request.service';
import { SaccadesMergedChartService } from 'src/app/saccade-memory-test/services/saccadesMergedChartService';
import { SharedService } from 'src/app/saccade-memory-test/services/shared.service';
import { SmoothPursuitMergedChartServiceService } from '../../services/smoothPursuitMergedChartService.service';
import { SmoothPursuitParsingServiceService } from '../../services/smoothPursuitParsingService.service';
import { SmoothSaccadeHoryzontalChartComponent } from './smooth-saccade-horyzontal-chart/smooth-saccade-horyzontal-chart.component';
import { SmoothSaccadeMovementChartComponent } from './smooth-saccade-movement-chart/smooth-saccade-movement-chart.component';
import { SmoothSaccadeRealTimeChartComponent } from './smooth-saccade-real-time-chart/smooth-saccade-real-time-chart.component';
import { SmoothSaccadeVelocityChartComponent } from './smooth-saccade-velocity-chart/smooth-saccade-velocity-chart.component';
import { SmoothSaccadeVerticalChartComponent } from './smooth-saccade-vertical-chart/smooth-saccade-vertical-chart.component';

@Component({
  selector: 'app-smooth-saccade-merged-test-chart',
  templateUrl: './smooth-saccade-merged-test-chart.component.html'
})
export class SmoothSaccadeMergedTestChartComponent implements OnInit {

    @ViewChild('velocityElement') velocityChild: SmoothSaccadeVelocityChartComponent;
    @ViewChild('verticalMovementElement') verticalMovementChild: SmoothSaccadeVerticalChartComponent;
    @ViewChild('horizontalMovementElement') horizontalMovementChild: SmoothSaccadeHoryzontalChartComponent;
    @ViewChild('movementElement') movementChild: SmoothSaccadeMovementChartComponent;
    // @ViewChild('realTimeElement') realTimeChild: SmoothSaccadeRealTimeChartComponent;

    public testResults: ITestResults;
    private subscriptions: Subscription[] = [];
    private frames: ICamMessage[];
    private velocityData: IChartData;
    private movementData: IChartData;
    private clonedFrames: ICamMessage[];

    constructor(private chartService: SmoothPursuitMergedChartServiceService, private requestService: RequestService,
      private sharedService: SharedService,
      private smoothParsingService: SmoothPursuitParsingServiceService) {}

    ngOnInit() {
        this.requestService.getSmoothPursuitData()
          .subscribe(data => {
              this.frames = this.sharedService.parseStringToJson(data) as ICamMessage[];
              this.clonedFrames = [ ...this.frames ];
        });
    }

    public buildRecordedCharts(): void {
        if (this.frames !== null) {
			this.velocityData = this.chartService.setCamData([ ...this.clonedFrames ],
			CHART_TYPE.VELOCITY);
			this.velocityChild.buildRecordedChart(this.velocityData);
            console.log('asdas')

            let parsedFrames = this.smoothParsingService.parseFrames(this.frames);
            // parsedFrames = this.smoothParsingService.removeZeroElements(parsedFrames);

            const verticalFrames = this.smoothParsingService.removeHorizontalFrames([ ...parsedFrames ]);
            const horizontalFrames = this.smoothParsingService.removeVerticalFrames([ ...parsedFrames ]);

            const verticalChartData: IChartData = { framesData: verticalFrames };
            const horizontalChartData: IChartData = { framesData: horizontalFrames };
            const movementChartData: IChartData = { framesData: [ ...parsedFrames ] };

            this.verticalMovementChild.buildRecordedChart(verticalChartData);
            this.horizontalMovementChild.buildRecordedChart(horizontalChartData);
            this.movementChild.buildRecordedChart(movementChartData);

			// this.movementData = this.chartService.setCamData([ ...this.clonedFrames ],
			// CHART_TYPE.MOVEMENT);
			// this.movementData.testResults = this.velocityData.testResults;
			// this.verticalMovementElement.buildRecordedChart(this.movementData);

			// this.testResults = this.velocityData.testResults;
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
            this.verticalMovementChild.showDashedLines([ ...frames ]);
        }
        else if (!isChecked) {
            d3.selectAll('#velocityDashedLine').remove();
            d3.selectAll('#movementDashedLine').remove();
        }
    }
}
