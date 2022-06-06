import { Injectable, Input } from '@angular/core';
import { ICamMessage } from '../models/charts.model';

export interface IChartMargin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export interface IChartEdit {}

@Injectable()
export abstract class BulbicamChartComponent {
    public modalChart = false;
    @Input() inputData: ICamMessage[] | null = null;
    @Input() examinationID: string | null = null;
    public abstract addData(frames: any): void;
    public abstract setEdits(edits: IChartEdit[]): void;
    /**
     *
     * @param edit (Alexanrd: you need to fill "timestamp", "fieldName", "previousValue" and "currentValue" properties)
     * @returns an updated array of edits for whole chart to show in UI
     */
    public addEdit: ((edit: IChartEdit) => Promise<IChartEdit[]>);
    // тут я реализую сохранение изменения и возврат всех изменений этого чарта (обрати внимание что в одном чарте могут быть изменены несколько точек. Соответственно у каждой точки будет свой список, который тебе нужно будет фильтровать скачала по таймстампу данных о точке а потом по дате изменения чтобы расположить их в хронологическом порядке.)
    public updateCamMessage: (<T>(frame: T) => Promise<void>);
    public deleteCamMessage: ((frameTS: number) => Promise<void>);
    public abstract clearData(signal: boolean): void;

    exportData: any;

    // optional configuration object of the test
    // if it is configured from the diagram UI
    startParams?: any;
}
