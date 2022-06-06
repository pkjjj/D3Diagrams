/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SmoothSaccadeMergedTestChartComponent } from './smooth-saccade-merged-test-chart.component';

describe('SmoothSaccadeMergedTestChartComponent', () => {
  let component: SmoothSaccadeMergedTestChartComponent;
  let fixture: ComponentFixture<SmoothSaccadeMergedTestChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SmoothSaccadeMergedTestChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SmoothSaccadeMergedTestChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
