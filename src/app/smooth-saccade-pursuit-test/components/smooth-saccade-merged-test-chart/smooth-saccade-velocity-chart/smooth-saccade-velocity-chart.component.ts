import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { ScaleLinear } from 'd3';
import { LINE_COLOR } from 'src/app/saccade-memory-test/components/saccade-merged-test-chart/saccade-velocity-chart/saccade-velocity-chart.constants';
import { ILine } from 'src/app/saccade-memory-test/constants/types';
import { ICamMessage, IChartData, ISaccadeResult } from 'src/app/models/charts.model';

const Y_SCALE_INCREASE_FACTOR = 50;
const TEXT_OFFSET_BY_Y = 30;
const WHOLE_TEXT_OFFSET_Y = 500;
const VELOCITY_TRESHOLD = 30;
@Component({
  selector: 'app-smooth-saccade-velocity-chart',
  templateUrl: './smooth-saccade-velocity-chart.component.html',
  styleUrls: ['./smooth-saccade-velocity-chart.component.scss']
})
export class SmoothSaccadeVelocityChartComponent implements OnInit {
    @ViewChild('chart') private svgElement: ElementRef;
    @Input() public data: ICamMessage[];
    @Input() public width = 1400;
    @Input() public height = 500;
    @Input() public margin = 50;

    private svg: d3.Selection<SVGElement, unknown, null, undefined>;
    private svgInner: d3.Selection<SVGElement, unknown, null, undefined>;
    private yScale: ScaleLinear<number, number, never>;
    private xScale: ScaleLinear<number, number, never>;
    private points: [number, number][] = [];

    constructor() { }

    ngOnInit() {
    }

    public buildRecordedChart(data: ICamMessage[]): void {
        this.initializeChart(data);
        this.drawLineOnChart(data, { id: 'line', color: LINE_COLOR });
        this.drawTresholdDashedLine();
        // this.drawTestResults([ ...data ], testResults);
        this.drawProportionDashedLines([ ...data ]);
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
          .attr('width', this.width);

        this.svgInner = this.svg
          .append('g')
          .attr('id', 'velocityChartContent')
          .style('transform', 'translate(' + this.margin.toString() + 'px,  10px)');

        this.yScale = d3
          .scaleLinear()
          .domain([d3.max(data, d => d.pupilvelocity) + Y_SCALE_INCREASE_FACTOR, 0])
          .range([0, this.height - 2 * this.margin]);

        this.xScale = d3
          .scaleLinear()
          .domain([d3.min(data, d => d.pointX), d3.max(data, d => d.pointX)]);

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
          .attr('id', 'velocityChartPoints');

        this.width = this.svgElement.nativeElement.getBoundingClientRect().width;

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

    // private drawTestResults(data: ICamMessage[], testResults: ISaccadeResult[]) {
    //     for (let i = 0; i < testResults.length; i++) {
    //         if (testResults[i].noResponse !== false) { continue; }

    //         const saccadeStartIndex = data.findIndex(el => el.stimuliOS !== data[0].stimuliOS);
    //         const saccadeEndIndex = data.slice(saccadeStartIndex).findIndex(el => el.stimuliOS !== data[saccadeStartIndex].stimuliOS);
    //         let saccadeCenterIndex = Math.abs(Math.round((saccadeEndIndex - saccadeStartIndex) / 2));

    //         if (saccadeEndIndex === -1) {
    //             saccadeCenterIndex = Math.round(((data.length - 1) - saccadeStartIndex) / 2);
    //         }
    //         const textLocation: [number, number] = [this.xScale(data[saccadeCenterIndex].pointX), -(this.height - this.margin - WHOLE_TEXT_OFFSET_Y)];

    //         testResults[i].saccadesResults.forEach((saccade, index) => {
    //             this.svgInner
    //                 .append('text')
    //                 .attr('x', textLocation[0])
    //                 .attr('y', textLocation[1] - (TEXT_OFFSET_BY_Y + index * 10))
    //                 .style('text-anchor', 'middle')
    //                 .style('font-weight', 'bold')
    //                 .style('font-size', '8px')
    //                 .text(`S${index}L ${saccade.latency}ms Peak ${Math.trunc(saccade.peakVelocity)} A ${saccade.amplitude}`);
    //         });

    //         data.splice(0, saccadeEndIndex);
    //     }
    // }

    private drawProportionDashedLines(data: ICamMessage[]): void {
        while (data.length > 0) {
            const indexValue = data.findIndex(el => el.stimuliOS !== data[0].stimuliOS);
            if (indexValue === - 1) { break; }

            this.svgInner.append("line")
            .attr('id', 'velocityDashedLine')
            .attr("x1", this.xScale(data[indexValue - 1].pointX))
            .attr("y1", 0)
            .attr("x2", this.xScale(data[indexValue - 1].pointX))
            .attr("y2", this.height - this.margin * 2)
            .style("stroke-dasharray", ("3, 3"))
            .style("stroke-width", 2)
            .style("stroke", "red")
            .style("fill", "none");

            data.splice(0, indexValue);
        }
    }

    private drawTresholdDashedLine(): void {
        this.svgInner.append("line")
          .attr('id', 'velocityTresholdDashedLine')
          .attr("x1", this.width - this.margin * 2)
          .attr("y1", this.yScale(VELOCITY_TRESHOLD))
          .attr("x2", this.margin)
          .attr("y2", this.yScale(VELOCITY_TRESHOLD))
          .style("stroke-dasharray", ("3, 3"))
          .style("stroke-width", 2)
          .style("stroke", "red")
          .style("fill", "none");
    }
}
