import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PolicyListComponent } from './components/policy-list/policy-list.component';
import { PolicyDetailComponent } from './components/policy-detail/policy-detail.component';
import { PolicyEditorComponent } from './components/policy-editor/policy-editor.component';
import { EvaluationComponent } from './components/evaluation/evaluation.component';
import { EvaluationHistoryComponent } from './components/evaluation-history/evaluation-history.component';
import { BulkEvaluationComponent } from './components/bulk-evaluation/bulk-evaluation.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'policies', component: PolicyListComponent },
  { path: 'policies/new', component: PolicyEditorComponent },
  { path: 'policies/:id', component: PolicyDetailComponent },
  { path: 'policies/:id/edit', component: PolicyEditorComponent },
  { path: 'policies/:id/history', component: EvaluationHistoryComponent },
  { path: 'evaluate', component: EvaluationComponent },
  { path: 'evaluate/bulk', component: BulkEvaluationComponent },
  { path: '**', redirectTo: '/dashboard' }
];
