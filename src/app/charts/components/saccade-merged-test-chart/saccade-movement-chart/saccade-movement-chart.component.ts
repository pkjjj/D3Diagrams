import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { ILine } from 'src/app/charts/constants/types';
import * as d3 from 'd3';
import { ICamMessage } from 'src/app/charts/models/charts.model';
import { SaccadesMergedChartService } from 'src/app/charts/services/saccadesMergedChartService';
import { RequestService } from 'src/app/charts/services/request.service';
import { SharedService } from 'src/app/charts/services/shared.service';
import { COUNT_OF_DEGREES_TICKS, COUNT_SEGMENTS_OF_TICKS, FLASHING_STAGE, FRAMES_FOR_UPDATE, LAST_STAGE_WITHOUT_GREEN_POINT, RANGE_OF_ANGLES, START_OF_AXIS_X } from 'src/app/charts/constants/constants';
import { AXIS_Y_SIZE_IN_PIXELS, RATIO_PIXELS_TO_DEGREES } from 'src/app/charts/constants/chart';

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
    private lastPoint: [number, number][] = [];
    private trialsCount: number;
    private scaleFactor: number;
    private axisYPixelsMaxValue: number;
    private axisYPixelsMinValue: number;


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
        let parsedFrames = this.chartService.setCamData(this.frames);
        parsedFrames = this.chartService.setMovementData(parsedFrames);
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
        this.lastPoint = [];
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

        const startOfAxisX = data[0].calibrationGlintData.axisXLocation;
        let maxValue = startOfAxisX + 20;
        let minValue = startOfAxisX - 20;
        this.axisYPixelsMaxValue = maxValue;
        this.axisYPixelsMinValue = minValue;

        const [maxPointY, minPointY] = [d3.max(data, d => d.pointY), d3.min(data, d => d.pointY)];

        const pixelsBetweenTicks = data[0].calibrationGlintData.pixelDifference;
        let axisYSize = pixelsBetweenTicks * COUNT_SEGMENTS_OF_TICKS;

        if (minPointY < minValue) {
            const minPointYDifference = minValue - minPointY;
            console.log("first" + minPointYDifference, this.getScaleFactor(axisYSize))
            axisYSize += minPointYDifference;
            RANGE_OF_ANGLES.to -= minPointYDifference / RATIO_PIXELS_TO_DEGREES;
            minValue = minPointY;
        }

        if (maxPointY > maxValue) {
            const maxPointYDifference = maxPointY - maxValue;
            axisYSize += maxPointYDifference;
            RANGE_OF_ANGLES.from += maxPointYDifference / RATIO_PIXELS_TO_DEGREES;
            maxValue = maxPointY;
        }

        // const scaleFactor = (this.height - this.margin * 2) / axisYSize;
        const scaleFactor = this.getScaleFactor(axisYSize);
        const axisYheight = axisYSize * scaleFactor;

        this.yScale = d3
          .scaleLinear()
          .domain([maxValue, minValue])
          .range([0, this.height - 2 * this.margin]);
        console.log(d3.max(data, d => d.pointY), d3.min(data, d => d.pointY))
        this.yScaleAngle = d3
          .scaleLinear()
          .domain([RANGE_OF_ANGLES.from, RANGE_OF_ANGLES.to])
          .range([0, this.height - 2 * this.margin]);

        this.yAxisDistance = this.svgInner
          .append('g')
          .attr('id', 'y-axisDistance')
          .style('transform', 'translate(' + (this.margin) + 'px,  0)');

        this.yAxisAngle = this.svgInner
          .append('g')
          .attr('id', 'y-axisAngle')
          .style('transform', 'translate(' + (this.margin - 30) + 'px, 0)');

        this.xScale = d3
          .scaleLinear()
          .domain(d3.extent(data, d => d.pointX));

        console.log(this.axisYPixelsMinValue - minPointY, this.getScaleFactor(axisYSize))
        const axisXOffsetToCenter = this.getScaleFactor(axisYSize) * (this.axisYPixelsMinValue - minPointY);

        console.log(axisXOffsetToCenter);

        this.xAxis = this.svgInner
          .append('g')
          .attr('id', 'x-axis')
          .style('transform', 'translate(0, ' + (this.computeLocationAxisX(startOfAxisX, minValue, maxValue)) + 'px)');

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

    // compute scale factor for axis Y.
    private getScaleFactor(axisYHeight: number): number {

        const scaleFactor = axisYHeight !== 0
          ? (this.height - this.margin * 2) / axisYHeight
          : 0;

        return scaleFactor;
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
