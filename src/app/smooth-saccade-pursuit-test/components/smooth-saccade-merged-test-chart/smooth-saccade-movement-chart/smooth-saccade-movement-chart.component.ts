import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { ScaleLinear } from 'd3';
import { COUNT_OF_DEGREES_TICKS } from 'src/app/saccade-memory-test/components/saccade-merged-test-chart/saccade-movement-chart/movement-chart.constants';
import { ILine } from 'src/app/saccade-memory-test/constants/types';
import { CHART_SUBTYPE, ICamMessage, IChartData, IPursuitSaccadeTestResults, IRangeTestResult, ISaccadeResult, RANGE_TYPE, SACCADE_RESULT } from 'src/app/models/charts.model';
import { FLASHING_STAGE } from 'src/app/saccade-memory-test/constants/constants';

export enum MOVEMENT_TYPE {
    VERTICAL,
    HORIZONTAL
}

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

    public testResults: IPursuitSaccadeTestResults;
    private calibratedFrames: ICamMessage[];
    private svg: d3.Selection<SVGElement, unknown, null, undefined>;
    private svgInner: d3.Selection<SVGElement, unknown, null, undefined>;
    private yScaleAngle: ScaleLinear<number, number, never>;
    private yScaleVertical: ScaleLinear<number, number, never>;
    private yScaleHorizontal: ScaleLinear<number, number, never>;
    private yScalePoint: number;
    private xScale: ScaleLinear<number, number, never>;
    private lastPoint: [number, number];
    private trialsCount: number;
    private counter = 0;
    private verticalSaccadesResults: ISaccadeResult[] = [];
    private horizontalSaccadesResults: ISaccadeResult[] = [];

    constructor() { }

    ngOnInit() {
    }

    public buildRecordedChart(chartData: IChartData) {
        const parsedFrames = chartData.framesData;
        this.testResults = chartData.pursuitSaccadesTestResults;
        this.calibratedFrames = chartData.movementFrames;

        this.initializeChart(parsedFrames);
        this.drawVerticalMovementData([ ...chartData.separatedFrames.verticalFrames ]);
        this.drawHorizontalMovementData([ ...chartData.separatedFrames.horizontalFrames ]);

        this.drawGreenLines([ ...chartData.separatedFrames.verticalFrames ], MOVEMENT_TYPE.VERTICAL);
        this.drawGreenLines([ ...chartData.separatedFrames.horizontalFrames ], MOVEMENT_TYPE.HORIZONTAL);

        this.testResults.rangeTestResults.forEach(f => {
            if (f.type === CHART_SUBTYPE.VERTICAL) {
                this.verticalSaccadesResults = this.verticalSaccadesResults.concat(f.saccadesTestResults);
            } 
            else {
                this.horizontalSaccadesResults = this.horizontalSaccadesResults.concat(f.saccadesTestResults);
            }
        })
        this.drawRedCircles([ ...chartData.separatedFrames.verticalFrames ],
           this.verticalSaccadesResults, 
           MOVEMENT_TYPE.VERTICAL);
        this.drawRedCircles([ ...chartData.separatedFrames.horizontalFrames ], 
          this.horizontalSaccadesResults, 
          MOVEMENT_TYPE.HORIZONTAL);
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

        this.yScaleVertical = d3
          .scaleLinear()
          .domain(d3.extent(this.calibratedFrames, f => f.eyeOSy).reverse())
          .range([0, this.height - 2 * this.margin]);

        this.yScaleHorizontal = d3
          .scaleLinear()
          .domain(d3.extent(this.calibratedFrames, f => f.eyeOSx).reverse())
          .range([0, this.height - 2 * this.margin]);

        this.yScaleAngle = d3
          .scaleLinear()
          .domain(d3.extent(this.calibratedFrames, f => f.stimuliOS).reverse())
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
          .style('transform', 'translate(0, ' + (this.height - 2 * this.margin).toString() + 'px)');

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

    private drawVerticalMovementData(data: ICamMessage[]): void {
        const points: [number, number][] = data.map(d => [
            this.xScale(d.pointX),
            this.yScaleVertical(d.eyeOSy),
        ]);

        this.lastPoint = points[points.length - 1];

        this.drawLineOnChart(points, { id: 'line', color: 'black' });
    }

    private drawHorizontalMovementData(data: ICamMessage[]): void {
        const points: [number, number][] = data.map(d => [
            this.xScale(d.pointX),
            this.yScaleHorizontal(d.eyeOSx),
        ]);

        points.unshift(this.lastPoint);
  
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

    private drawGreenLines(data: ICamMessage[], type: MOVEMENT_TYPE) {
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
                  type === MOVEMENT_TYPE.VERTICAL
                    ? this.yScaleVertical(d.calibrationGlintData.firstPointYOfTrial)
                    : this.yScaleHorizontal(d.calibrationGlintData.firstPointYOfTrial)
              ]);

            this.drawLineOnChart(greenLinePoints, { id: 'greenLine', color: 'green' });

            data.splice(0, endIndex);
        }
    }

    private drawRedCircles(data: ICamMessage[], testResults: ISaccadeResult[], type: MOVEMENT_TYPE) {
        const radius = 5;

        testResults = testResults.filter(f => f.type !== RANGE_TYPE.AVERAGE);

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

            this.yScalePoint = type === MOVEMENT_TYPE.VERTICAL
              ? this.yScaleVertical(data[startIndex].eyeOSy)
              : this.yScaleHorizontal(data[startIndex].eyeOSx);

            this.svgInner
              .append('circle')
              .attr('cx', this.xScale(data[startIndex].pointX))
              .attr('cy', this.yScalePoint)
              .attr('r', radius)
              .attr('fill', 'red');

            this.yScalePoint = type === MOVEMENT_TYPE.VERTICAL
              ? this.yScaleVertical(data[endIndex].eyeOSy)
              : this.yScaleHorizontal(data[endIndex].eyeOSx);

            this.svgInner
              .append('circle')
              .attr('cx', this.xScale(data[endIndex].pointX))
              .attr('cy', this.yScalePoint)
              .attr('r', radius)
              .attr('fill', 'red');

            const index = this.counter;

            const result = testResults[index].result === SACCADE_RESULT.ACCEPT
              ? `L ${testResults[index].latency}ms \n A ${testResults[index].amplitude}%`
              : `${testResults[index].result}`;

            this.svgInner
              .append('text')
              .attr('x', this.xScale(data[startIndex + 1].pointX))
              .attr('y', this.yScalePoint - 10)
              .style('text-anchor', 'middle')
              .style('font-weight', 'bold')
              .style('font-size', '10px')
              .text(result);

            data.splice(0, endIndex);

            this.counter++;
        }
        this.counter = 0;
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
