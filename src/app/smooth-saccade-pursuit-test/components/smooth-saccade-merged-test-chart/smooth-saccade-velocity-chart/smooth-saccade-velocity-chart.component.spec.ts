/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SmoothSaccadeVelocityChartComponent } from './smooth-saccade-velocity-chart.component';

describe('SmoothSaccadeVelocityChartComponent', () => {
  let component: SmoothSaccadeVelocityChartComponent;
  let fixture: ComponentFixture<SmoothSaccadeVelocityChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SmoothSaccadeVelocityChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SmoothSaccadeVelocityChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
