#!/usr/bin/env node
// End-to-end smoke test against a RUNNING stack. No dependencies, just fetch.
//   node scripts/smoke.mjs                 (defaults to http://localhost:3000/api)
//   API=http://host:3000/api node scripts/smoke.mjs
// Exits non-zero if any step fails.

const API = (process.env.API || "http://localhost:3000/api").replace(/\/+$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@arogyini.in";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@12345";
const STAMP = Date.now();

const results = [];
let token = null;

const record = (name, pass, note = "") => {
  results.push({ name, pass, note });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${name}${note ? ` — ${note}` : ""}`);
  return pass;
};

class StepError extends Error {}

async function call(method, path, { body, auth = true, raw = false } = {}) {
  const started = Date.now();
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const latencyMs = Date.now() - started;
  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new StepError(`${method} ${path} returned non-JSON (${res.status}): ${text.slice(0, 120)}`);
  }

  if (raw) return { res, payload, latencyMs };
  if (!res.ok || payload?.success !== true) {
    const err = payload?.error;
    // authLimiter allows 10 auth calls per 15 minutes and each run spends two, so repeated
    // runs hit it. Say so plainly instead of looking like a broken account.
    if (res.status === 429) {
      throw new StepError(
        `${method} ${path} -> 429 rate limited. This is the API protecting itself, not a defect; ` +
          `wait 15 minutes or restart the backend to clear the in-memory counter.`
      );
    }
    throw new StepError(`${method} ${path} -> ${res.status} ${err?.code ?? ""} ${err?.message ?? text.slice(0, 120)}`);
  }
  return { data: payload.data, meta: payload.meta, latencyMs };
}

// Runs one named step; a thrown StepError becomes a FAIL row instead of stopping the run.
async function step(name, fn) {
  try {
    const note = await fn();
    return { ok: record(name, true, note ?? ""), value: undefined };
  } catch (err) {
    record(name, false, err.message);
    return { ok: false };
  }
}

async function main() {
  console.log(`AROGYINI smoke test against ${API}\n`);

  // --- reachability -------------------------------------------------------
  let reachable = false;
  await step("API /health reachable", async () => {
    const { data } = await call("GET", "/health", { auth: false });
    reachable = true;
    if (data.db !== "connected") throw new StepError(`MongoDB is ${data.db}`);
    return `db ${data.db}`;
  });
  if (!reachable) {
    console.log("\nThe API is not reachable, so nothing else can be checked.");
    return summarise();
  }

  // --- auth ---------------------------------------------------------------
  const email = `smoke+${STAMP}@arogyini.test`;
  let userId = null;
  await step("sign up a throwaway user", async () => {
    const { data } = await call("POST", "/auth/signup", {
      auth: false,
      body: { name: "Smoke Tester", email, password: "Smoke@12345", city: "Pune" },
    });
    token = data.token;
    userId = data.user.id;
    if (!token) throw new StepError("no token returned");
    if (data.user.role !== "user") throw new StepError(`signup gave role ${data.user.role}`);
    return email;
  });
  if (!token) {
    console.log("\nSign-up failed, so the authenticated steps cannot run.");
    return summarise();
  }

  await step("GET /auth/me returns that user", async () => {
    const { data } = await call("GET", "/auth/me");
    if (data.user.id !== userId) throw new StepError("different user returned");
    return data.user.name;
  });

  // --- safety: contact + SOS ---------------------------------------------
  await step("add an emergency contact", async () => {
    const { data } = await call("POST", "/contacts", {
      body: { name: "Smoke Contact", phone: "+919876500000", relation: "friend", priority: 1 },
    });
    return `${data.contact.name} ${data.contact.phone}`;
  });

  let sosId = null;
  await step("trigger an SOS", async () => {
    const { data } = await call("POST", "/sos", {
      body: { latitude: 18.5204, longitude: 73.8567, accuracy: 25, message: "smoke test, please ignore" },
    });
    sosId = data.event.id;
    const sent = (data.event.notifications ?? []).filter((n) => n.status === "sent").length;
    if (data.event.status !== "active") throw new StepError(`status is ${data.event.status}`);
    return `${sent}/${(data.event.notifications ?? []).length} SMS sent, maps link ${data.event.mapsUrl ? "yes" : "no"}`;
  });

  if (sosId) {
    await step("resolve that SOS", async () => {
      const { data } = await call("PATCH", `/sos/${sosId}/resolve`);
      if (data.event.status !== "resolved") throw new StepError(`status is ${data.event.status}`);
      return "resolved";
    });
  }

  // --- health: cycle log + summary ---------------------------------------
  const startDate = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);
  await step("log a cycle", async () => {
    const { data } = await call("POST", "/cycles", {
      body: { startDate, flow: "medium", symptoms: ["cramps"], mood: "tired", notes: "smoke test" },
    });
    return `start ${data.log.startDate?.slice(0, 10) ?? startDate}`;
  });

  await step("read the cycle summary", async () => {
    const { data } = await call("GET", "/cycles/summary");
    if (typeof data.averageCycleLength !== "number") throw new StepError("no averageCycleLength");
    if (!data.phase) throw new StepError("no phase in the summary");
    if (!data.nextPeriodDate) throw new StepError("no nextPeriodDate in the summary");
    return `avg ${data.averageCycleLength}d, day ${data.currentCycleDay}, ${data.phase}, next ${String(
      data.nextPeriodDate
    ).slice(0, 10)}`;
  });

  // --- legal: POSH draft --------------------------------------------------
  await step("generate a POSH complaint draft", async () => {
    const { data } = await call("POST", "/legal/drafts", {
      body: {
        type: "posh",
        complainantName: "Smoke Tester",
        employerName: "Example Pvt Ltd",
        respondentName: "A Colleague",
        incidentDate: "2026-09-01",
        incidentPlace: "Office, 3rd floor",
        incidentDescription: "Repeated unwelcome remarks during team meetings, described here for the smoke test.",
      },
    });
    // The Legal page reads draft.title and draft.text, so assert exactly those.
    if (typeof data.text !== "string" || data.text.length < 100) throw new StepError("draft text looks empty");
    if (!data.title) throw new StepError("draft has no title");
    if (!data.text.includes("Smoke Tester")) throw new StepError("the draft does not include the complainant");
    return `"${data.title}", ${data.text.length} chars`;
  });

  // --- career: save + apply ----------------------------------------------
  let jobId = null;
  await step("find a seeded job", async () => {
    const { data, meta } = await call("GET", "/career/jobs?limit=1", { auth: false });
    jobId = data?.[0]?.id;
    if (!jobId) throw new StepError("no jobs found — run `npm run seed`");
    return `${data[0].title} (${meta?.total ?? "?"} total)`;
  });

  if (jobId) {
    await step("save the job", async () => {
      const { data } = await call("POST", `/career/jobs/${jobId}/save`);
      if (data.saved !== true) throw new StepError(`saved is ${data.saved}`);
      return "saved";
    });

    await step("apply to the job", async () => {
      const { data } = await call("POST", `/career/jobs/${jobId}/apply`, {
        body: { coverNote: "Smoke test application, please ignore." },
      });
      if (!data.application?.id) throw new StepError("no application returned");
      return `status ${data.application.status}`;
    });

    await step("a second apply is rejected with 409", async () => {
      const { res, payload } = await call("POST", `/career/jobs/${jobId}/apply`, { body: {}, raw: true });
      if (res.status !== 409) throw new StepError(`expected 409, got ${res.status}`);
      return payload?.error?.code ?? "conflict";
    });
  }

  // --- chat ---------------------------------------------------------------
  let conversationId = null;
  await step("create a conversation", async () => {
    const { data } = await call("POST", "/chat/conversations", { body: {} });
    conversationId = data.conversation.id;
    return conversationId;
  });

  const asked = [];
  if (conversationId) {
    const questions = [
      ["health question", "my period is late and I have bad cramps, what should I do"],
      ["legal question", "what counts as sexual harassment at work and how do I complain"],
      ["emergency question", "bachao someone is following me right now I am scared"],
    ];

    for (const [label, content] of questions) {
      await step(label, async () => {
        const { data, latencyMs } = await call("POST", `/chat/conversations/${conversationId}/messages`, {
          body: { content },
        });
        const msg = data.message;
        asked.push(msg);
        const head = msg.content.replace(/\s+/g, " ").slice(0, 120);
        const sources = msg.sources?.length ? `, ${msg.sources.length} source(s)` : "";
        const emergency = msg.emergency ? ", emergency" : "";
        console.log(`        bot=${msg.bot} status=${msg.status} ${latencyMs}ms${emergency}${sources}`);
        console.log(`        "${head}${msg.content.length > 120 ? "…" : ""}"`);
        if (!msg.content) throw new StepError("empty answer");
        return `${msg.bot}/${msg.status} in ${latencyMs}ms`;
      });
    }

    await step("the emergency answer carries the safety notice", async () => {
      const emergency = asked.find((m) => m.emergency);
      if (!emergency) throw new StepError("no answer was flagged emergency");
      if (!emergency.content.includes("112")) throw new StepError("the 112 notice is missing");
      return "112 notice present";
    });
  }

  // --- report + admin -----------------------------------------------------
  let reportedMessageId = null;
  if (asked.length > 0) {
    await step("report an assistant answer", async () => {
      reportedMessageId = asked[0].id;
      const { data } = await call("POST", `/chat/messages/${reportedMessageId}/report`, {
        body: { reason: `Smoke test report ${STAMP}` },
      });
      if (data.issue.type !== "user_report") throw new StepError(`type is ${data.issue.type}`);
      return data.issue.id;
    });
  }

  const userToken = token;
  let adminOk = false;
  await step("sign in as the seeded admin", async () => {
    token = null;
    const { data } = await call("POST", "/auth/signin", {
      auth: false,
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    token = data.token;
    if (data.user.role !== "admin") throw new StepError(`${ADMIN_EMAIL} has role ${data.user.role}`);
    adminOk = true;
    return ADMIN_EMAIL;
  });
  if (!adminOk) token = userToken;

  if (adminOk && reportedMessageId) {
    await step("the report appears in /api/admin/chat/issues", async () => {
      const { data } = await call("GET", "/admin/chat/issues?type=user_report&limit=100");
      const found = data.find((issue) => (issue.message?.id ?? issue.message) === reportedMessageId);
      if (!found) throw new StepError(`report for message ${reportedMessageId} not listed`);
      if (!found.reason?.includes(String(STAMP))) throw new StepError("the reason does not match this run");
      return `issue ${found.id}, status ${found.status}`;
    });
  }

  if (adminOk) {
    await step("the SOS event appears in /api/admin/sos", async () => {
      const { data } = await call("GET", "/admin/sos?limit=100");
      if (!data.some((event) => event.id === sosId)) throw new StepError("this run's SOS is not listed");
      return `${data.length} event(s) listed`;
    });
  }

  return summarise();
}

function summarise() {
  const failed = results.filter((row) => !row.pass);
  const width = Math.max(28, ...results.map((row) => row.name.length));

  console.log(`\n${"".padEnd(width + 8, "-")}`);
  for (const row of results) console.log(`${row.pass ? "PASS" : "FAIL"}  ${row.name.padEnd(width)}`);
  console.log(`${"".padEnd(width + 8, "-")}`);
  console.log(`${results.length - failed.length}/${results.length} passed`);

  if (failed.length > 0) {
    console.log("\nFailures:");
    for (const row of failed) console.log(`  - ${row.name}: ${row.note}`);
  }
  return failed.length === 0 ? 0 : 1;
}

// Set exitCode rather than calling process.exit(): exiting while fetch's sockets are still
// closing aborts libuv on Windows ("UV_HANDLE_CLOSING") and loses the real exit code.
main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err) => {
    console.error(`\nSmoke test crashed: ${err?.stack ?? err}`);
    process.exitCode = 1;
  });
