/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SaccadeVelocityChartComponent } from './saccade-velocity-chart.component';

describe('SaccadeVelocityChartComponent', () => {
  let component: SaccadeVelocityChartComponent;
  let fixture: ComponentFixture<SaccadeVelocityChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SaccadeVelocityChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SaccadeVelocityChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
