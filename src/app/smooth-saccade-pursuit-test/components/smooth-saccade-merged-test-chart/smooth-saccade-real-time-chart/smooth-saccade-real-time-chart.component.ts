import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { ScaleLinear } from 'd3';
import { framesForUpdate, INDEX_DOT_FOR_CHECK } from 'src/app/saccade-memory-test/constants/real-time-chart';
import { ILine } from 'src/app/saccade-memory-test/constants/types';
import { ICamMessage } from 'src/app/saccade-memory-test/models/charts.model';
import { RequestService } from 'src/app/saccade-memory-test/services/request.service';
import { SharedService } from 'src/app/saccade-memory-test/services/shared.service';
import { SmoothPursuitMergedChartServiceService } from 'src/app/smooth-saccade-pursuit-test/services/smoothPursuitMergedChartService.service';

@Component({
  selector: 'app-smooth-saccade-real-time-chart',
  templateUrl: './smooth-saccade-real-time-chart.component.html',
  styleUrls: ['./smooth-saccade-real-time-chart.component.css']
})
export class SmoothSaccadeRealTimeChartComponent implements OnInit {
    @ViewChild('chart') private svgElement: ElementRef<SVGElement>;
    @Input() public data: ICamMessage[];
    @Input() public width = 700;
    @Input() public height = 700;
    @Input() public margin = 50;

    private initialFrames: ICamMessage[];
    private frames: ICamMessage[];
    private svg: d3.Selection<SVGElement, unknown, null, undefined>;
    private svgInner: d3.Selection<SVGElement, unknown, null, undefined>;
    private yScale: ScaleLinear<number, number, never>;
    private xScale: ScaleLinear<number, number, never>;
    private lastPoint: [number, number][] = [];
    private lastPointX: number;
    private readonly AXIS_X_MAX_VALUE = 62;
    private readonly MAX_Y_SCALE_VALUE = 300;
    private readonly MIN_Y_SCALE_VALUE = 180;

    constructor(private chartService: SmoothPursuitMergedChartServiceService, private requestService: RequestService,
      private sharedService: SharedService) { }

    ngOnInit() {
        this.requestService.getSmoothPursuitData()
          .subscribe(data => {
              this.initialFrames = this.sharedService.parseStringToJson(data) as ICamMessage[];
              this.frames = [ ...this.initialFrames ];
        });
    }

    // build real-time chart
    public async buildRealTimeChart() {
        if (d3.select('#realTimeChartContent').empty()) {
            this.initializeChart();
            for (let i = 0; i < this.frames.length / 100; i++) {
                await this.chartService.addData([ ...this.frames.splice(0, 100) ])
                    .then(initialFrames => {
                        console.log(initialFrames)
                        this.drawPoints([ ...initialFrames ]);
                        // this.tuneFramesCount(initialFrames);
                    });
            }
        }

        // const interval = setInterval(() => {
        //     this.frames.length !== 0
        //     ? this.drawPointsByFramesAmount(framesForUpdate.framesPerBlock)
        //     : this.hideChart(interval);
        // }, framesForUpdate.millisecondsPerBlock);
    }

    // clear chart
    public clearChart() {
        d3.select('#realTimeChartPoints').selectChildren().remove();
        this.frames = [ ...this.initialFrames ];
        this.lastPoint = [];
        this.lastPointX = null;
    }

    private hideChart(interval) {
        // clearInterval(interval);
        d3.select('#realTimeChart').remove();
    }

    private tuneFramesCount(initialFrames: ICamMessage[]) {
        initialFrames.forEach((frame, index) => {
          if (index % INDEX_DOT_FOR_CHECK == 0 && index != 0)
            initialFrames.splice(index - (INDEX_DOT_FOR_CHECK - 1), INDEX_DOT_FOR_CHECK);
        });
    }

    // private drawPointsByFramesAmount(framesCount: number) {
    //     this.chartService.addData(this.frames.splice(0, framesCount))
    //       .then(frames => {
    //           this.drawPoints([ ...frames ]);
    //       });
    // }

    private initializeChart(): void {
        this.svg = d3
          .select(this.svgElement.nativeElement)
          .attr('height', this.height)
          .attr('width', '100%')
          .attr('id', 'realTimeChart');

        this.svgInner = this.svg
          .append('g')
          .attr('id', 'realTimeChartContent')
          .style('transform', 'translate(' + (this.margin.toString() + 'px, ' + this.margin.toString()) + 'px)');

        this.yScale = d3
          .scaleLinear()
          .domain([this.MAX_Y_SCALE_VALUE, this.MIN_Y_SCALE_VALUE])
          .range([0, this.height - 2 * this.margin]);

        const yAxisDistance = this.svgInner
          .append('g')
          .attr('id', 'y-axisDistance')
          .style('transform', 'translate(' + (this.margin).toString() + 'px,  0)');

        this.xScale = d3
          .scaleLinear()
          .domain([0, this.AXIS_X_MAX_VALUE]);

        const timeAxisX = this.svgInner
          .append('g')
          .attr('id', 'x-axis')
          .style('transform', 'translate(0, ' + (this.height / 2 - this.margin).toString() + 'px)');

        this.svgInner = this.svgInner
          .append('g')
          .attr('id', 'realTimeChartPoints');

        this.width = this.svgElement.nativeElement.getBoundingClientRect().width;

        this.xScale.range([this.margin, this.width - 2 * this.margin]);

        const xAxis = d3
          .axisBottom(this.xScale);

        timeAxisX.call(xAxis);

        const yAxis = d3
          .axisLeft(this.yScale).tickValues([]);

        yAxisDistance.call(yAxis);
    }

    private drawPoints(data: ICamMessage[]): void {
        if (this.lastPoint.length != 0) {
            const firstTime: [number, number] =
              [
                this.xScale(data[0].pointX),
                this.yScale(data[0].eyeOSy)
              ]
            this.lastPoint.push(firstTime);
        }

        this.drawLineOnChart(this.lastPoint, { id: 'line', color: 'blue' });

        this.lastPoint = [];

        const points: [number, number][] = data.map(d => [
          this.xScale(d.pointX),
          this.yScale(d.eyeOSy),
        ]);

        this.lastPoint.push(points[points.length - 1]);

        this.drawLineOnChart(points, { id: 'line', color: 'blue' });
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
