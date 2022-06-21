export interface ILine {
    id: string,
    color: string
}

export interface ICalibrationMovementChartData {
    startOfAxisX: number;
    yScaleMaxValue: number;
    yScaleMinValue: number;
    yScaleAngleMaxValue: number;
    yScaleAngleMinValue: number;
}

export interface ICalibrationDot {
    rawODx: number;
    angleGreenDotPointY: number;
}

export interface ICalibrationData {
    calibationGlintData: number,
    pixelDifference: number,
    firstPointYOfTrial: number;
    ratio: number,
}

export enum CHART_TYPE {
    MOVEMENT,
    VELOCITY,
    REAL_TIME,
}
