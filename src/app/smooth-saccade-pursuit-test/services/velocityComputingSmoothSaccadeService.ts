import { SmoothPursuitTest } from "../models/smoothPursuitTest";

export interface SeparatedFrames { horizontalFrames: SmoothPursuitTest[], verticalFrames: SmoothPursuitTest[] }

export abstract class VelocityComputingSmoothSaccadeService {

    protected verticalRatio: number;
    protected velocityHorizontalArray: number[] = [];
    protected readonly COUNT_OF_SKIPPED = 15;
    protected readonly BAD_RESULT = -1;

    public abstract computeVelocityData(frames: SmoothPursuitTest[]): number[];

    public separateFrames(frames: SmoothPursuitTest[]): SeparatedFrames {
        const verticalFramesCount = frames.findIndex(f => f.stimuliOSx !== 0);
        const separatedFrames: SeparatedFrames = {
            verticalFrames: frames.splice(0, verticalFramesCount),
            horizontalFrames: frames
        };

        return separatedFrames;
    }

    protected computeVelocityByHorizontalMovement(time: number,
        calibrationAngle: number, secondDotAngle: number): number {
        return time !== 0
            ? Math.abs((secondDotAngle - calibrationAngle) / time)
            : 0;
    }

    
}
