import { Injectable } from '@angular/core';
import { ICamMessage, IChartData } from '../../models/charts.model';
import { ChartService } from '../../services/chartService';
import { CHART_TYPE } from '../constants/types';
import { MemoryParsingService } from './memoryParsingService';
import { MovementComputingService } from './computing/movementComputingService';
import { VelocityComputingService } from './computing/velocityComputingService';
import * as d3 from 'd3';
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
            return this.movementComputingService.computeChartData([ ...parsedFrames ]);
        }
        if (chartType === CHART_TYPE.VELOCITY) {
            return this.velocityComputingService.computeChartData([ ...parsedFrames ]);
        }

        return null;
    }

    public export() {
        throw new Error('Method not implemented.');
    }

    public clearData(): void {
        d3.select('#velocityChartPoints').selectChildren().remove();
        d3.select('#chartPoints').selectChildren().remove();
    }
}
