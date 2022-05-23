import { Injectable } from '@angular/core';
import { ICamMessage } from '../models/charts.model';
import { ChartService } from './chartService';
import * as d3 from 'd3';
import * as d3Scale from 'd3';
import * as d3Shape from 'd3';
import * as d3Array from 'd3';
import * as d3Axis from 'd3';
import { SharedService } from './shared.service';
import { DEGREES_PER_PIXEL, FRAMES_PER_SECOND, IPoint, LEFT_EYE, MILLISECONDS_PER_FRAME, RIGHT_EYE } from '../constants/constants';

@Injectable()
export class SaccadesMergedChartService extends ChartService {
    private firstTimestamp: number;
    private arr = [];
    private velocityArray = [];
    private points: IPoint[] = [];
    constructor(private sharedService: SharedService) {
        super();
    }
    //Promise ask. Нужно ли создавать другой метод если высчитываем два три лищних поля.
    public addData(frames: ICamMessage[]): Promise<ICamMessage[]> {
        return new Promise((resolve, reject) => {
            const parsedFrames = this.parseFrames(frames);
            resolve(parsedFrames);
        });
    }
    public setCamData(frames: ICamMessage[]): ICamMessage[] {
        return this.parseFrames(frames);
    }
    public setVelocityData(parsedFrames: ICamMessage[]): IPoint[] {
        return this.computeVelocityDataByFramesCount(parsedFrames, FRAMES_PER_SECOND);
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

    private computeVelocityDataByFramesCount(frames: ICamMessage[], framesCount: number): IPoint[] {
        frames.forEach((frame, index) => {
            if (index % framesCount == 0 && index != 0) {
                let parsedFrames = this.velocityArray.slice(-framesCount);
                this.arr.push(Math.max(...parsedFrames));
            }
            if (index + 1 < frames.length) {
                const pixels = frames[index + 1].pointX - frame.pointX;
                const seconds = frames[index + 1].pointY - frame.pointY;
                const degrees = pixels * DEGREES_PER_PIXEL;

                seconds != 0
                ? this.velocityArray.push(Math.abs(degrees / seconds))
                : this.velocityArray.push(0);
            }
            else {
                this.arr.push(Math.max(...this.velocityArray));
            }
        });

        this.arr.forEach((element, index) => {
            this.points.push({ pointX: index, pointY: element });
        });

        return this.points;
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
