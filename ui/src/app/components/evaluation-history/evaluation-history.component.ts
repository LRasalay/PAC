import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../services/api.service';

interface EvaluationLog {
  id: string;
  policy_id: string;
  compliant: boolean;
  evaluated_at: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    errors: number;
    skipped: number;
  };
}

@Component({
  selector: 'app-evaluation-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatChipsModule
  ],
  template: `
    <div class="history-container">
      <div class="header">
        <button mat-icon-button routerLink="/policies" *ngIf="policyId">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Evaluation History</h1>
        <span class="policy-id" *ngIf="policyId">{{ policyId }}</span>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="loading" *ngIf="loading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <table mat-table [dataSource]="evaluations" *ngIf="!loading && evaluations.length > 0">
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let eval">
                <mat-icon [class.pass]="eval.compliant" [class.fail]="!eval.compliant">
                  {{ eval.compliant ? 'check_circle' : 'cancel' }}
                </mat-icon>
              </td>
            </ng-container>

            <ng-container matColumnDef="policy_id">
              <th mat-header-cell *matHeaderCellDef>Policy</th>
              <td mat-cell *matCellDef="let eval">
                <a [routerLink]="['/policies', eval.policy_id]">{{ eval.policy_id }}</a>
              </td>
            </ng-container>

            <ng-container matColumnDef="evaluated_at">
              <th mat-header-cell *matHeaderCellDef>Evaluated At</th>
              <td mat-cell *matCellDef="let eval">{{ eval.evaluated_at | date:'medium' }}</td>
            </ng-container>

            <ng-container matColumnDef="summary">
              <th mat-header-cell *matHeaderCellDef>Summary</th>
              <td mat-cell *matCellDef="let eval">
                <div class="summary-chips">
                  <mat-chip class="pass">{{ eval.summary.passed }} passed</mat-chip>
                  <mat-chip class="fail" *ngIf="eval.summary.failed > 0">{{ eval.summary.failed }} failed</mat-chip>
                  <mat-chip class="error" *ngIf="eval.summary.errors > 0">{{ eval.summary.errors }} errors</mat-chip>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <div class="empty-state" *ngIf="!loading && evaluations.length === 0">
            <mat-icon>history</mat-icon>
            <p>No evaluation history found</p>
            <button mat-raised-button color="primary" routerLink="/evaluate">
              Run an Evaluation
            </button>
          </div>

          <mat-paginator
            *ngIf="totalCount > pageSize"
            [length]="totalCount"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)"
          ></mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .history-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0;
    }

    .policy-id {
      font-family: monospace;
      background: #e0e0e0;
      padding: 4px 12px;
      border-radius: 4px;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    table {
      width: 100%;
    }

    .pass { color: #4caf50; }
    .fail { color: #f44336; }

    .summary-chips {
      display: flex;
      gap: 8px;
    }

    .summary-chips mat-chip {
      font-size: 11px;
    }

    .summary-chips .pass { background: #e8f5e9; color: #2e7d32; }
    .summary-chips .fail { background: #ffebee; color: #c62828; }
    .summary-chips .error { background: #fff3e0; color: #e65100; }

    .empty-state {
      text-align: center;
      padding: 48px;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
    }

    a {
      color: #1976d2;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }
  `]
})
export class EvaluationHistoryComponent implements OnInit {
  evaluations: EvaluationLog[] = [];
  loading = true;
  policyId: string | null = null;
  displayedColumns = ['status', 'policy_id', 'evaluated_at', 'summary'];
  pageSize = 25;
  totalCount = 0;
  currentPage = 0;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.policyId = this.route.snapshot.paramMap.get('id');
    this.loadHistory();
  }

  loadHistory(): void {
    if (!this.policyId) {
      this.loading = false;
      return;
    }

    this.loading = true;
    const offset = this.currentPage * this.pageSize;

    this.apiService.getEvaluationHistory(this.policyId, this.pageSize, offset).subscribe({
      next: (response) => {
        this.evaluations = response.evaluations || [];
        this.totalCount = response.total || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load evaluation history', err);
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadHistory();
  }
}
