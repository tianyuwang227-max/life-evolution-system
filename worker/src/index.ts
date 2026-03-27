export interface Env {
  DB: D1Database;
  CORS_ORIGIN?: string;
  ACCESS_MODE?: string;
  ACCESS_BYPASS_SECRET?: string;
}

const TZ = "Asia/Shanghai";

function nowISO() {
  return new Date().toISOString();
}

function todayStr() {
  const formatter = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ });
  return formatter.format(new Date());
}

function dateRange(end: string, days: number) {
  const [y, m, d] = end.split("-").map(Number);
  const endDate = new Date(Date.UTC(y, m - 1, d));
  endDate.setUTCDate(endDate.getUTCDate() - (days - 1));
  const start = endDate.toISOString().slice(0, 10);
  return { start, end };
}

function json(data: unknown, status = 200, corsHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
    },
  });
}

function resolveAllowedOrigin(env: Env, requestOrigin: string | null) {
  const raw = env.CORS_ORIGIN || "*";
  const allowed = raw.split(",").map((item) => item.trim()).filter(Boolean);
  if (allowed.length === 0) return "*";
  if (allowed.includes("*")) return "*";
  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  return allowed[0];
}

function corsHeaders(env: Env, request: Request) {
  const requestOrigin = request.headers.get("Origin");
  const origin = resolveAllowedOrigin(env, requestOrigin);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, CF-Access-Jwt-Assertion, X-Bypass-Secret",
  };
  if (origin !== "*") {
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}

function isAuthorized(request: Request, env: Env) {
  const mode = env.ACCESS_MODE || "access";
  if (mode === "off") return true;

  const bypass = env.ACCESS_BYPASS_SECRET;
  if (bypass && request.headers.get("x-bypass-secret") === bypass) {
    return true;
  }

  const accessJwt = request.headers.get("cf-access-jwt-assertion");
  return Boolean(accessJwt);
}

function buildUpdate(input: Record<string, unknown>, allowed: string[]) {
  const fields = allowed.filter((key) => input[key] !== undefined);
  if (!fields.length) return null;
  const sets = fields.map((key) => `${key} = ?`).join(", ");
  const values = fields.map((key) => input[key]);
  return { sets, values };
}

async function parseBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cors = corsHeaders(env, request);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (!url.pathname.startsWith("/api")) {
      return new Response("Not Found", { status: 404 });
    }

    if (!isAuthorized(request, env)) {
      return json({ error: "Unauthorized" }, 401, cors);
    }

    try {
      const path = url.pathname.replace("/api", "");
      const segments = path.split("/").filter(Boolean);
      const resource = segments[0];
      const id = segments[1] ? Number(segments[1]) : null;

      if (resource === "health") {
        return json({ ok: true, time: nowISO() }, 200, cors);
      }

      if (resource === "tasks") {
        if (request.method === "GET" && segments.length === 1) {
          const date = url.searchParams.get("date") || todayStr();
          const { results } = await env.DB.prepare(
            "SELECT * FROM tasks WHERE date = ? ORDER BY id DESC"
          ).bind(date).all();
          return json({ date, items: results }, 200, cors);
        }
        if (request.method === "POST" && segments.length === 1) {
          const body = await parseBody(request);
          if (!body?.title) return json({ error: "title required" }, 400, cors);
          const date = body.date || todayStr();
          const now = nowISO();
          const stmt = env.DB.prepare(
            "INSERT INTO tasks (date, title, done, priority, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
          );
          const result = await stmt.bind(
            date,
            body.title,
            body.done ? 1 : 0,
            body.priority ?? 2,
            body.note ?? null,
            now,
            now
          ).run();
          return json({ id: result.meta.last_row_id }, 201, cors);
        }
        if (id && request.method === "PUT") {
          const body = (await parseBody(request)) || {};
          const update = buildUpdate(body, ["date", "title", "done", "priority", "note"]);
          if (!update) return json({ error: "no fields" }, 400, cors);
          const now = nowISO();
          await env.DB.prepare(`UPDATE tasks SET ${update.sets}, updated_at = ? WHERE id = ?`).bind(
            ...update.values,
            now,
            id
          ).run();
          return json({ ok: true }, 200, cors);
        }
        if (id && request.method === "DELETE") {
          await env.DB.prepare("DELETE FROM tasks WHERE id = ?").bind(id).run();
          return json({ ok: true }, 200, cors);
        }
      }

      if (resource === "schedule") {
        if (request.method === "GET" && segments.length === 1) {
          const date = url.searchParams.get("date") || todayStr();
          const { results } = await env.DB.prepare(
            "SELECT * FROM schedule_blocks WHERE date = ? ORDER BY start_time ASC"
          ).bind(date).all();
          return json({ date, items: results }, 200, cors);
        }
        if (request.method === "POST" && segments.length === 1) {
          const body = await parseBody(request);
          if (!body?.title || !body?.start_time || !body?.end_time) {
            return json({ error: "title/start_time/end_time required" }, 400, cors);
          }
          const date = body.date || todayStr();
          const now = nowISO();
          const result = await env.DB.prepare(
            "INSERT INTO schedule_blocks (date, start_time, end_time, title, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
          ).bind(
            date,
            body.start_time,
            body.end_time,
            body.title,
            body.note ?? null,
            now,
            now
          ).run();
          return json({ id: result.meta.last_row_id }, 201, cors);
        }
        if (id && request.method === "PUT") {
          const body = (await parseBody(request)) || {};
          const update = buildUpdate(body, ["date", "start_time", "end_time", "title", "note"]);
          if (!update) return json({ error: "no fields" }, 400, cors);
          const now = nowISO();
          await env.DB.prepare(
            `UPDATE schedule_blocks SET ${update.sets}, updated_at = ? WHERE id = ?`
          ).bind(...update.values, now, id).run();
          return json({ ok: true }, 200, cors);
        }
        if (id && request.method === "DELETE") {
          await env.DB.prepare("DELETE FROM schedule_blocks WHERE id = ?").bind(id).run();
          return json({ ok: true }, 200, cors);
        }
      }

      if (resource === "reviews") {
        if (request.method === "GET" && segments.length === 1) {
          const date = url.searchParams.get("date") || todayStr();
          const review = await env.DB.prepare(
            "SELECT * FROM daily_reviews WHERE date = ?"
          ).bind(date).first();
          return json({ date, review }, 200, cors);
        }
        if (request.method === "POST" && segments.length === 1) {
          const body = await parseBody(request);
          const date = body?.date || todayStr();
          const now = nowISO();
          const stmt = env.DB.prepare(
            `INSERT INTO daily_reviews (
              date, did_what, tasks_done, study_minutes, procrastinated, mood_score,
              good_things, why_good, repeat_next, biggest_problem, root_cause,
              tomorrow_plan, happiest_moment, lowest_moment, triggers,
              spent_amount, spent_value, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          );
          const result = await stmt.bind(
            date,
            body?.did_what ?? null,
            body?.tasks_done ?? null,
            body?.study_minutes ?? null,
            body?.procrastinated ?? null,
            body?.mood_score ?? null,
            body?.good_things ?? null,
            body?.why_good ?? null,
            body?.repeat_next ?? null,
            body?.biggest_problem ?? null,
            body?.root_cause ?? null,
            body?.tomorrow_plan ?? null,
            body?.happiest_moment ?? null,
            body?.lowest_moment ?? null,
            body?.triggers ?? null,
            body?.spent_amount ?? null,
            body?.spent_value ?? null,
            now,
            now
          ).run();
          return json({ id: result.meta.last_row_id }, 201, cors);
        }
        if (id && request.method === "PUT") {
          const body = (await parseBody(request)) || {};
          const update = buildUpdate(body, [
            "date",
            "did_what",
            "tasks_done",
            "study_minutes",
            "procrastinated",
            "mood_score",
            "good_things",
            "why_good",
            "repeat_next",
            "biggest_problem",
            "root_cause",
            "tomorrow_plan",
            "happiest_moment",
            "lowest_moment",
            "triggers",
            "spent_amount",
            "spent_value",
          ]);
          if (!update) return json({ error: "no fields" }, 400, cors);
          const now = nowISO();
          await env.DB.prepare(
            `UPDATE daily_reviews SET ${update.sets}, updated_at = ? WHERE id = ?`
          ).bind(...update.values, now, id).run();
          return json({ ok: true }, 200, cors);
        }
        if (id && request.method === "DELETE") {
          await env.DB.prepare("DELETE FROM daily_reviews WHERE id = ?").bind(id).run();
          return json({ ok: true }, 200, cors);
        }
      }

      if (resource === "prompts") {
        if (request.method === "GET" && segments.length === 1) {
          const { results } = await env.DB.prepare(
            "SELECT * FROM prompts ORDER BY order_index ASC, id ASC"
          ).all();
          return json({ items: results }, 200, cors);
        }
        if (request.method === "POST" && segments.length === 1) {
          const body = await parseBody(request);
          if (!body?.question) return json({ error: "question required" }, 400, cors);
          const now = nowISO();
          const result = await env.DB.prepare(
            "INSERT INTO prompts (group_name, question, enabled, order_index, created_at) VALUES (?, ?, ?, ?, ?)"
          ).bind(
            body.group_name ?? "每日复盘",
            body.question,
            body.enabled === undefined ? 1 : body.enabled ? 1 : 0,
            body.order_index ?? 0,
            now
          ).run();
          return json({ id: result.meta.last_row_id }, 201, cors);
        }
        if (id && request.method === "PUT") {
          const body = (await parseBody(request)) || {};
          const update = buildUpdate(body, ["group_name", "question", "enabled", "order_index"]);
          if (!update) return json({ error: "no fields" }, 400, cors);
          await env.DB.prepare(`UPDATE prompts SET ${update.sets} WHERE id = ?`).bind(
            ...update.values,
            id
          ).run();
          return json({ ok: true }, 200, cors);
        }
        if (id && request.method === "DELETE") {
          await env.DB.prepare("DELETE FROM prompts WHERE id = ?").bind(id).run();
          return json({ ok: true }, 200, cors);
        }
      }

      if (resource === "rewards" || resource === "punishments") {
        const table = resource;
        if (request.method === "GET" && segments.length === 1) {
          const { results } = await env.DB.prepare(
            `SELECT * FROM ${table} ORDER BY id DESC`
          ).all();
          return json({ items: results }, 200, cors);
        }
        if (request.method === "POST" && segments.length === 1) {
          const body = await parseBody(request);
          if (!body?.title) return json({ error: "title required" }, 400, cors);
          const now = nowISO();
          const result = await env.DB.prepare(
            `INSERT INTO ${table} (title, rule, enabled, created_at) VALUES (?, ?, ?, ?)`
          ).bind(
            body.title,
            body.rule ?? null,
            body.enabled === undefined ? 1 : body.enabled ? 1 : 0,
            now
          ).run();
          return json({ id: result.meta.last_row_id }, 201, cors);
        }
        if (id && request.method === "PUT") {
          const body = (await parseBody(request)) || {};
          const update = buildUpdate(body, ["title", "rule", "enabled"]);
          if (!update) return json({ error: "no fields" }, 400, cors);
          await env.DB.prepare(
            `UPDATE ${table} SET ${update.sets} WHERE id = ?`
          ).bind(...update.values, id).run();
          return json({ ok: true }, 200, cors);
        }
        if (id && request.method === "DELETE") {
          await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
          return json({ ok: true }, 200, cors);
        }
      }

      if (resource === "finance") {
        if (request.method === "GET" && segments.length === 1) {
          const date = url.searchParams.get("date");
          const month = url.searchParams.get("month");
          let query = "SELECT * FROM finance_records";
          const params: string[] = [];
          if (date) {
            query += " WHERE date = ?";
            params.push(date);
          } else if (month) {
            query += " WHERE substr(date, 1, 7) = ?";
            params.push(month);
          }
          query += " ORDER BY date DESC, id DESC";
          const stmt = env.DB.prepare(query);
          const { results } = params.length ? await stmt.bind(...params).all() : await stmt.all();
          return json({ items: results }, 200, cors);
        }
        if (request.method === "POST" && segments.length === 1) {
          const body = await parseBody(request);
          if (!body?.amount || !body?.type) return json({ error: "type/amount required" }, 400, cors);
          const date = body.date || todayStr();
          const now = nowISO();
          const category = body.category || (body.type === "income" ? "收入" : "其他");
          const result = await env.DB.prepare(
            "INSERT INTO finance_records (date, type, amount, category, note, created_at) VALUES (?, ?, ?, ?, ?, ?)"
          ).bind(
            date,
            body.type,
            body.amount,
            category,
            body.note ?? null,
            now
          ).run();
          return json({ id: result.meta.last_row_id }, 201, cors);
        }
        if (id && request.method === "PUT") {
          const body = (await parseBody(request)) || {};
          const update = buildUpdate(body, ["date", "type", "amount", "category", "note"]);
          if (!update) return json({ error: "no fields" }, 400, cors);
          await env.DB.prepare(
            `UPDATE finance_records SET ${update.sets} WHERE id = ?`
          ).bind(...update.values, id).run();
          return json({ ok: true }, 200, cors);
        }
        if (id && request.method === "DELETE") {
          await env.DB.prepare("DELETE FROM finance_records WHERE id = ?").bind(id).run();
          return json({ ok: true }, 200, cors);
        }
      }

      if (resource === "exercise") {
        if (request.method === "GET" && segments.length === 1) {
          const date = url.searchParams.get("date") || todayStr();
          const { results } = await env.DB.prepare(
            "SELECT * FROM exercise_logs WHERE date = ? ORDER BY id DESC"
          ).bind(date).all();
          return json({ date, items: results }, 200, cors);
        }
        if (request.method === "POST" && segments.length === 1) {
          const body = await parseBody(request);
          if (!body?.duration_minutes) return json({ error: "duration_minutes required" }, 400, cors);
          const date = body.date || todayStr();
          const now = nowISO();
          const result = await env.DB.prepare(
            "INSERT INTO exercise_logs (date, duration_minutes, type, note, created_at) VALUES (?, ?, ?, ?, ?)"
          ).bind(
            date,
            body.duration_minutes,
            body.type ?? null,
            body.note ?? null,
            now
          ).run();
          return json({ id: result.meta.last_row_id }, 201, cors);
        }
        if (id && request.method === "PUT") {
          const body = (await parseBody(request)) || {};
          const update = buildUpdate(body, ["date", "duration_minutes", "type", "note"]);
          if (!update) return json({ error: "no fields" }, 400, cors);
          await env.DB.prepare(`UPDATE exercise_logs SET ${update.sets} WHERE id = ?`).bind(
            ...update.values,
            id
          ).run();
          return json({ ok: true }, 200, cors);
        }
        if (id && request.method === "DELETE") {
          await env.DB.prepare("DELETE FROM exercise_logs WHERE id = ?").bind(id).run();
          return json({ ok: true }, 200, cors);
        }
      }

      if (resource === "diet") {
        if (request.method === "GET" && segments.length === 1) {
          const date = url.searchParams.get("date") || todayStr();
          const { results } = await env.DB.prepare(
            "SELECT * FROM diet_logs WHERE date = ? ORDER BY id DESC"
          ).bind(date).all();
          return json({ date, items: results }, 200, cors);
        }
        if (request.method === "POST" && segments.length === 1) {
          const body = await parseBody(request);
          if (!body?.meal || !body?.calories) {
            return json({ error: "meal/calories required" }, 400, cors);
          }
          const date = body.date || todayStr();
          const now = nowISO();
          const result = await env.DB.prepare(
            "INSERT INTO diet_logs (date, meal, calories, note, created_at) VALUES (?, ?, ?, ?, ?)"
          ).bind(
            date,
            body.meal,
            body.calories,
            body.note ?? null,
            now
          ).run();
          return json({ id: result.meta.last_row_id }, 201, cors);
        }
        if (id && request.method === "PUT") {
          const body = (await parseBody(request)) || {};
          const update = buildUpdate(body, ["date", "meal", "calories", "note"]);
          if (!update) return json({ error: "no fields" }, 400, cors);
          await env.DB.prepare(`UPDATE diet_logs SET ${update.sets} WHERE id = ?`).bind(
            ...update.values,
            id
          ).run();
          return json({ ok: true }, 200, cors);
        }
        if (id && request.method === "DELETE") {
          await env.DB.prepare("DELETE FROM diet_logs WHERE id = ?").bind(id).run();
          return json({ ok: true }, 200, cors);
        }
      }

      if (resource === "settings") {
        if (request.method === "GET" && segments.length === 1) {
          const { results } = await env.DB.prepare("SELECT * FROM settings").all();
          return json({ items: results }, 200, cors);
        }
        if (request.method === "PUT" && segments.length === 2) {
          const key = segments[1];
          const body = await parseBody(request);
          if (body?.value === undefined) return json({ error: "value required" }, 400, cors);
          await env.DB.prepare(
            "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
          ).bind(key, String(body.value)).run();
          return json({ ok: true }, 200, cors);
        }
      }

      if (resource === "summary") {
        const date = url.searchParams.get("date") || todayStr();
        const month = date.slice(0, 7);

        const taskRow = await env.DB.prepare(
          "SELECT COUNT(*) as total, SUM(done) as done FROM tasks WHERE date = ?"
        ).bind(date).first();

        const review = await env.DB.prepare(
          "SELECT study_minutes, mood_score, procrastinated FROM daily_reviews WHERE date = ?"
        ).bind(date).first();

        const todayFinance = await env.DB.prepare(
          "SELECT SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense, SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income FROM finance_records WHERE date = ?"
        ).bind(date).first();

        const monthFinance = await env.DB.prepare(
          "SELECT SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense, SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income FROM finance_records WHERE substr(date, 1, 7) = ?"
        ).bind(month).first();

        const initialSavings = await env.DB.prepare(
          "SELECT value FROM settings WHERE key = 'initial_savings'"
        ).first();

        const totalIncome = await env.DB.prepare(
          "SELECT SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income FROM finance_records"
        ).first();

        const totalExpense = await env.DB.prepare(
          "SELECT SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense FROM finance_records"
        ).first();

        const savings =
          Number(initialSavings?.value || 0) +
          Number(totalIncome?.income || 0) -
          Number(totalExpense?.expense || 0);

        const monthIncome = Number(monthFinance?.income || 0);
        const monthExpense = Number(monthFinance?.expense || 0);
        const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome) * 100 : null;

        return json(
          {
            date,
            tasks: {
              total: Number(taskRow?.total || 0),
              done: Number(taskRow?.done || 0),
            },
            review: review || null,
            finance: {
              todayExpense: Number(todayFinance?.expense || 0),
              todayIncome: Number(todayFinance?.income || 0),
              monthExpense,
              monthIncome,
              savings,
              savingsRate,
            },
          },
          200,
          cors
        );
      }

      if (resource === "report") {
        const date = url.searchParams.get("date") || todayStr();
        const days = Number(url.searchParams.get("days") || 7);
        const range = dateRange(date, days);

        const tasksRes = await env.DB.prepare(
          "SELECT date, COUNT(*) as total, SUM(done) as done FROM tasks WHERE date >= ? AND date <= ? GROUP BY date ORDER BY date ASC"
        ).bind(range.start, range.end).all();

        const reviewsRes = await env.DB.prepare(
          "SELECT date, study_minutes, mood_score, procrastinated FROM daily_reviews WHERE date >= ? AND date <= ? ORDER BY date ASC"
        ).bind(range.start, range.end).all();

        const financeRes = await env.DB.prepare(
          "SELECT SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense, SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income FROM finance_records WHERE date >= ? AND date <= ?"
        ).bind(range.start, range.end).first();

        const taskRows = tasksRes.results || [];
        const reviewRows = reviewsRes.results || [];

        const completionRates = taskRows
          .map((row: any) => (row.total ? (row.done / row.total) * 100 : null))
          .filter((value: number | null) => value !== null) as number[];

        const avg = (list: Array<number | null | undefined>) => {
          const values = list.filter((v) => typeof v === "number") as number[];
          if (!values.length) return 0;
          return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
        };

        const avgMood = avg(reviewRows.map((row: any) => row.mood_score));
        const avgStudy = avg(reviewRows.map((row: any) => row.study_minutes));
        const avgProcrastination = avg(reviewRows.map((row: any) => row.procrastinated));

        const totalTasks = taskRows.reduce((sum: number, row: any) => sum + (row.total || 0), 0);
        const doneTasks = taskRows.reduce((sum: number, row: any) => sum + (row.done || 0), 0);
        const avgCompletion = completionRates.length ? avg(completionRates) : 0;

        const totalExpense = Number(financeRes?.expense || 0);
        const totalIncome = Number(financeRes?.income || 0);
        const avgDailyExpense = days > 0 ? Math.round((totalExpense / days) * 10) / 10 : 0;

        return json(
          {
            range: { ...range, days },
            tasks: {
              total: totalTasks,
              done: doneTasks,
              avgCompletion,
            },
            review: {
              avgMood,
              avgStudy,
              avgProcrastination,
            },
            finance: {
              totalExpense,
              totalIncome,
              avgDailyExpense,
            },
          },
          200,
          cors
        );
      }

      if (resource === "exercise-summary") {
        const date = url.searchParams.get("date") || todayStr();
        const weeks = Number(url.searchParams.get("weeks") || 4);
        const totalDays = Math.max(1, weeks * 7);
        const range = dateRange(date, totalDays);

        const rows = await env.DB.prepare(
          "SELECT date, SUM(duration_minutes) as total FROM exercise_logs WHERE date >= ? AND date <= ? GROUP BY date ORDER BY date ASC"
        ).bind(range.start, range.end).all();

        const totalMap = new Map<string, number>();
        (rows.results || []).forEach((row: any) => {
          totalMap.set(row.date, Number(row.total || 0));
        });

        const stats = [
          { day: 1, label: "周一", total_minutes: 0, occurrences: 0, avg_minutes: 0 },
          { day: 2, label: "周二", total_minutes: 0, occurrences: 0, avg_minutes: 0 },
          { day: 3, label: "周三", total_minutes: 0, occurrences: 0, avg_minutes: 0 },
          { day: 4, label: "周四", total_minutes: 0, occurrences: 0, avg_minutes: 0 },
          { day: 5, label: "周五", total_minutes: 0, occurrences: 0, avg_minutes: 0 },
          { day: 6, label: "周六", total_minutes: 0, occurrences: 0, avg_minutes: 0 },
          { day: 7, label: "周日", total_minutes: 0, occurrences: 0, avg_minutes: 0 },
        ];

        const cursor = new Date(`${range.start}T00:00:00Z`);
        const endDate = new Date(`${range.end}T00:00:00Z`);
        while (cursor <= endDate) {
          const dateStr = cursor.toISOString().slice(0, 10);
          const day = cursor.getUTCDay(); // 0 Sunday
          const idx = day === 0 ? 6 : day - 1;
          stats[idx].occurrences += 1;
          stats[idx].total_minutes += totalMap.get(dateStr) || 0;
          cursor.setUTCDate(cursor.getUTCDate() + 1);
        }

        stats.forEach((item) => {
          item.avg_minutes = item.occurrences
            ? Math.round((item.total_minutes / item.occurrences) * 10) / 10
            : 0;
        });

        return json({ range: { ...range, weeks }, weekdays: stats }, 200, cors);
      }

      if (resource === "trends") {
        const days = Number(url.searchParams.get("days") || 30);
        const end = todayStr();
        const { start } = dateRange(end, days);

        const finance = await env.DB.prepare(
          "SELECT date, SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense, SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income FROM finance_records WHERE date >= ? AND date <= ? GROUP BY date ORDER BY date ASC"
        ).bind(start, end).all();

        const reviews = await env.DB.prepare(
          "SELECT date, study_minutes, mood_score, procrastinated FROM daily_reviews WHERE date >= ? AND date <= ? ORDER BY date ASC"
        ).bind(start, end).all();

        const tasks = await env.DB.prepare(
          "SELECT date, COUNT(*) as total, SUM(done) as done FROM tasks WHERE date >= ? AND date <= ? GROUP BY date ORDER BY date ASC"
        ).bind(start, end).all();

        const exercise = await env.DB.prepare(
          "SELECT date, SUM(duration_minutes) as duration_minutes FROM exercise_logs WHERE date >= ? AND date <= ? GROUP BY date ORDER BY date ASC"
        ).bind(start, end).all();

        const diet = await env.DB.prepare(
          "SELECT date, SUM(calories) as calories FROM diet_logs WHERE date >= ? AND date <= ? GROUP BY date ORDER BY date ASC"
        ).bind(start, end).all();

        return json(
          {
            range: { start, end },
            finance: finance.results || [],
            reviews: reviews.results || [],
            tasks: tasks.results || [],
            exercise: exercise.results || [],
            diet: diet.results || [],
          },
          200,
          cors
        );
      }

      if (resource === "export") {
        const tasks = await env.DB.prepare("SELECT * FROM tasks ORDER BY date DESC, id DESC").all();
        const schedule = await env.DB.prepare(
          "SELECT * FROM schedule_blocks ORDER BY date DESC, start_time ASC"
        ).all();
        const reviews = await env.DB.prepare("SELECT * FROM daily_reviews ORDER BY date DESC").all();
        const prompts = await env.DB.prepare(
          "SELECT * FROM prompts ORDER BY order_index ASC, id ASC"
        ).all();
        const rewards = await env.DB.prepare("SELECT * FROM rewards ORDER BY id DESC").all();
        const punishments = await env.DB.prepare("SELECT * FROM punishments ORDER BY id DESC").all();
        const finance = await env.DB.prepare(
          "SELECT * FROM finance_records ORDER BY date DESC, id DESC"
        ).all();
        const exercise = await env.DB.prepare(
          "SELECT * FROM exercise_logs ORDER BY date DESC, id DESC"
        ).all();
        const diet = await env.DB.prepare(
          "SELECT * FROM diet_logs ORDER BY date DESC, id DESC"
        ).all();
        const settings = await env.DB.prepare("SELECT * FROM settings").all();

        return json(
          {
            generated_at: nowISO(),
            data: {
              tasks: tasks.results || [],
              schedule_blocks: schedule.results || [],
              daily_reviews: reviews.results || [],
              prompts: prompts.results || [],
              rewards: rewards.results || [],
              punishments: punishments.results || [],
              finance_records: finance.results || [],
              exercise_logs: exercise.results || [],
              diet_logs: diet.results || [],
              settings: settings.results || [],
            },
          },
          200,
          cors
        );
      }

      if (resource === "import" && request.method === "POST") {
        const body = await parseBody(request);
        if (!body?.data) return json({ error: "data required" }, 400, cors);

        const payload = body.data;
        const now = nowISO();
        const mode = url.searchParams.get("mode") || "overwrite";
        const isMerge = mode === "merge";

        if (!isMerge) {
          await env.DB.prepare("DELETE FROM tasks").run();
          await env.DB.prepare("DELETE FROM schedule_blocks").run();
          await env.DB.prepare("DELETE FROM daily_reviews").run();
          await env.DB.prepare("DELETE FROM prompts").run();
          await env.DB.prepare("DELETE FROM rewards").run();
          await env.DB.prepare("DELETE FROM punishments").run();
          await env.DB.prepare("DELETE FROM finance_records").run();
          await env.DB.prepare("DELETE FROM exercise_logs").run();
          await env.DB.prepare("DELETE FROM diet_logs").run();
          await env.DB.prepare("DELETE FROM settings").run();
        }

        const insertTasks = env.DB.prepare(
          isMerge
            ? "INSERT INTO tasks (id, date, title, done, priority, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET date=excluded.date, title=excluded.title, done=excluded.done, priority=excluded.priority, note=excluded.note, created_at=excluded.created_at, updated_at=excluded.updated_at"
            : "INSERT INTO tasks (id, date, title, done, priority, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );
        for (const item of payload.tasks || []) {
          await insertTasks.bind(
            item.id,
            item.date,
            item.title,
            item.done ?? 0,
            item.priority ?? 2,
            item.note ?? null,
            item.created_at || now,
            item.updated_at || now
          ).run();
        }

        const insertSchedule = env.DB.prepare(
          isMerge
            ? "INSERT INTO schedule_blocks (id, date, start_time, end_time, title, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET date=excluded.date, start_time=excluded.start_time, end_time=excluded.end_time, title=excluded.title, note=excluded.note, created_at=excluded.created_at, updated_at=excluded.updated_at"
            : "INSERT INTO schedule_blocks (id, date, start_time, end_time, title, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );
        for (const item of payload.schedule_blocks || []) {
          await insertSchedule.bind(
            item.id,
            item.date,
            item.start_time,
            item.end_time,
            item.title,
            item.note ?? null,
            item.created_at || now,
            item.updated_at || now
          ).run();
        }

        const insertReviews = env.DB.prepare(
          isMerge
            ? `INSERT INTO daily_reviews (
                date, did_what, tasks_done, study_minutes, procrastinated, mood_score,
                good_things, why_good, repeat_next, biggest_problem, root_cause,
                tomorrow_plan, happiest_moment, lowest_moment, triggers,
                spent_amount, spent_value, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(date) DO UPDATE SET
                did_what=excluded.did_what,
                tasks_done=excluded.tasks_done,
                study_minutes=excluded.study_minutes,
                procrastinated=excluded.procrastinated,
                mood_score=excluded.mood_score,
                good_things=excluded.good_things,
                why_good=excluded.why_good,
                repeat_next=excluded.repeat_next,
                biggest_problem=excluded.biggest_problem,
                root_cause=excluded.root_cause,
                tomorrow_plan=excluded.tomorrow_plan,
                happiest_moment=excluded.happiest_moment,
                lowest_moment=excluded.lowest_moment,
                triggers=excluded.triggers,
                spent_amount=excluded.spent_amount,
                spent_value=excluded.spent_value,
                created_at=excluded.created_at,
                updated_at=excluded.updated_at`
            : `INSERT INTO daily_reviews (
                id, date, did_what, tasks_done, study_minutes, procrastinated, mood_score,
                good_things, why_good, repeat_next, biggest_problem, root_cause,
                tomorrow_plan, happiest_moment, lowest_moment, triggers,
                spent_amount, spent_value, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        for (const item of payload.daily_reviews || []) {
          const commonFields = [
            item.date,
            item.did_what ?? null,
            item.tasks_done ?? null,
            item.study_minutes ?? null,
            item.procrastinated ?? null,
            item.mood_score ?? null,
            item.good_things ?? null,
            item.why_good ?? null,
            item.repeat_next ?? null,
            item.biggest_problem ?? null,
            item.root_cause ?? null,
            item.tomorrow_plan ?? null,
            item.happiest_moment ?? null,
            item.lowest_moment ?? null,
            item.triggers ?? null,
            item.spent_amount ?? null,
            item.spent_value ?? null,
            item.created_at || now,
            item.updated_at || now,
          ];
          if (isMerge) {
            await insertReviews.bind(...commonFields).run();
          } else {
            await insertReviews.bind(
              item.id,
              ...commonFields
            ).run();
          }
        }

        const insertPrompts = env.DB.prepare(
          isMerge
            ? "INSERT INTO prompts (id, group_name, question, enabled, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET group_name=excluded.group_name, question=excluded.question, enabled=excluded.enabled, order_index=excluded.order_index, created_at=excluded.created_at"
            : "INSERT INTO prompts (id, group_name, question, enabled, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        );
        for (const item of payload.prompts || []) {
          await insertPrompts.bind(
            item.id,
            item.group_name,
            item.question,
            item.enabled ?? 1,
            item.order_index ?? 0,
            item.created_at || now
          ).run();
        }

        const insertRewards = env.DB.prepare(
          isMerge
            ? "INSERT INTO rewards (id, title, rule, enabled, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title=excluded.title, rule=excluded.rule, enabled=excluded.enabled, created_at=excluded.created_at"
            : "INSERT INTO rewards (id, title, rule, enabled, created_at) VALUES (?, ?, ?, ?, ?)"
        );
        for (const item of payload.rewards || []) {
          await insertRewards.bind(
            item.id,
            item.title,
            item.rule ?? null,
            item.enabled ?? 1,
            item.created_at || now
          ).run();
        }

        const insertPunishments = env.DB.prepare(
          isMerge
            ? "INSERT INTO punishments (id, title, rule, enabled, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title=excluded.title, rule=excluded.rule, enabled=excluded.enabled, created_at=excluded.created_at"
            : "INSERT INTO punishments (id, title, rule, enabled, created_at) VALUES (?, ?, ?, ?, ?)"
        );
        for (const item of payload.punishments || []) {
          await insertPunishments.bind(
            item.id,
            item.title,
            item.rule ?? null,
            item.enabled ?? 1,
            item.created_at || now
          ).run();
        }

        const insertFinance = env.DB.prepare(
          isMerge
            ? "INSERT INTO finance_records (id, date, type, amount, category, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET date=excluded.date, type=excluded.type, amount=excluded.amount, category=excluded.category, note=excluded.note, created_at=excluded.created_at"
            : "INSERT INTO finance_records (id, date, type, amount, category, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        for (const item of payload.finance_records || []) {
          await insertFinance.bind(
            item.id,
            item.date,
            item.type,
            item.amount,
            item.category,
            item.note ?? null,
            item.created_at || now
          ).run();
        }

        const insertExercise = env.DB.prepare(
          isMerge
            ? "INSERT INTO exercise_logs (id, date, duration_minutes, type, note, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET date=excluded.date, duration_minutes=excluded.duration_minutes, type=excluded.type, note=excluded.note, created_at=excluded.created_at"
            : "INSERT INTO exercise_logs (id, date, duration_minutes, type, note, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        );
        for (const item of payload.exercise_logs || []) {
          await insertExercise.bind(
            item.id,
            item.date,
            item.duration_minutes,
            item.type ?? null,
            item.note ?? null,
            item.created_at || now
          ).run();
        }

        const insertDiet = env.DB.prepare(
          isMerge
            ? "INSERT INTO diet_logs (id, date, meal, calories, note, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET date=excluded.date, meal=excluded.meal, calories=excluded.calories, note=excluded.note, created_at=excluded.created_at"
            : "INSERT INTO diet_logs (id, date, meal, calories, note, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        );
        for (const item of payload.diet_logs || []) {
          await insertDiet.bind(
            item.id,
            item.date,
            item.meal,
            item.calories,
            item.note ?? null,
            item.created_at || now
          ).run();
        }

        const insertSettings = env.DB.prepare(
          "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
        );
        for (const item of payload.settings || []) {
          await insertSettings.bind(item.key, item.value).run();
        }

        return json({ ok: true }, 200, cors);
      }

      return json({ error: "Not Found" }, 404, cors);
    } catch (err) {
      return json({ error: "Server Error", detail: String(err) }, 500, cors);
    }
  },
};
