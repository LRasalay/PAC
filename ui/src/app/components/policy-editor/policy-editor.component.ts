import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../services/api.service';
import { Policy } from '../../models/policy.model';

@Component({
  selector: 'app-policy-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatStepperModule,
    MatTabsModule,
    MatTooltipModule
  ],
  template: `
    <div class="editor-container animate-fade-in">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a routerLink="/policies" class="breadcrumb-link">
          <mat-icon>description</mat-icon>
          Policies
        </a>
        <mat-icon class="breadcrumb-separator">chevron_right</mat-icon>
        <span class="breadcrumb-current">{{ isEdit ? 'Edit Policy' : 'Create Policy' }}</span>
      </div>

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon" [class.edit]="isEdit">
            <mat-icon>{{ isEdit ? 'edit_note' : 'add_circle' }}</mat-icon>
          </div>
          <div class="header-text">
            <h1>{{ isEdit ? 'Edit Policy' : 'Create Policy' }}</h1>
            <p class="subtitle">{{ isEdit ? 'Modify existing policy configuration' : 'Define a new compliance policy with rules' }}</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading policy...</p>
      </div>

      <!-- Editor Tabs -->
      <mat-tab-group class="editor-tabs" *ngIf="!loading">
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>edit</mat-icon>
            <span>Form Editor</span>
          </ng-template>
          <div class="tab-content">
            <!-- Policy Info Card -->
            <div class="editor-card">
              <div class="card-header">
                <mat-icon>info</mat-icon>
                <h2>Policy Information</h2>
              </div>
              <div class="card-content">
                <form [formGroup]="policyForm">
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Policy ID</mat-label>
                      <input matInput formControlName="id" placeholder="my-policy-id" [readonly]="isEdit">
                      <mat-icon matPrefix>fingerprint</mat-icon>
                      <mat-hint>Lowercase letters, numbers, and hyphens only</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Version</mat-label>
                      <input matInput formControlName="version" placeholder="1.0.0">
                      <mat-icon matPrefix>local_offer</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Name</mat-label>
                      <input matInput formControlName="name" placeholder="Policy Name">
                      <mat-icon matPrefix>title</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Domain</mat-label>
                      <mat-select formControlName="domain">
                        <mat-option value="MRM">
                          <div class="domain-option">
                            <span class="domain-dot mrm"></span>
                            MRM - Model Risk Management
                          </div>
                        </mat-option>
                        <mat-option value="ERM">
                          <div class="domain-option">
                            <span class="domain-dot erm"></span>
                            ERM - Enterprise Risk Management
                          </div>
                        </mat-option>
                        <mat-option value="CRM">
                          <div class="domain-option">
                            <span class="domain-dot crm"></span>
                            CRM - Counterparty Risk Management
                          </div>
                        </mat-option>
                      </mat-select>
                      <mat-icon matPrefix>category</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Description</mat-label>
                      <textarea matInput formControlName="description" rows="3" placeholder="Describe the policy purpose and scope"></textarea>
                      <mat-icon matPrefix>description</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Owner</mat-label>
                      <input matInput formControlName="owner" placeholder="Team or person">
                      <mat-icon matPrefix>person</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Severity</mat-label>
                      <mat-select formControlName="severity">
                        <mat-option value="critical">
                          <span class="severity-option critical">Critical</span>
                        </mat-option>
                        <mat-option value="high">
                          <span class="severity-option high">High</span>
                        </mat-option>
                        <mat-option value="medium">
                          <span class="severity-option medium">Medium</span>
                        </mat-option>
                        <mat-option value="low">
                          <span class="severity-option low">Low</span>
                        </mat-option>
                      </mat-select>
                      <mat-icon matPrefix>priority_high</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Effective Date</mat-label>
                      <input matInput type="date" formControlName="effectiveDate">
                      <mat-icon matPrefix>event</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Tags</mat-label>
                      <input matInput formControlName="tags" placeholder="compliance, audit, quarterly">
                      <mat-icon matPrefix>label</mat-icon>
                      <mat-hint>Comma-separated values</mat-hint>
                    </mat-form-field>
                  </div>
                </form>
              </div>
            </div>

            <!-- Rules Card -->
            <div class="editor-card">
              <div class="card-header">
                <mat-icon>rule</mat-icon>
                <h2>Rules (JSON)</h2>
              </div>
              <div class="card-content">
                <p class="card-hint">Define rules as a JSON array. Each rule should have id, name, and conditions.</p>

                <!-- Rule Templates -->
                <div class="rule-templates">
                  <span class="templates-label">Quick Add:</span>
                  <button mat-stroked-button class="template-btn" (click)="addRuleTemplate('required')" matTooltip="Required field check">
                    <mat-icon>check_box</mat-icon>
                    Required
                  </button>
                  <button mat-stroked-button class="template-btn" (click)="addRuleTemplate('range')" matTooltip="Value range check">
                    <mat-icon>tune</mat-icon>
                    Range
                  </button>
                  <button mat-stroked-button class="template-btn" (click)="addRuleTemplate('date')" matTooltip="Date validation">
                    <mat-icon>event</mat-icon>
                    Date
                  </button>
                  <button mat-stroked-button class="template-btn" (click)="addRuleTemplate('conditional')" matTooltip="Conditional rule">
                    <mat-icon>call_split</mat-icon>
                    Conditional
                  </button>
                </div>

                <!-- JSON Editor -->
                <div class="json-editor-wrapper">
                  <textarea
                    class="json-editor"
                    [(ngModel)]="rulesJson"
                    rows="20"
                    placeholder='[
  {
    "id": "rule-001",
    "name": "Rule Name",
    "conditions": {
      "path": "$.field",
      "operator": "exists"
    },
    "remediation": "Action to fix"
  }
]'
                  ></textarea>
                </div>

                <div class="json-actions">
                  <button mat-button (click)="formatRulesJson()" matTooltip="Format JSON">
                    <mat-icon>auto_fix_high</mat-icon>
                    Format
                  </button>
                  <button mat-button (click)="validateRules()" matTooltip="Validate rules">
                    <mat-icon>check</mat-icon>
                    Validate
                  </button>
                  <button mat-button (click)="clearRules()" matTooltip="Clear all rules">
                    <mat-icon>delete_outline</mat-icon>
                    Clear
                  </button>
                </div>

                <div class="json-error" *ngIf="rulesError">
                  <mat-icon>error</mat-icon>
                  {{ rulesError }}
                </div>
                <div class="json-success" *ngIf="rulesValid">
                  <mat-icon>check_circle</mat-icon>
                  Rules JSON is valid
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>code</mat-icon>
            <span>JSON Editor</span>
          </ng-template>
          <div class="tab-content">
            <div class="editor-card">
              <div class="card-header">
                <mat-icon>data_object</mat-icon>
                <h2>Full Policy JSON</h2>
              </div>
              <div class="card-content">
                <p class="card-hint">Edit the complete policy definition as JSON. Changes will sync with the form editor.</p>

                <div class="json-editor-wrapper full">
                  <textarea
                    class="json-editor"
                    [(ngModel)]="fullJson"
                    rows="30"
                  ></textarea>
                </div>

                <div class="json-actions">
                  <button mat-button (click)="formatFullJson()" matTooltip="Format JSON">
                    <mat-icon>auto_fix_high</mat-icon>
                    Format
                  </button>
                  <button mat-button (click)="loadFromJson()" matTooltip="Load JSON to form">
                    <mat-icon>upload</mat-icon>
                    Load to Form
                  </button>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>

      <!-- Actions -->
      <div class="editor-actions" *ngIf="!loading">
        <button mat-raised-button color="primary" class="save-btn" (click)="save()" [disabled]="saving">
          <mat-icon>{{ saving ? 'hourglass_top' : 'save' }}</mat-icon>
          {{ saving ? 'Saving...' : (isEdit ? 'Update Policy' : 'Create Policy') }}
        </button>
        <button mat-stroked-button routerLink="/policies">
          Cancel
        </button>
      </div>
    </div>
  `,
  styles: [`
    .editor-container {
      max-width: 1000px;
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

    .header-icon.edit {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);
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

    /* Loading */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
    }

    .loading-container p {
      margin-top: 16px;
      color: #64748b;
    }

    /* Tabs */
    .editor-tabs {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
      overflow: hidden;
      margin-bottom: 24px;
    }

    ::ng-deep .editor-tabs .mat-mdc-tab-header {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    ::ng-deep .editor-tabs .mat-mdc-tab {
      min-width: 160px;
    }

    ::ng-deep .editor-tabs .mat-mdc-tab .mdc-tab__content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tab-content {
      padding: 24px;
    }

    /* Editor Card */
    .editor-card {
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 24px;
      overflow: hidden;
    }

    .editor-card:last-child {
      margin-bottom: 0;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 18px 24px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
    }

    .card-header mat-icon {
      color: #3b82f6;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .card-header h2 {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .card-content {
      padding: 24px;
    }

    .card-hint {
      color: #64748b;
      font-size: 14px;
      margin: 0 0 20px 0;
    }

    /* Form Grid */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Domain/Severity Options */
    .domain-option {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .domain-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .domain-dot.mrm { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .domain-dot.erm { background: linear-gradient(135deg, #10b981, #059669); }
    .domain-dot.crm { background: linear-gradient(135deg, #f59e0b, #d97706); }

    .severity-option {
      font-weight: 500;
    }

    .severity-option.critical { color: #b91c1c; }
    .severity-option.high { color: #c2410c; }
    .severity-option.medium { color: #a16207; }
    .severity-option.low { color: #15803d; }

    /* Rule Templates */
    .rule-templates {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      padding: 16px 20px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      margin-bottom: 20px;
    }

    .templates-label {
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
    }

    .template-btn {
      font-size: 13px;
      border-radius: 8px;
    }

    .template-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 6px;
    }

    /* JSON Editor */
    .json-editor-wrapper {
      background: #1e293b;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #334155;
    }

    .json-editor-wrapper.full {
      margin-bottom: 16px;
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
      min-height: 380px;
    }

    .json-editor::placeholder {
      color: #475569;
    }

    .json-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .json-actions button {
      font-size: 13px;
      color: #64748b;
    }

    .json-actions button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 6px;
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

    .json-success {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      color: #15803d;
      font-size: 13px;
    }

    .json-error mat-icon,
    .json-success mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Actions */
    .editor-actions {
      display: flex;
      gap: 16px;
      padding: 20px 0;
    }

    .save-btn {
      height: 48px;
      padding: 0 32px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
    }

    .save-btn mat-icon {
      margin-right: 8px;
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
export class PolicyEditorComponent implements OnInit {
  isEdit = false;
  loading = false;
  saving = false;
  policyForm: FormGroup;
  rulesJson = '[]';
  fullJson = '';
  rulesError = '';
  rulesValid = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {
    this.policyForm = this.fb.group({
      id: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      version: ['1.0.0', [Validators.required, Validators.pattern(/^\d+\.\d+\.\d+$/)]],
      name: ['', Validators.required],
      domain: ['MRM', Validators.required],
      description: [''],
      owner: [''],
      severity: ['medium'],
      effectiveDate: [''],
      tags: ['']
    });
  }

  ngOnInit(): void {
    const policyId = this.route.snapshot.paramMap.get('id');
    if (policyId && policyId !== 'new') {
      this.isEdit = true;
      this.loadPolicy(policyId);
    } else {
      this.updateFullJson();
    }
  }

  loadPolicy(policyId: string): void {
    this.loading = true;
    this.apiService.getPolicy(policyId).subscribe({
      next: (policy) => {
        this.policyForm.patchValue({
          id: policy.id,
          version: policy.version,
          name: policy.metadata.name,
          domain: policy.metadata.domain,
          description: policy.metadata.description || '',
          owner: policy.metadata.owner || '',
          severity: policy.metadata.severity || 'medium',
          effectiveDate: policy.metadata.effectiveDate || '',
          tags: policy.metadata.tags?.join(', ') || ''
        });
        this.rulesJson = JSON.stringify(policy.rules, null, 2);
        this.updateFullJson();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load policy', err);
        this.snackBar.open('Failed to load policy', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  formatRulesJson(): void {
    try {
      const parsed = JSON.parse(this.rulesJson);
      this.rulesJson = JSON.stringify(parsed, null, 2);
      this.rulesError = '';
    } catch (e) {
      this.rulesError = 'Invalid JSON format';
    }
  }

  validateRules(): void {
    try {
      const rules = JSON.parse(this.rulesJson);
      if (!Array.isArray(rules)) {
        this.rulesError = 'Rules must be an array';
        this.rulesValid = false;
        return;
      }
      for (const rule of rules) {
        if (!rule.id || !rule.name || !rule.conditions) {
          this.rulesError = 'Each rule must have id, name, and conditions';
          this.rulesValid = false;
          return;
        }
      }
      this.rulesError = '';
      this.rulesValid = true;
      this.updateFullJson();
    } catch (e) {
      this.rulesError = 'Invalid JSON format';
      this.rulesValid = false;
    }
  }

  updateFullJson(): void {
    const policy = this.buildPolicy();
    if (policy) {
      this.fullJson = JSON.stringify(policy, null, 2);
    }
  }

  formatFullJson(): void {
    try {
      const parsed = JSON.parse(this.fullJson);
      this.fullJson = JSON.stringify(parsed, null, 2);
    } catch (e) {
      this.snackBar.open('Invalid JSON format', 'Close', { duration: 3000 });
    }
  }

  loadFromJson(): void {
    try {
      const policy = JSON.parse(this.fullJson);
      this.policyForm.patchValue({
        id: policy.id,
        version: policy.version,
        name: policy.metadata?.name || '',
        domain: policy.metadata?.domain || 'MRM',
        description: policy.metadata?.description || '',
        owner: policy.metadata?.owner || '',
        severity: policy.metadata?.severity || 'medium',
        effectiveDate: policy.metadata?.effectiveDate || '',
        tags: policy.metadata?.tags?.join(', ') || ''
      });
      this.rulesJson = JSON.stringify(policy.rules || [], null, 2);
      this.snackBar.open('Loaded from JSON', 'Close', { duration: 2000 });
    } catch (e) {
      this.snackBar.open('Invalid JSON format', 'Close', { duration: 3000 });
    }
  }

  addRuleTemplate(type: string): void {
    let rules: any[];
    try {
      rules = JSON.parse(this.rulesJson);
      if (!Array.isArray(rules)) rules = [];
    } catch {
      rules = [];
    }

    const ruleId = `rule-${String(rules.length + 1).padStart(3, '0')}`;
    let newRule: any;

    switch (type) {
      case 'required':
        newRule = {
          id: ruleId,
          name: 'Required Field Check',
          type: 'required_field',
          severity: 'high',
          conditions: {
            path: '$.entity.requiredField',
            operator: 'exists'
          },
          remediation: 'Ensure the required field is provided'
        };
        break;
      case 'range':
        newRule = {
          id: ruleId,
          name: 'Value Range Check',
          type: 'value_range',
          severity: 'medium',
          conditions: {
            all: [
              { path: '$.entity.value', operator: 'greater_than_or_equal', value: 0 },
              { path: '$.entity.value', operator: 'less_than_or_equal', value: 100 }
            ]
          },
          remediation: 'Value must be between 0 and 100'
        };
        break;
      case 'date':
        newRule = {
          id: ruleId,
          name: 'Date Validation',
          type: 'temporal',
          severity: 'medium',
          conditions: {
            path: '$.entity.lastReviewDate',
            operator: 'date_within',
            value: '365d'
          },
          remediation: 'Review date must be within the last 365 days'
        };
        break;
      case 'conditional':
        newRule = {
          id: ruleId,
          name: 'Conditional Rule',
          type: 'conditional',
          severity: 'medium',
          when: {
            path: '$.entity.type',
            operator: 'equals',
            value: 'high_risk'
          },
          conditions: {
            path: '$.entity.approval.status',
            operator: 'equals',
            value: 'approved'
          },
          remediation: 'High-risk entities require approval'
        };
        break;
      default:
        return;
    }

    rules.push(newRule);
    this.rulesJson = JSON.stringify(rules, null, 2);
    this.rulesError = '';
    this.rulesValid = false;
  }

  clearRules(): void {
    this.rulesJson = '[]';
    this.rulesError = '';
    this.rulesValid = false;
  }

  buildPolicy(): Policy | null {
    const form = this.policyForm.value;
    let rules: any[];
    try {
      rules = JSON.parse(this.rulesJson);
    } catch (e) {
      return null;
    }

    const tags = form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [];

    return {
      id: form.id,
      version: form.version,
      metadata: {
        name: form.name,
        domain: form.domain,
        description: form.description || undefined,
        owner: form.owner || undefined,
        severity: form.severity,
        effectiveDate: form.effectiveDate || undefined,
        tags: tags.length > 0 ? tags : undefined
      },
      rules: rules
    };
  }

  save(): void {
    if (!this.policyForm.valid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.validateRules();
    if (!this.rulesValid) {
      this.snackBar.open('Please fix rules JSON errors', 'Close', { duration: 3000 });
      return;
    }

    const policy = this.buildPolicy();
    if (!policy) {
      this.snackBar.open('Failed to build policy', 'Close', { duration: 3000 });
      return;
    }

    this.saving = true;

    const request = this.isEdit
      ? this.apiService.updatePolicy(policy.id, policy)
      : this.apiService.createPolicy(policy);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Policy updated successfully' : 'Policy created successfully',
          'Close',
          { duration: 3000 }
        );
        this.router.navigate(['/policies', policy.id]);
      },
      error: (err) => {
        console.error('Failed to save policy', err);
        this.snackBar.open(
          'Failed to save: ' + (err.error?.detail || 'Unknown error'),
          'Close',
          { duration: 5000 }
        );
        this.saving = false;
      }
    });
  }
}
