import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { ICalibrationMovementChartData, ILine } from 'src/app/charts/constants/types';
import * as d3 from 'd3';
import { ICamMessage, IChartData } from 'src/app/charts/models/charts.model';
import { SaccadesMergedChartService } from 'src/app/charts/services/saccadesMergedChartService';
import { RequestService } from 'src/app/charts/services/request.service';
import { SharedService } from 'src/app/charts/services/shared.service';
import { RATIO_PIXELS_TO_DEGREES } from 'src/app/charts/constants/chart';
import { rangeOfDegrees, COUNT_OF_DEGREES_TICKS, LAST_STAGE_WITHOUT_GREEN_POINT, FLASHING_STAGE } from 'src/app/charts/constants/movement-chart';

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

    private chartData: IChartData;
    private calibrationData: ICalibrationMovementChartData;
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
    private trialsCount: number;
    private yScaleMaxValue: number;
    private yScaleMinValue: number;
    private yScaleAngleMaxValue: number;
    private yScaleAngleMinValue: number;
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
    public buildRecordedChart() {
        const parsedFrames = this.chartService.setCamData(this.frames);
        this.chartData = this.chartService.setMovementData(parsedFrames);
        this.calibrationData = this.chartData.calibrationData;

        if (d3.select('#chartContent').empty()) {
            this.initializeChart(parsedFrames);
        }
        this.drawPoints(parsedFrames);
        this.drawGreenLines([ ...parsedFrames ]);
        this.drawRedCircles([ ...parsedFrames ]);
    }

    // clear chart
    public clearChart() {
        d3.select('#chartPoints').selectChildren().remove();
        this.frames = [ ...this.initialFrames ];
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
          .domain([this.calibrationData.yScaleMaxValue, this.calibrationData.yScaleMinValue])
          .range([0, this.height - 2 * this.margin]);

        this.yScaleAngle = d3
          .scaleLinear()
          .domain([this.calibrationData.yScaleAngleMaxValue, this.calibrationData.yScaleAngleMinValue])
          .range([0, this.height - 2 * this.margin]);

        this.yAxisDistance = this.svgInner
          .append('g')
          .attr('id', 'y-axisDistance')
          .style('transform', 'translate(' + (this.margin) + 'px,  0)');

        this.yAxisAngle = this.svgInner
          .append('g')
          .attr('id', 'y-axisAngle')
          .style('transform', 'translate(' + (this.margin - this.AXIS_Y_ANGLE_OFFSET_X) + 'px, 0)');

        this.xScale = d3
          .scaleLinear()
          .domain(d3.extent(data, d => d.pointX));

        const startOfAxisX = this.calibrationData.startOfAxisX;
        const minValue = this.calibrationData.yScaleMinValue;
        const maxValue = this.calibrationData.yScaleMaxValue;
        const locationAxisX = this.computeLocationAxisX(startOfAxisX, minValue, maxValue);

        this.xAxis = this.svgInner
          .append('g')
          .attr('id', 'x-axis')
          .style('transform', 'translate(0, ' + (locationAxisX) + 'px)');

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
          .ticks(COUNT_OF_DEGREES_TICKS)

        this.yAxisDistance.call(yAxis);
        this.yAxisAngle.call(yAxisAngle);
    }

    private drawPoints(data: ICamMessage[]): void {
        const points: [number, number][] = data.map(d => [
          this.xScale(d.pointX),
          this.yScale(d.pointY),
        ]);

        this.drawLineOnChart(points, { id: 'line', color: 'blue'});
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
                    this.yScaleAngle(d.angleGreenDotPointY),
                ]);

              this.drawLineOnChart(greenLinePoints, { id: 'greenLine', color: 'green' });
            }
        });
    }

    private drawRedCircles(data: ICamMessage[]) {
        const radius = 5;

        for (let i = 0; i < this.trialsCount; i++) {
            let indexValue = data.findIndex(el => el.stage == FLASHING_STAGE);

            if (indexValue != -1) {
              this.svgInner
                .append('circle')
                .attr('cx', this.xScale(data[indexValue].pointX))
                .attr('cy', this.yScaleAngle(data[indexValue].angleRedDotPointY))
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
