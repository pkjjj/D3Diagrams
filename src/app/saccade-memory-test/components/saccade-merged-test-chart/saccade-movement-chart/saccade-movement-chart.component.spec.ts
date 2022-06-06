/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SaccadeMovementChartComponent } from './saccade-movement-chart.component';

describe('SaccadeMovementChartComponent', () => {
  let component: SaccadeMovementChartComponent;
  let fixture: ComponentFixture<SaccadeMovementChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SaccadeMovementChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SaccadeMovementChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
