import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { FLASHING_STAGE, rangeOfDegrees, RATIO_PIXELS_TO_DEGREES } from '../constants/movement-chart';
import { ICalibrationMovementChartData } from '../constants/types';
import { ICamMessage, IChartData } from '../models/charts.model';
import { CalibrationDot, ICalibrationData } from './saccadesMergedChartService';

@Injectable()
export class MovementComputingService {

    constructor() { }

    public getChartMovementData(frames: ICamMessage[]): IChartData {
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

        const calibrationChartData = this.computeChartCalibrationData(frames, calibrationArray[0]);
        const chartData: IChartData = {
            calibrationData: calibrationChartData,
            framesData: frames
        }

        return chartData;
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

    private computeChartCalibrationData(frames: ICamMessage[],
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
}
