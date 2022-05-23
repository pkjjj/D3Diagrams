import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { ILine } from 'src/app/charts/constants/types';
import * as d3 from 'd3';
import { ICamMessage } from 'src/app/charts/models/charts.model';
import { SaccadesMergedChartService } from 'src/app/charts/services/saccadesMergedChartService';
import { RequestService } from 'src/app/charts/services/request.service';
import { SharedService } from 'src/app/charts/services/shared.service';
import { FLASHING_STAGE, FRAMES_FOR_UPDATE, LAST_STAGE_WITHOUT_GREEN_POINT, RANGE_OF_ANGLES, START_OF_AXIS_X } from 'src/app/charts/constants/constants';

@Component({
  selector: 'app-saccade-movement-chart',
  templateUrl: './saccade-movement-chart.component.html',
  styleUrls: ['./saccade-movement-chart.component.css']
})
export class SaccadeMovementChartComponent implements OnInit {
    @ViewChild('chart') private svgElement: ElementRef;
    @Input() public data: ICamMessage[];
    @Input() public width: number = 700;
    @Input() public height: number = 700;
    @Input() public margin: number = 50;

    private initialFrames: ICamMessage[];
    private frames: ICamMessage[];
    private svg: d3.Selection<any, unknown, null, undefined>;
    private svgInner: any;
    private yScale: any;
    private yScaleAngle: any;
    private xScale: any;
    private xAxis: any;
    private yAxisDistance: any;
    private yAxisAngle: any;
    private lastPoint: [number, number][] = [];
    private trialsCount: number;

    constructor(private chartService: SaccadesMergedChartService, private requestService: RequestService,
      private sharedService: SharedService) { }

    ngOnInit() {
        this.requestService.getMemoryData()
          .subscribe(data => {
              this.initialFrames = this.sharedService.parseStringToJson(data) as ICamMessage[];
              this.frames = [ ...this.initialFrames ];
              this.trialsCount = this.frames[this.frames.length - 1].trial;
        });
    }

    // build real-time chart
    public buildRealTimeChart() {
        if (d3.select('#chartContent').empty()) {
            this.chartService.addData(this.frames)
            .then(initialFrames => {
                this.initializeChart(initialFrames);
            });
        }

        const interval = setInterval(() => {
            this.frames.length !== 0
            ? this.drawPointsByFramesAmount(FRAMES_FOR_UPDATE.framesPerBlock)
            : clearInterval(interval);
        }, FRAMES_FOR_UPDATE.millisecondsPerBlock);
    }

    // build recorded chart
    public buildRecordedChart() {
        const parsedFrames = this.chartService.setCamData(this.frames);
        if (d3.select('#chartContent').empty()) {
            this.initializeChart(parsedFrames);
        }
        this.drawPoints(parsedFrames);
        this.drawGreenLines([ ...parsedFrames ]);
        this.drawRedCircle([ ...parsedFrames ]);
    }

    // clear chart
    public clearChart() {
        d3.select('#chartPoints').selectChildren().remove();
        this.frames = [ ...this.initialFrames ];
        this.lastPoint = [];
    }

    private drawPointsByFramesAmount(framesCount: number) {
        this.chartService.addData(this.frames.splice(0, framesCount))
          .then(frames => {
              this.drawPoints(frames);
              this.drawGreenLines([ ...frames ]);
              this.drawRedCircle([ ...frames ]);
          });
    }

    private initializeChart(data: ICamMessage[]): void {
        this.svg = d3
          .select(this.svgElement.nativeElement)
          .attr('height', this.height)
          .attr('width', '100%');

        this.svgInner = this.svg
          .append('g')
          .attr('id', 'chartContent')
          .style('transform', 'translate(' + this.margin + 'px, ' + this.margin + 'px)');

        this.yScale = d3
          .scaleLinear()
          .domain([d3.max(data, d => d.pointY + 13), d3.min(data, d => d.pointY)])
          .range([0, this.height - 2 * this.margin]);

        this.yScaleAngle = d3
          .scaleLinear()
          .domain([RANGE_OF_ANGLES.from, RANGE_OF_ANGLES.to])
          .range([0, this.height - 2 * this.margin]);

        this.yAxisDistance = this.svgInner
          .append('g')
          .attr('id', 'y-axisDistance')
          .style('transform', 'translate(' + (this.margin) + 'px,  0)');

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
          .style('transform', 'translate(0, ' + (this.height / 2 - this.margin) + 'px)');

        this.svgInner = this.svgInner
          .append('g')
          .attr('id', 'chartPoints');

        this.width = this.svgElement.nativeElement
          .getBoundingClientRect()
          .width;

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

        this.drawLineOnChart(this.lastPoint, { id: 'line', color: 'blue'});

        this.lastPoint = [];

        const points: [number, number][] = data.map(d => [
          this.xScale(d.pointX),
          this.yScale(d.pointY),
        ]);

        this.lastPoint.push(points[points.length - 1]);

        this.drawLineOnChart(points, { id: 'line', color: 'blue'});
    }

    private drawGreenLine(data: ICamMessage[]): void {
        const greenLinePoints: [number, number][] = data
        .filter(el => el.stage != LAST_STAGE_WITHOUT_GREEN_POINT)
        .map(d => [
          this.xScale(d.pointX),
          this.yScaleAngle(d.angleGreenDotPointY),
        ]);
        console.log(greenLinePoints)
        this.drawLineOnChart(greenLinePoints, { id: 'line', color: 'green' });
    }

    private drawGreenLines(data: ICamMessage[]) {
        let greenDotIndex: number = null;
        let indexValue = 0;

        data.forEach(frame => {
            if (frame.greenDotIndex != greenDotIndex) {
              greenDotIndex = frame.greenDotIndex;
              console.log(greenDotIndex)
              indexValue = data.findIndex(el => el.greenDotIndex != greenDotIndex);
              console.log(indexValue)
              const greenLinePoints: [number, number][] = data
                .splice(0, indexValue)
                .filter(el => el.stage != LAST_STAGE_WITHOUT_GREEN_POINT)
                .map(d => [
                    this.xScale(d.pointX),
                    this.yScaleAngle(d.angleGreenDotPointY),
                ]);

              this.drawLineOnChart(greenLinePoints, { id: 'greenLine', color: 'green' });
            }
        });
    }

    private drawRedCircle(data: ICamMessage[]) {
        const radius = 5;
        // console.log(data.length);
        for (let i = 0; i < this.trialsCount; i++) {
            let indexValue = data.findIndex(el => el.stage == FLASHING_STAGE);

            this.svgInner
              .append('circle')
              .attr('cx', this.xScale(data[indexValue].pointX))
              .attr('cy', this.yScaleAngle(data[indexValue].angleGreenDotPointY) + radius)
              .attr('r', radius)
              .attr('fill', 'red');

            for (let i = indexValue; i < data.length; i++) {
                if (data[i].stage == FLASHING_STAGE)
                    indexValue = i;
                else
                    break;
            }
            data.splice(0, indexValue + 1);
        }
    }

    private drawLineOnChart(points: [number, number][],
    lineStyle: ILine): void {
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
}
