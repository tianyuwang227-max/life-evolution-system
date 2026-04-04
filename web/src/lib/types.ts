import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";

export type Task = {
  id: number;
  date: string;
  title: string;
  done: number;
  priority: number;
  note?: string | null;
};

export type ScheduleBlock = {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  title: string;
  note?: string | null;
};

export type DailyReview = {
  id: number;
  date: string;
  did_what?: string | null;
  tasks_done?: string | null;
  study_minutes?: number | null;
  procrastinated?: number | null;
  mood_score?: number | null;
  good_things?: string | null;
  why_good?: string | null;
  repeat_next?: string | null;
  biggest_problem?: string | null;
  root_cause?: string | null;
  tomorrow_plan?: string | null;
  happiest_moment?: string | null;
  lowest_moment?: string | null;
  triggers?: string | null;
  spent_amount?: number | null;
  spent_value?: string | null;
};

export type PromptItem = {
  id: number;
  group_name: string;
  question: string;
  enabled: number;
  order_index: number;
};

export type RewardItem = {
  id: number;
  title: string;
  rule?: string | null;
  enabled: number;
};

export type PunishmentItem = RewardItem;

export type FinanceRecord = {
  id: number;
  date: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string | null;
};

export type ExerciseLog = {
  id: number;
  date: string;
  duration_minutes: number;
  type?: string | null;
  note?: string | null;
};

export type DietLog = {
  id: number;
  date: string;
  meal: string;
  calories: number;
  note?: string | null;
};

export type Summary = {
  date: string;
  tasks: {
    total: number;
    done: number;
  };
  review: Pick<DailyReview, "study_minutes" | "mood_score" | "procrastinated"> | null;
  finance: {
    todayExpense: number;
    todayIncome: number;
    monthExpense: number;
    monthIncome: number;
    savings: number;
    savingsRate: number | null;
  };
};

export type Trends = {
  range: { start: string; end: string };
  finance: Array<{ date: string; expense: number; income: number }>;
  reviews: Array<{ date: string; study_minutes: number | null; mood_score: number | null; procrastinated: number | null }>;
  tasks: Array<{ date: string; total: number; done: number }>;
  exercise: Array<{ date: string; duration_minutes: number }>;
  diet: Array<{ date: string; calories: number }>;
};

export type ReportSummary = {
  range: { start: string; end: string; days: number };
  tasks: { total: number; done: number; avgCompletion: number };
  review: { avgMood: number; avgStudy: number; avgProcrastination: number };
  finance: { totalExpense: number; totalIncome: number; avgDailyExpense: number };
};

export type ExportPayload = {
  generated_at: string;
  data: {
    tasks: Task[];
    schedule_blocks: ScheduleBlock[];
    daily_reviews: DailyReview[];
    prompts: PromptItem[];
    rewards: RewardItem[];
    punishments: PunishmentItem[];
    finance_records: FinanceRecord[];
    exercise_logs: ExerciseLog[];
    diet_logs: DietLog[];
    settings: Array<{ key: string; value: string }>;
  };
};

export type ExerciseSummary = {
  range: { start: string; end: string; weeks: number };
  weekdays: Array<{
    day: number;
    label: string;
    total_minutes: number;
    occurrences: number;
    avg_minutes: number;
  }>;
};

export type AuthStatus = {
  authenticated: boolean;
  hasPasskey: boolean;
  setupRequired: boolean;
  userName: string | null;
  sessionExpiresAt: string | null;
};

export type PasskeyRegistrationOptions = {
  flowId: string;
  userName: string;
  rpID: string;
  rpName: string;
  options: PublicKeyCredentialCreationOptionsJSON;
};

export type PasskeyLoginOptions = {
  flowId: string;
  userName: string | null;
  rpID: string;
  rpName: string;
  options: PublicKeyCredentialRequestOptionsJSON;
};

export type PasskeyRegistrationVerifyPayload = {
  flowId: string;
  response: RegistrationResponseJSON;
};

export type PasskeyLoginVerifyPayload = {
  flowId: string;
  response: AuthenticationResponseJSON;
};
