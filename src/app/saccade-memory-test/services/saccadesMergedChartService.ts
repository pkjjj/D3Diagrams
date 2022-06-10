import { Injectable } from '@angular/core';
import { ICamMessage, IChartData } from '../models/charts.model';
import { ChartService } from '../../services/chartService';
import { CHART_TYPE } from '../constants/types';
import { MovementComputingService } from './movementComputingService';
import { VelocityComputingService } from './velocityComputingService';
import { MemoryParsingService } from './memoryParsingService';
@Injectable()
export class SaccadesMergedChartService extends ChartService {

    constructor(private parsingService: MemoryParsingService,
      private movementComputingService: MovementComputingService,
      private velocityComputingService: VelocityComputingService) {
        super();
    }

    public async addData(frames: ICamMessage[]): Promise<ICamMessage[]> {
        return new Promise((resolve, reject) => {
            let parsedFrames = this.parsingService.parseFrames(frames);
            parsedFrames = this.parsingService.getDotsDegreeByIndex(parsedFrames);
            
            setTimeout(() => {
                resolve(parsedFrames);
            }, 100);
        });
    }

    public setCamData(frames: ICamMessage[], chartType?: CHART_TYPE): IChartData | ICamMessage[] {
        let parsedFrames = this.parsingService.parseFrames(frames);
        parsedFrames = this.parsingService.getDotsDegreeByIndex(parsedFrames);

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
