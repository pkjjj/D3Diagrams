import { Injectable } from '@angular/core';
import { CHART_TYPE } from 'src/app/saccade-memory-test/constants/types';
import { ICamMessage, IChartData } from 'src/app/saccade-memory-test/models/charts.model';
import { MemoryParsingService } from 'src/app/saccade-memory-test/services/memoryParsingService';
import { MovementComputingService } from 'src/app/saccade-memory-test/services/movementComputingService';
import { VelocityComputingService } from 'src/app/saccade-memory-test/services/velocityComputingService';
import { ChartService } from 'src/app/services/chartService';
import { SmoothPursuitParsingServiceService } from './smoothPursuitParsingService.service';
import { VelocityComputingSmoothSaccadeService } from './velocityComputingSmoothSaccadeService';
import { VelocityHorizontalComputingService } from './velocityHorizontalComputingService';
import { VelocityVerticalComputingService } from './velocityVerticalComputingService';

@Injectable()
export class SmoothPursuitMergedChartServiceService extends ChartService {

    constructor(private smoothParsingService: SmoothPursuitParsingServiceService,
        private velocityHorizontalService: VelocityHorizontalComputingService,
        private velocityVerticalService: VelocityVerticalComputingService,
        private movementComputingService: MovementComputingService,
        private parsingService: MemoryParsingService) {
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

    public setCamData(frames: ICamMessage[], chartType?: CHART_TYPE): IChartData {
        let parsedFrames = this.smoothParsingService.parseFrames(frames);
        parsedFrames = this.smoothParsingService.removeZeroElements(parsedFrames);
        // const smoothPursuitFrames = this.smoothParsingService.parseSmoothPursuitFrames(parsedFrames);

        if (typeof chartType === 'undefined') {
            // return parsedFrames;
        }
        if (chartType === CHART_TYPE.MOVEMENT) {
            return this.movementComputingService.getChartMovementData([ ...parsedFrames ]);
        }
        if (chartType === CHART_TYPE.VELOCITY) {
            const separatedFrames = this.velocityHorizontalService.separateFrames([ ...parsedFrames ]);
            const horizontalFrames = this.velocityHorizontalService.computeVelocityData(separatedFrames.horizontalFrames);
            const verticalFrames = this.velocityVerticalService.computeVelocityData(separatedFrames.verticalFrames);
            const velocityFrames = verticalFrames.concat(horizontalFrames);
            parsedFrames.forEach((frame, index) => {
                frame.pupilvelocity = velocityFrames[index];
                // console.log(frame.pupilvelocity)
            });
            const chartData: IChartData = { framesData: parsedFrames };
            return chartData;
        }

        return null;
    }

    public export() {
        throw new Error('Method not implemented.');
    }

    public clearData(): void {
        throw new Error('Method not implemented.');
    }
}
