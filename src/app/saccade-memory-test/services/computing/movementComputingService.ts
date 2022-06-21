import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { ComputingService } from 'src/app/services/computingService';
import { rangeOfDegrees, RATIO_PIXELS_TO_DEGREES } from '../../components/saccade-merged-test-chart/saccade-movement-chart/movement-chart.constants';
import { ICalibrationData, ICalibrationMovementChartData } from '../../constants/types';
import { ICamMessage, IChartData } from '../../../models/charts.model';
import { CalibrationComputingService } from './calibrationComputingService';

@Injectable()
export class MovementComputingService extends ComputingService {

    private OFFSET_FROM_CENTER = 20;

    constructor(private calibrationService: CalibrationComputingService) { super(); }

    public computeChartData(frames: ICamMessage[]): IChartData {
        this.calibrationService.fillFramesByCalibrationData(frames);

        const calibrationChartData = this.computeChartCalibrationData(frames, frames[0].calibrationGlintData);
        const chartData: IChartData = {
            calibrationData: calibrationChartData,
            framesData: frames
        }

        return chartData;
    }

    private computeChartCalibrationData(frames: ICamMessage[],
      calibrationData: ICalibrationData): ICalibrationMovementChartData {
        const startOfAxisX = calibrationData.firstPointYOfTrial;
        let maxValue = startOfAxisX + this.OFFSET_FROM_CENTER;
        let minValue = startOfAxisX - this.OFFSET_FROM_CENTER;

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
