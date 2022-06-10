import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { ScaleLinear } from 'd3';
import { COUNT_OF_DEGREES_TICKS, LAST_STAGE_WITHOUT_GREEN_POINT, FLASHING_STAGE } from 'src/app/saccade-memory-test/constants/movement-chart';
import { ICalibrationMovementChartData, ILine } from 'src/app/saccade-memory-test/constants/types';
import { ICamMessage, IChartData } from 'src/app/saccade-memory-test/models/charts.model';
import { RequestService } from 'src/app/saccade-memory-test/services/request.service';
import { SaccadesMergedChartService } from 'src/app/saccade-memory-test/services/saccadesMergedChartService';
import { SharedService } from 'src/app/saccade-memory-test/services/shared.service';

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

        this.initializeChart(parsedFrames);
        this.drawPoints(parsedFrames);
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
          .domain(d3.extent(data, f => f.eyeOSx))
          .range([0, this.height - 2 * this.margin]);

        this.yScaleAngle = d3
          .scaleLinear()
          .domain(d3.extent(data, f => f.stimuliOSx).reverse())
          .range([0, this.height - 2 * this.margin]);

        const distanceAxisY = this.svgInner
          .append('g')
          .attr('id', 'y-axisDistance')
          .style('transform', 'translate(' + this.margin.toString() + 'px,  0)');

        const angleAxisY = this.svgInner
          .append('g')
          .attr('id', 'y-axisAngle')
          .style('transform', 'translate(' + this.margin.toString() + 'px, 0)');

        this.xScale = d3
          .scaleLinear()
          .domain([d3.min(data, d => d.pointX), d3.max(data, d => d.pointX)]);

        // const startOfAxisX = this.calibrationData.startOfAxisX;
        // const minValue = this.calibrationData.yScaleMinValue;
        // const maxValue = this.calibrationData.yScaleMaxValue;
        // const locationAxisX = this.computeLocationAxisX(startOfAxisX, minValue, maxValue);

        const timeAxisX = this.svgInner
          .append('g')
          .attr('id', 'x-axis')
          .style('transform', 'translate(0, ' + (this.height / 2 -this.margin).toString() + 'px)');

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

        // distanceAxisY.call(yAxis);
        angleAxisY.call(yAxisAngle);
    }

    private drawPoints(data: ICamMessage[]): void {
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
}
