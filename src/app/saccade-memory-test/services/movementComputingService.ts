import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { FLASHING_STAGE, rangeOfDegrees, RATIO_PIXELS_TO_DEGREES } from '../constants/movement-chart';
import { ICalibrationData, ICalibrationDot, ICalibrationMovementChartData } from '../constants/types';
import { ICamMessage, IChartData } from '../models/charts.model';
import { CalibrationComputingService } from './calibrationComputingService';

@Injectable()
export class MovementComputingService {

    constructor(private calibrationService: CalibrationComputingService) { }

    public getChartMovementData(frames: ICamMessage[]): IChartData {
        this.calibrationService.fillFramesByCalibrationData(frames);

        const calibrationChartData = this.computeChartCalibrationData(frames, frames[0].calibrationGlintData);
        const chartData: IChartData = {
            calibrationData: calibrationChartData,
            framesData: frames
        }

        return chartData;
    }

    private computeChartCalibrationData(frames: ICamMessage[],
      calibrationData: ICalibrationData): ICalibrationMovementChartData
    {
        const startOfAxisX = calibrationData.firstPointYOfTrial;
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
