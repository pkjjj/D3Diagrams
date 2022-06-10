export interface SmoothPursuitTest {
    eyeODx?: number;
    eyeODy?: number;
    eyeOSx?: number;
    eyeOSy?: number;
    stimuliODx?: number;
    stimuliODy?: number;
    stimuliOSx?: number;
    stimuliOSy?: number;
    pointX?: number;
    pointY?: number;
    velocity?: number;
    diagramType?: SMOOTH_PURSUIT_CHART_TYPE;
}

export enum SMOOTH_PURSUIT_CHART_TYPE {
    HORIZONTAL,
    VERTICAL,
    HORIZONTAL_VERTICAL
}
