import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { ScaleLinear } from 'd3';
import { LINE_COLOR } from 'src/app/saccade-memory-test/components/saccade-merged-test-chart/saccade-velocity-chart/saccade-velocity-chart.constants';
import { FLASHING_STAGE } from 'src/app/saccade-memory-test/constants/movement-chart';
import { ILine } from 'src/app/saccade-memory-test/constants/types';
import { ICamMessage, IChartData } from 'src/app/saccade-memory-test/models/charts.model';
import { RequestService } from 'src/app/saccade-memory-test/services/request.service';
import { SaccadesMergedChartService } from 'src/app/saccade-memory-test/services/saccadesMergedChartService';
import { SharedService } from 'src/app/saccade-memory-test/services/shared.service';

@Component({
  selector: 'app-smooth-saccade-velocity-chart',
  templateUrl: './smooth-saccade-velocity-chart.component.html',
  styleUrls: ['./smooth-saccade-velocity-chart.component.scss']
})
export class SmoothSaccadeVelocityChartComponent implements OnInit {
    @ViewChild('chart') private svgElement: ElementRef;
    @Input() public data: ICamMessage[];
    @Input() public width = 1250;
    @Input() public height = 500;
    @Input() public margin = 50;

    private frames: ICamMessage[];
    private svg: d3.Selection<SVGElement, unknown, null, undefined>;
    private svgInner: d3.Selection<SVGElement, unknown, null, undefined>;
    private yScale: ScaleLinear<number, number, never>;
    private xScale: ScaleLinear<number, number, never>;
    private points: [number, number][] = [];
    private trialsCount: number;

    constructor(private chartService: SaccadesMergedChartService, private requestService: RequestService,
      private sharedService: SharedService) { }

    ngOnInit() {
        this.requestService.getMemoryData()
          .subscribe(data => {
              this.frames = this.sharedService.parseStringToJson(data) as ICamMessage[];
              this.trialsCount = this.frames[this.frames.length - 1].trial + 1;
        });
    }

    public buildRecordedChart(data: IChartData): void {
        if (d3.select('#velocityChartContent').empty()) {
            this.initializeChart(data.framesData);
        }
        console.log(data)
        this.drawLineOnChart(data.framesData, { id: 'line', color: LINE_COLOR });
        this.drawTresholdDashedLine();
    }

    public buildRecordedPointsOnMovementChart(data: ICamMessage[]): void {
        this.drawLineOnMovementChart(data, { id: 'velocityline', color: 'red' });
    }

    public showDashedLines(frames: ICamMessage[]): void {
        this.drawProportionDashedLines(frames);
    }

    private initializeChart(data: ICamMessage[]): void {
        this.svg = d3
          .select(this.svgElement.nativeElement as SVGElement)
          .attr('height', this.height)
          .attr('width', '100%');

        this.svgInner = this.svg
          .append('g')
          .attr('id', 'velocityChartContent')
          .style('transform', 'translate(' + this.margin.toString() + 'px,  10px)');

        this.yScale = d3
          .scaleLinear()
          .domain([d3.max(data, d => d.pupilvelocity), 0])
          .range([0, this.height - 2 * this.margin]);

        console.log(d3.max(data, d => d.pupilvelocity))

        this.xScale = d3
          .scaleLinear()
          .domain([0, d3.max(data, d => d.pointX)]);

        const distanceAxisY = this.svgInner
          .append('g')
          .attr('id', 'y-axisDistance')
          .style('transform', 'translate(' + this.margin.toString() + 'px,  0)');

        const timeAxisX = this.svgInner
          .append('g')
          .attr('id', 'x-axis')
          .style('transform', 'translate(0, ' + (this.height - this.margin * 2).toString() + 'px)');

        this.svgInner = this.svgInner
          .append('g')
          .attr('id', 'velocityChartPoints')

        // this.width = this.svgElement.nativeElement.getBoundingClientRect().width;

        this.xScale.range([this.margin, this.width - 2 * this.margin]);

        const xAxis = d3
          .axisBottom(this.xScale);

        timeAxisX.call(xAxis);

        const yAxis = d3
          .axisLeft(this.yScale);

        distanceAxisY.call(yAxis);
    }

    private drawLineOnChart(data: ICamMessage[],
    lineStyle: ILine): void {
        this.points = data.map(d => [
          this.xScale(d.pointX),
          this.yScale(d.pupilvelocity),
        ]);

        const line = d3
        .line()
        .x(d => d[0])
        .y(d => d[1])
        .curve(d3.curveMonotoneX);

        this.svgInner
          .append('path')
          .attr('id', lineStyle.id)
          .attr('d', line(this.points))
          .style('fill', 'none')
          .style('stroke', lineStyle.color)
          .style('stroke-width', '2px');

        this.points = [];
    }

    private drawLineOnMovementChart(data: ICamMessage[],
    lineStyle: ILine): void {
        this.yScale = d3
          .scaleLinear()
          .domain([d3.max(data, d => d.pupilvelocity), 0])
          .range([0, this.height - 2 * this.margin]);

        this.width = (d3.select('#movementChart').node() as HTMLElement).getBoundingClientRect().width;

        this.xScale = d3
          .scaleLinear()
          .domain(d3.extent(data, d => d.pointX))
          .range([this.margin, this.width - 2 * this.margin]);

        this.points = data.map(d => [
          this.xScale(d.pointX),
          this.yScale(d.pupilvelocity),
        ]);

        const line = d3
        .line()
        .x(d => d[0])
        .y(d => d[1])
        .curve(d3.curveMonotoneX);

        d3.select('#chartPoints')
          .append('path')
          .attr('id', lineStyle.id)
          .attr('d', line(this.points))
          .style('fill', 'none')
          .style('stroke', lineStyle.color)
          .style('stroke-width', '2px')
          .style('opacity', 0.5);

        this.points = [];
    }

    private drawProportionDashedLines(data: ICamMessage[]): void {
      for (let i = 0; i < this.trialsCount; i++) {
          let indexValue = data.findIndex(el => el.stage == FLASHING_STAGE);
          console.log(data[indexValue].pointX, this.height - this.margin * 2)
          this.svgInner.append("line")
            .attr('id', 'velocityDashedLine')
            .attr("x1", this.xScale(data[indexValue].pointX))
            .attr("y1", 0)
            .attr("x2", this.xScale(data[indexValue].pointX))
            .attr("y2", this.height - this.margin * 2)
            .style("stroke-dasharray", ("3, 3"))
            .style("stroke-width", 2)
            .style("stroke", "red")
            .style("fill", "none");

          for (let i = indexValue; i < data.length; i++) {
            if (data[i].stage == FLASHING_STAGE)
                indexValue = i;
            else
                break;
          }

          data.splice(0, indexValue + 1);
      }
    }

    private drawTresholdDashedLine(): void {
        this.svgInner.append("line")
          .attr('id', 'velocityTresholdDashedLine')
          .attr("x1", this.width - this.margin * 2)
          .attr("y1", (this.height - this.margin * 2) - 30)
          .attr("x2", this.margin)
          .attr("y2", (this.height - this.margin * 2) - 30)
          .style("stroke-dasharray", ("3, 3"))
          .style("stroke-width", 2)
          .style("stroke", "red")
          .style("fill", "none");
    }
}
