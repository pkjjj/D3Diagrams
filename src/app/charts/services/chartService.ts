import { CHART_TYPE } from '../constants/types';
import { ICamMessage } from '../models/charts.model';

export abstract class ChartService {
    constructor() {}
    public abstract addData(frames: ICamMessage[]): Promise<ICamMessage[]>;
    public abstract setCamData(frames: ICamMessage[], chartType: CHART_TYPE): void;
    public abstract export(): any;
    public abstract clearData(): void;
    public getXvalue(startTs: number, currentRawTs: number): number {
        const currentTs: number = currentRawTs / 10000;
        return Math.abs((currentTs - startTs) / 1000);
    }
}
