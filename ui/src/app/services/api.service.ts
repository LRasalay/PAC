import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Policy,
  PolicyListResponse,
  EvaluationRequest,
  EvaluationResult,
  BulkEvaluationRequest,
  BulkEvaluationResponse
} from '../models/policy.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Health check
  getHealth(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.apiUrl}/health`);
  }

  // Policy CRUD
  listPolicies(domain?: string): Observable<PolicyListResponse> {
    let params = new HttpParams();
    if (domain) {
      params = params.set('domain', domain);
    }
    return this.http.get<PolicyListResponse>(`${this.apiUrl}/policies`, { params });
  }

  getPolicy(policyId: string): Observable<Policy> {
    return this.http.get<Policy>(`${this.apiUrl}/policies/${policyId}`);
  }

  createPolicy(policy: Policy): Observable<Policy> {
    return this.http.post<Policy>(`${this.apiUrl}/policies`, policy);
  }

  updatePolicy(policyId: string, policy: Partial<Policy>): Observable<Policy> {
    return this.http.put<Policy>(`${this.apiUrl}/policies/${policyId}`, policy);
  }

  deletePolicy(policyId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/policies/${policyId}`);
  }

  // Evaluation
  evaluate(request: EvaluationRequest): Observable<EvaluationResult> {
    return this.http.post<EvaluationResult>(`${this.apiUrl}/evaluate`, request);
  }

  bulkEvaluate(request: BulkEvaluationRequest): Observable<BulkEvaluationResponse> {
    return this.http.post<BulkEvaluationResponse>(`${this.apiUrl}/evaluate/bulk`, request);
  }

  getEvaluationHistory(policyId: string, limit = 100, offset = 0): Observable<any> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    return this.http.get(`${this.apiUrl}/evaluate/${policyId}/history`, { params });
  }
}
