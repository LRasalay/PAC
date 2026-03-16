import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../services/api.service';
import { Policy, EvaluationResult } from '../../models/policy.model';
import { EvaluationResultComponent } from '../evaluation-result/evaluation-result.component';

@Component({
  selector: 'app-evaluation',
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
    MatDividerModule,
    MatTooltipModule,
    EvaluationResultComponent
  ],
  template: `
    <div class="evaluation-container animate-fade-in">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>play_circle</mat-icon>
          </div>
          <div class="header-text">
            <h1>Evaluate Compliance</h1>
            <p class="subtitle">Test data against policy rules to check compliance</p>
          </div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="evaluation-grid">
        <!-- Input Panel -->
        <div class="input-panel">
          <div class="panel-card">
            <div class="panel-header">
              <div class="panel-title">
                <mat-icon>tune</mat-icon>
                <h2>Evaluation Input</h2>
              </div>
            </div>

            <div class="panel-content">
              <!-- Policy Selector -->
              <div class="form-section">
                <label class="section-label">
                  <mat-icon>description</mat-icon>
                  Select Policy
                </label>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-select [(ngModel)]="selectedPolicyId" (selectionChange)="onPolicySelect()" placeholder="Choose a policy to evaluate against">
                    <mat-optgroup *ngFor="let domain of domains" [label]="domain.label">
                      <mat-option *ngFor="let policy of domain.policies" [value]="policy.id">
                        <div class="policy-option">
                          <span class="policy-name">{{ policy.metadata.name }}</span>
                          <span class="policy-id-small">{{ policy.id }}</span>
                        </div>
                      </mat-option>
                    </mat-optgroup>
                  </mat-select>
                </mat-form-field>
              </div>

              <!-- JSON Input -->
              <div class="form-section">
                <div class="section-header">
                  <label class="section-label">
                    <mat-icon>code</mat-icon>
                    Data to Evaluate (JSON)
                  </label>
                  <div class="section-actions">
                    <button mat-button class="action-btn" (click)="formatJson()" matTooltip="Format JSON">
                      <mat-icon>auto_fix_high</mat-icon>
                      Format
                    </button>
                    <button mat-button class="action-btn" (click)="loadSampleData()" *ngIf="selectedPolicyId" matTooltip="Load sample data">
                      <mat-icon>science</mat-icon>
                      Sample
                    </button>
                  </div>
                </div>
                <div class="json-editor-wrapper">
                  <div class="editor-line-numbers">
                    <span *ngFor="let line of getLineNumbers()">{{ line }}</span>
                  </div>
                  <textarea
                    class="json-editor"
                    [(ngModel)]="inputJson"
                    (input)="updateLineNumbers()"
                    (scroll)="syncScroll($event)"
                    placeholder='{"model": {"id": "...", ...}}'
                    rows="18"
                    #jsonTextarea
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
                [disabled]="!selectedPolicyId || !inputJson || evaluating"
              >
                <mat-icon>{{ evaluating ? 'hourglass_top' : 'play_arrow' }}</mat-icon>
                {{ evaluating ? 'Evaluating...' : 'Run Evaluation' }}
              </button>
              <button mat-stroked-button (click)="clear()">
                <mat-icon>refresh</mat-icon>
                Reset
              </button>
            </div>
          </div>
        </div>

        <!-- Result Panel -->
        <div class="result-panel">
          <app-evaluation-result
            *ngIf="result"
            [result]="result"
          ></app-evaluation-result>

          <!-- Empty State -->
          <div class="empty-result" *ngIf="!result && !evaluating">
            <div class="empty-icon">
              <mat-icon>assessment</mat-icon>
            </div>
            <h3>Ready to Evaluate</h3>
            <p>Select a policy and enter JSON data to check compliance against the policy rules.</p>
            <div class="empty-steps">
              <div class="step">
                <span class="step-number">1</span>
                <span>Select a policy</span>
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <span>Enter or load data</span>
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <span>Run evaluation</span>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div class="loading-result" *ngIf="evaluating">
            <div class="loading-animation">
              <mat-spinner diameter="56"></mat-spinner>
            </div>
            <h3>Evaluating...</h3>
            <p>Checking data against policy rules</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .evaluation-container {
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
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
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
    .evaluation-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: start;
    }

    @media (max-width: 1200px) {
      .evaluation-grid {
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
      color: #3b82f6;
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

    /* Form Sections */
    .form-section {
      margin-bottom: 24px;
    }

    .form-section:last-child {
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
      margin-bottom: 12px;
    }

    .section-header .section-label {
      margin-bottom: 0;
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

    .full-width {
      width: 100%;
    }

    /* Policy Option */
    .policy-option {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .policy-name {
      font-weight: 500;
      color: #1e293b;
    }

    .policy-id-small {
      font-size: 12px;
      color: #94a3b8;
      font-family: 'SF Mono', 'Fira Code', monospace;
    }

    /* JSON Editor */
    .json-editor-wrapper {
      display: flex;
      background: #1e293b;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #334155;
    }

    .editor-line-numbers {
      display: flex;
      flex-direction: column;
      padding: 16px 0;
      min-width: 44px;
      background: #0f172a;
      text-align: right;
      border-right: 1px solid #334155;
      user-select: none;
    }

    .editor-line-numbers span {
      padding: 0 12px;
      font-size: 13px;
      line-height: 1.6;
      color: #475569;
      font-family: 'SF Mono', 'Fira Code', monospace;
    }

    .json-editor {
      flex: 1;
      padding: 16px;
      background: transparent;
      border: none;
      outline: none;
      color: #a5f3fc;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 13px;
      line-height: 1.6;
      resize: none;
      min-height: 340px;
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

    /* Empty State */
    .empty-result {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
      padding: 48px 32px;
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

    .empty-result h3 {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 8px 0;
    }

    .empty-result p {
      color: #64748b;
      margin: 0 0 32px 0;
      max-width: 320px;
      margin-left: auto;
      margin-right: auto;
    }

    .empty-steps {
      display: flex;
      justify-content: center;
      gap: 32px;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #64748b;
      font-size: 14px;
    }

    .step-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      border-radius: 50%;
      font-size: 13px;
      font-weight: 600;
    }

    /* Loading State */
    .loading-result {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
      padding: 64px 32px;
      text-align: center;
    }

    .loading-animation {
      margin-bottom: 24px;
    }

    .loading-result h3 {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 8px 0;
    }

    .loading-result p {
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
export class EvaluationComponent implements OnInit {
  policies: Policy[] = [];
  domains: { label: string; policies: Policy[] }[] = [];
  selectedPolicyId = '';
  inputJson = '';
  jsonError = '';
  evaluating = false;
  result: EvaluationResult | null = null;
  lineCount = 18;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPolicies();

    this.route.queryParams.subscribe(params => {
      if (params['policy']) {
        this.selectedPolicyId = params['policy'];
      }
    });
  }

  loadPolicies(): void {
    this.apiService.listPolicies().subscribe({
      next: (response) => {
        this.policies = response.policies;
        this.groupByDomain();
      },
      error: (err) => {
        console.error('Failed to load policies', err);
      }
    });
  }

  groupByDomain(): void {
    const domainMap: Record<string, Policy[]> = {
      MRM: [],
      ERM: [],
      CRM: []
    };

    this.policies.forEach(p => {
      const domain = p.metadata.domain;
      if (domainMap[domain]) {
        domainMap[domain].push(p);
      }
    });

    this.domains = [
      { label: 'Model Risk Management (MRM)', policies: domainMap['MRM'] },
      { label: 'Enterprise Risk Management (ERM)', policies: domainMap['ERM'] },
      { label: 'Counterparty Risk Management (CRM)', policies: domainMap['CRM'] }
    ].filter(d => d.policies.length > 0);
  }

  onPolicySelect(): void {
    this.result = null;
  }

  getLineNumbers(): number[] {
    return Array.from({ length: this.lineCount }, (_, i) => i + 1);
  }

  updateLineNumbers(): void {
    const lines = this.inputJson.split('\n').length;
    this.lineCount = Math.max(18, lines);
  }

  syncScroll(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const lineNumbers = textarea.previousElementSibling as HTMLElement;
    if (lineNumbers) {
      lineNumbers.scrollTop = textarea.scrollTop;
    }
  }

  formatJson(): void {
    try {
      const parsed = JSON.parse(this.inputJson);
      this.inputJson = JSON.stringify(parsed, null, 2);
      this.updateLineNumbers();
      this.jsonError = '';
    } catch (e) {
      this.jsonError = 'Invalid JSON format';
    }
  }

  loadSampleData(): void {
    const policy = this.policies.find(p => p.id === this.selectedPolicyId);
    if (!policy) return;

    let sampleData: any = {};

    if (policy.metadata.domain === 'MRM') {
      sampleData = {
        model: {
          id: 'sample-model-001',
          owner: 'Data Science Team',
          documentation: {
            url: 'https://docs.example.com/models/sample',
            lastReviewDate: new Date().toISOString().split('T')[0]
          },
          specification: {
            methodology: 'XGBoost',
            inputVariables: ['feature1', 'feature2'],
            outputVariables: ['prediction']
          },
          validation: {
            status: 'approved',
            completedDate: new Date().toISOString().split('T')[0]
          },
          metrics: {
            auc: 0.85,
            accuracy: 0.92
          },
          riskRating: 'medium',
          environment: 'production',
          monitoring: {
            enabled: true,
            thresholds: { performance: 0.8 },
            dataDriftEnabled: true,
            lastReportDate: new Date().toISOString().split('T')[0]
          }
        }
      };
    } else if (policy.metadata.domain === 'ERM') {
      sampleData = {
        businessUnit: {
          id: 'BU-001',
          name: 'Retail Banking',
          riskAssessment: {
            completedDate: new Date().toISOString().split('T')[0],
            categories: ['operational', 'credit', 'market'],
            highRiskCount: 2,
            criticalRiskCount: 0,
            mitigationPlans: [{ risk: 'R1', plan: 'Mitigation 1' }],
            allRisksHaveOwners: true
          }
        },
        metrics: {
          operationalLoss: { quarterlyTotal: 5000000 },
          creditRisk: { utilizationPercent: 75 },
          marketRisk: { varUtilization: 80 },
          liquidity: { coverageRatio: 120 },
          concentration: { largestExposurePercent: 8 }
        }
      };
    } else if (policy.metadata.domain === 'CRM') {
      sampleData = {
        counterparty: {
          id: 'CP-001',
          name: 'Acme Corporation',
          limit: {
            approved: true,
            amount: 10000000,
            lastReviewDate: new Date().toISOString().split('T')[0]
          },
          exposure: {
            current: 7500000,
            utilizationPercent: 75
          },
          secured: true,
          collateral: {
            coverageRatio: 110
          },
          creditRating: {
            internal: 'A'
          },
          financials: {
            statementDate: new Date().toISOString().split('T')[0]
          },
          kyc: {
            status: 'complete',
            lastUpdateDate: new Date().toISOString().split('T')[0]
          },
          creditMetrics: {
            probabilityOfDefault: 0.02
          }
        }
      };
    }

    this.inputJson = JSON.stringify(sampleData, null, 2);
    this.updateLineNumbers();
    this.jsonError = '';
  }

  evaluate(): void {
    this.jsonError = '';

    let data: any;
    try {
      data = JSON.parse(this.inputJson);
    } catch (e) {
      this.jsonError = 'Invalid JSON format';
      return;
    }

    this.evaluating = true;
    this.result = null;

    this.apiService.evaluate({
      policy_id: this.selectedPolicyId,
      data: data
    }).subscribe({
      next: (result) => {
        this.result = result;
        this.evaluating = false;
      },
      error: (err) => {
        console.error('Evaluation failed', err);
        this.snackBar.open('Evaluation failed: ' + (err.error?.detail || 'Unknown error'), 'Close', { duration: 5000 });
        this.evaluating = false;
      }
    });
  }

  clear(): void {
    this.inputJson = '';
    this.result = null;
    this.jsonError = '';
    this.lineCount = 18;
  }
}
