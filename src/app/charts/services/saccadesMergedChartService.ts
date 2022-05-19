import { Injectable } from '@angular/core';
import { ICamMessage } from '../models/charts.model';
import { ChartService } from './chartService';
import * as d3 from 'd3';
import * as d3Scale from 'd3';
import * as d3Shape from 'd3';
import * as d3Array from 'd3';
import * as d3Axis from 'd3';

@Injectable()
export class SaccadesMergedChartService extends ChartService {
    constructor() {
        super();
    }
    public addData(frames: ICamMessage[]): Promise<void> {
        
        throw new Error('Method not implemented.');
    }
    public setCamData(frames: ICamMessage[]): void {
        throw new Error('Method not implemented.');
    }
    public export() {
        throw new Error('Method not implemented.');
    }
    public clearData(): void {
        throw new Error('Method not implemented.');
    }
}
