import type {
  CreateLearnerRequest,
  CreateLearnerResponse,
  GenerateBaselineRequest,
  GenerateBaselineResponse,
  SubmitBaselineResponsesRequest,
  SubmitBaselineResponsesResponse,
  CreateDifficultyProposalRequest,
  CreateDifficultyProposalResponse,
  DecideOnDifficultyProposalRequest,
  DecideOnDifficultyProposalResponse,
  ListDifficultyProposalsResponse,
  GenerateLessonPlanRequest,
  GenerateLessonPlanResponse,
  GetLearnerResponse,
  MeResponse
} from "./contracts";
import type {
  ListTenantsResponse,
  GetTenantConfigResponse,
  ListDistrictsResponse,
  ListSchoolsResponse,
  ListRoleAssignmentsResponse
} from "./admin-contracts";
import type {
  GetTodaySessionResponse,
  StartSessionRequest,
  StartSessionResponse,
  UpdateActivityStatusRequest,
  UpdateActivityStatusResponse
} from "./session-contracts";

export class AivoApiClient {
  constructor(private baseUrl: string, private getToken?: () => Promise<string | null>) {}

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken ? await this.getToken() : null;
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  // Auth
  me() {
    return this.request<MeResponse>("/me");
  }

  // Learners
  createLearner(body: CreateLearnerRequest) {
    return this.request<CreateLearnerResponse>("/learners", {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  getLearner(learnerId: string) {
    return this.request<GetLearnerResponse>(`/learners/${learnerId}`);
  }

  // Baseline
  generateBaseline(body: GenerateBaselineRequest) {
    return this.request<GenerateBaselineResponse>("/baseline/generate", {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  submitBaselineResponses(body: SubmitBaselineResponsesRequest) {
    return this.request<SubmitBaselineResponsesResponse>("/baseline/submit", {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  // Difficulty proposals
  createDifficultyProposal(body: CreateDifficultyProposalRequest) {
    return this.request<CreateDifficultyProposalResponse>("/difficulty/proposals", {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  decideOnDifficultyProposal(body: DecideOnDifficultyProposalRequest) {
    return this.request<DecideOnDifficultyProposalResponse>(
      `/difficulty/proposals/${body.proposalId}/decision`,
      {
        method: "POST",
        body: JSON.stringify({ approve: body.approve, notes: body.notes })
      }
    );
  }

  listDifficultyProposals(learnerId: string) {
    const search = new URLSearchParams({ learnerId });
    return this.request<ListDifficultyProposalsResponse>(
      `/difficulty/proposals?${search.toString()}`
    );
  }

  // Lessons
  generateLessonPlan(body: GenerateLessonPlanRequest) {
    return this.request<GenerateLessonPlanResponse>("/lessons/generate", {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  // Admin: platform-level
  listTenants() {
    return this.request<ListTenantsResponse>("/admin/tenants");
  }

  getTenantConfig(tenantId: string) {
    return this.request<GetTenantConfigResponse>(`/admin/tenants/${tenantId}`);
  }

  // Admin: district-level
  listDistricts(tenantId: string) {
    return this.request<ListDistrictsResponse>(`/admin/tenants/${tenantId}/districts`);
  }

  listSchools(tenantId: string, districtId?: string) {
    const search = new URLSearchParams({ ...(districtId ? { districtId } : {}) });
    const query = search.toString();
    const suffix = query ? `?${query}` : "";
    return this.request<ListSchoolsResponse>(
      `/admin/tenants/${tenantId}/schools${suffix}`
    );
  }

  listRoleAssignments(tenantId: string) {
    return this.request<ListRoleAssignmentsResponse>(
      `/admin/tenants/${tenantId}/roles`
    );
  }

  // Sessions

  getTodaySession(learnerId: string, subject: string) {
    const search = new URLSearchParams({ learnerId, subject });
    return this.request<GetTodaySessionResponse>(
      `/sessions/today?${search.toString()}`
    );
  }

  startSession(body: StartSessionRequest) {
    return this.request<StartSessionResponse>("/sessions/start", {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  updateActivityStatus(body: UpdateActivityStatusRequest) {
    return this.request<UpdateActivityStatusResponse>(
      `/sessions/${body.sessionId}/activities/${body.activityId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: body.status })
      }
    );
  }
}
