import { Injectable } from "@angular/core";
import { LEFT_EYE, RIGHT_EYE } from "../constants/constants";
import { ICamMessage } from "../models/charts.model";
import { SharedService } from "./shared.service";

@Injectable()
export class ParsingService {

    private firstTimestamp: number;

    constructor(private sharedService: SharedService) {}

    public parseFrames(frames: ICamMessage[]) {
        frames.forEach((frame) => {
            frames = this.removeZeroElements(frames);

            frame.seconds = this.sharedService.convertTimestampToSeconds(frame.timestamp);

            this.firstTimestamp = this.firstTimestamp ?? frame.seconds;

            frame.pointX = frame.seconds - this.firstTimestamp;

            frame.target = frame.targetType == 0
                ? LEFT_EYE
                : RIGHT_EYE;

            frame.angleGreenDotPointY = this.getDegreeByIndex(frame.greenDotIndex);
            frame.angleRedDotPointY = this.getDegreeByIndex(frame.redDotIndex);
        });

        return frames;
    }

    private getDegreeByIndex(dotIndex: number) {
        switch (dotIndex) {
          case 0:
            return -10;
          case 1:
            return -5;
          case 2:
            return 0;
          case 3:
            return 5;
          case 4:
            return 10;
          default:
            throw new Error('wrong dot Index value');
        }
    }

    // remove elements when patient blinks or maybe it was flash
    private removeZeroElements(frames: ICamMessage[]): ICamMessage[] {
        for (let i = frames.length - 1; i >= 0; --i)
        {
            frames[i].rawODx == 0
              ? frames.splice(i, 1)
              : frames[i].pointY = frames[i].rawODx;
        }

        return frames;
    }
}
