import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { ScaleLinear } from 'd3';
import { COUNT_OF_DEGREES_TICKS } from 'src/app/saccade-memory-test/components/saccade-merged-test-chart/saccade-movement-chart/movement-chart.constants';
import { ILine } from 'src/app/saccade-memory-test/constants/types';
import { ICamMessage, IChartData } from 'src/app/models/charts.model';
import { FLASHING_STAGE } from 'src/app/saccade-memory-test/constants/constants';

@Component({
  selector: 'app-smooth-saccade-movement-chart',
  templateUrl: './smooth-saccade-movement-chart.component.html',
  styleUrls: ['./smooth-saccade-movement-chart.component.scss']
})
export class SmoothSaccadeMovementChartComponent implements OnInit {

    @ViewChild('chart') private svgElement: ElementRef;
    @Input() public data: ICamMessage[];
    @Input() public width = 1250;
    @Input() public height = 500;
    @Input() public margin = 50;

    private svg: d3.Selection<SVGElement, unknown, null, undefined>;
    private svgInner: d3.Selection<SVGElement, unknown, null, undefined>;
    private yScaleAngle: ScaleLinear<number, number, never>;
    private xScale: ScaleLinear<number, number, never>;
    private trialsCount: number;

    constructor() { }

    ngOnInit() {
    }

    public buildRecordedChart(chartData: IChartData) {
        const parsedFrames = chartData.framesData;

        this.initializeChart(parsedFrames);
        this.drawVerticalPoints(parsedFrames);
        this.drawHorizontalPoints(parsedFrames);
    }

    public showDashedLines(frames: ICamMessage[]): void {
        this.drawDashedLine(frames);
    }

    private initializeChart(data: ICamMessage[]): void {
        this.svg = d3
          .select(this.svgElement.nativeElement)
          .attr('height', this.height)
          .attr('width', '100%')
          .attr('id', 'movementChart') as d3.Selection<SVGElement, unknown, null, undefined>;

        this.svgInner = this.svg
          .append('g')
          .attr('id', 'chartContent')
          .style('transform', 'translate(' + this.margin.toString() + 'px, ' + this.margin.toString() + 'px)');

        this.yScaleAngle = d3
          .scaleLinear()
          .domain(d3.extent(data, f => f.stimuliOSx).reverse())
          .range([0, this.height - 2 * this.margin]);

        const angleAxisY = this.svgInner
          .append('g')
          .attr('id', 'y-axisAngle')
          .style('transform', 'translate(' + this.margin.toString() + 'px, 0)');

        this.xScale = d3
          .scaleLinear()
          .domain([0, d3.max(data, d => d.pointX)]);

        const timeAxisX = this.svgInner
          .append('g')
          .attr('id', 'x-axis')
          .style('transform', 'translate(0, ' + (this.height / 2 -this.margin).toString() + 'px)');

        this.svgInner = this.svgInner
          .append('g')
          .attr('id', 'movementChartPoints');

        this.xScale.range([this.margin, this.width - 2 * this.margin]);

        const xAxis = d3
          .axisBottom(this.xScale);

        timeAxisX.call(xAxis);

        const yAxisAngle = d3
          .axisLeft(this.yScaleAngle)
          .ticks(COUNT_OF_DEGREES_TICKS)

        angleAxisY.call(yAxisAngle);
    }

    private drawVerticalPoints(data: ICamMessage[]): void {
        const points: [number, number][] = data.map(d => [
          this.xScale(d.pointX),
          this.yScaleAngle(d.stimuliOSy),
        ]);

        this.drawLineOnChart(points, { id: 'line', color: '#bed869' });
    }

    private drawHorizontalPoints(data: ICamMessage[]): void {
        const points: [number, number][] = data.map(d => [
          this.xScale(d.pointX),
          this.yScaleAngle(d.stimuliOSx),
        ]);

        this.drawLineOnChart(points, { id: 'line', color: 'blue' });
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

    private drawDashedLine(data: ICamMessage[]): void {
      for (let i = 0; i < this.trialsCount; i++) {
          let indexValue = data.findIndex(el => el.stage == FLASHING_STAGE);
          console.log(data[indexValue].pointX);
          this.svgInner.append("line")
            .attr('id', 'movementDashedLine')
            .attr("x1", this.xScale(data[indexValue].pointX))
            .attr("y1", 0)
            .attr("x2", this.xScale(data[indexValue].pointX))
            .attr("y2", this.height)
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

    private computeLocationAxisX(startOfAxisX: number, minValue: number, maxValue: number): number {
        const difference = maxValue - minValue;

        const scaleFactor = difference !== 0
          ? (this.height - this.margin * 2) / difference
          : 0;

        const offsetToBottom = maxValue - startOfAxisX;
        const offsetToBottomWithFactor = offsetToBottom * scaleFactor;

        return offsetToBottomWithFactor;
    }

}
