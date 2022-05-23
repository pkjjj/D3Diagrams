export const LEFT_EYE = 'OD';
export const RIGHT_EYE = 'OS';
export const START_OF_AXIS_X = 273;
export const DEGREES_PER_PIXEL = 0.5;
export const FRAMES_PER_SECOND = 400;
export const MILLISECONDS_PER_FRAME = 1 / FRAMES_PER_SECOND;

// нужна ли
export const RANGE_OF_ANGLES = {
    from: 10,
    to: -10
};

export interface ILine {
  id: string,
  color: string
}
export interface IPoint {
  pointX: number | Date,
  pointY: number | Date
}
