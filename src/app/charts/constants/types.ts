export interface ILine {
    id: string,
    color: string
}
export interface IPoint {
    pointX: number | Date,
    pointY: number | Date
}

export interface ICalibrationMovementChartData {
    startOfAxisX: number;
    yScaleMaxValue: number;
    yScaleMinValue: number;
    yScaleAngleMaxValue: number;
    yScaleAngleMinValue: number;
}

export enum CHART_TYPE {
  MOVEMENT,
  VELOCITY,
  REAL_TIME,
}
