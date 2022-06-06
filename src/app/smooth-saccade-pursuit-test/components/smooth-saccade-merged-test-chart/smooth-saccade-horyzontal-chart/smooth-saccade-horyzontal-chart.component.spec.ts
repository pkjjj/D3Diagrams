/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SmoothSaccadeHoryzontalChartComponent } from './smooth-saccade-horyzontal-chart.component';

describe('SmoothSaccadeHoryzontalChartComponent', () => {
  let component: SmoothSaccadeHoryzontalChartComponent;
  let fixture: ComponentFixture<SmoothSaccadeHoryzontalChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SmoothSaccadeHoryzontalChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SmoothSaccadeHoryzontalChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
