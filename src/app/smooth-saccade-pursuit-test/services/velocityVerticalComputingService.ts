import { SmoothPursuitTest } from "../models/smoothPursuitTest";
import { VelocityComputingSmoothSaccadeService } from "./velocityComputingSmoothSaccadeService";

export class VelocityVerticalComputingService extends VelocityComputingSmoothSaccadeService {

    private firstCalibrationIndex: number;
    private secondCalibrationIndex: number;

    public computeVelocityData(frames: SmoothPursuitTest[]) {
        this.computeFirstCalibrationRange(frames);

        for (let index = 0; index < frames.length; index++) {
            if (index + this.COUNT_OF_SKIPPED < frames.length) {
                if (this.secondCalibrationIndex === index) {
                    frames.splice(0, index);
                    index = 0;
                }
                if (index === 0) {
                    this.firstCalibrationIndex = index;
                    this.secondCalibrationIndex = this.getSecondCalibrationIndex(frames, this.firstCalibrationIndex)
                     + this.firstCalibrationIndex;

                    if (this.secondCalibrationIndex === this.BAD_RESULT) {
                        this.secondCalibrationIndex = frames.length - 1;
                    }
                }

                if (frames[index + this.COUNT_OF_SKIPPED].stimuliOSy !== frames[index].stimuliOSy) {
                    this.velocityHorizontalArray.push(0);
                    continue;
                }

                const velocity = this.computeVelocity(frames, this.firstCalibrationIndex, this.secondCalibrationIndex, index);

                this.velocityHorizontalArray.push(velocity);
            }
            else {
                this.velocityHorizontalArray.push(0);
            }
        }

        return this.velocityHorizontalArray;
    }

    private computeVelocity(frames: SmoothPursuitTest[], firstCalibrationIndex: number, secondCalibrationIndex: number, index: number) {
        const calibrationAngle = this.computeHorizontalCalibrationData(frames[firstCalibrationIndex],
            frames[secondCalibrationIndex], frames[index]);
        const secondDotAngle = this.computeHorizontalCalibrationData(frames[firstCalibrationIndex],
            frames[secondCalibrationIndex], frames[index + this.COUNT_OF_SKIPPED]);

        const time = frames[index].pointX - frames[index + this.COUNT_OF_SKIPPED].pointX;

        return this.computeVelocityByHorizontalMovement(time, calibrationAngle, secondDotAngle);
    }

    private getFirstCalibrationIndex(frame: SmoothPursuitTest, frames: SmoothPursuitTest[]) {
        return frames.findIndex(f => f.stimuliOSy !== frame.stimuliOSy) - 1;
    }

    private getSecondCalibrationIndex(frames: SmoothPursuitTest[], firstCalibrationIndex: number) {
        return frames.slice(firstCalibrationIndex + 1)
            .findIndex(f => f.stimuliOSy !== frames[firstCalibrationIndex + 1].stimuliOSy);
    }

    private computeHorizontalCalibrationData(firstCalibrationDot: SmoothPursuitTest,
        secondCalibrationDot: SmoothPursuitTest, currentFrame: SmoothPursuitTest) {
        const ratio = (firstCalibrationDot.eyeOSy - secondCalibrationDot.eyeOSy)
            / (firstCalibrationDot.stimuliOSy - secondCalibrationDot.stimuliOSy);
        const calibrationData = currentFrame.stimuliOSy +
            (firstCalibrationDot.eyeOSy - currentFrame.eyeOSy) / ratio;

        return calibrationData;
    }

    private computeFirstCalibrationRange(frames: SmoothPursuitTest[]) {
        for (let index = 0; index < frames.length; index++) {
            if (index === this.firstCalibrationIndex) {
                frames.splice(0, index);
                break;
            }
            this.firstCalibrationIndex = this.getFirstCalibrationIndex(frames[index], frames);
            this.secondCalibrationIndex = this.getSecondCalibrationIndex(frames, this.firstCalibrationIndex)
                + this.firstCalibrationIndex;

            const velocity = this.computeVelocity(frames, this.firstCalibrationIndex, this.secondCalibrationIndex, index);

            this.velocityHorizontalArray.push(velocity);
        }
    }
}
