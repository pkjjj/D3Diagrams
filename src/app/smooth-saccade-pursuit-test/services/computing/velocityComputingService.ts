import { ICamMessage } from "src/app/models/charts.model";

const COUNT_OF_SKIPPED = 15;

export class VelocityVerticalComputingService {

    private velocityArray: number[] = [];
    private firstCalibrationIndex: number;
    private secondCalibrationIndex: number;
    private resultFrames: ICamMessage[] = [];

    public computeVelocityData(frames: ICamMessage[]): ICamMessage[] {
        this.resultFrames = [];
        this.firstCalibrationIndex = 0;
        this.secondCalibrationIndex = 0;
        this.velocityArray = [];
        this.computeFirstCalibrationRange(frames);
        
        for (let index = 0; index < frames.length; index++) {
            if (index + COUNT_OF_SKIPPED < frames.length) {
                if (this.secondCalibrationIndex === index) {
                    const slicedFrames = frames.splice(0, index);

                    this.resultFrames = this.resultFrames.concat(slicedFrames);
                    index = 0;
                }
                if (index === 0) {
                    this.firstCalibrationIndex = index;
                    this.secondCalibrationIndex = frames.slice(this.firstCalibrationIndex)
                        .findIndex(f => f.stimuliOS !== frames[this.firstCalibrationIndex].stimuliOS) + this.firstCalibrationIndex;

                    if (this.secondCalibrationIndex === -1) {
                        this.secondCalibrationIndex = frames.length - 1;
                    }
                }

                if (frames[index + COUNT_OF_SKIPPED].stimuliOS !== frames[index].stimuliOS) {
                    const calibrationAngle = this.computeHorizontalCalibrationData(frames[this.firstCalibrationIndex],
                        frames[this.secondCalibrationIndex], frames[index]);
                    frames[index].calibrationAngleOS = calibrationAngle;
                    this.velocityArray.push(0);
                    continue;
                }

                const velocity = this.computeVelocity(frames, this.firstCalibrationIndex, this.secondCalibrationIndex, index);

                this.velocityArray.push(velocity);
            }
            else {
                const calibrationAngle = this.computeHorizontalCalibrationData(frames[this.firstCalibrationIndex],
                    frames[this.secondCalibrationIndex], frames[index]);
                frames[index].calibrationAngleOS = calibrationAngle;

                if (this.secondCalibrationIndex === index) {
                    const slicedFrames = frames.splice(0, index + 1);
                    this.resultFrames = this.resultFrames.concat(slicedFrames);
                }
                this.velocityArray.push(0);
            }
        }

        this.resultFrames.forEach((frame, index) => {
            frame.pupilvelocity = this.velocityArray[index];
            frame.stimuliOS = frame.stimuliOS
        });

        return this.resultFrames;
    }

    private computeVelocity(frames: ICamMessage[], firstCalibrationIndex: number, secondCalibrationIndex: number, index: number) {
        const calibrationAngle = this.computeHorizontalCalibrationData(frames[firstCalibrationIndex],
            frames[secondCalibrationIndex], frames[index]);
        const secondDotAngle = this.computeHorizontalCalibrationData(frames[firstCalibrationIndex],
            frames[secondCalibrationIndex], frames[index + COUNT_OF_SKIPPED]);
        frames[index].calibrationAngleOS = calibrationAngle;

        const time = frames[index].pointX - frames[index + COUNT_OF_SKIPPED].pointX;

        return this.computeVelocityByHorizontalMovement(time, calibrationAngle, secondDotAngle);
    }

    private getFirstCalibrationIndex(frame: ICamMessage, frames: ICamMessage[]) {
        return frames.findIndex(f => f.stimuliOS !== frame.stimuliOS);
    }

    private getSecondCalibrationIndex(frames: ICamMessage[], firstCalibrationIndex: number) {
        return frames.slice(firstCalibrationIndex)
            .findIndex(f => f.stimuliOS !== frames[firstCalibrationIndex ].stimuliOS);
    }

    private computeHorizontalCalibrationData(firstCalibrationDot: ICamMessage,
        secondCalibrationDot: ICamMessage, currentFrame: ICamMessage) {
        const ratio = (firstCalibrationDot.eyeOS - secondCalibrationDot.eyeOS)
            / (firstCalibrationDot.stimuliOS - secondCalibrationDot.stimuliOS);
            
        const calibrationData = ratio !== 0
            ? currentFrame.stimuliOS +
            (firstCalibrationDot.eyeOS - currentFrame.eyeOS) / ratio
            : 0;    

        return calibrationData;
    }

    private computeFirstCalibrationRange(frames: ICamMessage[]) {
        for (let index = 0; index < frames.length; index++) {
            if (index === this.firstCalibrationIndex && index !== 0) {
                const slicedFrames = frames.splice(0, index);
                this.resultFrames = this.resultFrames.concat(slicedFrames);
                break;
            }

            this.firstCalibrationIndex = this.getFirstCalibrationIndex(frames[index], frames) - 1;
            this.secondCalibrationIndex = this.getSecondCalibrationIndex(frames, this.firstCalibrationIndex + 1)
                + this.firstCalibrationIndex;

            const velocity = this.computeVelocity(frames, this.firstCalibrationIndex, this.secondCalibrationIndex, index);

            this.velocityArray.push(velocity);
        }
    }

    private computeVelocityByHorizontalMovement(time: number,
        calibrationAngle: number, secondDotAngle: number): number {
        return time !== 0
            ? Math.abs((secondDotAngle - calibrationAngle) / time)
            : 0;
    }
}
