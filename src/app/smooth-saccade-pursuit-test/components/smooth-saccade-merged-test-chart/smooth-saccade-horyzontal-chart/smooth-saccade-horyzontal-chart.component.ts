import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { ScaleLinear } from 'd3';
import { COUNT_OF_DEGREES_TICKS } from 'src/app/saccade-memory-test/components/saccade-merged-test-chart/saccade-movement-chart/movement-chart.constants';
import { ILine } from 'src/app/saccade-memory-test/constants/types';
import { ICamMessage, IChartData } from 'src/app/models/charts.model';
import { FLASHING_STAGE } from 'src/app/saccade-memory-test/constants/constants';

@Component({
  selector: 'app-smooth-saccade-horyzontal-chart',
  templateUrl: './smooth-saccade-horyzontal-chart.component.html',
  styleUrls: ['./smooth-saccade-horyzontal-chart.component.scss']
})
export class SmoothSaccadeHoryzontalChartComponent implements OnInit {
    @ViewChild('chart') private svgElement: ElementRef;
    @Input() public data: ICamMessage[];
    @Input() public width = 1250;
    @Input() public height = 500;
    @Input() public margin = 50;

    private calibratedFrames: ICamMessage[];
    private svg: d3.Selection<SVGElement, unknown, null, undefined>;
    private svgInner: d3.Selection<SVGElement, unknown, null, undefined>;
    private yScaleAngle: ScaleLinear<number, number, never>;
    private yScale: ScaleLinear<number, number, never>;
    private xScale: ScaleLinear<number, number, never>;
    private trialsCount: number;

    constructor() { }

    ngOnInit() {
    }

    public buildRecordedChart(chartData: IChartData) {
        const parsedFrames = chartData.framesData;
        this.calibratedFrames = chartData.movementFrames;

        this.initializeChart(parsedFrames);
        this.drawRawMovementData(this.calibratedFrames);
        this.drawGreenLines([ ...this.calibratedFrames ]);
        this.drawCalibrationDots(this.calibratedFrames);
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

        this.yScale = d3
          .scaleLinear()
          .domain(d3.extent(this.calibratedFrames, f => f.eyeOSx).reverse())
          .range([0, this.height - 2 * this.margin]);

        this.yScaleAngle = d3
          .scaleLinear()
          .domain(d3.extent(this.calibratedFrames, f => f.stimuliOSx).reverse())
          .range([0, this.height - 2 * this.margin]);

        const angleAxisY = this.svgInner
          .append('g')
          .attr('id', 'y-axisAngle')
          .style('transform', 'translate(' + this.margin.toString() + 'px, 0)');

        this.xScale = d3
          .scaleLinear()
          .domain([d3.min(data, d => d.pointX), d3.max(data, d => d.pointX)]);

        const timeAxisX = this.svgInner
          .append('g')
          .attr('id', 'x-axis')
          .style('transform', 'translate(0, ' + (this.height - 2 * this.margin).toString() + 'px)');

        this.svgInner = this.svgInner
          .append('g')
          .attr('id', 'horizontalChartPoints');

        this.xScale.range([this.margin, this.width - 2 * this.margin]);

        const xAxis = d3
          .axisBottom(this.xScale);

        timeAxisX.call(xAxis);

        const yAxisAngle = d3
          .axisLeft(this.yScaleAngle)
          .ticks(COUNT_OF_DEGREES_TICKS)

        angleAxisY.call(yAxisAngle);
    }

    private drawRawMovementData(data: ICamMessage[]): void {
        const points: [number, number][] = data.map(d => [
            this.xScale(d.pointX),
            this.yScale(d.eyeOSx),
        ]);
  
        this.drawLineOnChart(points, { id: 'line', color: 'black' });
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

    private drawGreenLines(data: ICamMessage[]) {
        while (data.length > 1) {
            const startIndex = data.findIndex(f => f.calibrationGlintData);
            const slicedFrames = data.slice(startIndex);
            let endIndex = slicedFrames
              .findIndex(f => f.calibrationGlintData?.calibationGlintData !== slicedFrames[0].calibrationGlintData?.calibationGlintData)
              + startIndex;

            if (endIndex < startIndex) {
                endIndex = data.length - 1;
            }

            const greenLinePoints: [number, number][] = data
              .slice(startIndex, endIndex)
              .map(d => [
                  this.xScale(d.pointX),
                  this.yScale(d.calibrationGlintData.firstPointYOfTrial),
              ]);

            this.drawLineOnChart(greenLinePoints, { id: 'greenLine', color: 'green' });

            data.splice(0, endIndex);
        }
    }

    private drawCalibrationDots(data: ICamMessage[]) {
        const radius = 5;

        while (data.length > 1) {
            const startIndex = data.findIndex(f => f.calibrationGlintData);
            const slicedFrames = data.slice(startIndex);
            let endIndex = slicedFrames
              .findIndex(f => f.calibrationGlintData?.calibationGlintData !== slicedFrames[0].calibrationGlintData?.calibationGlintData)
              + startIndex;

            if (startIndex === -1) { break; }

            if (endIndex < startIndex) {
                endIndex = data.length - 1;
            }

            this.svgInner
              .append('circle')
              .attr('cx', this.xScale(data[startIndex].pointX))
              .attr('cy', this.yScale(data[startIndex].eyeOSx))
              .attr('r', radius)
              .attr('fill', 'red');

            this.svgInner
              .append('circle')
              .attr('cx', this.xScale(data[endIndex].pointX))
              .attr('cy', this.yScale(data[endIndex].eyeOSx))
              .attr('r', radius)
              .attr('fill', 'red');

            data.splice(0, endIndex);
        }
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
}
