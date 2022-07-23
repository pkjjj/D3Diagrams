import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PursuitFFTComponent } from './pursuit-fft.component';

describe('PursuitFFTComponent', () => {
  let component: PursuitFFTComponent;
  let fixture: ComponentFixture<PursuitFFTComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PursuitFFTComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PursuitFFTComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
