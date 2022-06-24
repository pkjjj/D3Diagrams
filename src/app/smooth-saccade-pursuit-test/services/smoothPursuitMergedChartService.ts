import { Injectable } from '@angular/core';
import { CHART_TYPE } from 'src/app/saccade-memory-test/constants/types';
import { CHART_SUBTYPE, ICamMessage, IChartData, IPursuitSaccadeTestResults, IRangeTestResult, ISaccadeResult, SeparatedFrames } from 'src/app/models/charts.model';
import { MovementComputingService } from 'src/app/saccade-memory-test/services/computing/movementComputingService';
import { MemoryParsingService } from 'src/app/saccade-memory-test/services/memoryParsingService';
import { ChartService } from 'src/app/services/chartService';
import { VelocitySaccadeAnalyticsService } from './computing/velocitySaccadeAnalyticsService';
import { VelocityVerticalComputingService } from './computing/velocityComputingService';
import { SmoothPursuitParsingServiceService } from './smoothPursuitParsingService';
import * as d3 from 'd3';

@Injectable()
export class SmoothPursuitMergedChartServiceService extends ChartService {

    private countAccept: number;
    private countErrorPatient: number;
    private countErrorSystem: number;

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
        const parsedFrames = this.smoothParsingService.parseFrames(frames);
        const outputFrames = this.smoothParsingService.removeZeroElements([ ...parsedFrames ]);

        const separatedTestResultsFrames = this.smoothParsingService.separateFrames([ ...parsedFrames ]);
        const separatedFrames = this.smoothParsingService.separateFrames([ ...outputFrames ]);

        this.smoothParsingService.tuneVerticalFrames(separatedFrames);
        this.smoothParsingService.tuneHorizontalFrames(separatedFrames);

        this.smoothParsingService.tuneVerticalFrames(separatedTestResultsFrames);
        this.smoothParsingService.tuneHorizontalFrames(separatedTestResultsFrames);

        const verticalArray = this.velocityService.computeVelocityData([ ...separatedFrames.verticalFrames ]);
        const horizontalArray = this.velocityService.computeVelocityData([ ...separatedFrames.horizontalFrames ]);

        const verticalTestFrames = this.velocityService
            .computeVelocityData([ ...separatedTestResultsFrames.verticalFrames ]);
        const horizontalTestFrames = this.velocityService
            .computeVelocityData([ ...separatedTestResultsFrames.horizontalFrames ]);

        const verticalTestResults = this.saccadeAnalyticsService
            .computeTestResults([ ...verticalTestFrames ], CHART_SUBTYPE.VERTICAL);
        const horizontalTestResults = this.saccadeAnalyticsService
            .computeTestResults([ ...horizontalTestFrames ], CHART_SUBTYPE.HORIZONTAL);

        const { accept, errorPatient, errorSystem} = this.calculateResults(horizontalTestResults, verticalTestResults);
        
        // Have order a value?
        const rangeTestResults = verticalTestResults.concat(horizontalTestResults);

        const testResults: IPursuitSaccadeTestResults = {
            rangeTestResults: rangeTestResults,
            accept: accept,
            errorPatient: errorPatient,
            errorSystem: errorSystem
        } 

        const chartData: IChartData = {
            framesData: outputFrames,
            verticalVelocityFrames: verticalArray,
            horizontalVelocityFrames: horizontalArray,
            pursuitSaccadesTestResults: testResults
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

    private calculateResults(horizontalTestResults: IRangeTestResult[], verticalTestResults: IRangeTestResult[]):
    { accept: number, errorPatient: number, errorSystem: number } {
        let countAccept = 0;
        let countErrorPatient = 0;
        let countErrorSystem = 0;

        horizontalTestResults.forEach(interval => {
            countAccept += interval.accept;
            countErrorPatient += interval.errorPatient;
            countErrorSystem += interval.errorSystem;
        });

        verticalTestResults.forEach(interval => {
            countAccept += interval.accept;
            countErrorPatient += interval.errorPatient;
            countErrorSystem += interval.errorSystem;
        });

        return { accept: countAccept, errorPatient: countErrorPatient, errorSystem: countErrorSystem }
    }
}
