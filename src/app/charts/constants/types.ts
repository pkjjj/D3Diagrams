export interface ILine {
  id: string,
  color: string
}
export interface IPoint {
  pointX: number | Date,
  pointY: number | Date
}

export class CalibrationData {
  distance: number;
  firstDotAngleValue: number;
  secondDotAngleValue: number;
}
