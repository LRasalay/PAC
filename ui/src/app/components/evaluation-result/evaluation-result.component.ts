import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EvaluationResult, RuleResult } from '../../models/policy.model';

@Component({
  selector: 'app-evaluation-result',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatExpansionModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="result-container animate-slide-up">
      <!-- Result Header -->
      <div class="result-header" [class.compliant]="result.compliant" [class.non-compliant]="!result.compliant">
        <div class="result-status">
          <div class="status-icon-wrapper" [class.compliant]="result.compliant" [class.non-compliant]="!result.compliant">
            <mat-icon>{{ result.compliant ? 'check_circle' : 'cancel' }}</mat-icon>
          </div>
          <div class="status-info">
            <h2>{{ result.compliant ? 'Compliant' : 'Non-Compliant' }}</h2>
            <p class="policy-ref">
              <mat-icon>description</mat-icon>
              {{ result.policy_id }}
            </p>
          </div>
        </div>

        <div class="result-summary">
          <div class="summary-stat pass" matTooltip="Rules passed">
            <mat-icon>check</mat-icon>
            <span class="stat-value">{{ result.summary.passed }}</span>
            <span class="stat-label">Passed</span>
          </div>
          <div class="summary-stat fail" *ngIf="result.summary.failed > 0" matTooltip="Rules failed">
            <mat-icon>close</mat-icon>
            <span class="stat-value">{{ result.summary.failed }}</span>
            <span class="stat-label">Failed</span>
          </div>
          <div class="summary-stat error" *ngIf="result.summary.errors > 0" matTooltip="Evaluation errors">
            <mat-icon>error</mat-icon>
            <span class="stat-value">{{ result.summary.errors }}</span>
            <span class="stat-label">Errors</span>
          </div>
          <div class="summary-stat skip" *ngIf="result.summary.skipped > 0" matTooltip="Rules skipped">
            <mat-icon>skip_next</mat-icon>
            <span class="stat-value">{{ result.summary.skipped }}</span>
            <span class="stat-label">Skipped</span>
          </div>
        </div>
      </div>

      <!-- Timestamp -->
      <div class="result-meta">
        <mat-icon>schedule</mat-icon>
        <span>Evaluated at {{ result.evaluated_at | date:'medium' }}</span>
      </div>

      <!-- Rule Results -->
      <div class="rules-results">
        <mat-accordion class="rules-accordion">
          <mat-expansion-panel *ngFor="let rule of result.results; let i = index"
                               class="rule-result-panel"
                               [class]="rule.status">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <div class="rule-status-indicator" [class]="rule.status">
                  <mat-icon>{{ getStatusIcon(rule.status) }}</mat-icon>
                </div>
                <div class="rule-info">
                  <span class="rule-id">{{ rule.rule_id }}</span>
                  <span class="rule-name">{{ rule.rule_name }}</span>
                </div>
              </mat-panel-title>
              <mat-panel-description>
                <span class="status-badge" [class]="rule.status">
                  {{ rule.status }}
                </span>
              </mat-panel-description>
            </mat-expansion-panel-header>

            <div class="rule-details">
              <!-- Message -->
              <div class="detail-section">
                <div class="detail-label">
                  <mat-icon>{{ rule.status === 'fail' ? 'healing' : 'info' }}</mat-icon>
                  {{ rule.status === 'fail' ? 'Remediation' : 'Message' }}
                </div>
                <div class="detail-content" [class.remediation]="rule.status === 'fail'">
                  {{ rule.message }}
                </div>
              </div>

              <!-- Details -->
              <div class="detail-section" *ngIf="rule.details && hasDetails(rule.details)">
                <div class="detail-label">
                  <mat-icon>data_object</mat-icon>
                  Details
                </div>
                <pre class="detail-json">{{ rule.details | json }}</pre>
              </div>
            </div>
          </mat-expansion-panel>
        </mat-accordion>
      </div>
    </div>
  `,
  styles: [`
    .result-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    /* Result Header */
    .result-header {
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 24px;
      border-bottom: 1px solid #f1f5f9;
    }

    .result-header.compliant {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-bottom-color: #bbf7d0;
    }

    .result-header.non-compliant {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border-bottom-color: #fecaca;
    }

    .result-status {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .status-icon-wrapper {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .status-icon-wrapper.compliant {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4);
    }

    .status-icon-wrapper.non-compliant {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
    }

    .status-icon-wrapper mat-icon {
      color: white;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .status-info h2 {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 4px 0;
      letter-spacing: -0.02em;
    }

    .result-header.compliant .status-info h2 {
      color: #15803d;
    }

    .result-header.non-compliant .status-info h2 {
      color: #b91c1c;
    }

    .policy-ref {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #64748b;
      font-size: 14px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      margin: 0;
    }

    .policy-ref mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Summary Stats */
    .result-summary {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .summary-stat {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 12px;
      cursor: default;
    }

    .summary-stat mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .summary-stat.pass {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      color: #15803d;
    }

    .summary-stat.fail {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      color: #b91c1c;
    }

    .summary-stat.error {
      background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
      color: #c2410c;
    }

    .summary-stat.skip {
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      color: #475569;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 700;
    }

    .stat-label {
      font-size: 13px;
      font-weight: 500;
    }

    /* Meta */
    .result-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 24px;
      background: #f8fafc;
      color: #64748b;
      font-size: 13px;
      border-bottom: 1px solid #f1f5f9;
    }

    .result-meta mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Rules Results */
    .rules-results {
      padding: 20px;
    }

    .rules-accordion {
      display: block;
    }

    .rule-result-panel {
      margin-bottom: 10px;
      border-radius: 12px !important;
      box-shadow: none !important;
      border: 1px solid #e2e8f0 !important;
      overflow: hidden;
    }

    .rule-result-panel::before {
      display: none !important;
    }

    .rule-result-panel.pass {
      border-left: 4px solid #22c55e !important;
    }

    .rule-result-panel.fail {
      border-left: 4px solid #ef4444 !important;
    }

    .rule-result-panel.error {
      border-left: 4px solid #f59e0b !important;
    }

    .rule-result-panel.skip {
      border-left: 4px solid #94a3b8 !important;
    }

    ::ng-deep .rule-result-panel .mat-expansion-panel-header {
      padding: 12px 20px;
    }

    .rule-status-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      margin-right: 14px;
    }

    .rule-status-indicator mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .rule-status-indicator.pass {
      background: #dcfce7;
      color: #16a34a;
    }

    .rule-status-indicator.fail {
      background: #fee2e2;
      color: #dc2626;
    }

    .rule-status-indicator.error {
      background: #ffedd5;
      color: #ea580c;
    }

    .rule-status-indicator.skip {
      background: #f1f5f9;
      color: #64748b;
    }

    .rule-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .rule-id {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 12px;
      padding: 4px 10px;
      background: #f1f5f9;
      border-radius: 6px;
      color: #475569;
    }

    .rule-name {
      font-weight: 500;
      color: #1e293b;
      font-size: 14px;
    }

    .status-badge {
      padding: 5px 12px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .status-badge.pass {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      color: #15803d;
    }

    .status-badge.fail {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      color: #b91c1c;
    }

    .status-badge.error {
      background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
      color: #c2410c;
    }

    .status-badge.skip {
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      color: #475569;
    }

    /* Rule Details */
    .rule-details {
      padding: 16px 0 0 0;
    }

    .detail-section {
      margin-bottom: 16px;
    }

    .detail-section:last-child {
      margin-bottom: 0;
    }

    .detail-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 10px;
    }

    .detail-label mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .detail-content {
      padding: 14px 18px;
      background: #f8fafc;
      border-radius: 10px;
      color: #1e293b;
      font-size: 14px;
      line-height: 1.6;
      border: 1px solid #e2e8f0;
    }

    .detail-content.remediation {
      background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
      border: 1px solid #fde047;
      border-left: 4px solid #eab308;
      color: #854d0e;
    }

    .detail-json {
      background: #1e293b;
      color: #a5f3fc;
      padding: 16px 20px;
      border-radius: 10px;
      overflow-x: auto;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 13px;
      line-height: 1.6;
      margin: 0;
    }

    /* Animations */
    .animate-slide-up {
      animation: slideUp 0.4s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class EvaluationResultComponent {
  @Input() result!: EvaluationResult;

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pass': return 'check_circle';
      case 'fail': return 'cancel';
      case 'error': return 'error';
      case 'skip': return 'skip_next';
      default: return 'help';
    }
  }

  hasDetails(details: Record<string, any>): boolean {
    return Object.keys(details).length > 0;
  }
}
