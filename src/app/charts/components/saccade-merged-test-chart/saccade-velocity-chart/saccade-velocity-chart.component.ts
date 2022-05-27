import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { IPoint, ILine } from 'src/app/charts/constants/types';
import { ICamMessage } from 'src/app/charts/models/charts.model';
import { RequestService } from 'src/app/charts/services/request.service';
import { SaccadesMergedChartService } from 'src/app/charts/services/saccadesMergedChartService';
import { SharedService } from 'src/app/charts/services/shared.service';

@Component({
  selector: 'app-saccade-velocity-chart',
  templateUrl: './saccade-velocity-chart.component.html',
  styleUrls: ['./saccade-velocity-chart.component.css']
})
export class SaccadeVelocityChartComponent implements OnInit {
    @ViewChild('chart') private svgElement: ElementRef;
    @Input() public data: IPoint[];
    @Input() public width: number = 700;
    @Input() public height: number = 700;
    @Input() public margin: number = 50;

    private frames: ICamMessage[];
    private clonedFrames: ICamMessage[];
    private svg: d3.Selection<any, unknown, null, undefined>;
    private svgInner: any;
    private yScale: any;
    private xScale: any;
    private xAxis: any;
    private yAxisDistance: any;
    private lastPoint: [number, number][] = [];

    constructor(private chartService: SaccadesMergedChartService, private requestService: RequestService,
      private sharedService: SharedService) { }

    ngOnInit() {
        this.requestService.getMemoryData()
          .subscribe(data => {
              this.frames = this.sharedService.parseStringToJson(data) as ICamMessage[];
              this.clonedFrames = [ ...this.frames ];
        });
    }

    public buildRecordedChart(): void {
        if (this.data == null) {
            const parsedFrames = this.chartService.setCamData(this.clonedFrames);
            this.data = this.chartService.setVelocityData([...parsedFrames]);
        }

        if (d3.select('#velocityChartContent').empty()) {
            this.initializeChart(this.data);
        }
        this.drawPoints(this.data);
    }

    public clearChart(): void {
        d3.select('#velocityChartPoints').selectChildren().remove();
        this.clonedFrames = [ ...this.frames ];
        this.lastPoint = [];
    }

    private initializeChart(data: IPoint[]): void {
        this.svg = d3
          .select(this.svgElement.nativeElement)
          .attr('height', this.height)
          .attr('width', '100%');

        this.svgInner = this.svg
          .append('g')
          .attr('id', 'velocityChartContent')
          .style('transform', 'translate(' + this.margin + 'px, ' + this.margin + 'px)');

        this.yScale = d3
          .scaleLinear()
          .domain([d3.max(data, d => d.pointY), 0])
          .range([0, this.height - 2 * this.margin]);

        this.xScale = d3
          .scaleLinear()
          .domain(d3.extent(data, d => d.pointX));

        this.yAxisDistance = this.svgInner
          .append('g')
          .attr('id', 'y-axisDistance')
          .style('transform', 'translate(' + this.margin + 'px,  0)');

        this.xAxis = this.svgInner
          .append('g')
          .attr('id', 'x-axis')
          .style('transform', 'translate(0, ' + (this.height - this.margin * 2) + 'px)');

        this.svgInner = this.svgInner
          .append('g')
          .attr('id', 'velocityChartPoints')

        this.width = this.svgElement.nativeElement.getBoundingClientRect().width;

        this.xScale.range([this.margin, this.width - 2 * this.margin]);

        const xAxis = d3
          .axisBottom(this.xScale);

        this.xAxis.call(xAxis);

        const yAxis = d3
          .axisLeft(this.yScale);

        this.yAxisDistance.call(yAxis);
    }

    private drawPoints(data: IPoint[]): void {
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
