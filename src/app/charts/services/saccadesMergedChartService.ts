import { Injectable } from '@angular/core';
import { ICamMessage } from '../models/charts.model';
import { ChartService } from './chartService';
import { SharedService } from './shared.service';
import { DEGREES_PER_PIXEL, FLASHING_STAGE, FRAMES_PER_SECOND, INDEX_DOT_FOR_CHECK, LEFT_EYE, RIGHT_EYE } from '../constants/constants';
import { CalibrationData, IPoint } from '../constants/types';

export interface CalibrationDot {
    rawODx: number;
    angleGreenDotPointY: number;
}
@Injectable()
export class SaccadesMergedChartService extends ChartService {
    private firstTimestamp: number;
    private arr = [];
    private velocityArray = [];
    private points: IPoint[] = [];

    constructor(private sharedService: SharedService) {
        super();
    }

    public addData(frames: ICamMessage[]): Promise<ICamMessage[]> {
        return new Promise((resolve, reject) => {
            const parsedFrames = this.parseFrames(frames);

            resolve(parsedFrames);
        });
    }

    public setCamData(frames: ICamMessage[]): ICamMessage[] {
        return this.parseFrames(frames);
    }

    public setVelocityData(frames: ICamMessage[]): IPoint[] {
        const parsedFrames = this.parseFrames(frames);

        return this.computeVelocityDataByFramesCount(parsedFrames, 10);
    }

    public setMovementData(frames: ICamMessage[]): ICamMessage[] {
        const trialCount = frames[frames.length - 1].trial;
        const calibrationArray = [];

        for (let i = 0; i < trialCount; i++) {
            if (i + 1 > trialCount)
                break;

            const firstTrialsArray = frames.filter(el => el.trial == i);
            const secondTrialsArray = frames.filter(el => el.trial == i+1);
            const calibrationData = this.computeMovementData(firstTrialsArray, secondTrialsArray);

            calibrationArray.push(calibrationData);
        }

        frames.forEach((frame) => {
            frame.calibrationGlintData = calibrationArray[frame.trial];
        });
        console.log(frames);
        console.log(calibrationArray);
        return frames;
    }

    public export() {
        throw new Error('Method not implemented.');
    }

    public clearData(): void {
        throw new Error('Method not implemented.');
    }

    private parseFrames(frames: ICamMessage[]) {
        frames.forEach((frame) => {
            frames = this.removeZeroElements(frames);

            frame.seconds = this.sharedService.convertTimestampToSeconds(frame.timestamp);

            this.firstTimestamp = this.firstTimestamp ?? frame.seconds;

            frame.pointX = frame.seconds - this.firstTimestamp;

            frame.target = frame.targetType == 0
                ? LEFT_EYE
                : RIGHT_EYE;

            frame.angleGreenDotPointY = this.getDegreeByIndex(frame.greenDotIndex);
            frame.angleRedDotPointY = this.getDegreeByIndex(frame.redDotIndex);
        });

        return frames;
    }

  private getDegreeByIndex(dotIndex: number) {
    switch (dotIndex) {
      case 0:
        return -10;
      case 1:
        return -5;
      case 2:
        return 0;
      case 3:
        return 5;
      case 4:
        return 10;
      default:
        throw new Error('wrong dot Index value');
    }
  }

    private computeVelocityDataByFramesCount(frames: ICamMessage[], framesPerSecond: number): IPoint[] {
        frames.forEach((frame, index) => {
            if (index % framesPerSecond == 0 && index != 0) {
                let parsedFrames = this.velocityArray.slice(-framesPerSecond);
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
                this.arr.push(Math.max(...this.velocityArray));//TODO rename arr
            }
        });

        this.arr.forEach((element, index) => {
            this.points.push({ pointX: index, pointY: element });
        });

        return this.points;
    }

    private computeMovementData(firstTrialframes: ICamMessage[], secondTrialframes: ICamMessage[]) {
        const firstDot = this.computeCalibrationDot(firstTrialframes) as CalibrationDot;
        const secondDot = this.computeCalibrationDot(secondTrialframes) as CalibrationDot;

        return this.computeCalibrationGlintData(firstDot, secondDot);
    }

    private computeCalibrationDot(frames: ICamMessage[]): ICamMessage {
        const firstTrial = frames[0].trial;
        const flashIndex = frames.findIndex(el => el.stage == FLASHING_STAGE
          && el.trial == firstTrial);

        return frames[flashIndex];
    }

    private computeCalibrationGlintData(firstDot: CalibrationDot, secondDot: CalibrationDot) {
        const axisXLocation = firstDot.rawODx;
        const p = firstDot.angleGreenDotPointY;
        const t = secondDot.angleGreenDotPointY;
        const pixelDifference = firstDot.rawODx - secondDot.rawODx;
        const degreeDifference = firstDot.angleGreenDotPointY - secondDot.angleGreenDotPointY;
        const ratio = pixelDifference / degreeDifference;
        const calibationGlintData = firstDot.angleGreenDotPointY - (secondDot.rawODx - firstDot.rawODx) / ratio;

        return { calibationGlintData, pixelDifference, axisXLocation, p, t };
    }

    // remove elements when patient blinks or maybe it was flash
    private removeZeroElements(frames: ICamMessage[]): ICamMessage[] {
        for (let i = frames.length - 1; i >= 0; --i)
        {
            frames[i].rawODx == 0
              ? frames.splice(i, 1)
              : frames[i].pointY = frames[i].rawODx;
        }

        return frames;
    }
}
