import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../services/api.service';
import { Policy, Rule } from '../../models/policy.model';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-policy-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule
  ],
  template: `
    <div class="policy-detail-container animate-fade-in" *ngIf="policy">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a routerLink="/policies" class="breadcrumb-link">
          <mat-icon>description</mat-icon>
          Policies
        </a>
        <mat-icon class="breadcrumb-separator">chevron_right</mat-icon>
        <span class="breadcrumb-current">{{ policy.metadata.name }}</span>
      </div>

      <!-- Header Section -->
      <div class="header-card">
        <div class="header-top">
          <div class="header-left">
            <div class="domain-icon" [class]="policy.metadata.domain.toLowerCase()">
              <mat-icon>{{ getDomainIcon(policy.metadata.domain) }}</mat-icon>
            </div>
            <div class="header-info">
              <div class="header-badges">
                <span class="domain-badge" [class]="policy.metadata.domain.toLowerCase()">
                  {{ policy.metadata.domain }}
                </span>
                <span class="severity-badge" [class]="policy.metadata.severity || 'medium'">
                  {{ policy.metadata.severity || 'medium' }}
                </span>
                <span class="version-badge">v{{ policy.version }}</span>
              </div>
              <h1>{{ policy.metadata.name }}</h1>
              <p class="policy-id">
                <mat-icon>fingerprint</mat-icon>
                {{ policy.id }}
              </p>
            </div>
          </div>
          <div class="header-actions">
            <button mat-raised-button color="primary" [routerLink]="['/evaluate']" [queryParams]="{policy: policy.id}">
              <mat-icon>play_circle</mat-icon>
              Evaluate
            </button>
            <button mat-stroked-button [routerLink]="['/policies', policy.id, 'history']">
              <mat-icon>history</mat-icon>
              History
            </button>
            <button mat-stroked-button [routerLink]="['/policies', policy.id, 'edit']">
              <mat-icon>edit</mat-icon>
              Edit
            </button>
            <button mat-stroked-button color="warn" (click)="deletePolicy()">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <mat-tab-group class="content-tabs">
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>info</mat-icon>
            <span>Overview</span>
          </ng-template>
          <div class="tab-content">
            <!-- Info Cards Grid -->
            <div class="info-grid">
              <div class="info-card">
                <div class="info-card-header">
                  <mat-icon>description</mat-icon>
                  <h3>Description</h3>
                </div>
                <p>{{ policy.metadata.description || 'No description provided' }}</p>
              </div>

              <div class="info-card">
                <div class="info-card-header">
                  <mat-icon>person</mat-icon>
                  <h3>Owner</h3>
                </div>
                <p>{{ policy.metadata.owner || 'Not specified' }}</p>
              </div>

              <div class="info-card">
                <div class="info-card-header">
                  <mat-icon>event</mat-icon>
                  <h3>Effective Date</h3>
                </div>
                <p>{{ policy.metadata.effectiveDate || 'Not specified' }}</p>
              </div>

              <div class="info-card" *ngIf="policy.metadata.tags?.length">
                <div class="info-card-header">
                  <mat-icon>label</mat-icon>
                  <h3>Tags</h3>
                </div>
                <div class="tags-list">
                  <span class="tag" *ngFor="let tag of policy.metadata.tags">{{ tag }}</span>
                </div>
              </div>
            </div>

            <!-- Rules Section -->
            <div class="rules-section">
              <div class="section-header">
                <div class="section-title">
                  <mat-icon>rule</mat-icon>
                  <h2>Rules</h2>
                  <span class="rules-count">{{ policy.rules.length }}</span>
                </div>
              </div>

              <mat-accordion class="rules-accordion">
                <mat-expansion-panel *ngFor="let rule of policy.rules; let i = index"
                                     class="rule-panel"
                                     [class.has-when]="rule.when">
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <span class="rule-number">{{ i + 1 }}</span>
                      <span class="rule-id">{{ rule.id }}</span>
                      <span class="rule-name">{{ rule.name }}</span>
                    </mat-panel-title>
                    <mat-panel-description>
                      <span class="rule-type" *ngIf="rule.type">{{ rule.type }}</span>
                      <span class="severity-pill" [class]="rule.severity || policy.metadata.severity || 'medium'">
                        {{ rule.severity || policy.metadata.severity || 'medium' }}
                      </span>
                    </mat-panel-description>
                  </mat-expansion-panel-header>

                  <div class="rule-content">
                    <p class="rule-description" *ngIf="rule.description">{{ rule.description }}</p>

                    <div class="rule-section" *ngIf="rule.when">
                      <div class="section-label">
                        <mat-icon>call_split</mat-icon>
                        Precondition (when)
                      </div>
                      <pre class="code-block">{{ rule.when | json }}</pre>
                    </div>

                    <div class="rule-section">
                      <div class="section-label">
                        <mat-icon>checklist</mat-icon>
                        Conditions
                      </div>
                      <pre class="code-block">{{ rule.conditions | json }}</pre>
                    </div>

                    <div class="rule-section remediation" *ngIf="rule.remediation">
                      <div class="section-label">
                        <mat-icon>healing</mat-icon>
                        Remediation
                      </div>
                      <div class="remediation-text">{{ rule.remediation }}</div>
                    </div>
                  </div>
                </mat-expansion-panel>
              </mat-accordion>
            </div>
          </div>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>code</mat-icon>
            <span>JSON</span>
          </ng-template>
          <div class="tab-content">
            <div class="json-card">
              <div class="json-header">
                <h3>Policy Definition</h3>
                <button mat-icon-button matTooltip="Copy to clipboard" (click)="copyJson()">
                  <mat-icon>content_copy</mat-icon>
                </button>
              </div>
              <pre class="json-view">{{ policy | json }}</pre>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>

    <!-- Loading State -->
    <div class="loading-container" *ngIf="loading">
      <div class="loading-content">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading policy...</p>
      </div>
    </div>
  `,
  styles: [`
    .policy-detail-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Breadcrumb */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      font-size: 14px;
    }

    .breadcrumb-link {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #64748b;
      text-decoration: none;
      transition: color 0.2s;
    }

    .breadcrumb-link:hover {
      color: #3b82f6;
    }

    .breadcrumb-link mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .breadcrumb-separator {
      color: #cbd5e1;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .breadcrumb-current {
      color: #1e293b;
      font-weight: 500;
    }

    /* Header Card */
    .header-card {
      background: white;
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      gap: 20px;
      flex: 1;
    }

    .domain-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .domain-icon.mrm {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
    }

    .domain-icon.erm {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
    }

    .domain-icon.crm {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);
    }

    .domain-icon mat-icon {
      color: white;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .header-info {
      flex: 1;
    }

    .header-badges {
      display: flex;
      gap: 10px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .domain-badge {
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .domain-badge.mrm {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      color: #1d4ed8;
    }

    .domain-badge.erm {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      color: #047857;
    }

    .domain-badge.crm {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #b45309;
    }

    .severity-badge {
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.03em;
    }

    .severity-badge.critical {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      color: #b91c1c;
    }
    .severity-badge.high {
      background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
      color: #c2410c;
    }
    .severity-badge.medium {
      background: linear-gradient(135deg, #fef9c3 0%, #fef08a 100%);
      color: #a16207;
    }
    .severity-badge.low {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      color: #15803d;
    }

    .version-badge {
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      background: #f1f5f9;
      color: #475569;
    }

    .header-info h1 {
      font-size: 26px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 8px 0;
      letter-spacing: -0.02em;
    }

    .policy-id {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #64748b;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 14px;
      margin: 0;
    }

    .policy-id mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .header-actions button {
      border-radius: 10px;
    }

    .header-actions button mat-icon {
      margin-right: 6px;
    }

    /* Tabs */
    .content-tabs {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    ::ng-deep .content-tabs .mat-mdc-tab-header {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    ::ng-deep .content-tabs .mat-mdc-tab {
      min-width: 140px;
    }

    ::ng-deep .content-tabs .mat-mdc-tab .mdc-tab__content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tab-content {
      padding: 28px;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .info-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e2e8f0;
    }

    .info-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .info-card-header mat-icon {
      color: #64748b;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .info-card-header h3 {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0;
    }

    .info-card p {
      margin: 0;
      color: #1e293b;
      font-size: 15px;
      line-height: 1.5;
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag {
      display: inline-block;
      padding: 5px 12px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      font-size: 13px;
      color: #475569;
    }

    /* Rules Section */
    .rules-section {
      margin-top: 8px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-title mat-icon {
      color: #3b82f6;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .section-title h2 {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .rules-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      padding: 0 10px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 600;
    }

    /* Rules Accordion */
    .rules-accordion {
      display: block;
    }

    .rule-panel {
      margin-bottom: 12px;
      border-radius: 12px !important;
      border: 1px solid #e2e8f0 !important;
      box-shadow: none !important;
      overflow: hidden;
    }

    .rule-panel::before {
      display: none !important;
    }

    .rule-panel.has-when {
      border-left: 3px solid #f59e0b !important;
    }

    ::ng-deep .rule-panel .mat-expansion-panel-header {
      padding: 16px 20px;
    }

    .rule-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: #f1f5f9;
      color: #64748b;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      margin-right: 12px;
    }

    .rule-id {
      font-family: 'SF Mono', 'Fira Code', monospace;
      background: #f1f5f9;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      color: #475569;
      margin-right: 12px;
    }

    .rule-name {
      font-weight: 500;
      color: #1e293b;
    }

    .rule-type {
      font-size: 12px;
      color: #64748b;
      margin-right: 12px;
      text-transform: capitalize;
    }

    .severity-pill {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .severity-pill.critical { background: #fee2e2; color: #b91c1c; }
    .severity-pill.high { background: #ffedd5; color: #c2410c; }
    .severity-pill.medium { background: #fef9c3; color: #a16207; }
    .severity-pill.low { background: #dcfce7; color: #15803d; }

    .rule-content {
      padding: 16px 0 0 0;
    }

    .rule-description {
      color: #64748b;
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 20px 0;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 3px solid #e2e8f0;
    }

    .rule-section {
      margin-bottom: 20px;
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
      margin-bottom: 10px;
    }

    .section-label mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .code-block {
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

    .rule-section.remediation .section-label {
      color: #0891b2;
    }

    .remediation-text {
      background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%);
      border: 1px solid #a5f3fc;
      border-left: 3px solid #0891b2;
      padding: 16px 20px;
      border-radius: 10px;
      color: #0e7490;
      font-size: 14px;
      line-height: 1.6;
    }

    /* JSON View */
    .json-card {
      background: #1e293b;
      border-radius: 12px;
      overflow: hidden;
    }

    .json-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #334155;
    }

    .json-header h3 {
      margin: 0;
      color: #e2e8f0;
      font-size: 14px;
      font-weight: 500;
    }

    .json-header button {
      color: #94a3b8;
    }

    .json-header button:hover {
      color: white;
    }

    .json-view {
      padding: 20px;
      margin: 0;
      color: #a5f3fc;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 13px;
      line-height: 1.6;
      overflow-x: auto;
      max-height: 600px;
    }

    /* Loading */
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .loading-content {
      text-align: center;
    }

    .loading-content p {
      margin-top: 16px;
      color: #64748b;
    }

    /* Animations */
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-top {
        flex-direction: column;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-start;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PolicyDetailComponent implements OnInit {
  policy: Policy | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const policyId = this.route.snapshot.paramMap.get('id');
    if (policyId) {
      this.loadPolicy(policyId);
    }
  }

  loadPolicy(policyId: string): void {
    this.apiService.getPolicy(policyId).subscribe({
      next: (policy) => {
        this.policy = policy;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load policy', err);
        this.snackBar.open('Failed to load policy', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  getDomainIcon(domain: string): string {
    switch (domain) {
      case 'MRM': return 'model_training';
      case 'ERM': return 'security';
      case 'CRM': return 'handshake';
      default: return 'description';
    }
  }

  copyJson(): void {
    if (this.policy) {
      navigator.clipboard.writeText(JSON.stringify(this.policy, null, 2));
      this.snackBar.open('Copied to clipboard', 'Close', { duration: 2000 });
    }
  }

  deletePolicy(): void {
    if (!this.policy) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Policy',
        message: `Are you sure you want to delete "${this.policy.metadata.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && this.policy) {
        this.apiService.deletePolicy(this.policy.id).subscribe({
          next: () => {
            this.snackBar.open('Policy deleted successfully', 'Close', { duration: 3000 });
            this.router.navigate(['/policies']);
          },
          error: (err) => {
            console.error('Failed to delete policy', err);
            this.snackBar.open('Failed to delete policy', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
}
