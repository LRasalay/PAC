import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../services/api.service';
import { Policy, BulkEvaluationResponse, BulkEvaluationResultItem } from '../../models/policy.model';

@Component({
  selector: 'app-bulk-evaluation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatChipsModule,
    MatCheckboxModule,
    MatTooltipModule
  ],
  template: `
    <div class="bulk-container animate-fade-in">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>playlist_add_check</mat-icon>
          </div>
          <div class="header-text">
            <h1>Bulk Evaluation</h1>
            <p class="subtitle">Evaluate multiple data items against policies in a single request</p>
          </div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="bulk-grid">
        <!-- Input Panel -->
        <div class="input-panel">
          <div class="panel-card">
            <div class="panel-header">
              <div class="panel-title">
                <mat-icon>input</mat-icon>
                <h2>Bulk Input</h2>
              </div>
            </div>

            <div class="panel-content">
              <!-- Instructions -->
              <div class="instructions-box">
                <mat-icon>info</mat-icon>
                <div class="instructions-text">
                  <p>Enter a JSON array of evaluation items. Each item should have:</p>
                  <div class="code-hints">
                    <code>id</code>
                    <code>policy_id</code>
                    <code>data</code>
                  </div>
                </div>
              </div>

              <!-- Options -->
              <div class="options-section">
                <mat-checkbox [(ngModel)]="failFast" class="option-checkbox">
                  <span class="option-label">Fail Fast</span>
                  <span class="option-desc">Stop on first error</span>
                </mat-checkbox>
              </div>

              <!-- JSON Editor -->
              <div class="json-section">
                <div class="section-header">
                  <label class="section-label">
                    <mat-icon>data_array</mat-icon>
                    Evaluation Items (JSON Array)
                  </label>
                  <div class="section-actions">
                    <button mat-button class="action-btn" (click)="formatJson()" matTooltip="Format JSON">
                      <mat-icon>auto_fix_high</mat-icon>
                      Format
                    </button>
                    <button mat-button class="action-btn" (click)="loadSample()" matTooltip="Load sample data">
                      <mat-icon>science</mat-icon>
                      Sample
                    </button>
                  </div>
                </div>
                <div class="json-editor-wrapper">
                  <textarea
                    class="json-editor"
                    [(ngModel)]="inputJson"
                    rows="22"
                    placeholder='[
  {
    "id": "item-1",
    "policy_id": "mrm-model-documentation",
    "data": { "model": { ... } }
  },
  {
    "id": "item-2",
    "policy_id": "erm-risk-assessment",
    "data": { "businessUnit": { ... } }
  }
]'
                  ></textarea>
                </div>
                <div class="json-error" *ngIf="jsonError">
                  <mat-icon>error</mat-icon>
                  {{ jsonError }}
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="panel-actions">
              <button
                mat-raised-button
                color="primary"
                class="evaluate-btn"
                (click)="evaluate()"
                [disabled]="!inputJson || evaluating"
              >
                <mat-icon>{{ evaluating ? 'hourglass_top' : 'play_arrow' }}</mat-icon>
                {{ evaluating ? 'Evaluating...' : 'Evaluate All' }}
              </button>
              <button mat-stroked-button (click)="clear()">
                <mat-icon>refresh</mat-icon>
                Reset
              </button>
            </div>
          </div>
        </div>

        <!-- Results Panel -->
        <div class="results-panel">
          <!-- Loading State -->
          <div class="loading-card" *ngIf="evaluating">
            <mat-spinner diameter="56"></mat-spinner>
            <h3>Evaluating {{ itemCount }} items...</h3>
            <p>Processing bulk evaluation request</p>
          </div>

          <!-- Results -->
          <div class="results-card" *ngIf="result && !evaluating">
            <div class="results-header">
              <h2>Results</h2>
              <span class="results-count">{{ result.total }} items evaluated</span>
            </div>

            <!-- Summary Stats -->
            <div class="summary-stats">
              <div class="stat total">
                <mat-icon>list</mat-icon>
                <div class="stat-content">
                  <span class="stat-value">{{ result.total }}</span>
                  <span class="stat-label">Total</span>
                </div>
              </div>
              <div class="stat compliant">
                <mat-icon>check_circle</mat-icon>
                <div class="stat-content">
                  <span class="stat-value">{{ result.compliant }}</span>
                  <span class="stat-label">Compliant</span>
                </div>
              </div>
              <div class="stat non-compliant">
                <mat-icon>cancel</mat-icon>
                <div class="stat-content">
                  <span class="stat-value">{{ result.non_compliant }}</span>
                  <span class="stat-label">Non-Compliant</span>
                </div>
              </div>
              <div class="stat errors" *ngIf="result.errors > 0">
                <mat-icon>error</mat-icon>
                <div class="stat-content">
                  <span class="stat-value">{{ result.errors }}</span>
                  <span class="stat-label">Errors</span>
                </div>
              </div>
            </div>

            <!-- Results Table -->
            <div class="results-table-wrapper">
              <table mat-table [dataSource]="result.results" class="results-table">
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let item">
                    <div class="status-indicator" [class]="getItemStatus(item)">
                      <mat-icon>{{ getItemIcon(item) }}</mat-icon>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="id">
                  <th mat-header-cell *matHeaderCellDef>Item ID</th>
                  <td mat-cell *matCellDef="let item">
                    <span class="item-id">{{ item.id }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="policy_id">
                  <th mat-header-cell *matHeaderCellDef>Policy</th>
                  <td mat-cell *matCellDef="let item">
                    <a [routerLink]="['/policies', item.policy_id]" class="policy-link">
                      {{ item.policy_id }}
                    </a>
                  </td>
                </ng-container>

                <ng-container matColumnDef="summary">
                  <th mat-header-cell *matHeaderCellDef>Summary</th>
                  <td mat-cell *matCellDef="let item">
                    <span *ngIf="item.error" class="error-text">{{ item.error }}</span>
                    <div *ngIf="!item.error && item.summary" class="summary-chips">
                      <span class="chip pass">{{ item.summary.passed || 0 }} passed</span>
                      <span class="chip fail" *ngIf="item.summary.failed > 0">{{ item.summary.failed }} failed</span>
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;" [class.error-row]="row.error"></tr>
              </table>
            </div>
          </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="!result && !evaluating">
            <div class="empty-icon">
              <mat-icon>table_chart</mat-icon>
            </div>
            <h3>No Results Yet</h3>
            <p>Enter evaluation items and click "Evaluate All" to see results here.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bulk-container {
      max-width: 1500px;
      margin: 0 auto;
    }

    /* Page Header */
    .page-header {
      margin-bottom: 28px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35);
    }

    .header-icon mat-icon {
      color: white;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .header-text h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .header-text .subtitle {
      color: #64748b;
      font-size: 14px;
      margin: 4px 0 0 0;
    }

    /* Grid Layout */
    .bulk-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: start;
    }

    @media (max-width: 1200px) {
      .bulk-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Panel Card */
    .panel-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .panel-header {
      padding: 20px 24px;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .panel-title mat-icon {
      color: #8b5cf6;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .panel-title h2 {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .panel-content {
      padding: 24px;
    }

    /* Instructions */
    .instructions-box {
      display: flex;
      gap: 14px;
      padding: 16px 18px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
      border-radius: 12px;
      margin-bottom: 20px;
    }

    .instructions-box mat-icon {
      color: #0284c7;
      font-size: 22px;
      width: 22px;
      height: 22px;
      flex-shrink: 0;
    }

    .instructions-text p {
      margin: 0 0 10px 0;
      color: #0369a1;
      font-size: 14px;
    }

    .code-hints {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .code-hints code {
      padding: 4px 10px;
      background: white;
      border: 1px solid #bae6fd;
      border-radius: 6px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 13px;
      color: #0369a1;
    }

    /* Options */
    .options-section {
      margin-bottom: 20px;
    }

    .option-checkbox {
      display: flex;
      align-items: center;
    }

    .option-label {
      font-weight: 500;
      color: #1e293b;
      margin-right: 8px;
    }

    .option-desc {
      color: #64748b;
      font-size: 13px;
    }

    /* JSON Section */
    .json-section {
      margin-bottom: 0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .section-label mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .section-actions {
      display: flex;
      gap: 4px;
    }

    .action-btn {
      font-size: 12px;
      color: #64748b;
    }

    .action-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    /* JSON Editor */
    .json-editor-wrapper {
      background: #1e293b;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #334155;
    }

    .json-editor {
      width: 100%;
      padding: 16px;
      background: transparent;
      border: none;
      outline: none;
      color: #a5f3fc;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 13px;
      line-height: 1.6;
      resize: none;
      min-height: 400px;
    }

    .json-editor::placeholder {
      color: #475569;
    }

    .json-error {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border: 1px solid #fecaca;
      border-radius: 10px;
      color: #b91c1c;
      font-size: 13px;
    }

    .json-error mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Panel Actions */
    .panel-actions {
      display: flex;
      gap: 12px;
      padding: 20px 24px;
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
    }

    .evaluate-btn {
      flex: 1;
      height: 48px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
    }

    .evaluate-btn mat-icon {
      margin-right: 8px;
    }

    /* Results Card */
    .results-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
    }

    .results-header h2 {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .results-count {
      color: #64748b;
      font-size: 14px;
    }

    /* Summary Stats */
    .summary-stats {
      display: flex;
      gap: 16px;
      padding: 20px 24px;
      background: #f8fafc;
      border-bottom: 1px solid #f1f5f9;
      flex-wrap: wrap;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      border-radius: 12px;
      flex: 1;
      min-width: 120px;
    }

    .stat mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 22px;
      font-weight: 700;
    }

    .stat-label {
      font-size: 12px;
      font-weight: 500;
    }

    .stat.total {
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      color: #475569;
    }

    .stat.compliant {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      color: #15803d;
    }

    .stat.non-compliant {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      color: #b91c1c;
    }

    .stat.errors {
      background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
      color: #c2410c;
    }

    /* Results Table */
    .results-table-wrapper {
      overflow-x: auto;
    }

    .results-table {
      width: 100%;
    }

    ::ng-deep .results-table .mat-mdc-header-cell {
      font-weight: 600;
      color: #64748b;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      background: #f8fafc;
    }

    ::ng-deep .results-table .mat-mdc-cell {
      padding: 14px 16px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 10px;
    }

    .status-indicator mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .status-indicator.pass {
      background: #dcfce7;
      color: #16a34a;
    }

    .status-indicator.fail {
      background: #fee2e2;
      color: #dc2626;
    }

    .status-indicator.error {
      background: #ffedd5;
      color: #ea580c;
    }

    .item-id {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 13px;
      color: #1e293b;
    }

    .policy-link {
      color: #3b82f6;
      text-decoration: none;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 13px;
    }

    .policy-link:hover {
      text-decoration: underline;
    }

    .error-text {
      color: #b91c1c;
      font-size: 13px;
    }

    .error-row {
      background: #fef9c3;
    }

    .summary-chips {
      display: flex;
      gap: 8px;
    }

    .chip {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .chip.pass {
      background: #dcfce7;
      color: #15803d;
    }

    .chip.fail {
      background: #fee2e2;
      color: #b91c1c;
    }

    /* Loading State */
    .loading-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
      padding: 64px 32px;
      text-align: center;
    }

    .loading-card h3 {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin: 24px 0 8px 0;
    }

    .loading-card p {
      color: #64748b;
      margin: 0;
    }

    /* Empty State */
    .empty-state {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
      padding: 64px 32px;
      text-align: center;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    .empty-icon mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #94a3b8;
    }

    .empty-state h3 {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 8px 0;
    }

    .empty-state p {
      color: #64748b;
      margin: 0;
    }

    /* Animations */
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class BulkEvaluationComponent implements OnInit {
  policies: Policy[] = [];
  inputJson = '';
  jsonError = '';
  evaluating = false;
  failFast = false;
  result: BulkEvaluationResponse | null = null;
  itemCount = 0;
  displayedColumns = ['status', 'id', 'policy_id', 'summary'];

  constructor(
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPolicies();
  }

  loadPolicies(): void {
    this.apiService.listPolicies().subscribe({
      next: (response) => {
        this.policies = response.policies;
      },
      error: (err) => {
        console.error('Failed to load policies', err);
      }
    });
  }

  formatJson(): void {
    try {
      const parsed = JSON.parse(this.inputJson);
      this.inputJson = JSON.stringify(parsed, null, 2);
      this.jsonError = '';
    } catch (e) {
      this.jsonError = 'Invalid JSON format';
    }
  }

  loadSample(): void {
    const sample = [
      {
        id: 'model-001',
        policy_id: 'mrm-model-documentation',
        data: {
          model: {
            id: 'credit-score-v2',
            owner: 'Data Science Team',
            documentation: {
              url: 'https://docs.example.com/models/cs-v2',
              lastReviewDate: new Date().toISOString().split('T')[0]
            }
          }
        }
      },
      {
        id: 'model-002',
        policy_id: 'mrm-model-documentation',
        data: {
          model: {
            id: 'fraud-detection-v1',
            owner: 'Risk Analytics'
          }
        }
      },
      {
        id: 'risk-001',
        policy_id: 'erm-risk-assessment',
        data: {
          businessUnit: {
            id: 'BU-001',
            riskAssessment: {
              completedDate: new Date().toISOString().split('T')[0],
              categories: ['operational', 'credit'],
              highRiskCount: 2,
              criticalRiskCount: 0
            }
          }
        }
      }
    ];

    this.inputJson = JSON.stringify(sample, null, 2);
    this.jsonError = '';
  }

  getItemStatus(item: BulkEvaluationResultItem): string {
    if (item.error) return 'error';
    return item.compliant ? 'pass' : 'fail';
  }

  getItemIcon(item: BulkEvaluationResultItem): string {
    if (item.error) return 'error';
    return item.compliant ? 'check_circle' : 'cancel';
  }

  evaluate(): void {
    this.jsonError = '';
    let items: any[];

    try {
      items = JSON.parse(this.inputJson);
      if (!Array.isArray(items)) {
        this.jsonError = 'Input must be a JSON array';
        return;
      }
    } catch (e) {
      this.jsonError = 'Invalid JSON format';
      return;
    }

    this.itemCount = items.length;
    this.evaluating = true;
    this.result = null;

    this.apiService.bulkEvaluate({
      items: items,
      fail_fast: this.failFast
    }).subscribe({
      next: (result) => {
        this.result = result;
        this.evaluating = false;
      },
      error: (err) => {
        console.error('Bulk evaluation failed', err);
        this.snackBar.open('Evaluation failed: ' + (err.error?.detail || 'Unknown error'), 'Close', { duration: 5000 });
        this.evaluating = false;
      }
    });
  }

  clear(): void {
    this.inputJson = '';
    this.result = null;
    this.jsonError = '';
  }
}
