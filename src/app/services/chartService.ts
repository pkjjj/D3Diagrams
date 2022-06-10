import { CHART_TYPE, IPoint } from '../saccade-memory-test/constants/types';
import { ICamMessage, IChartData } from '../saccade-memory-test/models/charts.model';

export abstract class ChartService {
    constructor() {}
    public abstract addData(frames: ICamMessage[]): Promise<ICamMessage[]>;
    public abstract setCamData(frames: ICamMessage[], chartType: CHART_TYPE): unknown;
    public abstract export(): any;
    public abstract clearData(): void;
    public getXvalue(startTs: number, currentRawTs: number): number {
        const currentTs: number = currentRawTs / 10000;
        return Math.abs((currentTs - startTs) / 1000);
    }
}
