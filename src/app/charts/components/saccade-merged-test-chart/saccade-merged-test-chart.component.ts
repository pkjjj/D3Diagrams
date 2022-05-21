import { AfterViewInit, Component, ElementRef, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { IChartEdit } from '../../components/haploChart.component';
import { ICamMessage } from '../../models/charts.model';
import { SaccadesMergedChartService } from '../../services/saccadesMergedChartService';
import { BulbicamChartComponent } from '../haploChart.component';
import { HttpClient } from '@angular/common/http';

import * as d3 from 'd3';
import * as d3Scale from 'd3';
import * as d3Shape from 'd3';
import * as d3Array from 'd3';
import * as d3Axis from 'd3';
import { RANGE_OF_ANGLES, START_OF_AXIS_X } from '../../constants/constants';



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
    private jsonTestsResult: any;

    private width = 700;
    private height = 700;
    private margin = 50;

    public data: ICamMessage[];
    public svg;
    public svgInner;
    public yScale;
    public yScaleAngle;
    public xScale;
    public xAxis;
    public yAxisDistance;
    public yAxisAngle;
    public lineGroup;
    public dataSubject: BehaviorSubject<ICamMessage[]> = new BehaviorSubject<ICamMessage[]>(null);
    // чартсервис - сервис в котором должна быть реализована вся бизнес-логикаа
    constructor(public chartService: SaccadesMergedChartService, private httpClient: HttpClient) {
        super();
    }
    // в этом хуке активируются все нужные подписки
    ngOnInit(): void {
        this.httpClient.get('assets/charts/16522699559352059.log', {responseType: 'text'})
          .subscribe(data => {
              this.jsonTestsResult = this.parseStringToJson(data);
              let frames: ICamMessage[] = this.jsonTestsResult;

              this.chartService.addData(frames)
                .then(frames => {
                      this.dataSubject.next(frames);
                });
          });
    }
    // в этом хуке СВГ уже инициализирован. можно начинать рисовать
    ngAfterViewInit(): void {
        this.dataSubject.subscribe(value => {
            if (value) {
                this.data = value;
                this.initializeChart();
                this.drawChart();
            }
        });
    }
    // этот хут отрабатывает при удалении компонента из дома
    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
    //make static
    private parseStringToJson(data: string): string {
        let parsedString = data.replace(/\s/g, '')
          .replace(/<([^}]+){/g, '{')
          .replace(/}/g, '},')
          .slice(0, -1);

        parsedString = '[' + parsedString + ']';
        return JSON.parse(parsedString);
    }
    private initializeChart(): void {
        this.svg = d3
          .select(this.svgp.nativeElement)
          .attr('height', this.height)
          .attr('width', '100%');

        this.svgInner = this.svg
          .append('g')
          .style('transform', 'translate(' + this.margin + 'px, ' + this.margin + 'px)');

        this.yScale = d3
          .scaleLinear()
          .domain([d3.max(this.data, d => d.pointY) + 1, d3.min(this.data, d => d.pointY) - 1])
          .range([0, this.height - 2 * this.margin]);

        this.yScaleAngle = d3
          .scaleLinear()
          .domain([RANGE_OF_ANGLES.from, RANGE_OF_ANGLES.to])
          .range([0, this.height - 2 * this.margin]);

        this.yAxisDistance = this.svgInner
          .append('g')
          .attr('id', 'y-axisDistance')
          .style('transform', 'translate(' + this.margin + 'px,  0)');

        this.yAxisAngle = this.svgInner
          .append('g')
          .attr('id', 'y-axisAngle')
          .style('transform', 'translate(' + (this.margin - 30) + 'px,  0)');

        this.xScale = d3
          .scaleLinear()
          .domain(d3.extent(this.data, d => {console.log(Math.round(d.pointX));return d.pointX}));

        this.xAxis = this.svgInner
          .append('g')
          .attr('id', 'x-axis')
          .style('transform', 'translate(0, ' + this.computeLocationAxisX() + 'px)');

        this.lineGroup = this.svgInner
          .append('g')
          .append('path')
          .attr('id', 'line')
          .style('fill', 'none')
          .style('stroke', 'red')
          .style('stroke-width', '2px')
    }
    // compute axis X location with scale factor. Axis should be on 274 y point.
    private computeLocationAxisX(): number {
        const values = d3.extent(this.data, d => d.pointY);
        const difference = values[1] - values[0];

        const scaleFactor = difference !== 0
          ? this.height / difference
          : 0;

        const offsetToBottom = values[1] - START_OF_AXIS_X;
        const offsetToBottomWithFactor = offsetToBottom * scaleFactor;

        return offsetToBottomWithFactor;
    }
    private drawChart(): void {
        this.width = this.svgp.nativeElement.getBoundingClientRect().width;

        this.xScale.range([this.margin, this.width - 2 * this.margin]);

        const xAxis = d3
          .axisBottom(this.xScale);
          // .ticks(10)
          // .tickFormat(d3.timeSecond());

        this.xAxis.call(xAxis);

        const yAxis = d3
          .axisLeft(this.yScale);
        const yAxisAngle = d3
          .axisLeft(this.yScaleAngle)
          .ticks(5);

        this.yAxisDistance.call(yAxis);
        this.yAxisAngle.call(yAxisAngle);

        const line = d3
          .line()
          .x(d => d[0])
          .y(d => d[1])
          .curve(d3.curveMonotoneX);

        const points: [number, number][] = this.data.map(d => [
          this.xScale(d.pointX),
          this.yScale(d.pointY),
        ]);

        this.lineGroup.attr('d', line(points));
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
