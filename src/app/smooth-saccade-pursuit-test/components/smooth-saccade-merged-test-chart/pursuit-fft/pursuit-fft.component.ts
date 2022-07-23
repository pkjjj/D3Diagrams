import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { axisBottom, axisLeft, line, max, min, ScaleLinear, scaleLinear } from 'd3';
import * as d3 from 'd3';
import { JsonService } from 'src/app/shared/jsonService';
import { transform, transformRadix2, transformBluestein } from 'src/app/smooth-saccade-pursuit-test/components/fft';

export interface ISmoothPursuitTestCamMessage {
  message_type: number;
  timestamp: number;
  eyeODx: number;
  eyeODy: number;
  eyeOSx: number;
  eyeOSy: number;
  calibratedeyeODx: number;
  calibratedeyeODy: number;
  calibratedeyeOSx: number;
  calibratedeyeOSy: number;
  stimuliODx: number;
  stimuliODy: number;
  stimuliOSx: number;
  stimuliOSy: number;
  x: number;
  rawEyeODy: number;
  rawEyeODx: number;
  rawEyeOSx: number;
  rawEyeOSy: number;
}

export interface Point { x: number, y: number };

@Component({
  selector: 'app-pursuit-fft',
  templateUrl: './pursuit-fft.component.html',
  styleUrls: ['./pursuit-fft.component.scss']
})
export class PursuitFFTComponent implements OnInit {

  @ViewChild('chart') private svgElement: ElementRef;
  @ViewChild('phaseChart') private svgPhaseElement: ElementRef;
  public gainDegreesOD: number;
  public gainOD: number
  private svg: d3.Selection<SVGElement, unknown, null, undefined>;
  private svgInner: d3.Selection<SVGElement, unknown, null, undefined>;
  private yAxisPhase: ScaleLinear<number, number, never>;
  private yAxisAmplitude: ScaleLinear<number, number, never>;
  private yAxisGenerator: ScaleLinear<number, number, never>;
  private xAxisGenerator: ScaleLinear<number, number, never>;
  private height = 1000;
  private margin = 50;
  private readonly padding: { left: number; top: number; right: number; bottom: number } = { left: 40, top: 15, right: 40, bottom: 15 };
  private width = 1500;
  private startTimestamp = 0;
  private textPadding = 50;
  private stimuliPhasesOD: number[] = [];
  private eyePhasesOD: number[] = [];
  private eyePhasesOS: number[] = [];
  private countSamplesPerSecond: number;
  private maxFrequency: number;
  private readonly IDEAL_MAX_FREQUENCY = 3;
  private readonly IDEAL_RESOLUTION = 0.05;

  constructor(private httpClient: HttpClient, private sharedService: JsonService) { }

  ngOnInit(): void {
    this.httpClient.get('/assets/smooth-saccade-pursuit-test/16473330419876303.log', { responseType: 'text' })
      .subscribe((f) => {
        // const signal = f;
        // const inputArray = signal.split('\n');
        // let floatArray: any[] = [];
        // inputArray.forEach(element => {
        //   floatArray.push(parseFloat(element.replace(',', '.')));
        // });
        // // floatArray =  floatArray.concat(new Array(1000).fill(0))
        // const phaseOS = this.fft(floatArray)
        // console.log(phaseOS);
        let parsedFrames = this.sharedService.parseStringToJson(f) as ISmoothPursuitTestCamMessage[];
        console.log(parsedFrames)
        const begining = parsedFrames.findIndex(phase => phase.message_type === 15);
        const ending = parsedFrames.findIndex(phase => phase.message_type === 16);
        parsedFrames = parsedFrames.slice(begining, ending);

        this.startTimestamp = parsedFrames[0].timestamp / 10000;
        const lastTime = this.getXvalue(this.startTimestamp, parsedFrames[parsedFrames.length - 1].timestamp);

        let amplitudesOS = parsedFrames.map(el => el.stimuliOSx);
        let amplitudesOD = parsedFrames.map(el => el.stimuliODx);
        let amplitudesEyeOS = parsedFrames.map(el => el.eyeOSx);
        let amplitudesEyeOD = parsedFrames.map(el => el.eyeODx);
        // amplitudesOS =  amplitudesOS.concat(new Array(30000).fill(0));
        // amplitudesEyeOS =  amplitudesEyeOS.concat(new Array(30000).fill(0));
        // amplitudesEyeOD =  amplitudesEyeOD.concat(new Array(30000).fill(0));
        // for (let i = 0; i < 3; i++) {
        //   amplitudesOS = amplitudesOS.concat(amplitudesOS);
        //   amplitudesEyeOS =  amplitudesEyeOS.concat(amplitudesEyeOS);
        //   amplitudesEyeOD =  amplitudesEyeOD.concat(amplitudesEyeOD);
        // }
        const amplitudeEyeOS = this.fft(amplitudesEyeOS);
        const amplitudeEyeOD = this.fft(amplitudesEyeOD);
        const stimuliAmplitudeOS = this.fft(amplitudesOS);
        const stimuliAmplitudeOD = this.fft(amplitudesOD);

        stimuliAmplitudeOS.forEach(element => {
          const y = Math.atan(element) * 180 / Math.PI;
          this.stimuliPhasesOD.push(y);
        });
        amplitudeEyeOS.forEach(element => {
          const y = Math.atan(element) * 180 / Math.PI;
          this.eyePhasesOS.push(y);
        });
        amplitudeEyeOD.forEach(element => {
          const y = Math.atan(element) * 180 / Math.PI;
          this.eyePhasesOD.push(y);
        });
        
        this.countSamplesPerSecond = stimuliAmplitudeOS.length / lastTime;
        const resolution = this.countSamplesPerSecond / stimuliAmplitudeOS.length;
        const resolutionDifference = this.IDEAL_RESOLUTION / resolution;
        this.maxFrequency = this.IDEAL_MAX_FREQUENCY / resolutionDifference;

        this.drawAmplitudeChart(stimuliAmplitudeOS, amplitudeEyeOS, amplitudeEyeOD);

        this.drawPhaseChart(this.stimuliPhasesOD,  this.eyePhasesOS, this.eyePhasesOD)
      });
  }

  private fft(arrayOfAmplitude: number[]) {
    const next = Math.pow(2, Math.ceil(Math.log(arrayOfAmplitude.length)/Math.log(2)));
    const startIndex = arrayOfAmplitude.length;

    arrayOfAmplitude.length = next;
    arrayOfAmplitude.fill(0, startIndex);

    const outArray = new Array(arrayOfAmplitude.length).fill(0);

    transformBluestein(arrayOfAmplitude, outArray);

    return outArray;
  }

  private drawAmplitudeChart(stimuliAmplitude: number[], amplitudeOS: number[], amplitudeOD: number[]) {
    this.svg = d3
    .select(this.svgElement.nativeElement)
    .attr('height', this.height)
    .attr('width', this.width)
    .attr('id', 'movementChart') as d3.Selection<SVGElement, unknown, null, undefined>;

    this.svgInner = this.svg
    .append('g')
    .attr('id', 'chartContent')
    .style('transform', 'translate(' + this.margin.toString() + 'px, ' + this.margin.toString() + 'px)');

    const fftOD: Point[] = [];
    const fftOS: Point[] = [];
    const stimuli: Point[] = [];

    stimuliAmplitude.forEach((amp, i) => {
        const frequency = i * this.countSamplesPerSecond / stimuliAmplitude.length;
        const obj = { y: amp, x: frequency};
        stimuli.push(obj);
    });
    amplitudeOS.forEach((amp, i) => {
        const frequency = i * this.countSamplesPerSecond / amplitudeOS.length;
        const obj = { y: amp, x: frequency };
        fftOS.push(obj);
    });
    amplitudeOD.forEach((amp, i) => {
        const frequency = i * this.countSamplesPerSecond / amplitudeOD.length;  
        const obj = { y: amp, x: frequency };
        fftOD.push(obj);
    });

    const wavesTogether = [...fftOD.map(f => f.y), ...fftOS.map(f => f.y), ...stimuli.map(f => f.y)];

    this.yAxisGenerator = scaleLinear()
        .domain([max(wavesTogether), min(wavesTogether)])
        .range([0, this.height - 300]);

    this.xAxisGenerator = scaleLinear()
        .domain([0, this.maxFrequency])
        .range([0, this.width - this.padding.right * 4.5]);

    this.drawChart(stimuli, fftOS, fftOD);

    this.drawPeak(stimuli);
  }

  private drawPhaseChart(stimuliPhases: number[], phaseOS: number[], phaseOD: number[]) {
    this.svg = d3
    .select(this.svgPhaseElement.nativeElement)
    .attr('height', this.height)
    .attr('width', this.width)
    .attr('id', 'movementChart') as d3.Selection<SVGElement, unknown, null, undefined>;

    this.svgInner = this.svg
    .append('g')
    .attr('id', 'chartContent')
    .style('transform', 'translate(' + this.margin.toString() + 'px, ' + this.margin.toString() + 'px)');

    const fftOD: Point[] = [];
    const fftOS: Point[] = [];
    const stimuli: Point[] = [];

    stimuliPhases.forEach((phase, i) => {
        const obj = { y: phase, x: i * this.countSamplesPerSecond / stimuliPhases.length };
        stimuli.push(obj);
    });
    phaseOS.forEach((phase, i) => {
        const obj = { y: phase, x: i * this.countSamplesPerSecond / phaseOS.length };
        fftOS.push(obj);
    });
    phaseOD.forEach((phase, i) => {
        const obj = { y: phase, x: i * this.countSamplesPerSecond / phaseOD.length };
        fftOD.push(obj);
    });

    this.yAxisGenerator = scaleLinear()
        .domain([250, -250])
        .range([0, this.height - 300]);

    this.xAxisGenerator = scaleLinear()
        .domain([0, this.maxFrequency])
        .range([0, this.width - this.padding.right * 4.5]);

    this.drawTestResults(stimuli, fftOD, fftOS);

    this.drawPeak(stimuli);

    this.drawChart(stimuli, fftOS, fftOD);
  }

  private drawPeak(stimuli: Point[]) {
    const peak = stimuli.filter(s => s.x < this.maxFrequency)
      .reduce((prev, current) => (Math.abs(prev.y) > Math.abs(current.y)) 
      ? prev
      : current);

    this.svgInner
      .append('line')
      .attr('class', 'fftOD')
      .attr("x1", this.xAxisGenerator(peak.x))
      .attr("y1", 0)
      .attr("x2", this.xAxisGenerator(peak.x))
      .attr("y2", this.yAxisGenerator(peak.y))
      .attr('stroke', 'black')
      .attr('stroke-width', 5)
      .attr('fill', 'transparent')
      .attr('transform', `translate(${this.padding.right * 2.5},${0})`);

    this.svgInner
      .append('circle')
      .attr('cx', this.xAxisGenerator(peak.x))
      .attr('cy', this.yAxisGenerator(peak.y))
      .attr('r', 7)
      .attr('fill', 'red')
      .attr('transform', `translate(${this.padding.right * 2.5},${0})`);
  }

  private drawTestResults(stimuli: Point[], fftOD: Point[], fftOS: Point[]) {
    const stimuliPeak = stimuli.filter(s => s.x < this.maxFrequency)
      .reduce((prev, current) => (Math.abs(prev.y) > Math.abs(current.y)) 
      ? prev
      : current);
    const peakIndex = stimuli.findIndex(s => s.y === stimuliPeak.y);

    const differenceOD = stimuliPeak.y - fftOD[peakIndex].y;
    const differenceOS = stimuliPeak.y - fftOS[peakIndex].y;
    const gainOD = fftOD[peakIndex].y / stimuliPeak.y;
    const gainOS = fftOS[peakIndex].y / stimuliPeak.y;

    const stDevOD = this.standardDeviation(fftOD.map(f => f.y));
    const stDevOS = this.standardDeviation(fftOS.map(f => f.y));

    const covOD = this.computeCovariance(stDevOD, fftOD.map(f => f.y));
    const covOS = this.computeCovariance(stDevOS, fftOS.map(f => f.y));
    // output gain
    this.svgInner
      .append('text')
      .attr('x', 120)
      .attr('y', this.yAxisGenerator(stimuliPeak.y) + this.textPadding)
      .style('font-weight', 'bold')
      .style('font-size', '13px')
      .text(`Gain in degrees OS ${differenceOS}`);
    this.svgInner
      .append('text')
      .attr('x', 120)
      .attr('y', this.yAxisGenerator(stimuliPeak.y) + this.textPadding + 20)
      .style('font-weight', 'bold')
      .style('font-size', '13px')
      .text(`Gain ${gainOS}`);

    this.svgInner
      .append('text')
      .attr('x', 120)
      .attr('y', this.yAxisGenerator(stimuliPeak.y) + this.textPadding + 40)
      .style('font-weight', 'bold')
      .style('font-size', '13px')
      .text(`Gain in degrees OS ${differenceOD}`);
    this.svgInner
      .append('text')
      .attr('x', 120)
      .attr('y', this.yAxisGenerator(stimuliPeak.y) + this.textPadding + 60)
      .style('font-weight', 'bold')
      .style('font-size', '13px')
      .text(`Gain ${gainOD}`);
    // output standart deviation
    this.svgInner
      .append('text')
      .attr('x', 120)
      .attr('y', this.yAxisGenerator(stimuliPeak.y) + this.textPadding + 80)
      .style('font-weight', 'bold')
      .style('font-size', '13px')
      .text(`St dev OS ${stDevOS.toFixed(3)}`);
    this.svgInner
      .append('text')
      .attr('x', 120)
      .attr('y', this.yAxisGenerator(stimuliPeak.y) + this.textPadding + 100)
      .style('font-weight', 'bold')
      .style('font-size', '13px')
      .text(`St dev OD ${stDevOD.toFixed(3)}`);
    // output COV
    this.svgInner
      .append('text')
      .attr('x', 120)
      .attr('y', this.yAxisGenerator(stimuliPeak.y) + this.textPadding + 120)
      .style('font-weight', 'bold')
      .style('font-size', '13px')
      .text(`COV OS ${covOS.toFixed(3)}`);
    this.svgInner
      .append('text')
      .attr('x', 120)
      .attr('y', this.yAxisGenerator(stimuliPeak.y) + this.textPadding + 140)
      .style('font-weight', 'bold')
      .style('font-size', '13px')
      .text(`COV OD ${covOD.toFixed(3)}`);
  }

  private drawChart(stimuli: Point[], fftOS: Point[], fftOD: Point[]) {
    const lineGenerator = line<{ y: number; x: number }>()
      .x(d => this.xAxisGenerator(d.x))
      .y(d => this.yAxisGenerator(d.y));

    this.svgInner
      .append('path')
      .attr('class', 'fftOD')
      .datum(stimuli)
      .attr('d', lineGenerator)
      .attr('stroke', 'red')
      .attr('stroke-width', '2')
      .attr('fill', 'transparent')
      .attr('transform', `translate(${this.padding.right * 2.5},${0})`);

    this.svgInner
      .append('path')
      .attr('class', 'fftOD')
      .datum(fftOS)
      .attr('d', lineGenerator)
      .attr('stroke', 'green')
      .attr('stroke-width', '2')
      .attr('fill', 'transparent')
      .attr('transform', `translate(${this.padding.right * 2.5},${0})`);
    
    this.svgInner
      .append('path')
      .attr('class', 'fftOD')
      .datum(fftOD)
      .attr('d', lineGenerator)
      .attr('stroke', 'blue')
      .attr('stroke-width', '2')
      .attr('fill', 'transparent')
      .attr('transform', `translate(${this.padding.right * 2.5},${0})`);

    this.svgInner
      .append('g')
      .attr('class', 'yAxisFrequency')
      .attr('transform', `translate(${this.padding.right * 2.5},${0})`)
      .attr('color', 'black')
      .call(axisLeft(this.yAxisGenerator).ticks(10));

    this.svgInner
      .append('g')
      .attr('class', 'xAxisFrequency')
      .attr('color', 'black')
      .attr('transform', `translate(${this.padding.right * 2.5},0)`)
      .call(axisBottom(this.xAxisGenerator));
  }

  public getXvalue(startTs: number, currentRawTs: number): number {
    const currentTs: number = currentRawTs / 10000;
    return Math.abs((currentTs - startTs) / 1000);
  }

  private standardDeviation(array: number[]){
    const average = array.reduce((prev, curr) => Math.abs(prev) + Math.abs(curr), 0) 
      / array.length;

    array = array.map((el)=>{
      return (el - average) ** 2
    })

    let total = array.reduce((acc, curr)=> Math.abs(acc) + Math.abs(curr), 0);

    return Math.sqrt(total / array.length)
  }

  private computeCovariance(deviation: number, array: number[]) {
    const average = array.reduce((prev, curr) => Math.abs(prev) + Math.abs(curr), 0) 
      / array.length;
    console.log(average)
    return deviation / average * 100;
  }
}
