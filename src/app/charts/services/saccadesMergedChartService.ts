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
    private firstTimestamp: number;
    constructor(private sharedService: SharedService) {
        super();
    }
    //Promise ask
    public addData(frames: ICamMessage[]): Promise<ICamMessage[]> {
        return new Promise((resolve, reject) => {
            const parsedFrames = this.parseFrames(frames);
            resolve(parsedFrames);
        });
    }
    public setCamData(frames: ICamMessage[]): ICamMessage[]         {
        return this.parseFrames(frames);
    }
    public export() {
        throw new Error('Method not implemented.');
    }
    public clearData(): void {
        throw new Error('Method not implemented.');
    }
    private parseFrames(frames: ICamMessage[]) {
        frames.forEach((frame, index) => {
        frames = this.removeZeroElements(frames);

        frame.seconds = this.sharedService.convertTimestampToSeconds(frame.timestamp);

        this.firstTimestamp = this.firstTimestamp ?? frame.seconds;
        frame.pointX = frame.seconds - this.firstTimestamp;

        frame.target = frame.targetType == 0
            ? LEFT_EYE
            : RIGHT_EYE;

        switch(frame.greenDotIndex) {
          case 0:
              frame.angleGreenDotPointY = -10;
              break;
          case 1:
              frame.angleGreenDotPointY = -5;
              break;
          case 2:
              frame.angleGreenDotPointY = 0;
              break
          case 3:
              frame.angleGreenDotPointY = 5;
              break;
          case 4:
              frame.angleGreenDotPointY = 10;
              break;
        }
        });

        return frames;
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
