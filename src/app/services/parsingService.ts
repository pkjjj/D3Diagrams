import { Injectable } from "@angular/core";
import { LEFT_EYE, RIGHT_EYE } from "../saccade-memory-test/constants/constants";
import { ICamMessage } from "../saccade-memory-test/models/charts.model";
import { SharedService } from "../saccade-memory-test/services/shared.service";

@Injectable()
export abstract class ParsingService {

    private firstTimestamp: number;

    constructor(private sharedService: SharedService) {}

    public parseFrames(frames: ICamMessage[]): ICamMessage[] {

        frames.forEach((frame) => {
            frame.seconds = this.sharedService.convertTimestampToSeconds(frame.timestamp);

            this.firstTimestamp = this.firstTimestamp ?? frame.seconds;

            frame.pointX = frame.seconds - this.firstTimestamp;

            frame.target = frame.targetType == 0
                ? LEFT_EYE
                : RIGHT_EYE;
        });

        return frames;
    }
}
