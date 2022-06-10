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
import { MovementComputingService } from './saccade-memory-test/services/movementComputingService';
import { VelocityComputingService } from './saccade-memory-test/services/velocityComputingService';
import { CalibrationComputingService } from './saccade-memory-test/services/calibrationComputingService';
import { SaccadeTestResultsComponent } from './saccade-memory-test/components/saccade-merged-test-chart/saccade-test-results/saccade-test-results.component';
import { SmoothSaccadeMovementChartComponent } from './smooth-saccade-pursuit-test/components/smooth-saccade-merged-test-chart/smooth-saccade-movement-chart/smooth-saccade-movement-chart.component';
import { SmoothSaccadeVelocityChartComponent } from './smooth-saccade-pursuit-test/components/smooth-saccade-merged-test-chart/smooth-saccade-velocity-chart/smooth-saccade-velocity-chart.component';
import { SmoothSaccadeMergedTestChartComponent } from './smooth-saccade-pursuit-test/components/smooth-saccade-merged-test-chart/smooth-saccade-merged-test-chart.component';
import { SmoothPursuitParsingServiceService } from './smooth-saccade-pursuit-test/services/smoothPursuitParsingService.service';
import { SmoothPursuitMergedChartServiceService } from './smooth-saccade-pursuit-test/services/smoothPursuitMergedChartService.service';
import { MemoryParsingService } from './saccade-memory-test/services/memoryParsingService';
import { VelocityHorizontalComputingService } from './smooth-saccade-pursuit-test/services/velocityHorizontalComputingService';
import { VelocityVerticalComputingService } from './smooth-saccade-pursuit-test/services/velocityVerticalComputingService';
import { SmoothSaccadeHoryzontalChartComponent } from './smooth-saccade-pursuit-test/components/smooth-saccade-merged-test-chart/smooth-saccade-horyzontal-chart/smooth-saccade-horyzontal-chart.component';
import { SmoothSaccadeVerticalChartComponent } from './smooth-saccade-pursuit-test/components/smooth-saccade-merged-test-chart/smooth-saccade-vertical-chart/smooth-saccade-vertical-chart.component';
import { SmoothSaccadeRealTimeChartComponent } from './smooth-saccade-pursuit-test/components/smooth-saccade-merged-test-chart/smooth-saccade-real-time-chart/smooth-saccade-real-time-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    SaccadeMergedBulbicamTestChartComponent,
    SaccadeVelocityChartComponent,
    SaccadeMovementChartComponent,
    SaccadeRealTimeChartComponent,
    SaccadeTestResultsComponent,
    SmoothSaccadeMergedTestChartComponent,
    SmoothSaccadeMovementChartComponent,
    SmoothSaccadeVelocityChartComponent,
    SmoothSaccadeHoryzontalChartComponent,
    SmoothSaccadeVerticalChartComponent,
    SmoothSaccadeRealTimeChartComponent
  ],
  imports: [
    BrowserModule,
    RouterModule,
    HttpClientModule,
    AppRoutingModule,
  ],
  providers: [
    SaccadesMergedChartService,
    MovementComputingService,
    VelocityComputingService,
    CalibrationComputingService,
    SmoothPursuitParsingServiceService,
    SmoothPursuitMergedChartServiceService,
    MemoryParsingService,
    VelocityHorizontalComputingService,
    VelocityVerticalComputingService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
