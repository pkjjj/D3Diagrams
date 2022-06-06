import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ICalibrationMovementChartData, ILine } from 'src/app/saccade-memory-test/constants/types';
import * as d3 from 'd3';
import { ICamMessage, IChartData } from 'src/app/saccade-memory-test/models/charts.model';
import { SaccadesMergedChartService } from 'src/app/saccade-memory-test/services/saccadesMergedChartService';
import { RequestService } from 'src/app/saccade-memory-test/services/request.service';
import { SharedService } from 'src/app/saccade-memory-test/services/shared.service';
import { COUNT_OF_DEGREES_TICKS, LAST_STAGE_WITHOUT_GREEN_POINT, FLASHING_STAGE } from 'src/app/saccade-memory-test/constants/movement-chart';
import { ScaleLinear } from 'd3';

@Component({
  selector: 'app-saccade-movement-chart',
  templateUrl: './saccade-movement-chart.component.html',
  styleUrls: ['./saccade-movement-chart.component.css']
})
export class SaccadeMovementChartComponent implements OnInit {
    @ViewChild('chart') private svgElement: ElementRef;
    @Input() public data: ICamMessage[];
    @Input() public width = 1250;
    @Input() public height = 500;
    @Input() public margin = 50;

    private chartData: IChartData;
    private calibrationData: ICalibrationMovementChartData;
    private initialFrames: ICamMessage[];
    private frames: ICamMessage[];
    private svg: d3.Selection<SVGElement, unknown, null, undefined>;
    private svgInner: d3.Selection<SVGElement, unknown, null, undefined>;
    private yScale: ScaleLinear<number, number, never>;
    private yScaleAngle: ScaleLinear<number, number, never>;
    private xScale: ScaleLinear<number, number, never>;
    private trialsCount: number;
    private readonly AXIS_Y_ANGLE_OFFSET_X = 30;

    constructor(private chartService: SaccadesMergedChartService, private requestService: RequestService,
      private sharedService: SharedService) { }

    ngOnInit() {
        this.requestService.getMemoryData()
          .subscribe(data => {
              this.initialFrames = this.sharedService.parseStringToJson(data) as ICamMessage[];
              this.frames = [ ...this.initialFrames ];
              this.trialsCount = this.frames[this.frames.length - 1].trial + 1;
        });
    }

    // build recorded chart
    public buildRecordedChart(chartData: IChartData) {
        this.calibrationData = chartData.calibrationData;
        const parsedFrames = chartData.framesData;

        if (d3.select('#chartContent').empty()) {
            this.initializeChart(parsedFrames);
        }
        this.drawPoints(parsedFrames);
        this.drawGreenLines([ ...parsedFrames ]);
        this.drawRedCircles([ ...parsedFrames ], chartData.testResults.latencyArray);
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
          .domain([this.calibrationData.yScaleMaxValue, this.calibrationData.yScaleMinValue])
          .range([0, this.height - 2 * this.margin]);

        this.yScaleAngle = d3
          .scaleLinear()
          .domain([this.calibrationData.yScaleAngleMaxValue, this.calibrationData.yScaleAngleMinValue])
          .range([0, this.height - 2 * this.margin]);

        const distanceAxisY = this.svgInner
          .append('g')
          .attr('id', 'y-axisDistance')
          .style('transform', 'translate(' + this.margin.toString() + 'px,  0)');

        const angleAxisY = this.svgInner
          .append('g')
          .attr('id', 'y-axisAngle')
          .style('transform', 'translate(' + (this.margin - this.AXIS_Y_ANGLE_OFFSET_X).toString() + 'px, 0)');

        this.xScale = d3
          .scaleLinear()
          .domain([0, d3.max(data, d => d.pointX)]);

        const startOfAxisX = this.calibrationData.startOfAxisX;
        const minValue = this.calibrationData.yScaleMinValue;
        const maxValue = this.calibrationData.yScaleMaxValue;
        const locationAxisX = this.computeLocationAxisX(startOfAxisX, minValue, maxValue);

        const timeAxisX = this.svgInner
          .append('g')
          .attr('id', 'x-axis')
          .style('transform', 'translate(0, ' + locationAxisX.toString() + 'px)');

        this.svgInner = this.svgInner
          .append('g')
          .attr('id', 'chartPoints');

        // this.width = this.svgElement.nativeElement
        //   .getBoundingClientRect()
        //   .width;

        this.xScale.range([this.margin, this.width - 2 * this.margin]);

        const xAxis = d3
          .axisBottom(this.xScale);

        timeAxisX.call(xAxis);

        const yAxis = d3
          .axisLeft(this.yScale);
        const yAxisAngle = d3
          .axisLeft(this.yScaleAngle)
          .ticks(COUNT_OF_DEGREES_TICKS)

        distanceAxisY.call(yAxis);
        angleAxisY.call(yAxisAngle);
    }

    private drawPoints(data: ICamMessage[]): void {
        const points: [number, number][] = data.map(d => [
          this.xScale(d.pointX),
          this.yScale(d.pointY),
        ]);

        this.drawLineOnChart(points, { id: 'line', color: 'blue' });
    }

    private drawGreenLines(data: ICamMessage[]) {
        let greenDotIndex: number = null;
        let indexValue = 0;

        data.forEach(frame => {
            if (frame.greenDotIndex != greenDotIndex) {
              greenDotIndex = frame.greenDotIndex;
              indexValue = data.findIndex(el => el.greenDotIndex != greenDotIndex);

              if (frame.trial == this.trialsCount - 1) { indexValue = data.length - 1; }

              const greenLinePoints: [number, number][] = data
                .splice(0, indexValue)
                .filter(el => el.stage != LAST_STAGE_WITHOUT_GREEN_POINT)
                .map(d => [
                    this.xScale(d.pointX),
                    this.yScale(d.calibrationGlintData.firstPointYOfTrial),
                ]);

              this.drawLineOnChart(greenLinePoints, { id: 'greenLine', color: 'green' });
            }
        });
    }

    private drawRedCircles(data: ICamMessage[], latencyArray: number[]) {
        const radius = 5;

        for (let i = 0; i < this.trialsCount; i++) {
            let indexValue = data.findIndex(el => el.stage == FLASHING_STAGE);
            const latencyTime = Math.round(latencyArray[i] * 1000);

            if (indexValue != -1) {
              this.svgInner
                .append('circle')
                .attr('cx', this.xScale(data[indexValue].pointX))
                .attr('cy', this.yScaleAngle(data[indexValue].angleRedDotPointY))
                .attr('r', radius)
                .attr('fill', 'red');

              this.svgInner
                .append('text')
                .attr('x', this.xScale(data[indexValue].pointX))
                .attr('y', this.yScaleAngle(data[indexValue].angleRedDotPointY) - 10)
                .style('text-anchor', 'middle')
                .style('font-weight', 'bold')
                .style('font-size', '10px')
                .text('L ' + latencyTime.toString() + 'ms');

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
