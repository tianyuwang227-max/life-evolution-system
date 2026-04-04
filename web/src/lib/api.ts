import type {
  AuthStatus,
  Task,
  ScheduleBlock,
  DailyReview,
  PromptItem,
  RewardItem,
  PunishmentItem,
  FinanceRecord,
  Summary,
  Trends,
  ReportSummary,
  ExportPayload,
  ExerciseLog,
  DietLog,
  ExerciseSummary,
  PasskeyLoginOptions,
  PasskeyLoginVerifyPayload,
  PasskeyRegistrationOptions,
  PasskeyRegistrationVerifyPayload,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";
const BYPASS = import.meta.env.VITE_BYPASS_SECRET;

function formatErrorMessage(detail: string, status: number) {
  if (!detail) {
    return `Request failed: ${status}`;
  }

  try {
    const parsed = JSON.parse(detail) as { error?: string; detail?: string };
    if (parsed.error && parsed.detail) {
      return `${parsed.error}: ${parsed.detail}`;
    }
    if (parsed.error) {
      return parsed.error;
    }
  } catch {
    // Keep original plain-text error below.
  }

  return detail;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (BYPASS) {
    headers.set("X-Bypass-Secret", BYPASS);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: options.credentials ?? "include",
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(formatErrorMessage(detail, res.status));
  }
  return (await res.json()) as T;
}

export function getAuthStatus() {
  return request<AuthStatus>(`/api/auth/status`);
}

export function createPasskeyRegistrationOptions(payload: { userName: string; bootstrapSecret: string }) {
  return request<PasskeyRegistrationOptions>(`/api/auth/register/options`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyPasskeyRegistration(payload: PasskeyRegistrationVerifyPayload) {
  return request<AuthStatus>(`/api/auth/register/verify`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createPasskeyLoginOptions() {
  return request<PasskeyLoginOptions>(`/api/auth/login/options`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function verifyPasskeyLogin(payload: PasskeyLoginVerifyPayload) {
  return request<AuthStatus>(`/api/auth/login/verify`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return request<{ ok: true }>(`/api/auth/logout`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function getSummary(date: string) {
  return request<Summary>(`/api/summary?date=${date}`);
}

export function getTrends(days = 30) {
  return request<Trends>(`/api/trends?days=${days}`);
}

export function getReport(days = 7, date?: string) {
  const params = new URLSearchParams();
  params.set("days", String(days));
  if (date) params.set("date", date);
  return request<ReportSummary>(`/api/report?${params.toString()}`);
}

export function exportData() {
  return request<ExportPayload>(`/api/export`);
}

export function importData(payload: ExportPayload, mode: "overwrite" | "merge" = "overwrite") {
  return request(`/api/import?mode=${mode}`, {
    method: "POST",
    body: JSON.stringify({ data: payload.data }),
  });
}

export function listTasks(date: string) {
  return request<{ date: string; items: Task[] }>(`/api/tasks?date=${date}`);
}

export function createTask(payload: Partial<Task>) {
  return request(`/api/tasks`, { method: "POST", body: JSON.stringify(payload) });
}

export function updateTask(id: number, payload: Partial<Task>) {
  return request(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteTask(id: number) {
  return request(`/api/tasks/${id}`, { method: "DELETE" });
}

export function listSchedule(date: string) {
  return request<{ date: string; items: ScheduleBlock[] }>(`/api/schedule?date=${date}`);
}

export function createSchedule(payload: Partial<ScheduleBlock>) {
  return request(`/api/schedule`, { method: "POST", body: JSON.stringify(payload) });
}

export function updateSchedule(id: number, payload: Partial<ScheduleBlock>) {
  return request(`/api/schedule/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteSchedule(id: number) {
  return request(`/api/schedule/${id}`, { method: "DELETE" });
}

export function getReview(date: string) {
  return request<{ date: string; review: DailyReview | null }>(`/api/reviews?date=${date}`);
}

export function createReview(payload: Partial<DailyReview>) {
  return request(`/api/reviews`, { method: "POST", body: JSON.stringify(payload) });
}

export function updateReview(id: number, payload: Partial<DailyReview>) {
  return request(`/api/reviews/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function listPrompts() {
  return request<{ items: PromptItem[] }>(`/api/prompts`);
}

export function createPrompt(payload: Partial<PromptItem>) {
  return request(`/api/prompts`, { method: "POST", body: JSON.stringify(payload) });
}

export function updatePrompt(id: number, payload: Partial<PromptItem>) {
  return request(`/api/prompts/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deletePrompt(id: number) {
  return request(`/api/prompts/${id}`, { method: "DELETE" });
}

export function listRewards() {
  return request<{ items: RewardItem[] }>(`/api/rewards`);
}

export function createReward(payload: Partial<RewardItem>) {
  return request(`/api/rewards`, { method: "POST", body: JSON.stringify(payload) });
}

export function updateReward(id: number, payload: Partial<RewardItem>) {
  return request(`/api/rewards/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteReward(id: number) {
  return request(`/api/rewards/${id}`, { method: "DELETE" });
}

export function listPunishments() {
  return request<{ items: PunishmentItem[] }>(`/api/punishments`);
}

export function createPunishment(payload: Partial<PunishmentItem>) {
  return request(`/api/punishments`, { method: "POST", body: JSON.stringify(payload) });
}

export function updatePunishment(id: number, payload: Partial<PunishmentItem>) {
  return request(`/api/punishments/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deletePunishment(id: number) {
  return request(`/api/punishments/${id}`, { method: "DELETE" });
}

export function listFinance(date?: string, month?: string) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (month) params.set("month", month);
  const query = params.toString();
  return request<{ items: FinanceRecord[] }>(`/api/finance${query ? `?${query}` : ""}`);
}

export function createFinance(payload: Partial<FinanceRecord>) {
  return request(`/api/finance`, { method: "POST", body: JSON.stringify(payload) });
}

export function updateFinance(id: number, payload: Partial<FinanceRecord>) {
  return request(`/api/finance/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteFinance(id: number) {
  return request(`/api/finance/${id}`, { method: "DELETE" });
}

export function listSettings() {
  return request<{ items: Array<{ key: string; value: string }> }>(`/api/settings`);
}

export function updateSetting(key: string, value: string | number) {
  return request(`/api/settings/${key}`, { method: "PUT", body: JSON.stringify({ value }) });
}

export function listExercise(date: string) {
  return request<{ date: string; items: ExerciseLog[] }>(`/api/exercise?date=${date}`);
}

export function createExercise(payload: Partial<ExerciseLog>) {
  return request(`/api/exercise`, { method: "POST", body: JSON.stringify(payload) });
}

export function updateExercise(id: number, payload: Partial<ExerciseLog>) {
  return request(`/api/exercise/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteExercise(id: number) {
  return request(`/api/exercise/${id}`, { method: "DELETE" });
}

export function listDiet(date: string) {
  return request<{ date: string; items: DietLog[] }>(`/api/diet?date=${date}`);
}

export function createDiet(payload: Partial<DietLog>) {
  return request(`/api/diet`, { method: "POST", body: JSON.stringify(payload) });
}

export function updateDiet(id: number, payload: Partial<DietLog>) {
  return request(`/api/diet/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteDiet(id: number) {
  return request(`/api/diet/${id}`, { method: "DELETE" });
}

export function getExerciseSummary(weeks = 4, date?: string) {
  const params = new URLSearchParams();
  params.set("weeks", String(weeks));
  if (date) params.set("date", date);
  return request<ExerciseSummary>(`/api/exercise-summary?${params.toString()}`);
}
