import { Injectable } from '@angular/core';
import { ICamMessage, IChartData } from '../models/charts.model';
import { ChartService } from './chartService';
import { SharedService } from './shared.service';
import { DEGREES_PER_PIXEL, LEFT_EYE, RIGHT_EYE } from '../constants/constants';
import { ICalibrationMovementChartData, IPoint } from '../constants/types';
import { FRAMES_PER_SECOND, RATIO_PIXELS_TO_DEGREES } from '../constants/chart';
import { FLASHING_STAGE, rangeOfDegrees } from '../constants/movement-chart';
import * as d3 from 'd3';

export interface CalibrationDot {
    rawODx: number;
    angleGreenDotPointY: number;
}

export interface ICalibrationData {
    calibationGlintData: number,
    pixelDifference: number,
    axisXLocation: number
}
@Injectable()
export class SaccadesMergedChartService extends ChartService {
    private firstTimestamp: number;
    private maxValuesArray = [];
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

        return this.computeVelocityDataByFramesCount(parsedFrames, FRAMES_PER_SECOND);
    }

    public setMovementData(frames: ICamMessage[]): IChartData {
        const trialCount = frames[frames.length - 1].trial;
        const calibrationArray = [];

        for (let i = 0; i < trialCount; i++) {
            if (i + 1 > trialCount)
                break;

            const firstTrialsArray = frames.filter(el => el.trial == i);
            const secondTrialsArray = frames.filter(el => el.trial == i+1);
            const calibrationData: ICalibrationData =
              this.computeMovementData(firstTrialsArray, secondTrialsArray);

            calibrationArray.push(calibrationData);
        }

        // frames.forEach((frame) => {
        //     frame.calibrationGlintData = calibrationArray[frame.trial];
        // });

        const calibrationChartData = this.computeCharCalibrationData(frames, calibrationArray[0]);
        const chartData: IChartData = {
            calibrationData: calibrationChartData,
            framesData: frames
        }

        return chartData;
    }

    private computeCharCalibrationData(frames: ICamMessage[],
      calibrationData: ICalibrationData): ICalibrationMovementChartData
    {
        const startOfAxisX = calibrationData.axisXLocation;
        let maxValue = startOfAxisX + 20;
        let minValue = startOfAxisX - 20;

        const [maxPointY, minPointY] = [d3.max(frames, d => d.pointY), d3.min(frames, d => d.pointY)];

        if (minPointY < minValue) {
            const minPointYDifference = minValue - minPointY;
            rangeOfDegrees.minValue -= minPointYDifference / RATIO_PIXELS_TO_DEGREES;
            minValue = minPointY;
        }

        if (maxPointY > maxValue) {
            const maxPointYDifference = maxPointY - maxValue;
            rangeOfDegrees.maxValue += maxPointYDifference / RATIO_PIXELS_TO_DEGREES;
            maxValue = maxPointY;
        }

        const chartData: ICalibrationMovementChartData = {
            startOfAxisX: startOfAxisX,
            yScaleMaxValue: maxValue,
            yScaleMinValue: minValue,
            yScaleAngleMaxValue: rangeOfDegrees.maxValue,
            yScaleAngleMinValue: rangeOfDegrees.minValue
        }

        return chartData;
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
        const pixelDifference = firstDot.rawODx - secondDot.rawODx;
        const degreeDifference = firstDot.angleGreenDotPointY - secondDot.angleGreenDotPointY;
        const ratio = pixelDifference / degreeDifference;
        const calibationGlintData = firstDot.angleGreenDotPointY - (secondDot.rawODx - firstDot.rawODx) / ratio;

        return { calibationGlintData, pixelDifference, axisXLocation };
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
