import { Injectable } from "@angular/core";
import { ICamMessage } from "../models/charts.model";

@Injectable()
export abstract class ParsingService {

    private firstTimestamp: number;

    constructor() {}

    public parseFrames(frames: ICamMessage[]): ICamMessage[] {

        frames.forEach((frame) => {
            frame.seconds = this.convertTimestampToSeconds(frame.timestamp);

            this.firstTimestamp = this.firstTimestamp ?? frame.seconds;

            frame.pointX = frame.seconds - this.firstTimestamp;
        });

        return frames;
    }

    public convertTimestampToSeconds(timestamp: number) {
        return new Date(timestamp/1e4).getTime() / 1000;
    }
}
