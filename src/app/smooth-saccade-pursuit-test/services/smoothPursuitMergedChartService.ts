import { Injectable } from '@angular/core';
import { CHART_TYPE } from 'src/app/saccade-memory-test/constants/types';
import { CHART_SUBTYPE, ICamMessage, IChartData, IRangeTestResult, ISaccadeResult, SeparatedFrames } from 'src/app/models/charts.model';
import { MovementComputingService } from 'src/app/saccade-memory-test/services/computing/movementComputingService';
import { MemoryParsingService } from 'src/app/saccade-memory-test/services/memoryParsingService';
import { ChartService } from 'src/app/services/chartService';
import { VelocitySaccadeAnalyticsService } from './computing/velocitySaccadeAnalyticsService';
import { VelocityVerticalComputingService } from './computing/velocityComputingService';
import { SmoothPursuitParsingServiceService } from './smoothPursuitParsingService';
import * as d3 from 'd3';

@Injectable()
export class SmoothPursuitMergedChartServiceService extends ChartService {

    constructor(private smoothParsingService: SmoothPursuitParsingServiceService,
        private velocityService: VelocityVerticalComputingService,
        private parsingService: MemoryParsingService,
        private saccadeAnalyticsService: VelocitySaccadeAnalyticsService) {
        super();
    }

    public addData(frames: ICamMessage[]): Promise<ICamMessage[]> {
        return new Promise((resolve) => {
            const parsedFrames = this.parsingService.parseFrames(frames);
            const tunedFrames = this.smoothParsingService.removeZeroElements(parsedFrames);

            setTimeout(() => {
                resolve(tunedFrames);
            }, 100);
        });
    }

    public setCamData(frames: ICamMessage[]): IChartData {
        let parsedFrames = this.smoothParsingService.parseFrames(frames);
        parsedFrames = this.smoothParsingService.removeZeroElements(parsedFrames);

        const separatedFrames = this.smoothParsingService.separateFrames([ ...parsedFrames ]);

        this.smoothParsingService.tuneVerticalFrames(separatedFrames);

        this.smoothParsingService.tuneHorizontalFrames(separatedFrames);

        const verticalArray = this.velocityService.computeVelocityData([ ...separatedFrames.verticalFrames ]);
        const horizontalArray = this.velocityService.computeVelocityData([ ...separatedFrames.horizontalFrames ]);

        const verticalTestResults = this.saccadeAnalyticsService
            .computeTestResults([ ...verticalArray ], CHART_SUBTYPE.VERTICAL);
        const horizontalTestResults = this.saccadeAnalyticsService
            .computeTestResults([ ...horizontalArray ], CHART_SUBTYPE.HORIZONTAL);

        // Have order a value?
        const testResults = verticalTestResults.concat(horizontalTestResults);

        const chartData: IChartData = {
            framesData: parsedFrames,
            verticalVelocityFrames: verticalArray,
            horizontalVelocityFrames: horizontalArray,
            // pursuitVerticalTestResults: verticalTestResults,
            // pursuitHorizontalTestResults: horizontalTestResults,
            pursuitSaccadestestResults: testResults
        };

        return chartData;
    }

    public export() {
        throw new Error('Method not implemented.');
    }

    public clearData(): void {
        d3.selectAll('#velocityChartPoints').selectChildren().remove();
		d3.select('#chartPoints').selectChildren().remove();
        d3.select('#horizontalChartPoints').selectChildren().remove();
        d3.select('#realTimeChartPoints').selectChildren().remove();
        d3.select('#movementChartPoints').selectChildren().remove();
    }
}
