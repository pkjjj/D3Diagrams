import { AfterViewInit, Component, ElementRef, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { BehaviorSubject, first, Subscription } from 'rxjs';
import { IChartEdit } from '../../components/haploChart.component';
import { ICamMessage } from '../../models/charts.model';
import { BulbicamChartComponent } from '../haploChart.component';

@Component({
    selector: 'saccade-merged-test-chart',
    templateUrl: 'saccade-merged-test-chart.component.html',
    styleUrls: ['saccade-merged-test-chart.component.scss'],
})
export class SaccadeMergedBulbicamTestChartComponent extends BulbicamChartComponent implements OnInit, AfterViewInit, OnDestroy {
    // свг - элемент для рисования
    @ViewChild('chart') private svgp: ElementRef;
    // в массиве ниже хранятся все подписки
    private subscriptions: Subscription[] = [];
    // чартсервис - сервис в котором должна быть реализована вся бизнес-логикаа
    constructor() {
        super();
    }
    ngOnInit(): void {}
    ngAfterViewInit(): void {}
    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
    // функция для очистки данных перед загрузкой новых
    public clearData(): void {}
    // пока не парься
    public setEdits(edits: IChartEdit[]): void {}
    // функция для внесения данных частично (передача данных с кама в реальном времени)
    public async addData(frames: ICamMessage[]): Promise<void> {}
    // функция для внесения данных в полном объеме за раз (передача данных из БД)
    public setCamData(frames: ICamMessage[]): void {}
}
