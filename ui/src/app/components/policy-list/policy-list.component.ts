import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../services/api.service';
import { Policy } from '../../models/policy.model';

@Component({
  selector: 'app-policy-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="policy-list-container animate-fade-in">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>description</mat-icon>
          </div>
          <div class="header-text">
            <h1>Policies</h1>
            <p class="subtitle">Manage compliance policies across all risk domains</p>
          </div>
        </div>
        <button mat-raised-button color="primary" routerLink="/policies/new" class="create-btn">
          <mat-icon>add</mat-icon>
          Create Policy
        </button>
      </div>

      <!-- Filters Section -->
      <div class="filters-card">
        <div class="filters-row">
          <div class="filter-group">
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Filter by Domain</mat-label>
              <mat-select [(ngModel)]="selectedDomain" (selectionChange)="loadPolicies()">
                <mat-option value="">All Domains</mat-option>
                <mat-option value="MRM">
                  <span class="domain-option">
                    <span class="domain-dot mrm"></span>
                    MRM - Model Risk
                  </span>
                </mat-option>
                <mat-option value="ERM">
                  <span class="domain-option">
                    <span class="domain-dot erm"></span>
                    ERM - Enterprise Risk
                  </span>
                </mat-option>
                <mat-option value="CRM">
                  <span class="domain-option">
                    <span class="domain-dot crm"></span>
                    CRM - Counterparty Risk
                  </span>
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search policies</mat-label>
              <mat-icon matPrefix class="search-icon">search</mat-icon>
              <input matInput [(ngModel)]="searchTerm" (input)="filterPolicies()" placeholder="Search by name, ID, or description...">
              <button *ngIf="searchTerm" matSuffix mat-icon-button (click)="searchTerm = ''; filterPolicies()">
                <mat-icon>close</mat-icon>
              </button>
            </mat-form-field>
          </div>

          <div class="results-count" *ngIf="!loading">
            <span class="count">{{ filteredPolicies.length }}</span> policies found
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading">
        <div class="loading-spinner">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Loading policies...</p>
        </div>
      </div>

      <!-- Policy Grid -->
      <div class="policy-grid" *ngIf="!loading && filteredPolicies.length > 0">
        <div class="policy-card" *ngFor="let policy of filteredPolicies; let i = index"
             [routerLink]="['/policies', policy.id]"
             [style.animation-delay]="i * 50 + 'ms'">
          <div class="card-header">
            <div class="domain-badge" [class]="policy.metadata.domain.toLowerCase()">
              <mat-icon>{{ getDomainIcon(policy.metadata.domain) }}</mat-icon>
              <span>{{ policy.metadata.domain }}</span>
            </div>
            <span class="severity-badge" [class]="policy.metadata.severity || 'medium'">
              {{ policy.metadata.severity || 'medium' }}
            </span>
          </div>

          <div class="card-body">
            <h3 class="policy-name">{{ policy.metadata.name }}</h3>
            <p class="policy-id">
              <mat-icon>fingerprint</mat-icon>
              {{ policy.id }}
            </p>
            <p class="description" *ngIf="policy.metadata.description">
              {{ policy.metadata.description | slice:0:120 }}{{ policy.metadata.description.length > 120 ? '...' : '' }}
            </p>
          </div>

          <div class="card-footer">
            <div class="footer-info">
              <span class="version">
                <mat-icon>local_offer</mat-icon>
                v{{ policy.version }}
              </span>
              <span class="rules-count">
                <mat-icon>rule</mat-icon>
                {{ policy.rules.length }} rules
              </span>
            </div>

            <div class="card-actions">
              <button mat-icon-button [routerLink]="['/policies', policy.id]"
                      matTooltip="View Details" (click)="$event.stopPropagation()">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button [routerLink]="['/evaluate']" [queryParams]="{policy: policy.id}"
                      matTooltip="Evaluate" (click)="$event.stopPropagation()">
                <mat-icon>play_circle</mat-icon>
              </button>
              <button mat-icon-button [routerLink]="['/policies', policy.id, 'edit']"
                      matTooltip="Edit" (click)="$event.stopPropagation()">
                <mat-icon>edit</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading && filteredPolicies.length === 0">
        <div class="empty-icon">
          <mat-icon>folder_open</mat-icon>
        </div>
        <h2>No policies found</h2>
        <p *ngIf="searchTerm || selectedDomain">Try adjusting your search or filter criteria</p>
        <p *ngIf="!searchTerm && !selectedDomain">Get started by creating your first policy</p>
        <button mat-raised-button color="primary" routerLink="/policies/new" *ngIf="!searchTerm && !selectedDomain">
          <mat-icon>add</mat-icon>
          Create Policy
        </button>
        <button mat-stroked-button (click)="clearFilters()" *ngIf="searchTerm || selectedDomain">
          <mat-icon>filter_alt_off</mat-icon>
          Clear Filters
        </button>
      </div>
    </div>
  `,
  styles: [`
    .policy-list-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Page Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 20px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
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

    .create-btn {
      height: 44px;
      padding: 0 24px;
      font-weight: 600;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
    }

    .create-btn mat-icon {
      margin-right: 8px;
    }

    /* Filters */
    .filters-card {
      background: white;
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }

    .filters-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .filter-group {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      flex: 1;
    }

    .filter-field {
      min-width: 200px;
    }

    .search-field {
      min-width: 320px;
      flex: 1;
      max-width: 480px;
    }

    .search-icon {
      color: #94a3b8;
      margin-right: 8px;
    }

    .domain-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .domain-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .domain-dot.mrm { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
    .domain-dot.erm { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    .domain-dot.crm { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }

    .results-count {
      color: #64748b;
      font-size: 14px;
      white-space: nowrap;
    }

    .results-count .count {
      font-weight: 700;
      color: #1e293b;
    }

    /* Loading */
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 80px 20px;
    }

    .loading-spinner {
      text-align: center;
    }

    .loading-spinner p {
      margin-top: 16px;
      color: #64748b;
    }

    /* Policy Grid */
    .policy-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
    }

    .policy-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.4s ease-out backwards;
    }

    .policy-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
      border-color: #cbd5e1;
    }

    .policy-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      border-radius: 16px 16px 0 0;
      opacity: 0;
      transition: opacity 0.25s;
    }

    .policy-card:hover::before {
      opacity: 1;
    }

    .policy-card:has(.domain-badge.mrm)::before {
      background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    }

    .policy-card:has(.domain-badge.erm)::before {
      background: linear-gradient(90deg, #10b981, #059669);
    }

    .policy-card:has(.domain-badge.crm)::before {
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .domain-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .domain-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
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
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.04em;
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

    .card-body {
      flex: 1;
    }

    .policy-name {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.4;
    }

    .policy-id {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #64748b;
      font-size: 13px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      margin: 0 0 12px 0;
    }

    .policy-id mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .description {
      color: #64748b;
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      margin-top: 16px;
      border-top: 1px solid #f1f5f9;
    }

    .footer-info {
      display: flex;
      gap: 16px;
    }

    .footer-info span {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #94a3b8;
      font-size: 13px;
    }

    .footer-info mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .card-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transform: translateX(8px);
      transition: all 0.2s;
    }

    .policy-card:hover .card-actions {
      opacity: 1;
      transform: translateX(0);
    }

    .card-actions button {
      width: 36px;
      height: 36px;
      color: #64748b;
      transition: all 0.2s;
    }

    .card-actions button:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .card-actions mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 80px 40px;
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
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

    .empty-state h2 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
    }

    .empty-state p {
      color: #64748b;
      margin: 0 0 24px 0;
    }

    /* Animations */
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

    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .filter-group {
        flex-direction: column;
        width: 100%;
      }

      .filter-field, .search-field {
        width: 100%;
        min-width: unset;
        max-width: unset;
      }

      .policy-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PolicyListComponent implements OnInit {
  policies: Policy[] = [];
  filteredPolicies: Policy[] = [];
  loading = true;
  selectedDomain = '';
  searchTerm = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadPolicies();
  }

  loadPolicies(): void {
    this.loading = true;
    const domain = this.selectedDomain || undefined;
    this.apiService.listPolicies(domain).subscribe({
      next: (response) => {
        this.policies = response.policies;
        this.filterPolicies();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load policies', err);
        this.loading = false;
      }
    });
  }

  filterPolicies(): void {
    if (!this.searchTerm) {
      this.filteredPolicies = this.policies;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredPolicies = this.policies.filter(p =>
      p.id.toLowerCase().includes(term) ||
      p.metadata.name.toLowerCase().includes(term) ||
      (p.metadata.description?.toLowerCase().includes(term))
    );
  }

  getDomainIcon(domain: string): string {
    switch (domain) {
      case 'MRM': return 'model_training';
      case 'ERM': return 'security';
      case 'CRM': return 'handshake';
      default: return 'description';
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedDomain = '';
    this.loadPolicies();
  }
}
