import { Injectable } from '@angular/core';
import { ComputingService } from 'src/app/services/computingService';
import { LAST_STAGE_WITHOUT_GREEN_POINT } from '../../components/saccade-merged-test-chart/saccade-movement-chart/movement-chart.constants';
import { TRESHOLD_VELOCITY } from '../../components/saccade-merged-test-chart/saccade-velocity-chart/saccade-velocity-chart.constants';
import { ICamMessage, IChartData, ITestResults } from '../../../models/charts.model';
import { CalibrationComputingService } from './calibrationComputingService';

@Injectable()
export class VelocityComputingService extends ComputingService {

    private timeArray: number[] = [];
    private velocity: number;
    private points: ICamMessage[] = [];
    private readonly COUNT_OF_SKIPPED = 4;
    private readonly FRAMES_PER_SECOND = 10;

    constructor(private calibrationService: CalibrationComputingService) { super(); }

    public computeChartData(frames: ICamMessage[]): IChartData {
        this.calibrationService.fillFramesByCalibrationData(frames);

        frames.forEach((frame, index) => {
            if (index > this.COUNT_OF_SKIPPED) {
                const frameOffsetAngle = this.computeAngle(frame);
                const nextframeOffsetAngle = this.computeAngle(frames[index - this.COUNT_OF_SKIPPED]);

                if (frame.trial != frames[index - this.COUNT_OF_SKIPPED].trial) {
                    frame.pupilvelocity = 0;
                    return;
                }

                const seconds = frame.seconds - frames[index - this.COUNT_OF_SKIPPED].seconds;

                seconds != 0
                  ? this.velocity = Math.abs(nextframeOffsetAngle - frameOffsetAngle) / seconds
                  : this.velocity = 0;

                frame.pupilvelocity = this.velocity;
            }
            else {
                frame.pupilvelocity = 0;
            }
        });

        const velocityChartData: IChartData = {
            framesData: this.tuneFrames(frames),
            testResults: this.computeLatencies(frames)
        }
        this.points = [];

        return velocityChartData;
    }

    private tuneFrames(frames: ICamMessage[]): ICamMessage[] {
        frames.forEach((frame, index) => {
          if (index % this.FRAMES_PER_SECOND == 0 && index != 0) {
            const lastFrames = frames.slice(index - this.FRAMES_PER_SECOND, index);

            const maxVelocityFrame = lastFrames
              .reduce((max, obj) => (max.pupilvelocity > obj.pupilvelocity) ? max : obj);
            this.points.push(maxVelocityFrame);
          }
        });

        this.points.push(frames[frames.length - 1]);

        return this.points;
    }

    private computeAngle(frame: ICamMessage) {
        return frame.calibrationGlintData.calibationGlintData + (frame.rawODx -
          frame.calibrationGlintData.firstPointYOfTrial) / frame.calibrationGlintData.ratio;
    }

    private computeLatencies(frames: ICamMessage[]): ITestResults {
        const trialsCount = frames[frames.length - 1].trial + 1;
        let inhibitoryErrorCount = 0;
        let noResponseErrorCount = 0;

        for (let i = 0; i < trialsCount; i++) {
            const startIndex = frames.findIndex(f => f.stage === LAST_STAGE_WITHOUT_GREEN_POINT);
            const endIndex = frames.findIndex(f => f.stage === LAST_STAGE_WITHOUT_GREEN_POINT
              && f.pupilvelocity > TRESHOLD_VELOCITY);

            if (endIndex === -1) {
                noResponseErrorCount = this.incrementErrorCount(noResponseErrorCount, frames, i);
                break;
            }

            const time = frames[endIndex].seconds - frames[startIndex].seconds;

            if (time < 0.1) {
                inhibitoryErrorCount = this.incrementErrorCount(inhibitoryErrorCount, frames, i);
                break;
            }

            const lastTrialIndex = frames.findIndex(f => f.trial === i + 1);
            frames.splice(0, lastTrialIndex);

            this.timeArray.push(time);
        }

        const sum = this.timeArray.reduce((a, b) => a + b, 0);
        const averageLatency = (sum / this.timeArray.length) || 0;

        const testResults: ITestResults = {
            correctResponseCount: trialsCount - inhibitoryErrorCount,
            inhibitoryError: inhibitoryErrorCount,
            noReponseError: noResponseErrorCount,
            totalCount: trialsCount,
            averageLatency: averageLatency,
            latencyArray: this.timeArray
        }

        this.timeArray = [];

        return testResults;
    }

    private incrementErrorCount(noResponseErrorCount: number, frames: ICamMessage[], i: number) {
        noResponseErrorCount++;
        const endIndex = frames.findIndex(f => f.trial === i + 1);
        frames.splice(0, endIndex);
        return noResponseErrorCount;
    }
}
