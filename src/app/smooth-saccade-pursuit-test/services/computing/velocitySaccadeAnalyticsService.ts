import { Injectable } from "@angular/core";
import { ICamMessage, ISaccadeResult } from "src/app/models/charts.model";

@Injectable()
export class VelocitySaccadeAnalyticsService {

    private testResults: ISaccadeResult[] = [];
    private saccadesResults: {
        latency?: number;
        peakVelocity?: number;
        amplitude? : number;
    }[] = [];
    private latency: number;
    private peakVelocity: number;
    private amplitude: number;
    private firstSaccadeIndex: number;
    private lastSaccadeIndex: number;
    private counter = 0;
    private readonly TRESHOLD_VALUE = 30;

    public computeTestResults(frames: ICamMessage[]): ISaccadeResult[] {
        this.testResults = [];
        this.saccadesResults = [];
        this.counter = 0;
        this.firstSaccadeIndex = 0;
        this.lastSaccadeIndex = 0;


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
            if (saccadesResultsPerRange !== null) {
                this.testResults.push({
                    id: this.counter++,
                    saccadesResults: saccadesResultsPerRange,
                    noResponse: false
                });
            }
            else {
                this.testResults.push({
                    id: this.counter++,
                    saccadesResults: null,
                    noResponse: true
                });
            }
            this.saccadesResults = [];
            frames.splice(0, framesPerRange.length);
        }
        console.log(this.testResults)
        return this.testResults;
    }

    private computeSaccadesResultForOneRange(frames: ICamMessage[])
    : { latency?: number; peakVelocity?: number; amplitude?: number }[] {
        for (let index = 0; index < frames.length; index++) {
            if (this.saccadesResults.length === 3) { break; }

            this.firstSaccadeIndex = frames.slice(index)
                .findIndex(f => f.pupilvelocity > this.TRESHOLD_VALUE);

            if (this.firstSaccadeIndex === -1 && index === 0) {
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
                amplitude: Math.trunc(this.amplitude * 100)
            });

            index = this.lastSaccadeIndex;
        }

        return this.saccadesResults;
    }
}
