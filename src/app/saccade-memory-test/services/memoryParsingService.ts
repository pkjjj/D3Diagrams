import { Injectable } from "@angular/core";
import { ParsingService } from "src/app/services/parsingService";
import { ICamMessage } from "../../models/charts.model";

@Injectable()
export class MemoryParsingService extends ParsingService {

    public getDotsDegreeByIndex(frames: ICamMessage[]): ICamMessage[] {
        frames = this.removeZeroElements(frames);

        frames.forEach(frame => {
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
        for (let i = frames.length - 1; i >= 0; --i) {
            frames[i].rawODx == 0
            ? frames.splice(i, 1)
            : frames[i].pointY = frames[i].rawODx;
        }

        return frames;
    }
}
