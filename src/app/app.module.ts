import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { SaccadeMergedBulbicamTestChartComponent } from './charts/components/saccade-merged-test-chart/saccade-merged-test-chart.component';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [
    AppComponent,
    SaccadeMergedBulbicamTestChartComponent,
  ],
  imports: [
    BrowserModule,
    RouterModule,
    AppRoutingModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
