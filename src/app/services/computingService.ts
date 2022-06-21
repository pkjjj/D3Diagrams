import { ICamMessage, IChartData } from "../models/charts.model";

export abstract class ComputingService {
    public abstract computeChartData(frames: ICamMessage[]): IChartData;
}
