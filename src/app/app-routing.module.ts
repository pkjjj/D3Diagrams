import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SaccadeMergedBulbicamTestChartComponent } from './charts/components/saccade-merged-test-chart/saccade-merged-test-chart.component';

const routes: Routes = [
  { path: '', component: SaccadeMergedBulbicamTestChartComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
