/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SmoothSaccadeMovementChartComponent } from './smooth-saccade-movement-chart.component';

describe('SmoothSaccadeMovementChartComponent', () => {
  let component: SmoothSaccadeMovementChartComponent;
  let fixture: ComponentFixture<SmoothSaccadeMovementChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SmoothSaccadeMovementChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SmoothSaccadeMovementChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
