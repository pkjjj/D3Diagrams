import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { IChartEdit } from '../../components/haploChart.component';
import { ICamMessage } from '../../models/charts.model';
import { SaccadesMergedChartService } from '../../services/saccadesMergedChartService';
import { BulbicamChartComponent } from '../haploChart.component';
import * as d3 from 'd3';
import * as d3Scale from 'd3';
import * as d3Shape from 'd3';
import * as d3Array from 'd3';
import * as d3Axis from 'd3';

@Component({
    selector: 'saccade-merged-test-chart',
    templateUrl: 'saccade-merged-test-chart.component.html',
    styleUrls: ['saccade-merged-test-chart.component.scss'],
})
export class SaccadeMergedBulbicamTestChartComponent extends BulbicamChartComponent implements OnInit, AfterViewInit, OnDestroy {
    // свг - элемент для рисования
    @ViewChild('saccadesChart') private svg: ElementRef;
    // в массиве ниже хранятся все подписки
    private subscriptions: Subscription[] = [];
    // чартсервис - сервис в котором должна быть реализована вся бизнес-логикаа
    constructor(public chartService: SaccadesMergedChartService) {
        super();
    }
    // в этом хуке активируются все нужные подписки
    ngOnInit(): void {
      d3.json('../assets/16522699559352059.log')
        .then(function(value) {
          console.log(value);
        });
    }
    // в этом хуке СВГ уже инициализирован. можно начинать рисовать
    ngAfterViewInit(): void {}
    // этот хут отрабатывает при удалении компонента из дома
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
