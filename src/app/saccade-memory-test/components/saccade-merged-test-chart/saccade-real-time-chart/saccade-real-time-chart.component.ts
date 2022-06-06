import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { framesForUpdate, INDEX_DOT_FOR_CHECK } from 'src/app/saccade-memory-test/constants/real-time-chart';
import { ILine } from 'src/app/saccade-memory-test/constants/types';
import { ICamMessage } from 'src/app/saccade-memory-test/models/charts.model';
import { RequestService } from 'src/app/saccade-memory-test/services/request.service';
import { SaccadesMergedChartService } from 'src/app/saccade-memory-test/services/saccadesMergedChartService';
import { SharedService } from 'src/app/saccade-memory-test/services/shared.service';

@Component({
  selector: 'app-saccade-real-time-chart',
  templateUrl: './saccade-real-time-chart.component.html',
  styleUrls: ['./saccade-real-time-chart.component.css']
})
export class SaccadeRealTimeChartComponent implements OnInit {
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
    private xScale: any;
    private xAxis: any;
    private yAxisDistance: any;
    private lastPoint: [number, number][] = [];
    private lastPointX: number;
    private readonly AXIS_X_MAX_VALUE = 60;

    constructor(private chartService: SaccadesMergedChartService, private requestService: RequestService,
      private sharedService: SharedService) { }

    ngOnInit() {
        this.requestService.getMemoryData()
          .subscribe(data => {
              this.initialFrames = this.sharedService.parseStringToJson(data) as ICamMessage[];
              this.frames = [ ...this.initialFrames ];
        });
    }

    // build real-time chart
    public buildRealTimeChart() {
        if (d3.select('#realTimeChartContent').empty()) {
            this.chartService.addData(this.frames)
            .then(initialFrames => {

                this.tuneFramesCount(initialFrames);
                this.initializeChart(initialFrames);
            });
        }

        const interval = setInterval(() => {
            this.frames.length !== 0
            ? this.drawPointsByFramesAmount(framesForUpdate.framesPerBlock)
            : this.hideChart(interval);
        }, framesForUpdate.millisecondsPerBlock);
    }

    // clear chart
    public clearChart() {
        d3.select('#realTimeChartPoints').selectChildren().remove();
        this.frames = [ ...this.initialFrames ];
        this.lastPoint = [];
        this.lastPointX = null;
    }

    private hideChart(interval) {
        clearInterval(interval);
        d3.select('#realTimeChart').remove();
    }

    private tuneFramesCount(initialFrames: ICamMessage[]) {
        initialFrames.forEach((frame, index) => {
          if (index % INDEX_DOT_FOR_CHECK == 0 && index != 0)
            initialFrames.splice(index - (INDEX_DOT_FOR_CHECK - 1), INDEX_DOT_FOR_CHECK);
        });
    }

    private drawPointsByFramesAmount(framesCount: number) {
        this.chartService.addData(this.frames.splice(0, framesCount))
          .then(frames => {
              this.drawPoints([ ...frames ]);
          });
    }

    private initializeChart(data: ICamMessage[]): void {
        this.svg = d3
          .select(this.svgElement.nativeElement)
          .attr('height', this.height)
          .attr('width', '100%')
          .attr('id', 'realTimeChart');

        this.svgInner = this.svg
          .append('g')
          .attr('id', 'realTimeChartContent')
          .style('transform', 'translate(' + this.margin + 'px, ' + this.margin + 'px)');

        this.yScale = d3
          .scaleLinear()
          .domain([d3.max(data, d => d.pointY + 30), d3.min(data, d => d.pointY - 30)])
          .range([0, this.height - 2 * this.margin]);

        this.yAxisDistance = this.svgInner
          .append('g')
          .attr('id', 'y-axisDistance')
          .style('transform', 'translate(' + (this.margin) + 'px,  0)');

        this.xScale = d3
          .scaleLinear()
          .domain([0, this.AXIS_X_MAX_VALUE]);

        this.xAxis = this.svgInner
          .append('g')
          .attr('id', 'x-axis')
          .style('transform', 'translate(0, ' + (this.height / 2 - this.margin) + 'px)');

        this.svgInner = this.svgInner
          .append('g')
          .attr('id', 'realTimeChartPoints');

        this.width = this.svgElement.nativeElement
          .getBoundingClientRect()
          .width;

        this.xScale.range([this.margin, this.width - 2 * this.margin]);

        const xAxis = d3
          .axisBottom(this.xScale);

        this.xAxis.call(xAxis);

        const yAxis = d3
          .axisLeft(this.yScale).tickValues([]);

        this.yAxisDistance.call(yAxis);
    }

    private drawPoints(data: ICamMessage[]): void {
        if (this.lastPoint.length != 0) {
            const firstTime: [number, number] =
              [
                this.xScale(data[0].pointX),
                this.yScale(data[0].pointY)
              ]
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
        this.setChartBackgroundColor(data);
    }

    private setChartBackgroundColor(data: ICamMessage[]) {
        const firstPointX = this.lastPointX ?? data[0].pointX;
        const width = this.xScale(data[data.length - 1].pointX) - this.xScale(firstPointX);
        const pointX = this.xScale(firstPointX);

        this.svgInner
            .append("rect")
            .attr("x", pointX)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", this.height - 2 * this.margin)
            .attr("fill", "red")
            .attr("opacity", 0.2);

        this.lastPointX = data[data.length - 1].pointX;
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
}
