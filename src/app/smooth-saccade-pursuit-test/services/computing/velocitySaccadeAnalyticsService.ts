import { Injectable } from "@angular/core";
import { CHART_SUBTYPE, ICamMessage, IRangeTestResult, ISaccadeResult, RANGE_TYPE, SACCADE_RESULT } from "src/app/models/charts.model";
import { ICalibrationData } from "src/app/saccade-memory-test/constants/types";

export interface IAdditionalRangeResults { 
    saccadesResults?: ISaccadeResult,
    countAccept?: number, 
    countErrorPatient?: number, 
    countErrorSystem?: number,
    maxStimuliValue?: number
} 


@Injectable()
export class VelocitySaccadeAnalyticsService {

    private calibrationArray: ICalibrationData[] = [];
    private initialFrames: ICamMessage[] = [];
    private resultFrames: ICamMessage[] = [];
    private testResults: IRangeTestResult[] = [];
    private latency: number;
    private peakVelocity: number;
    private amplitude: number;
    private firstSaccadeIndex: number;
    private lastSaccadeIndex: number;
    private charSubtype: CHART_SUBTYPE;
    private countAccept = 0
    private countErrorPatient = 0;
    private counter = 0;
    private countErrorSystem = 0;
    private readonly TRESHOLD_VALUE = 30;

    public computeTestResults(frames: ICamMessage[], chartType: CHART_SUBTYPE): IRangeTestResult[] {
        this.testResults = [];
        this.firstSaccadeIndex = 0;
        this.lastSaccadeIndex = 0;
        this.charSubtype = chartType;
        

        while (frames.length > 1) {
            this.cutFirstCalibrationRange(frames);
            
            const startIndex = frames.findIndex(f => f.stimuliOS === 0);

            const newPartIndex = startIndex !== -1
                ? startIndex
                : frames.length - 1;

            // check what returns frames (maybe + 1)
            const testResultsForInterval = this.computeIntervalResults(frames.splice(0, newPartIndex + 1));
            this.testResults.push(testResultsForInterval);

            this.resetResultCounters();
            // case when last whole interval are zeros
            const isLastInterval = frames.slice(startIndex, frames.length - 1)
                .every(f => f.stimuliOS === 0);
            
            if (isLastInterval) { break; }
        }
        
        return this.testResults;
    }


    private cutFirstCalibrationRange(frames: ICamMessage[]) {
        const firstCalibrationIndex = frames.findIndex(f => f.stimuliOS !== frames[0].stimuliOS);
        const slicedFrames = frames.slice(firstCalibrationIndex);
        const secondCalibrationIndex = slicedFrames.findIndex(f => f.stimuliOS !== slicedFrames[0].stimuliOS)
            + firstCalibrationIndex - 1;

        const splicedFrames =  frames.splice(0, secondCalibrationIndex);
        this.resultFrames = this.resultFrames.concat(splicedFrames);
    }

    // interval means that several ranges(stimuli saccades) and stops when stimuli equal 0
    private computeIntervalResults(frames: ICamMessage[]): IRangeTestResult {
        const testResults: IRangeTestResult = { saccadesTestResults: [] };
        while (frames.length > 2) {
            const firstCalibrationIndex = 0;
            const slicedFrames = frames.slice(firstCalibrationIndex + 1);

            let secondCalibrationIndex = slicedFrames.findIndex(f => f.stimuliOS !== slicedFrames[1].stimuliOS);

            // case when this is last stimuli saccade
            if (secondCalibrationIndex < firstCalibrationIndex && secondCalibrationIndex !== 0) {
                const isInterruption = slicedFrames
                    .every(f => f.stimuliOS === slicedFrames[1].stimuliOS 
                        && slicedFrames[1].stimuliOS !== 0);

                if (!isInterruption) { break; }
                
                secondCalibrationIndex = frames.length - 1;
            }

            const framesPerRange = frames.slice(firstCalibrationIndex, secondCalibrationIndex);

            const saccadesResultsPerRange = this.computeSaccadesResultForOneRange([ ...framesPerRange ]);

            testResults.saccadesTestResults.push(saccadesResultsPerRange.saccadesResults);

            frames.splice(0, secondCalibrationIndex);
        }

        testResults.accept = this.countAccept;
        testResults.errorPatient = this.countErrorPatient;
        testResults.errorSystem = this.countErrorSystem;
        testResults.type = this.charSubtype;
        testResults.angle = Math.abs(frames[0].stimuliOS);
        testResults.saccadesTestResults.push({
            type: RANGE_TYPE.AVERAGE,
            latency: this.computeAverage(testResults.saccadesTestResults, 'latency'),
            amplitude: this.computeAverage(testResults.saccadesTestResults, 'amplitude'),
            peakVelocity: this.computeAverage(testResults.saccadesTestResults, 'peakVelocity'),
        });

        return testResults;
    }

    private computeAverage(saccadesResults: ISaccadeResult[], propertyName: string): number {
        let count = 0;
        let sum = 0;
        saccadesResults.forEach(saccade => {
            if (saccade[propertyName]) {
                sum += saccade[propertyName];
                count++;
            }
        });

        const average = count !== 0
            ? sum / count 
            : 0;

        return average;
    }

    private computeSaccadesResultForOneRange(frames: ICamMessage[]): IAdditionalRangeResults {
        const rangeResults: IAdditionalRangeResults = { };

        // no calibration data error
        if (frames[0].eyeOSx === 0) {
            this.countErrorSystem++;
            rangeResults.saccadesResults = {
                result: SACCADE_RESULT.ERROR_SYSTEM,
            };

            return rangeResults;
        }

        this.firstSaccadeIndex = frames.slice(0)
            .findIndex(f => f.pupilvelocity > this.TRESHOLD_VALUE);

        // no response error
        if (this.firstSaccadeIndex === -1) {
            this.countErrorPatient++;
            rangeResults.saccadesResults = {
                result: SACCADE_RESULT.ERROR_PATIENT,
            };

            return rangeResults;
        }

        this.lastSaccadeIndex = frames.slice(this.firstSaccadeIndex)
            .findIndex(f => f.pupilvelocity < this.TRESHOLD_VALUE) + this.firstSaccadeIndex;

        this.latency = Math.abs(frames[0].pointX - frames[this.firstSaccadeIndex].pointX);

        // inhibitory error
        if (this.latency * 1000 < 100) {
            this.countErrorPatient++;
            rangeResults.saccadesResults = {
                result: SACCADE_RESULT.ERROR_PATIENT,
            };

            return rangeResults;
        }

        this.peakVelocity = frames.slice(this.firstSaccadeIndex, this.lastSaccadeIndex)
            .reduce((a, b) => a = a > b.pupilvelocity
            ? a
            : b.pupilvelocity, 0);

        const firstCalibrationDotAngle = frames[0].calibrationAngleOS;
        const lastSaccadeDotAngle = frames[this.lastSaccadeIndex].calibrationAngleOS;
        const secondCalibrationDotAngle = frames[frames.length - 1].stimuliOS;

        const calibrationAmplitude = Math.abs(secondCalibrationDotAngle - firstCalibrationDotAngle);
        const endTimeaAmplitude = Math.abs(lastSaccadeDotAngle - firstCalibrationDotAngle);

        this.amplitude = calibrationAmplitude !== 0
            ? Math.abs(endTimeaAmplitude / calibrationAmplitude)
            : Math.abs(endTimeaAmplitude / 0.1)

        rangeResults.saccadesResults = {
            latency: Math.trunc(this.latency * 1000),
            peakVelocity: this.peakVelocity,
            amplitude: Math.trunc(this.amplitude * 100),
            result: SACCADE_RESULT.ACCEPT,
            type: this.getEyeDirection(frames[this.firstSaccadeIndex].calibrationAngleOS, 
                frames[this.lastSaccadeIndex].calibrationAngleOS, this.charSubtype),
        };
        this.countAccept++;

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

    private resetResultCounters() {
        this.countAccept = 0;
        this.countErrorPatient = 0;
        this.countErrorSystem = 0;
    }

    public computeFramesByCalibrationData(frames: ICamMessage[]): ICamMessage[] {
        this.initialFrames = [ ...frames ];
        this.calibrationArray = [];
        this.counter = 0;

        while (frames.length > 1) {
            this.cutFirstCalibrationRange(frames);
            
            const startIndex = frames.findIndex(f => f.stimuliOS === 0);

            const newPartIndex = startIndex !== -1
                ? startIndex
                : frames.length - 1;

            // check what returns frames (maybe + 1)
            const testResultsForInterval = this.computeIntervalCalibrationData(frames.splice(0, newPartIndex + 1));
            this.calibrationArray = this.calibrationArray.concat(testResultsForInterval);

            this.resetResultCounters();
            // case when last whole interval are zeros
            const isLastInterval = frames.slice(startIndex, frames.length - 1)
                .every(f => f.stimuliOS === 0);
            
            if (isLastInterval) { break; }
        }

        this.resultFrames = [];

        for (let i = 0; i < this.initialFrames.length; i++) {
            this.cutFirstCalibrationRange(this.initialFrames);
            
            const startIndex = this.initialFrames.findIndex(f => f.stimuliOS === 0);

            const newPartIndex = startIndex !== -1
                ? startIndex
                : this.initialFrames.length - 1;

            // check what returns frames (maybe + 1)
            const splicedFrames = this.initialFrames.splice(0, newPartIndex + 1);
            const calibratedFrames = this.getCalibratedFrames(splicedFrames);
            this.resultFrames = this.resultFrames.concat(calibratedFrames);

            // case when last whole interval are zeros
            const isLastInterval = this.initialFrames.slice(startIndex, this.initialFrames.length - 1)
                .every(f => f.stimuliOS === 0);
            
            if (isLastInterval) { 
                this.resultFrames = this.resultFrames.concat(this.initialFrames);    
                break; 
            }
        }

        return this.resultFrames;
    }

    private getCalibratedFrames(frames: ICamMessage[]): ICamMessage[] {
        let parsedFrames: ICamMessage[] = [];
        while (frames.length > 2) {
            const firstCalibrationIndex = 0;
            const slicedFrames = frames.slice(firstCalibrationIndex + 1);

            let secondCalibrationIndex = slicedFrames.findIndex(f => f.stimuliOS !== slicedFrames[1].stimuliOS);

            // case when this is last stimuli saccade
            if (secondCalibrationIndex < firstCalibrationIndex && secondCalibrationIndex !== 0) {
                const isInterruption = slicedFrames
                    .every(f => f.stimuliOS === slicedFrames[1].stimuliOS 
                        && slicedFrames[1].stimuliOS !== 0);

                if (!isInterruption) { break; }
                
                secondCalibrationIndex = frames.length - 1;
            }

            const framesPerRange = frames.slice(firstCalibrationIndex, secondCalibrationIndex);

            const resultFrames = this.setCalibrationData([ ...framesPerRange ], this.calibrationArray[this.counter++]);

            parsedFrames = parsedFrames.concat(resultFrames);

            frames.splice(0, secondCalibrationIndex);
        }

        return parsedFrames;
    }

    private setCalibrationData(frames: ICamMessage[], calibrionData: ICalibrationData): ICamMessage[] {
        frames.forEach((frame) => {
            frame.calibrationGlintData = calibrionData;
        });

        return frames;
    }

    private computeIntervalCalibrationData(frames: ICamMessage[]) {
        const calibrationArray: ICalibrationData[] = [];

        while (frames.length > 2) {
            const firstCalibrationIndex = 0;
            const slicedFrames = frames.slice(firstCalibrationIndex + 1);

            let secondCalibrationIndex = slicedFrames.findIndex(f => f.stimuliOS !== slicedFrames[1].stimuliOS);

            // case when this is last stimuli saccade
            if (secondCalibrationIndex < firstCalibrationIndex && secondCalibrationIndex !== 0) {
                const isInterruption = slicedFrames
                    .every(f => f.stimuliOS === slicedFrames[1].stimuliOS 
                        && slicedFrames[1].stimuliOS !== 0);

                if (!isInterruption) { break; }
                
                secondCalibrationIndex = frames.length - 1;
            }

            const framesPerRange = frames.slice(firstCalibrationIndex, secondCalibrationIndex);

            const calibrationData = 
                this.computeCalibrationGlintData(framesPerRange[0], framesPerRange[framesPerRange.length - 1]);

            calibrationArray.push(calibrationData);

            frames.splice(0, secondCalibrationIndex);
        }

        return calibrationArray;
    }

    private computeCalibrationGlintData(firstDot: ICamMessage, secondDot: ICamMessage) {
        const firstPointYOfTrial = secondDot.eyeOS;
        const pixelDifference = firstDot.eyeOS - secondDot.eyeOS;
        const degreeDifference = firstDot.stimuliOS - secondDot.stimuliOS;
        const ratio = pixelDifference / degreeDifference;
        const calibationGlintData = firstDot.stimuliOS + (secondDot.eyeOS - firstDot.eyeOS) / ratio;

        return { calibationGlintData, pixelDifference, firstPointYOfTrial, ratio };
    }
}
