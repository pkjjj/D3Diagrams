/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SmoothSaccadeVerticalChartComponent } from './smooth-saccade-vertical-chart.component';

describe('SmoothSaccadeVerticalChartComponent', () => {
  let component: SmoothSaccadeVerticalChartComponent;
  let fixture: ComponentFixture<SmoothSaccadeVerticalChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SmoothSaccadeVerticalChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SmoothSaccadeVerticalChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
