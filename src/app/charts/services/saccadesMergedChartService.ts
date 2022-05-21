import { Injectable } from '@angular/core';
import { ICamMessage } from '../models/charts.model';
import { ChartService } from './chartService';
import * as d3 from 'd3';
import * as d3Scale from 'd3';
import * as d3Shape from 'd3';
import * as d3Array from 'd3';
import * as d3Axis from 'd3';
import { SharedService } from './shared.service';
import { LEFT_EYE, RIGHT_EYE } from '../constants/constants';

@Injectable()
export class SaccadesMergedChartService extends ChartService {
    constructor(private sharedService: SharedService) {
        super();
    }
    //Promise ask
    public addData(frames: ICamMessage[]): Promise<ICamMessage[]> {
        frames.forEach((frame, index) => {
            frame.seconds = this.sharedService.convertTimestampToSeconds(frame.timestamp);

            frame.pointX = index == 0
              ? 0
              : frame.seconds - frames[0].seconds;

            frame.target = frame.targetType == 0
              ? LEFT_EYE
              : RIGHT_EYE;
        });

        frames = this.removeZeroElements(frames);
        frames.shift();
        frames.pop();

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(frames);
            }, 100);
        });
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
    // remove elements when patient blinks or maybe it was flash
    private removeZeroElements(frames: ICamMessage[]) {
        for (let i = frames.length - 1; i >= 0; --i)
        {
            frames[i].rawODx == 0
              ? frames.splice(i, 1)
              : frames[i].pointY = frames[i].rawODx;
        }

        return frames;
    }
}
