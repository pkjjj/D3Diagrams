import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { SaccadeMergedBulbicamTestChartComponent } from './charts/components/saccade-merged-test-chart/saccade-merged-test-chart.component';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { SaccadesMergedChartService } from './charts/services/saccadesMergedChartService';
import { HttpClientModule } from '@angular/common/http';
import { SaccadeVelocityChartComponent } from './charts/components/saccade-merged-test-chart/saccade-velocity-chart/saccade-velocity-chart.component';
import { SaccadeMovementChartComponent } from './charts/components/saccade-merged-test-chart/saccade-movement-chart/saccade-movement-chart.component';
import { SaccadeRealTimeChartComponent } from './charts/components/saccade-merged-test-chart/saccade-real-time-chart/saccade-real-time-chart.component';
import { ParsingService } from './charts/services/parsingService';
import { MovementComputingService } from './charts/services/movementComputingService';
import { VelocityComputingService } from './charts/services/velocityComputingService';

@NgModule({
  declarations: [
    AppComponent,
    SaccadeMergedBulbicamTestChartComponent,
    SaccadeVelocityChartComponent,
    SaccadeMovementChartComponent,
    SaccadeRealTimeChartComponent
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
    VelocityComputingService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
