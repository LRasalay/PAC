import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';
import { ApiService } from '../../services/api.service';
import { Policy } from '../../models/policy.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatRippleModule
  ],
  template: `
    <div class="dashboard animate-fade-in">
      <!-- Welcome Section -->
      <div class="welcome-section">
        <div class="welcome-content">
          <h1>Welcome to PolicyHub</h1>
          <p>Manage compliance policies for Model Risk, Enterprise Risk, and Counterparty Risk Management</p>
        </div>
        <div class="welcome-actions">
          <button mat-raised-button color="primary" routerLink="/policies/new" class="primary-btn">
            <mat-icon>add</mat-icon>
            Create Policy
          </button>
          <button mat-raised-button routerLink="/evaluate" class="secondary-btn">
            <mat-icon>check_circle</mat-icon>
            Run Evaluation
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid" *ngIf="!loading">
        <div class="stat-card total" matRipple>
          <div class="stat-icon">
            <mat-icon>library_books</mat-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ totalPolicies }}</span>
            <span class="stat-label">Total Policies</span>
          </div>
          <div class="stat-trend up">
            <mat-icon>trending_up</mat-icon>
            <span>Active</span>
          </div>
        </div>

        <div class="stat-card mrm" matRipple routerLink="/policies" [queryParams]="{domain: 'MRM'}">
          <div class="stat-icon">
            <mat-icon>model_training</mat-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ mrmCount }}</span>
            <span class="stat-label">Model Risk (MRM)</span>
          </div>
          <div class="stat-badge">MRM</div>
        </div>

        <div class="stat-card erm" matRipple routerLink="/policies" [queryParams]="{domain: 'ERM'}">
          <div class="stat-icon">
            <mat-icon>business_center</mat-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ ermCount }}</span>
            <span class="stat-label">Enterprise Risk (ERM)</span>
          </div>
          <div class="stat-badge">ERM</div>
        </div>

        <div class="stat-card crm" matRipple routerLink="/policies" [queryParams]="{domain: 'CRM'}">
          <div class="stat-icon">
            <mat-icon>account_balance</mat-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ crmCount }}</span>
            <span class="stat-label">Counterparty Risk (CRM)</span>
          </div>
          <div class="stat-badge">CRM</div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading dashboard data...</p>
      </div>

      <!-- Two Column Layout -->
      <div class="content-grid" *ngIf="!loading">
        <!-- Recent Policies -->
        <div class="content-section">
          <div class="section-header">
            <h2>Recent Policies</h2>
            <a routerLink="/policies" class="view-all">View all <mat-icon>arrow_forward</mat-icon></a>
          </div>

          <div class="policies-list">
            <div
              *ngFor="let policy of policies.slice(0, 5)"
              class="policy-item"
              [routerLink]="['/policies', policy.id]"
              matRipple
            >
              <div class="policy-icon" [class]="policy.metadata.domain.toLowerCase()">
                <mat-icon>{{ getDomainIcon(policy.metadata.domain) }}</mat-icon>
              </div>
              <div class="policy-info">
                <span class="policy-name">{{ policy.metadata.name }}</span>
                <span class="policy-meta">{{ policy.rules.length }} rules · v{{ policy.version }}</span>
              </div>
              <div class="policy-badges">
                <span class="domain-badge" [class]="policy.metadata.domain.toLowerCase()">
                  {{ policy.metadata.domain }}
                </span>
                <span class="severity-badge" [class]="policy.metadata.severity || 'medium'">
                  {{ policy.metadata.severity || 'medium' }}
                </span>
              </div>
              <mat-icon class="chevron">chevron_right</mat-icon>
            </div>

            <div *ngIf="policies.length === 0" class="empty-state">
              <mat-icon>folder_open</mat-icon>
              <p>No policies found</p>
              <button mat-raised-button color="primary" routerLink="/policies/new">
                Create your first policy
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="content-section">
          <div class="section-header">
            <h2>Quick Actions</h2>
          </div>

          <div class="actions-grid">
            <div class="action-card" routerLink="/policies/new" matRipple>
              <div class="action-icon create">
                <mat-icon>add_circle</mat-icon>
              </div>
              <div class="action-content">
                <span class="action-title">Create Policy</span>
                <span class="action-desc">Define new compliance rules</span>
              </div>
            </div>

            <div class="action-card" routerLink="/evaluate" matRipple>
              <div class="action-icon evaluate">
                <mat-icon>fact_check</mat-icon>
              </div>
              <div class="action-content">
                <span class="action-title">Evaluate Data</span>
                <span class="action-desc">Check compliance status</span>
              </div>
            </div>

            <div class="action-card" routerLink="/evaluate/bulk" matRipple>
              <div class="action-icon bulk">
                <mat-icon>playlist_add_check</mat-icon>
              </div>
              <div class="action-content">
                <span class="action-title">Bulk Evaluation</span>
                <span class="action-desc">Process multiple items</span>
              </div>
            </div>

            <a class="action-card" href="http://localhost:8000/api/v1/docs" target="_blank" matRipple>
              <div class="action-icon api">
                <mat-icon>code</mat-icon>
              </div>
              <div class="action-content">
                <span class="action-title">API Documentation</span>
                <span class="action-desc">Explore the REST API</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Welcome Section */
    .welcome-section {
      background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
      border-radius: 20px;
      padding: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      position: relative;
      overflow: hidden;
    }

    .welcome-section::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
      pointer-events: none;
    }

    .welcome-content h1 {
      font-size: 28px;
      font-weight: 700;
      color: white;
      margin: 0 0 8px 0;
    }

    .welcome-content p {
      color: rgba(255, 255, 255, 0.7);
      margin: 0;
      font-size: 15px;
    }

    .welcome-actions {
      display: flex;
      gap: 12px;
      position: relative;
      z-index: 1;
    }

    .primary-btn {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
      padding: 0 24px !important;
      height: 44px !important;
    }

    .secondary-btn {
      background: rgba(255, 255, 255, 0.1) !important;
      color: white !important;
      padding: 0 24px !important;
      height: 44px !important;
      backdrop-filter: blur(10px);
    }

    .secondary-btn:hover {
      background: rgba(255, 255, 255, 0.2) !important;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 32px;
    }

    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 600px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid #e2e8f0;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .stat-card.total .stat-icon {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: white;
    }

    .stat-card.mrm .stat-icon {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
    }

    .stat-card.erm .stat-icon {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .stat-card.crm .stat-icon {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #1e293b;
      line-height: 1;
    }

    .stat-label {
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
    }

    .stat-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .stat-trend.up {
      color: #10b981;
    }

    .stat-trend mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .stat-badge {
      position: absolute;
      top: 16px;
      right: 16px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .stat-card.mrm .stat-badge {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .stat-card.erm .stat-badge {
      background: #d1fae5;
      color: #059669;
    }

    .stat-card.crm .stat-badge {
      background: #fef3c7;
      color: #d97706;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px;
      color: #64748b;
    }

    .loading-state p {
      margin-top: 16px;
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 24px;
    }

    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    .content-section {
      background: white;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid #e2e8f0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .section-header h2 {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .view-all {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      font-weight: 500;
      color: #3b82f6;
      text-decoration: none;
    }

    .view-all mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Policies List */
    .policies-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .policy-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
    }

    .policy-item:hover {
      background: #f8fafc;
      border-color: #e2e8f0;
    }

    .policy-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .policy-icon.mrm {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .policy-icon.erm {
      background: #d1fae5;
      color: #059669;
    }

    .policy-icon.crm {
      background: #fef3c7;
      color: #d97706;
    }

    .policy-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .policy-name {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .policy-meta {
      font-size: 12px;
      color: #64748b;
    }

    .policy-badges {
      display: flex;
      gap: 8px;
    }

    .domain-badge, .severity-badge {
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .domain-badge.mrm { background: #dbeafe; color: #1d4ed8; }
    .domain-badge.erm { background: #d1fae5; color: #059669; }
    .domain-badge.crm { background: #fef3c7; color: #d97706; }

    .severity-badge.critical { background: #fee2e2; color: #dc2626; }
    .severity-badge.high { background: #ffedd5; color: #ea580c; }
    .severity-badge.medium { background: #fef9c3; color: #ca8a04; }
    .severity-badge.low { background: #dcfce7; color: #16a34a; }

    .chevron {
      color: #94a3b8;
      font-size: 20px;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #64748b;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #cbd5e1;
    }

    /* Actions Grid */
    .actions-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .action-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      border: 1px solid #e2e8f0;
    }

    .action-card:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      transform: translateX(4px);
    }

    .action-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .action-icon.create {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
    }

    .action-icon.evaluate {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .action-icon.bulk {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
    }

    .action-icon.api {
      background: linear-gradient(135deg, #64748b 0%, #475569 100%);
      color: white;
    }

    .action-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .action-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    .action-desc {
      font-size: 12px;
      color: #64748b;
    }

    /* Animations */
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  policies: Policy[] = [];
  loading = true;
  totalPolicies = 0;
  mrmCount = 0;
  ermCount = 0;
  crmCount = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.apiService.listPolicies().subscribe({
      next: (response) => {
        this.policies = response.policies;
        this.totalPolicies = response.total;
        this.mrmCount = this.policies.filter(p => p.metadata.domain === 'MRM').length;
        this.ermCount = this.policies.filter(p => p.metadata.domain === 'ERM').length;
        this.crmCount = this.policies.filter(p => p.metadata.domain === 'CRM').length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load dashboard', err);
        this.loading = false;
      }
    });
  }

  getDomainIcon(domain: string): string {
    switch (domain) {
      case 'MRM': return 'model_training';
      case 'ERM': return 'business_center';
      case 'CRM': return 'account_balance';
      default: return 'description';
    }
  }
}
