import { Injectable } from '@angular/core';
import { ICamMessage } from 'src/app/saccade-memory-test/models/charts.model';
import { ParsingService } from 'src/app/services/parsingService';
import { SmoothPursuitTest } from '../models/smoothPursuitTest';

@Injectable()
export class SmoothPursuitParsingServiceService extends ParsingService {

    private resultFrames: SmoothPursuitTest[] = [];

    // remove elements when patient blinks or maybe it was flash
    public removeZeroElements(frames: ICamMessage[]): ICamMessage[] {
        for (let i = frames.length - 1; i >= 0; --i) {
            if (frames[i].eyeOSx == 0)
                frames.splice(i, 1)
            else
                frames[i].pointY = frames[i].stimuliOSy;
        }

        return frames;
    }

    public removeHorizontalFrames(frames: ICamMessage[]): ICamMessage[] {
        const firstHorizontalIndex = frames.findIndex(f => f.stimuliOSx !== 0);
        const count = frames.length - firstHorizontalIndex;
        frames.splice(firstHorizontalIndex, count);

        return frames;
    }

    public removeVerticalFrames(frames: ICamMessage[]): ICamMessage[] {
        const verticalFramesCount = frames.findIndex(f => f.stimuliOSx !== 0);
        frames.splice(0, verticalFramesCount);

        return frames;
    }

    // public tuneFramesArray(frames: ICamMessage[]): ICamMessage[] {
    //     frames.forEach(frame => {
    //         frame.verticalPointY = frame.
    //     });
    // }
}
