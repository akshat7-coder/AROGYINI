# AROGYINI — Backend

REST API for AROGYINI, a women's empowerment and safety platform for India. Four pillars:
**Health** (period and cycle tracker), **Legal** (rights plus generated complaint drafts),
**Career** (jobs, returnships, scholarships), **Safety** (SOS SMS to emergency contacts). An AI chat
assistant routes messages to two external RAG bots or a general LLM, and admins manage users,
content, SOS events and chatbot issues.

Node.js 22+ (ESM) · Express 5 · MongoDB + Mongoose · zod · JWT · Twilio · Jest + Supertest

---

## Setup

```bash
cd backend
npm install
cp .env.example .env        # then edit JWT_SECRET at minimum
npm run seed                # admin user + legal rights + jobs + scholarships + bot configs
npm run dev                 # http://localhost:3000
```

You need MongoDB reachable at `MONGODB_URI` — a local `mongod`, or a MongoDB Atlas connection
string. `npm test` needs neither: it starts an in-memory MongoDB per run.

Check it is up:

```bash
curl http://localhost:3000/api/health
# {"success":true,"data":{"status":"ok","uptime":1.2,"timestamp":"...","db":"connected"}}
```

`db` reflects the live Mongoose connection state, so it reports `disconnected` rather than
always claiming `ok`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | `node --watch src/index.js` — restarts on save |
| `npm start` | Production start |
| `npm test` | Full suite against an in-memory MongoDB |
| `npm run test:coverage` | Same, with a coverage report and enforced thresholds |
| `npm run seed` | Idempotent seed — safe to run repeatedly |

## Environment variables

| Variable | Default | Notes |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `PORT` | `3000` | |
| `MONGODB_URI` | — | **Required.** Local or Atlas |
| `JWT_SECRET` | — | **Required**, minimum 16 characters |
| `JWT_EXPIRES_IN` | `1d` | Any `jsonwebtoken` duration |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin |
| `ADMIN_EMAIL` | `admin@arogyini.in` | Seeded admin |
| `ADMIN_PASSWORD` | `Admin@12345` | **Change before deploying** |
| `SMS_PROVIDER` | `console` | `twilio` \| `console` \| `memory` |
| `TWILIO_ACCOUNT_SID` | empty | Required when `SMS_PROVIDER=twilio` |
| `TWILIO_AUTH_TOKEN` | empty | Required when `SMS_PROVIDER=twilio` |
| `TWILIO_PHONE_NUMBER` | empty | Required when `SMS_PROVIDER=twilio`, E.164 |
| `MEDICAL_BOT_URL` | `http://localhost:5000` | RAG bot exposing `POST /ask` |
| `LEGAL_BOT_URL` | `http://localhost:8002` | RAG bot exposing `POST /ask` |
| `LLM_API_URL` | `https://api.groq.com/openai/v1` | Any OpenAI-compatible base URL |
| `LLM_API_KEY` | empty | Empty means the built-in fallback answer is used |
| `LLM_MODEL` | `llama-3.1-8b-instant` | |
| `BOT_TIMEOUT_MS` | `30000` | Default per-bot timeout |

`src/config/env.js` validates all of this with zod at import time, so a bad configuration fails
before the server listens rather than at the first request. Blank values fall through to the
defaults above. Two rules are enforced beyond type checks:

- `JWT_SECRET` must be at least 16 characters.
- `SMS_PROVIDER=twilio` requires all three `TWILIO_*` values. A safety feature silently not
  sending is worse than not booting.

## Response format

Every endpoint returns the same envelope.

```json
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 20, "total": 42 } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

`meta` appears only on paginated list endpoints. Status codes: `200`, `201`, `204`,
`400` validation, `401` unauthenticated, `403` forbidden or deactivated, `404` not found or not
yours, `409` conflict, `413` body too large, `429` rate limited, `502` upstream bot failure.

Ownership is expressed as `404`, not `403`: asking for another user's record tells you nothing
about whether it exists.

## Auth and roles

- Roles are `user` and `admin`. **Signup always creates `user`** — the role is never read from the
  request body, and zod strips it before the service sees it.
- The first admin comes from `npm run seed` using `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- `Authorization: Bearer <token>`, payload `{ sub, role }`, expiry `JWT_EXPIRES_IN`.
- bcrypt with 12 salt rounds. Sign-in errors are deliberately generic: "Invalid email or password".
- `authenticate` loads the user from the database on **every** request, so deactivating an account
  takes effect immediately rather than when the token expires. `isActive: false` gives `403`.
- An admin cannot change their own role or status (`400 SELF_MODIFICATION_FORBIDDEN`).

### Rate limits

All disabled under `NODE_ENV=test`.

| Routes | Limit | Keyed on |
| --- | --- | --- |
| `POST /api/auth/signup`, `POST /api/auth/signin` | 10 / 15 min | IP |
| `POST /api/sos` | 5 / 10 min | **user id** |
| `POST /api/chat/conversations/:id/messages` | 20 / min | **user id** |

SOS and chat are keyed on the user, not the IP, so one person on a shared college or hostel
network cannot exhaust the limit for everyone else.

---

## Endpoints

64 routes. **Auth**: `—` public, `user` any signed-in user, `admin` role `admin`.

### Health

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/health` | — |

### Auth

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | — | Rate limited. Always creates `user` |
| POST | `/api/auth/signin` | — | Rate limited. Returns `{ user, token }` |
| GET | `/api/auth/me` | user | |
| PATCH | `/api/auth/me` | user | `name`, `phone`, `bloodGroup`, `city` only |
| PATCH | `/api/auth/password` | user | Requires `currentPassword` |

### Emergency contacts

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/contacts` | user | Own only, ordered by priority |
| POST | `/api/contacts` | user | Max 5 per user → `409 CONTACT_LIMIT_REACHED` |
| PATCH | `/api/contacts/:id` | user | Own only |
| DELETE | `/api/contacts/:id` | user | Own only |

Phone numbers are normalised to E.164 on the way in: `98765 43210`, `098765-43210`,
`+91 98765 43210` and `00919876543210` all store as `+919876543210`. The default country code
is `+91`.

### Cycle tracker

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/cycles/summary` | user | `hasData: false` with defaults when empty |
| GET | `/api/cycles` | user | Paginated, newest first |
| POST | `/api/cycles` | user | `400` future start, `409 CYCLE_OVERLAP` |
| PATCH | `/api/cycles/:id` | user | Own only; re-checks range and overlap |
| DELETE | `/api/cycles/:id` | user | Own only |

The summary averages the **last 6 cycles** (default 28, clamped 21–45), averages period length
(default 5), then derives the next period, ovulation (next period − 14), the fertile window
(ovulation −5 to +1), the current cycle day and phase, plus an `irregular` flag when cycle
lengths vary by more than 7 days. All dates are handled as UTC days. The maths is pure and takes
`today` as a parameter, so it is tested against fixed dates with no clock dependency.

### Safety and SOS

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/safety/helplines` | — | Static India helplines |
| POST | `/api/sos` | user | Rate limited. `400 NO_CONTACTS` with none saved |
| GET | `/api/sos` | user | Own history, paginated |
| GET | `/api/sos/:id` | user | Own only |
| PATCH | `/api/sos/:id/resolve` | user | `?notify=true` texts contacts "safe now" |
| PATCH | `/api/sos/:id/cancel` | user | |

`POST /api/sos` takes `{ latitude, longitude, accuracy?, message? }`, builds a
`https://maps.google.com/?q=lat,lng` link, and sends one SMS per contact via `Promise.allSettled`
so one bad number cannot stop the rest. Each contact's outcome is stored on the event as `sent`
or `failed` with the provider SID or the error.

Only **one active SOS per user**: a second trigger returns the existing event with
`alreadyActive: true` and `200` instead of creating a duplicate. `active` → `resolved` |
`cancelled`; resolving or cancelling an already-closed event is `404`.

Message sent to each contact:

```
EMERGENCY: <name> needs help. Live location: <mapsUrl> Time: <IST time>. Call 112.
```

### Legal

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/legal/rights` | — | `category`, `search`, paginated. Published only |
| GET | `/api/legal/rights/:slug` | — | `404` if unpublished |
| POST | `/api/legal/drafts` | user | Returns `{ type, title, text }` |

Eight seeded rights: POSH Act 2013, PWDVA 2005, Dowry Prohibition Act 1961, Maternity Benefit Act,
IT Act cyber safety, Indecent Representation of Women Act 1986, Commission of Sati (Prevention)
Act 1987, and Zero FIR. Categories: `workplace`, `domestic`, `marriage`, `cyber`, `criminal`,
`media`. Section numbers cite **both** the IPC/CrPC and the BNS/BNSS that replaced them on
1 July 2024, because both are still quoted in practice.

Draft types are `posh`, `zero_fir`, `pwdva` and `dowry`, each validated by its own schema through
a zod discriminated union on `type`, and each formatted as a real Indian complaint letter with an
IST date. Every draft ends with a disclaimer that it is not legal advice and points at NALSA on
15100.

> The legal content is informational, not legal advice.

### Career

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/career/jobs` | — | `type`, `category`, `search`, `careerBreakFriendly`, paginated |
| GET | `/api/career/jobs/:id` | — | Active only |
| POST | `/api/career/jobs/:id/save` | user | Toggle → `{ saved: true\|false }` |
| GET | `/api/career/saved` | user | |
| POST | `/api/career/jobs/:id/apply` | user | `409 ALREADY_APPLIED` on a repeat |
| GET | `/api/career/applications` | user | Own only, `status` filter, job populated |
| GET | `/api/career/scholarships` | — | Upcoming deadlines first, `?includeExpired=true` |

Job types: `full-time`, `part-time`, `remote`, `returnship`, `internship`. Inactive jobs are
hidden from the list, the detail route, save **and** apply — all four go through one guard, so
deactivating a job cannot be bypassed by posting straight to `/apply`.

Scholarships with no `deadline` are rolling schemes (for example Stand-Up India) and always
appear. `includeExpired=true` appends expired ones after the upcoming ones.

> The seeded **jobs are illustrative demo rows, not live vacancies.** The two returnships are
> modelled on real public programmes but the roles are invented. Replace them through
> `POST /api/admin/jobs` before real users see them. The seeded **scholarships are real schemes**,
> but every amount is marked approximate and the deadlines are indicative — verify on the
> official portal.

### Chat

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/chat/bots` | user | Enabled bots, for the picker |
| POST | `/api/chat/conversations` | user | |
| GET | `/api/chat/conversations` | user | Own only, newest activity first |
| GET | `/api/chat/conversations/:id` | user | Own only, with messages |
| DELETE | `/api/chat/conversations/:id` | user | Own only; deletes messages and issues too |
| POST | `/api/chat/conversations/:id/messages` | user | Rate limited. `{ content, bot? }` |
| POST | `/api/chat/messages/:id/report` | user | Assistant messages in own conversations only |

### Admin

All under `/api/admin/*` and behind `authorize("admin")` — a normal user gets `403`.

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/admin/stats` | admin |
| GET | `/api/admin/users` | admin |
| PATCH | `/api/admin/users/:id/role` | admin |
| PATCH | `/api/admin/users/:id/status` | admin |
| GET | `/api/admin/sos` | admin |
| PATCH | `/api/admin/sos/:id/resolve` | admin |
| GET | `/api/admin/legal` | admin |
| POST | `/api/admin/legal` | admin |
| PATCH | `/api/admin/legal/:id` | admin |
| DELETE | `/api/admin/legal/:id` | admin |
| GET | `/api/admin/jobs` | admin |
| POST | `/api/admin/jobs` | admin |
| PATCH | `/api/admin/jobs/:id` | admin |
| DELETE | `/api/admin/jobs/:id` | admin |
| GET | `/api/admin/jobs/:id/applications` | admin |
| PATCH | `/api/admin/applications/:id` | admin |
| GET | `/api/admin/scholarships` | admin |
| POST | `/api/admin/scholarships` | admin |
| PATCH | `/api/admin/scholarships/:id` | admin |
| DELETE | `/api/admin/scholarships/:id` | admin |
| GET | `/api/admin/chat/issues` | admin |
| PATCH | `/api/admin/chat/issues/:id` | admin |
| POST | `/api/admin/chat/issues/:id/retry` | admin |
| GET | `/api/admin/chat/bots` | admin |
| PATCH | `/api/admin/chat/bots/:key` | admin |
| POST | `/api/admin/chat/bots/:key/test` | admin |

`GET /api/admin/stats` returns `users`, `activeUsers`, `admins`, `activeSos`, `jobs`,
`activeJobs`, `applications`, `scholarships` and `openIssues`.

Admin listings include inactive and unpublished rows; the public ones never do. `GET
/api/admin/legal` additionally takes `isPublished=true|false`, which is how an unpublished right
is found again.
`DELETE /api/admin/jobs/:id` also deletes that job's applications, so no applicant is left with a
dangling record.

---

## How chat routing works

```
POST /api/chat/conversations/:id/messages { content, bot? }
```

1. **Sanitise and validate.** Strip HTML tags and control characters, collapse whitespace, then
   require 1–2000 characters. A tag-only message such as `<br>` is a `400`. Content is echoed to
   the browser and forwarded to third-party bots, so it is cleaned at the boundary.
2. **Save the user message**, then **detect intent**: `intentService.detect(content)` returns
   `{ intent, emergency }` from keyword lists covering English and commonly typed Roman-script
   Hindi. Intents are `health`, `legal`, `career`, `safety`, `general`. The emergency list is
   separate (`bachao`, `madad`, `help me`, `being followed`, `attacked`, …) and is acted on
   whichever intent wins. The conversation is titled from the first message, capped at 60 chars.
3. **Pick a bot.** An explicit `bot` of `medical`, `legal` or `general` overrides routing.
   `auto` (the default) maps `health` → medical, `legal` → legal, and everything else → general.
4. **Load its `BotConfig`.** The database overrides the env, so an admin edit always wins over
   the deployed configuration. A disabled bot falls back to `general`.
5. **Call the provider** with axios and `{ timeout: timeoutMs }`:
   - **medical / legal** → `POST {url}/ask` with `{ "question": "..." }`, expecting `{ "answer": "..." }`
   - **general** → OpenAI-compatible `POST {LLM_API_URL}/chat/completions` with the AROGYINI
     system prompt plus the last 10 messages. **If `LLM_API_KEY` is empty**, no call is made and a
     built-in per-intent fallback answer is returned with `bot: "fallback"`, pointing at the right
     app section and the relevant helplines. That is expected behaviour, not a failure.
6. **If `emergency`**, a short safety notice (112, 181, 1091) is **prepended** to the answer,
   never substituted for it, and `emergency: true` is set so the UI can show an SOS button.
7. **On failure or timeout**, the assistant message is saved with `status: "failed"` and a
   friendly apology that still carries the emergency numbers, a `ChatIssue` is created
   (`provider_error` or `timeout`), and the response is still `201`. **The chat never crashes on a
   bot being down.** Failed exchanges are excluded from the history sent to the LLM, so the
   apology text is never fed back as context.

Users can report any assistant message, creating a `ChatIssue` of type `user_report`. Admins
filter issues by status and type, set `open` / `in_progress` / `resolved` with a note, and
**retry** a failed message — which re-calls the provider, replaces the message content in place
(no duplicate), and resolves the issue. A retry that fails again returns `502 RETRY_FAILED` and
leaves the issue open.

Admins can also enable or disable each bot, change its URL and timeout, and send a test `ping`
that returns `ok` and `latencyMs`. `npm run seed` creates bot configs with `$setOnInsert` only,
so re-seeding never overwrites an admin's changes.

### The two RAG bots

Both only need `POST /ask` taking `{"question": "..."}` and returning `{"answer": "..."}`.

```python
# medical bot — Flask on 5000
from flask import Flask, request, jsonify
app = Flask(__name__)

@app.post("/ask")
def ask():
    question = (request.get_json(silent=True) or {}).get("question", "").strip()
    if not question:
        return jsonify({"error": "question is required"}), 400
    return jsonify({"answer": f"[medical] {question}"})   # replace with your RAG pipeline

if __name__ == "__main__":
    app.run(port=5000)
```

```python
# legal bot — FastAPI on 8002, run with: uvicorn main:app --port 8002
from fastapi import FastAPI
from pydantic import BaseModel
app = FastAPI()

class Query(BaseModel):
    question: str

@app.post("/ask")
def ask(query: Query):
    return {"answer": f"[legal] {query.question}"}        # replace with your RAG pipeline
```

A response missing the `answer` field is treated as a provider error, not a silent empty reply.

---

## SMS and Twilio

`SMS_PROVIDER` selects the provider in `src/services/sms/`:

- **`console`** (default) — logs each message to the server terminal. Best for development.
- **`memory`** — stores messages in an array for tests (`getSentMessages()`,
  `clearSentMessages()`). Also recognises the Twilio-style magic number `+15005550001`, which
  always fails, so the per-contact failure path is testable.
- **`twilio`** — sends for real.

### Switching to Twilio

```ini
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15551234567
```

1. Create a Twilio account and copy the **Account SID** and **Auth Token** from the console.
2. Get a phone number with SMS capability (Phone Numbers → Buy a number).
3. Put all three values in `.env` and restart. **All three are required** — with any of them blank
   the server refuses to start.
4. Trigger an SOS and check the event's `notifications` array, then cross-check the `providerSid`
   values against Twilio's Messaging log.
   The backend terminal logs each Twilio submission attempt, acceptance (SID and status), or
   failure (Twilio error code and message); recipient numbers are masked.

On a **trial account** three things will bite:

- **Every recipient must be verified** in the console (Phone Numbers → Verified Caller IDs). An
  unverified number fails with Twilio error `21608`. Because SOS uses `Promise.allSettled`, that
  one contact is recorded as `failed` while the verified ones still send — so check the
  `notifications` array, not just the HTTP status.
- Every message is prefixed with "Sent from your Twilio trial account".
- **India delivery needs DLT registration** under TRAI rules. A trial US long code to `+91`
  numbers often fails with `21612` / `30008` even when verified. For anything real you need a
  DLT-registered sender ID.

A `sent` status means Twilio *accepted* the message, not that it was delivered. There is no
delivery-status webhook yet.

---

## Project layout

```
src/
  index.js            entry: calls startServer()
  server.js           connects MongoDB, listens, graceful shutdown on SIGINT/SIGTERM
  app.js              builds the Express app (no listen, no DB) — what the tests import
  config/             env.js (zod-validated config), db.js
  models/             one Mongoose model per file; toJSON.js holds the shared transform
  routes/             one router per module, mounted in routes/index.js under /api
  controllers/        thin: read req, call a service, send a response
  services/           all business logic (auth, sos, cycle, legal, career, chat, sms, drafts)
  middleware/         authenticate, authorize, validate, errorHandler, notFound, rateLimiters
  validators/         zod schemas per module
  utils/              AppError, apiResponse, pagination, phone, dates, sanitise
  seed/               seed.js + data/*.js
tests/                one file per module, plus unit tests for the pure logic
requests.http         every endpoint, in order, for the VS Code REST Client
```

Conventions: ESM with `.js` extensions, `async/await` only, named exports except routers and
models. Express 5 forwards rejected promises to the error handler, so there is no `asyncHandler`
wrapper. Throw `new AppError(status, code, message)` and let `errorHandler` format it — it also
maps zod errors, Mongoose `CastError` and `ValidationError`, duplicate-key `11000`, JWT errors
and body-parser failures. `passwordHash` is `select: false` and stripped by the shared `toJSON`.

## Testing

```bash
npm test
npm run test:coverage
```

`mongodb-memory-server` provides the database (the first run downloads a `mongod` binary, so
expect ~35s once, then a few seconds). Tests import `app` from `src/app.js` and never start the
real server or touch the real database. Collections are cleared between tests.

Two things worth knowing if you add tests:

- Under Jest ESM, `jest` is **not** a global — `import { jest } from "@jest/globals"`.
- Outbound HTTP is mocked by swapping `axios.defaults.adapter`, not the module, since ESM
  namespaces are frozen. Save it, replace it with a `jest.fn()`, restore it in `afterEach`. A stub
  adapter bypasses axios's own `timeout`, so simulate a timeout by throwing
  `new axios.AxiosError(msg, "ECONNABORTED")` rather than hanging the adapter.

Coverage thresholds are enforced in `jest.config.js`: services at 80% across the board, global at
85% statements / 75% branches. `twilioProvider.js` is excluded because it constructs a live Twilio
client at import and so cannot be loaded without real credentials.
