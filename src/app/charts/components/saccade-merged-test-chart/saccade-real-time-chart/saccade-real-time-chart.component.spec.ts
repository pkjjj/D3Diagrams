/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SaccadeRealTimeChartComponent } from './saccade-real-time-chart.component';

describe('SaccadeRealTimeChartComponent', () => {
  let component: SaccadeRealTimeChartComponent;
  let fixture: ComponentFixture<SaccadeRealTimeChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SaccadeRealTimeChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SaccadeRealTimeChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
