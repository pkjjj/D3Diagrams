import { Injectable } from '@angular/core';
import { ICamMessage, IChartData } from '../models/charts.model';
import { ChartService } from './chartService';
import { CHART_TYPE, IPoint } from '../constants/types';
import { MovementComputingService } from './movementComputingService';
import { VelocityComputingService } from './velocityComputingService';
import { ParsingService } from './parsingService';
import { FRAMES_PER_SECOND } from '../constants/velocity-chart';
@Injectable()
export class SaccadesMergedChartService extends ChartService {

    constructor(private parsingService: ParsingService,
      private movementComputingService: MovementComputingService,
      private velocityComputingService: VelocityComputingService) {
        super();
    }

    public addData(frames: ICamMessage[]): Promise<ICamMessage[]> {
        return new Promise((resolve, reject) => {
            const parsedFrames = this.parsingService.parseFrames(frames);

            resolve(parsedFrames);
        });
    }

    public setCamData(frames: ICamMessage[], chartType?: CHART_TYPE): IChartData | IPoint[] | ICamMessage[] {
        const parsedFrames = this.parsingService.parseFrames(frames);

        if (typeof chartType === 'undefined') {
            return parsedFrames;
        }
        if (chartType === CHART_TYPE.MOVEMENT) {
            return this.movementComputingService.getChartMovementData([ ...parsedFrames ]);
        }
        if (chartType === CHART_TYPE.VELOCITY) {
            return this.velocityComputingService.computeVelocityDataByFramesCount([ ...parsedFrames ]);
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
