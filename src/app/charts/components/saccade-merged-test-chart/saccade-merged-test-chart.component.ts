import { AfterViewInit, Component, ElementRef, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { BehaviorSubject, first, Subscription } from 'rxjs';
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

export interface Line {
    id: string,
    color: string
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
    public lastPoint: [number, number][] = [];
    public line: {  };
    public amountGreenDots: number;
    // чартсервис - сервис в котором должна быть реализована вся бизнес-логикаа
    constructor(public chartService: SaccadesMergedChartService, private requestService: RequestService) {
        super();
    }
    // в этом хуке активируются все нужные подписки
    ngOnInit(): void {
        this.subscriptions.push(this.requestService.getMemoryData().subscribe());

        this.requestService.getMemoryData()
        .subscribe(data => {
            this.jsonTestsResult = this.parseStringToJson(data);
            this.frames = this.jsonTestsResult;
            this.frames.shift();
            this.frames.pop();
        });
    }
    // в этом хуке СВГ уже инициализирован. можно начинать рисовать
    ngAfterViewInit(): void {}
    // этот хут отрабатывает при удалении компонента из дома
    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
    // build real-time chart
    public buildRealTimeChart() {
        this.chartService.addData(this.frames)
            .then(frames => {
                this.initializeChart(frames);
            });

        const interval = setInterval(() => {
            this.frames.length !== 0
            ? this.drawPointsByAmount(100)
            : clearInterval(interval);
        }, 100);
    }
    // build recorded chart
    public buildRecordedChart() {
      const parsedFrames = this.chartService.setCamData(this.frames);

      this.initializeChart(parsedFrames);
      this.drawPoints(parsedFrames);
      this.drawGreenLines(parsedFrames);
    }
    public clearChart(chartType: CHART_TYPE) {

    }
    private drawPointsByAmount(framesCount: number) {
      this.chartService.addData(this.frames.splice(0, framesCount))
        .then(frames => {
            this.drawPoints(frames);
            this.drawGreenLine(frames);
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
          .domain([d3.max(data, d => d.pointY), d3.min(data, d => d.pointY)])
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
          .style('transform', 'translate(' + (this.margin - 30) + 'px,  0)')

        this.xScale = d3
          .scaleLinear()
          .domain(d3.extent(data, d => d.pointX));

        this.xAxis = this.svgInner
          .append('g')
          .attr('id', 'x-axis')
          .style('transform', 'translate(0, ' + (this.height / 2 - this.margin) + 'px)');

        this.svgInner.append('g')

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
    private drawPoints(data: ICamMessage[]): void {
        if (this.lastPoint.length != 0) {
            const firstTime: [number, number] = [this.xScale(data[0].pointX), this.yScale(data[0].pointY)]
            this.lastPoint.push(firstTime);
        }

        this.drawLineOnChart(this.lastPoint, { id: 'line', color: 'red'});

        this.lastPoint = [];

        const points: [number, number][] = data.map(d => [
          this.xScale(d.pointX),
          this.yScale(d.pointY),
        ]);

        this.lastPoint.push(points[data.length - 1]);

        this.drawLineOnChart(points, { id: 'line', color: 'red'});




    }
  private drawGreenLine(data: ICamMessage[]): void {
    const greenLinePoints: [number, number][] = data.filter(el => el.stage != 3).map(d => [
      this.xScale(d.pointX),
      this.yScaleAngle(d.angleGreenDotPointY),
    ]);
    this.drawLineOnChart(greenLinePoints, { id: 'greenLine', color: 'green' });
  }

  private drawGreenLines(data: ICamMessage[]) {
    let greenDotIndex: number = null;
    let indexValue = 0;

    data.forEach(frame => {
      if (frame.greenDotIndex != greenDotIndex) {
        greenDotIndex = frame.greenDotIndex;
        indexValue = data.findIndex(el => el.greenDotIndex != greenDotIndex);
        // const resultArray = data.filter(el => el.stage != 3 && el.greenDotIndex != greenDotIndex);
        // const lastIndex = resultArray.indexOf(resultArray[resultArray.length - 1]);
        const greenLinePoints: [number, number][] = data.splice(0, indexValue).filter(el => el.stage != 3).map(d => [
          this.xScale(d.pointX),
          this.yScaleAngle(d.angleGreenDotPointY),
        ]);
        this.drawLineOnChart(greenLinePoints, { id: 'greenLine', color: 'green' });

        return;
      }
    });
  }

    private drawLineOnChart(points: [number, number][],
    lineStyle: Line): void {
        const line = d3
        .line()
        .x(d => d[0])
        .y(d => d[1])
        .curve(d3.curveMonotoneX);

        this.svgInner
          .append('path')
          .attr('id', lineStyle.id)
          .attr('d', line(points))
          .style('fill', 'none')
          .style('stroke', lineStyle.color)
          .style('stroke-width', '2px');
    }
    // compute axis X location with scale factor. Axis should be on 274 y point.
    // private computeLocationAxisX(data: ICamMessage[]): number {
    //   const values = d3.extent(data, d => d.pointY);
    //   const difference = values[1] - values[0];

    //   const scaleFactor = difference !== 0
    //     ? this.height / difference
    //     : 0;

    //   const offsetToBottom = values[1] - START_OF_AXIS_X;
    //   const offsetToBottomWithFactor = offsetToBottom * scaleFactor;

    //   return offsetToBottomWithFactor;
    // }

    // функция для очистки данных перед загрузкой новых
    public clearData(): void {}
    // пока не парься
    public setEdits(edits: IChartEdit[]): void {}
    // функция для внесения данных частично (передача данных с кама в реальном времени)
    public async addData(frames: ICamMessage[]): Promise<void> {}
    // функция для внесения данных в полном объеме за раз (передача данных из БД)
    public setCamData(frames: ICamMessage[]): void {}
}
