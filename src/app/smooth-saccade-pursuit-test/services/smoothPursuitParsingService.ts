import { Injectable } from '@angular/core';
import { ICamMessage, SeparatedFrames } from 'src/app/models/charts.model';
import { ParsingService } from 'src/app/services/parsingService';

const INDEX_FOR_CHECK = 15;

@Injectable()
export class SmoothPursuitParsingServiceService extends ParsingService {

    // remove elements when patient blinks or maybe it was flash
    public removeZeroElements(frames: ICamMessage[]): ICamMessage[] {
        for (let i = frames.length - 1; i >= 0; --i) {
            if (frames[i].eyeOSx === 0 || frames[i].eyeOSx === 1000 || frames[i].eyeOSy === 0 || frames[i].eyeOSy === 1000)
                frames.splice(i, 1)
            else
                frames[i].pointY = frames[i].stimuliOSy;
        }

        return frames;
    }

    public separateFrames(frames: ICamMessage[]): SeparatedFrames {
        // const verticalFramesCount = frames.findIndex(f => f.stimuliOSx !== 0);
        // const separatedFrames: SeparatedFrames = {
        //     verticalFrames: frames.splice(0, verticalFramesCount),
        //     horizontalFrames: frames
        // };

        const index = frames.findIndex(f => f.stimuliOSy !== 0);
        const endIndex = frames.slice(index).findIndex(f => f.stimuliOSy === 0) + index;

        const separatedFrames: SeparatedFrames = {
            verticalFrames: frames.splice(0, endIndex + 1),
            horizontalFrames: frames
        };

        return separatedFrames;
    }

    public tuneHorizontalFrames(horizontalFrames: ICamMessage[]) {
        horizontalFrames.forEach(frame => {
            frame.stimuliOS = frame.stimuliOSx;
            frame.eyeOS = frame.eyeOSx;
        });
    }

    public tuneVerticalFrames(verticalFrames: ICamMessage[]) {
        verticalFrames.forEach(frame => {
            frame.stimuliOS = frame.stimuliOSy;
            frame.eyeOS = frame.eyeOSy;
        });
    }

    public tuneFrames(frames: ICamMessage[]) {
        frames.forEach(frame => {
            frame.stimuliOS = frame.stimuliOSy;
            frame.eyeOS = frame.eyeOSy;
        });
    }

    public removeHorizontalFrames(frames: ICamMessage[]): ICamMessage[] {
        const firstHorizontalIndex = frames.findIndex(f => f.stimuliOSx !== 0);
        const count = frames.length - firstHorizontalIndex;
        frames.splice(firstHorizontalIndex, count);

        return frames;
    }

    public removeVerticalFrames(frames: ICamMessage[]): ICamMessage[] {
        const verticalFramesCount = frames.findIndex(f => f.stimuliOSx !== 0);
        frames.splice(0, verticalFramesCount - 1);

        return frames;
    }

    // public tuneFrames(frames: ICamMessage[]): ICamMessage[] {
    //     const points: ICamMessage[] = []

    //     frames.forEach((frame, index) => {
    //       if (index % INDEX_FOR_CHECK == 0 && index != 0) {
    //         const lastFrames = frames.slice(index - INDEX_FOR_CHECK, index);

    //         const maxVelocityFrame = lastFrames
    //           .reduce((max, obj) => (max.pupilvelocity > obj.pupilvelocity) ? max : obj);
    //         points.push(maxVelocityFrame);
    //       }
    //     });

    //     points.push(frames[frames.length - 1]);

    //     return points;
    // }
}
