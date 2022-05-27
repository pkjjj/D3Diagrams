import { Injectable } from '@angular/core';
import { DEGREES_PER_PIXEL } from '../constants/constants';
import { IPoint } from '../constants/types';
import { ICamMessage } from '../models/charts.model';

@Injectable()
export class VelocityComputingService {
    private maxValuesArray: number[] = [];
    private velocityArray: number[] = [];
    private points: IPoint[] = [];

    constructor() { }

    public computeVelocityDataByFramesCount(frames: ICamMessage[], framesPerSecond: number): IPoint[] {
        frames.forEach((frame, index) => {
            if (index % framesPerSecond == 0 && index != 0) {
                let parsedFrames = this.velocityArray.slice(-framesPerSecond);
                this.maxValuesArray.push(Math.max(...parsedFrames));
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
                this.maxValuesArray.push(Math.max(...this.velocityArray));
            }
        });

        this.maxValuesArray.forEach((element, index) => {
            this.points.push({ pointX: index, pointY: element });
        });

      return this.points;
    }

}
