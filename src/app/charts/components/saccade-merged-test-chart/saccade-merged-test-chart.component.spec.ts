import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaccadeMergedTestChartComponent } from './saccade-merged-test-chart.component';

describe('SaccadeMergedTestChartComponent', () => {
  let component: SaccadeMergedTestChartComponent;
  let fixture: ComponentFixture<SaccadeMergedTestChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SaccadeMergedTestChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SaccadeMergedTestChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
