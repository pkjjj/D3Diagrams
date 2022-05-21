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
import { RequestService } from '../../services/request.service';

export enum CHART_TYPE {
  VELOCTIY,
  MOVEMENT
}
export class timestamp {
  firstTimestamp: number
}

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
    private counter = 0;

    public frames: ICamMessage[];
    public data: ICamMessage[] = null;
    public svg;
    public svgInner;
    public yScale;
    public yScaleAngle;
    public xScale;
    public xAxis;
    public yAxisDistance;
    public yAxisAngle;
    public lineGroup;
    public line;
    public dataSubject: BehaviorSubject<ICamMessage[]> = new BehaviorSubject<ICamMessage[]>(null);
    // чартсервис - сервис в котором должна быть реализована вся бизнес-логикаа
    constructor(public chartService: SaccadesMergedChartService, private requestService: RequestService) {
        super();
    }
    // в этом хуке активируются все нужные подписки
    ngOnInit(): void {
        this.requestService.getMemoryData()
          .subscribe(data => {
              this.jsonTestsResult = this.parseStringToJson(data);
              this.frames = this.jsonTestsResult;
              this.frames.shift();
              this.frames.pop();

              this.chartService.addData(this.frames)
                  .then(frames => {
                      this.initializeChart(frames);
                  });

              const interval = setInterval(() => {
                  this.frames.length !== 0
                  ? this.getPointsForChart(100)
                  : clearInterval(interval);
              }, 100);
          });
    }
    // в этом хуке СВГ уже инициализирован. можно начинать рисовать
    ngAfterViewInit(): void {}
    // этот хут отрабатывает при удалении компонента из дома
    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
    public buildRealTimeChart(chartType: CHART_TYPE) {

    }
    public buildRecordedChart(chartType: CHART_TYPE) {

    }
    public clearChart(chartType: CHART_TYPE) {

    }
    private getPointsForChart(framesCount: number) {
      this.chartService.addData(this.frames.slice(0 + this.counter, framesCount + this.counter))
        .then(frames => {
            this.data = this.data === null
            ? frames
            : this.data.concat(frames);

            this.drawPoints(this.data);
            this.counter += 100;
        });
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
    private initializeChart(data: ICamMessage[]): void {
        this.svg = d3
          .select(this.svgp.nativeElement)
          .attr('height', this.height)
          .attr('width', '100%');

        this.svgInner = this.svg
          .append('g')
          .style('transform', 'translate(' + this.margin + 'px, ' + this.margin + 'px)');

        this.yScale = d3
          .scaleLinear()
          .domain([d3.max(data, d => d.pointY) + 1, d3.min(data, d => d.pointY) - 1])
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
          .domain(d3.extent(data, d => d.pointX));

        this.xAxis = this.svgInner
          .append('g')
          .attr('id', 'x-axis')
          .style('transform', 'translate(0, ' + this.computeLocationAxisX(data) + 'px)');

        // this.lineGroup = this.svgInner
        //   .append('g')
        //   .append('path')
        //   .attr('id', 'line')
        //   .style('fill', 'none')
        //   .style('stroke', 'red')
        //   .style('stroke-width', '2px');

        this.width = this.svgp.nativeElement.getBoundingClientRect().width;

        this.xScale.range([this.margin, this.width - 2 * this.margin]);

        const xAxis = d3
          .axisBottom(this.xScale);

        this.xAxis.call(xAxis);

        const yAxis = d3
          .axisLeft(this.yScale);
        const yAxisAngle = d3
          .axisLeft(this.yScaleAngle)
          .ticks(5);

        this.yAxisDistance.call(yAxis);
        this.yAxisAngle.call(yAxisAngle);
    }
    private drawPoints(data: ICamMessage[]) {
        const line = d3
          .line()
          .x(d => d[0])
          .y(d => d[1])
          .curve(d3.curveMonotoneX);

        const points: [number, number][] = data.map(d => [
          this.xScale(d.pointX),
          this.yScale(d.pointY),
        ]);

        this.svgInner
        .append('g')
        .append('path')
        .attr('id', 'line')
        .attr('d', line(points))
        .style('fill', 'none')
        .style('stroke', 'red')
        .style('stroke-width', '2px');
    }
    // compute axis X location with scale factor. Axis should be on 274 y point.
    private computeLocationAxisX(data: ICamMessage[]): number {
      const values = d3.extent(data, d => d.pointY);
      const difference = values[1] - values[0];

      const scaleFactor = difference !== 0
        ? this.height / difference
        : 0;

      const offsetToBottom = values[1] - START_OF_AXIS_X;
      const offsetToBottomWithFactor = offsetToBottom * scaleFactor;

      return offsetToBottomWithFactor;
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
