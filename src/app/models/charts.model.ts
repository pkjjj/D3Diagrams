// import { ISmartImage } from '../../saccadioweb/common/interfaces/smart-image.interface';

import { ICalibrationData, ICalibrationMovementChartData } from "../saccade-memory-test/constants/types";

export interface ICamMessage {
    chartTypeString: TEST_TYPE; // тип теста !!
    message_type: MESSAGE_TYPE; // тип сообщения !!
    timestamp: number; // и так понятно !!
    exitType?: number;
    metadata?: string;
    target?: string; // OS/OD !! targettype
    targetType?: number; // OD -  0 | OS - 1
    measurement?: number; // диаметр зрачка в Пьюпл тесте
    backgroundColor?: number; // цвет фона
    numtest?: number; // порядковый номер теста
    diameter?: number; // диаметр зрачка в Конвердженс тесте
    ppdistance?: number; // расстояние между зрачками
    age?: number;
    z?: number; // расстояние до виртуального видимого объекта
    targetx?: number;
    targety?: number;
    calibratedOSx?: number;
    rawODx?: number;
    rawODy?: number;
    rawOSx?: number;
    rawOSy?: number;
    greenDotIndex?: number;
    redDotIndex?: number;
    stage?: number;
    calibrationAngleOS?: number;
    calibrationGlintData?: ICalibrationData;
    trial?: number;
    pointX?: number;
    pointY?: number;
    seconds?: number; // сколько прошло секунд
    angleGreenDotPointY?: number;
    angleRedDotPointY?: number;
    seen?: number;
    direction?: number;
    lineType?: number;
    lineColor?: string;
    pulseduration?: number;
    pupilamplitude?: number;
    pupilvelocity?: number;
    pupillatency?: number;
    pupilsymmetry?: number;
    eyeODx?: number;
    eyeODy?: number;
    eyeOSx?: number;
    eyeOSy?: number;
    eyeOS?: number;
    stimuliODx?: number;
    stimuliODy?: number;
    stimuliOSx?: number;
    stimuliOSy?: number;
    stimuliOS?: number;
    verticalPointY?: number;
    horizontalPointY?: number;
    // Ptosis fields start
    ODBottomX?: number;
    ODBottomY?: number;
    ODCenterX?: number;
    ODCenterY?: number;
    ODSize?: number;
    ODTopX?: number;
    ODTopY?: number;
    OSBottomX?: number;
    OSBottomY?: number;
    OSCenterX?: number;
    OSCenterY?: number;
    OSSize?: number;
    OSTopX?: number;
    OSTopY?: number;
    picture?: string;
    // smartImage?: ISmartImage;
    // Ptosis fields end
}

export enum MESSAGE_TYPE {
    START_TEST, // 0 начало теста
    STOP_TEST, // 1 конец теста
    START_PUPIL_DATA_TRANSMISSION, // 2 начало субтеста диаметра зрачка
    STOP_PUPIL_DATA_TRANSMISSION, // 3 конец субтеста диаметра зрачка
    START_BACKGROUND_DATA_TRANSMISSION, // 4 начало периода с определенным цветом фона
    STOP_BACKGROUND_DATA_TRANSMISSION, // 5 конец периода с определенным цветом фона
    DATA_PACKAGE, // 6 данные для субтеста диаметра зрачка и данные для установки фона
    START_CONVERGENCE_NPC_DATA_TRANSMISSION, // 7
    STOP_CONVERGENCE_NPC_DATA_TRANSMISSION, // 8
    START_CONVERGENCE_RECOVERY_DATA_TRANSMISSION, // 9
    STOP_CONVERGENCE_RECOVERY_DATA_TRANSMISSION, // 10
    START_CENTER_SHOWING, // 11
    STOP_CENTER_SHOWING, // 12
    START_PERIPHERAL_SHOWING, // 13
    STOP_PERIPHERAL_SHOWING, // 14
    CONFIRMATION = 'OK',
    ERROR = 'ERROR',
    START_SEQUENCE = 15, // used in acuity1,fly,cover
    CONFIGURATION_PARAMS = 16, // used in cover to pass device params and such
}

export enum BACKGROUND_COLOR {
    LIGHT,
    DARK,
    RELAX,
}

export enum TEST_TYPE {
    SACCADE_MERGED,
}

export interface ICamTestData {
    _id?: string;
    data: Array<ICamMessage>;
}

export interface IChartData {
    calibrationData?: ICalibrationMovementChartData;
    testResults?: ITestResults;
    framesData?: ICamMessage[];
    horizontalVelocityFrames?: ICamMessage[];
    verticalVelocityFrames?: ICamMessage[];
    pursuitVerticalTestResults?: ISaccadeResult[];
    pursuitHorizontalTestResults?: ISaccadeResult[];
}

export interface ITestResults {
    correctResponseCount: number;
    inhibitoryError: number;
    noReponseError: number;
    totalCount: number;
    averageLatency: number;
    latencyArray: number[];
}

export interface ISaccadeResult {
    id?: number;
    saccadesResults?: {
        latency?: number;
        peakVelocity?: number;
        amplitude? : number;
    }[];
    noResponse?: boolean;
}

export interface SeparatedFrames { horizontalFrames: ICamMessage[], verticalFrames: ICamMessage[] }
