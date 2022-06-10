import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SaccadeMergedBulbicamTestChartComponent } from './saccade-memory-test/components/saccade-merged-test-chart/saccade-merged-test-chart.component';
import { SmoothSaccadeMergedTestChartComponent } from './smooth-saccade-pursuit-test/components/smooth-saccade-merged-test-chart/smooth-saccade-merged-test-chart.component';

const routes: Routes = [
  { path: 'ses', component: SaccadeMergedBulbicamTestChartComponent },
  { path: '', component: SmoothSaccadeMergedTestChartComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
