import { Injectable } from "@angular/core";
import { CHART_SUBTYPE, ICamMessage, IRangeTestResult, ISaccadeResult, RANGE_TYPE, SACCADE_RESULT } from "src/app/models/charts.model";

export interface IAdditionalRangeResults { 
    saccadesResults?: ISaccadeResult[],
    countAccept?: number, 
    countErrorPatient?: number, 
    countErrorSystem?: number 
} 

@Injectable()
export class VelocitySaccadeAnalyticsService {

    private testResults: IRangeTestResult[] = [];
    private saccadesResults: ISaccadeResult[] = [];
    private latency: number;
    private peakVelocity: number;
    private amplitude: number;
    private firstSaccadeIndex: number;
    private lastSaccadeIndex: number;
    private counter = 0;
    private charSubtype: CHART_SUBTYPE;
    private readonly TRESHOLD_VALUE = 30;

    public computeTestResults(frames: ICamMessage[], chartType: CHART_SUBTYPE): IRangeTestResult[] {
        this.testResults = [];
        this.saccadesResults = [];
        this.counter = 0;
        this.firstSaccadeIndex = 0;
        this.lastSaccadeIndex = 0;
        this.charSubtype = chartType;

        while (frames.length > 1) {
            const firstCalibrationIndex = frames.findIndex(f => f.stimuliOS !== frames[0].stimuliOS);
            const slicedFrames = frames.slice(firstCalibrationIndex)
            let secondCalibrationIndex = slicedFrames.findIndex(f => f.stimuliOS !== slicedFrames[0].stimuliOS)
            + firstCalibrationIndex;

            if (secondCalibrationIndex < firstCalibrationIndex && secondCalibrationIndex !== 0) {
                break;
            }

            if (secondCalibrationIndex === 0) {
                secondCalibrationIndex = frames.length;
            }

            const framesPerRange = frames.slice(firstCalibrationIndex - 1, secondCalibrationIndex - 1)

            const saccadesResultsPerRange = this.computeSaccadesResultForOneRange([ ...framesPerRange ]);

            this.testResults.push({
                id: this.counter++,
                type: chartType,
                saccadesTestResults: saccadesResultsPerRange.saccadesResults,
                angle: Math.abs(frames[firstCalibrationIndex].calibrationAngleOS) + 
                    Math.abs(frames[secondCalibrationIndex].calibrationAngleOS),
                accept: saccadesResultsPerRange.countAccept,
                errorPatient: saccadesResultsPerRange.countErrorPatient,
                errorSystem: saccadesResultsPerRange.countErrorSystem
            });

            this.saccadesResults = [];
            frames.splice(0, framesPerRange.length);
        }
        console.log(this.testResults)
        return this.testResults;
    }

    private computeSaccadesResultForOneRange(frames: ICamMessage[]): IAdditionalRangeResults {
        const rangeResults: IAdditionalRangeResults = { countAccept: 0, countErrorPatient: 0, countErrorSystem: 0};
        for (let index = 0; index < frames.length; index++) {
            if (this.saccadesResults.length === 3) { break; }

            this.firstSaccadeIndex = frames.slice(index)
                .findIndex(f => f.pupilvelocity > this.TRESHOLD_VALUE);

            // no response error
            if (this.firstSaccadeIndex === -1 && index === 0) {
                this.saccadesResults.push({
                    result: SACCADE_RESULT.ERROR_PATIENT,
                });
                rangeResults.countErrorPatient++;
                return null;
            }

            if (this.firstSaccadeIndex === -1) {
                break;
            }

            this.firstSaccadeIndex += index;
            this.lastSaccadeIndex = frames.slice(this.firstSaccadeIndex)
                .findIndex(f => f.pupilvelocity < this.TRESHOLD_VALUE) + this.firstSaccadeIndex;

            if (this.lastSaccadeIndex < this.firstSaccadeIndex
                && frames[frames.length - 1].pupilvelocity < this.TRESHOLD_VALUE) { break; }

            if (this.lastSaccadeIndex < this.firstSaccadeIndex
                && frames[frames.length - 1].pupilvelocity > this.TRESHOLD_VALUE) {
                this.lastSaccadeIndex = frames.length - 1;
            }

            this.latency = Math.abs(frames[0].pointX - frames[this.firstSaccadeIndex].pointX);

            // inhibitory error
            if (this.latency * 1000 < 100) {
                this.saccadesResults.push({
                    result: SACCADE_RESULT.ERROR_PATIENT,
                    type: this.getEyeDirection(frames[this.firstSaccadeIndex].calibrationAngleOS, 
                        frames[this.lastSaccadeIndex].calibrationAngleOS, this.charSubtype)
                });
                rangeResults.countErrorPatient++;

                // check
                index = this.lastSaccadeIndex;
                continue;
            }

            this.peakVelocity = frames.slice(this.firstSaccadeIndex, this.lastSaccadeIndex)
                .reduce((a, b) => a = a > b.pupilvelocity
                ? a
                : b.pupilvelocity, 0);

            //TODO check the formula
            const firstCalibrationDotAngle = frames[0].calibrationAngleOS;
            const lastSaccadeDotAngle = frames[this.lastSaccadeIndex].calibrationAngleOS;
            const secondCalibrationDotAngle = frames[frames.length - 1].stimuliOS;

            const calibrationAmplitude = Math.abs(secondCalibrationDotAngle - firstCalibrationDotAngle);
            const endTimeaAmplitude = Math.abs(lastSaccadeDotAngle - firstCalibrationDotAngle);

            this.amplitude = calibrationAmplitude !== 0
                ? Math.abs(endTimeaAmplitude / calibrationAmplitude)
                : Math.abs(endTimeaAmplitude / 0.1)

            this.saccadesResults.push({
                latency: Math.trunc(this.latency * 1000),
                peakVelocity: this.peakVelocity,
                amplitude: Math.trunc(this.amplitude * 100),
                result: SACCADE_RESULT.ACCEPT,
                type: this.getEyeDirection(frames[this.firstSaccadeIndex].calibrationAngleOS, 
                    frames[this.lastSaccadeIndex].calibrationAngleOS, this.charSubtype),
            });
            rangeResults.countAccept++;

            index = this.lastSaccadeIndex;
        }
        rangeResults.saccadesResults = this.saccadesResults;

        return rangeResults;
    }

    private getEyeDirection(calibrationAngle: number, secondCalibrationAngle: number, type: CHART_SUBTYPE) {
        if (type === CHART_SUBTYPE.VERTICAL) {
            return calibrationAngle < secondCalibrationAngle
                ? RANGE_TYPE.UPWARDS
                : RANGE_TYPE.DOWNWARDS;
        }
        else {
            return calibrationAngle < secondCalibrationAngle
                ? RANGE_TYPE.LEFT_TO_RIGHT
                : RANGE_TYPE.RIGHT_TO_LEFT;
        }
    }
}
