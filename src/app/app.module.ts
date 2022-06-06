import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { SaccadeMergedBulbicamTestChartComponent } from './saccade-memory-test/components/saccade-merged-test-chart/saccade-merged-test-chart.component';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { SaccadesMergedChartService } from './saccade-memory-test/services/saccadesMergedChartService';
import { HttpClientModule } from '@angular/common/http';
import { SaccadeVelocityChartComponent } from './saccade-memory-test/components/saccade-merged-test-chart/saccade-velocity-chart/saccade-velocity-chart.component';
import { SaccadeMovementChartComponent } from './saccade-memory-test/components/saccade-merged-test-chart/saccade-movement-chart/saccade-movement-chart.component';
import { SaccadeRealTimeChartComponent } from './saccade-memory-test/components/saccade-merged-test-chart/saccade-real-time-chart/saccade-real-time-chart.component';
import { ParsingService } from './saccade-memory-test/services/parsingService';
import { MovementComputingService } from './saccade-memory-test/services/movementComputingService';
import { VelocityComputingService } from './saccade-memory-test/services/velocityComputingService';
import { CalibrationComputingService } from './saccade-memory-test/services/calibrationComputingService';
import { SaccadeTestResultsComponent } from './saccade-memory-test/components/saccade-merged-test-chart/saccade-test-results/saccade-test-results.component';
import { SmoothSaccadeMovementChartComponent } from './smooth-saccade-pursuit-test/components/smooth-saccade-merged-test-chart/smooth-saccade-movement-chart/smooth-saccade-movement-chart.component';
import { SmoothSaccadeVelocityChartComponent } from './smooth-saccade-pursuit-test/components/smooth-saccade-merged-test-chart/smooth-saccade-velocity-chart/smooth-saccade-velocity-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    SaccadeMergedBulbicamTestChartComponent,
    SaccadeVelocityChartComponent,
    SaccadeMovementChartComponent,
    SaccadeRealTimeChartComponent,
    SaccadeTestResultsComponent,
    SmoothSaccadeMovementChartComponent,
    SmoothSaccadeVelocityChartComponent
  ],
  imports: [
    BrowserModule,
    RouterModule,
    HttpClientModule,
    AppRoutingModule,
  ],
  providers: [
    SaccadesMergedChartService,
    ParsingService,
    MovementComputingService,
    VelocityComputingService,
    CalibrationComputingService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
