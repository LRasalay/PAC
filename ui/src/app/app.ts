import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatTooltipModule
  ],
  template: `
    <div class="app-layout">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed">
        <div class="sidebar-header">
          <div class="logo">
            <div class="logo-icon">
              <mat-icon>shield</mat-icon>
            </div>
            <span class="logo-text" *ngIf="!sidebarCollapsed">Policy<span class="accent">Hub</span></span>
          </div>
          <button mat-icon-button class="collapse-btn" (click)="toggleSidebar()" [matTooltip]="sidebarCollapsed ? 'Expand' : 'Collapse'">
            <mat-icon>{{ sidebarCollapsed ? 'chevron_right' : 'chevron_left' }}</mat-icon>
          </button>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section">
            <span class="nav-section-title" *ngIf="!sidebarCollapsed">Main</span>
            <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" [matTooltip]="sidebarCollapsed ? 'Dashboard' : ''" matTooltipPosition="right">
              <mat-icon>dashboard</mat-icon>
              <span *ngIf="!sidebarCollapsed">Dashboard</span>
            </a>
            <a routerLink="/policies" routerLinkActive="active" class="nav-item" [matTooltip]="sidebarCollapsed ? 'Policies' : ''" matTooltipPosition="right">
              <mat-icon>description</mat-icon>
              <span *ngIf="!sidebarCollapsed">Policies</span>
            </a>
          </div>

          <div class="nav-section">
            <span class="nav-section-title" *ngIf="!sidebarCollapsed">Compliance</span>
            <a routerLink="/evaluate" routerLinkActive="active" class="nav-item" [matTooltip]="sidebarCollapsed ? 'Evaluate' : ''" matTooltipPosition="right">
              <mat-icon>check_circle</mat-icon>
              <span *ngIf="!sidebarCollapsed">Evaluate</span>
            </a>
            <a routerLink="/evaluate/bulk" routerLinkActive="active" class="nav-item" [matTooltip]="sidebarCollapsed ? 'Bulk Evaluate' : ''" matTooltipPosition="right">
              <mat-icon>playlist_add_check</mat-icon>
              <span *ngIf="!sidebarCollapsed">Bulk Evaluate</span>
            </a>
          </div>
        </nav>

        <div class="sidebar-footer">
          <a href="http://localhost:8000/api/v1/docs" target="_blank" class="nav-item" [matTooltip]="sidebarCollapsed ? 'API Docs' : ''" matTooltipPosition="right">
            <mat-icon>code</mat-icon>
            <span *ngIf="!sidebarCollapsed">API Docs</span>
          </a>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="main-wrapper">
        <header class="top-bar">
          <div class="top-bar-left">
            <h1 class="page-title">Risk Management & Compliance</h1>
          </div>
          <div class="top-bar-right">
            <div class="status-indicator">
              <span class="status-dot"></span>
              <span class="status-text">API Connected</span>
            </div>
          </div>
        </header>

        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }

    /* Sidebar */
    .sidebar {
      width: 260px;
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
      display: flex;
      flex-direction: column;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      z-index: 100;
    }

    .sidebar.collapsed {
      width: 72px;
    }

    .sidebar-header {
      padding: 20px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .logo-icon mat-icon {
      color: white;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.02em;
    }

    .logo-text .accent {
      color: #3b82f6;
    }

    .collapse-btn {
      color: rgba(255, 255, 255, 0.5);
      transition: color 0.2s;
    }

    .collapse-btn:hover {
      color: white;
    }

    .sidebar.collapsed .collapse-btn {
      position: absolute;
      right: 16px;
    }

    /* Navigation */
    .sidebar-nav {
      flex: 1;
      padding: 16px 12px;
      overflow-y: auto;
    }

    .nav-section {
      margin-bottom: 24px;
    }

    .nav-section-title {
      display: block;
      padding: 0 12px;
      margin-bottom: 8px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255, 255, 255, 0.4);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 10px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s;
      margin-bottom: 4px;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.08);
      color: white;
    }

    .nav-item.active {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .nav-item mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 12px;
    }

    .sidebar.collapsed .nav-item span {
      display: none;
    }

    /* Sidebar Footer */
    .sidebar-footer {
      padding: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    /* Main Wrapper */
    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Top Bar */
    .top-bar {
      height: 64px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .page-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: #ecfdf5;
      border-radius: 20px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      animation: pulse-dot 2s infinite;
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .status-text {
      font-size: 13px;
      font-weight: 500;
      color: #059669;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
    }
  `]
})
export class AppComponent {
  title = 'Policy-as-Code';
  sidebarCollapsed = false;

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}
