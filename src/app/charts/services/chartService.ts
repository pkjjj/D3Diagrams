import { ICamMessage } from '../models/charts.model';

export abstract class ChartService {
    constructor() {}
    public abstract addData(frames: ICamMessage[]): Promise<void>;
    public abstract setCamData(frames: ICamMessage[]): void;
    public abstract export(): any;
    public abstract clearData(): void;
    public getXvalue(startTs: number, currentRawTs: number): number {
        const currentTs: number = currentRawTs / 10000;
        return Math.abs((currentTs - startTs) / 1000);
    }
}
