import { Injectable } from "@angular/core";
import { FLASHING_STAGE } from "../constants/movement-chart";
import { ICalibrationData, ICalibrationDot } from "../constants/types";
import { ICamMessage } from "../models/charts.model";

@Injectable()
export class CalibrationComputingService {

    constructor() {}

    public fillFramesByCalibrationData(frames: ICamMessage[]) {
        const trialCount = frames[frames.length - 1].trial + 1;
        const calibrationArray = [];

        for (let i = 0; i < trialCount; i++) {
            if (i + 1 > trialCount)
                break;

            if (i == trialCount - 1) {
                const previousTrialsArray = frames.filter(el => el.trial == i-1);
                const firstTrialsArray = frames.filter(el => el.trial == i);

                const calibrationData: ICalibrationData =
                  this.computeCalibrationData(previousTrialsArray, firstTrialsArray);

                calibrationData.firstPointYOfTrial = firstTrialsArray[0].rawODx;

                calibrationArray.push(calibrationData);
                break;
            }

            const firstTrialsArray = frames.filter(el => el.trial == i);
            const secondTrialsArray = frames.filter(el => el.trial == i+1);

            const calibrationData: ICalibrationData =
              this.computeCalibrationData(firstTrialsArray, secondTrialsArray);

            calibrationArray.push(calibrationData);
        }

        frames.forEach((frame) => {
            frame.calibrationGlintData = calibrationArray[frame.trial];
        });
    }

    private computeCalibrationData(firstTrialframes: ICamMessage[], secondTrialframes: ICamMessage[]) {

        const flashIndex = firstTrialframes.findIndex(el => el.stage == FLASHING_STAGE);
        const firstDot = firstTrialframes[flashIndex];
        const secondFlashIndex = secondTrialframes.findIndex(el => el.stage == FLASHING_STAGE);
        const secondDot = secondTrialframes[secondFlashIndex];

        return this.computeCalibrationGlintData(firstDot, secondDot);
    }

    private computeCalibrationGlintData(firstDot: ICamMessage, secondDot: ICamMessage) {
        let firstPointYOfTrial = firstDot.rawODx;
        const pixelDifference = firstDot.rawODx - secondDot.rawODx;
        const degreeDifference = firstDot.angleGreenDotPointY - secondDot.angleGreenDotPointY;
        const ratio = pixelDifference / degreeDifference;
        const calibationGlintData = firstDot.angleGreenDotPointY + (secondDot.rawODx - firstDot.rawODx) / ratio;

        return { calibationGlintData, pixelDifference, firstPointYOfTrial, ratio };
    }
}
