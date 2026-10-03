# AROGYINI — Project Guide for Claude Code

AROGYINI is a women's empowerment and safety platform for India with four pillars:
**Health** (period tracker), **Legal** (rights + complaint drafts), **Career** (jobs, scholarships),
**Safety** (SOS SMS to 5 contacts via Twilio, siren, fake call). An AI chat assistant routes
messages to two external RAG bots (medical, legal) or a general LLM. Admins manage users,
content, SOS events and chatbot issues.

Work **one phase at a time** (see PROMPTS.md). Never start the next phase unless asked.

---

## Stack (always install with `@latest`, check docs for breaking changes)

**Backend** (`backend/`): Node.js 22+ (ESM, `"type": "module"`), Express 5, MongoDB + Mongoose,
jsonwebtoken, bcrypt, zod (validation), helmet, cors, morgan, express-rate-limit, dotenv, twilio,
axios (all outbound HTTP: RAG bots, LLM).
**Tests**: Jest + Supertest + mongodb-memory-server.
**Frontend** (`frontend/`): React 19 + Vite, Tailwind CSS v4 (`@tailwindcss/vite`, configured in CSS
with `@theme`, no tailwind.config.js), React Router (package `react-router`), lucide-react,
axios (all API calls).

## Commands

```bash
# backend
cd backend
npm run dev        # node --watch src/index.js
npm start          # node src/index.js
npm test           # node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand
npm run seed       # seeds admin user + legal rights + jobs + scholarships + bot configs

# frontend
cd frontend
npm run dev        # http://localhost:5173 (proxies /api -> http://localhost:3000)
npm run build
```

## Backend structure

```
backend/
  src/
    index.js            # entry: imports startServer() from server.js and calls it
    server.js           # startServer(): connects MongoDB, then app.listen(PORT)
    app.js              # builds and exports the Express app (no listen, no DB) — used by tests
    config/             # env.js (validated env with zod), db.js (connect/disconnect)
    models/             # Mongoose models, one per file, PascalCase
    routes/             # one router per module, mounted in routes/index.js under /api
    controllers/        # thin: read req, call service, send response
    services/           # business logic (auth, sos, sms, cycle, chat, llm, drafts...)
    middleware/         # authenticate, authorize, validate, errorHandler, notFound, rateLimiters
    validators/         # zod schemas per module
    utils/              # AppError, apiResponse, pagination, phone helpers
    seed/               # seed.js + data/*.js
  tests/
    setup.js            # starts mongodb-memory-server, clears collections between tests
    helpers.js          # createUser(), createAdmin(), authHeader(token)
    *.test.js           # one file per module
```

## Conventions

- **Comments**: only where logic is not obvious, **max 2 lines** per comment. No banner comments,
  no commented-out code, no JSDoc on obvious functions.
- ESM imports with `.js` extensions. `async/await` only. Named exports except routers/models.
- Express 5 forwards rejected promises to the error handler — **no asyncHandler wrapper**.
- Throw `new AppError(statusCode, code, message)`; `errorHandler` formats everything.
- Every request body/query/params is validated with zod via `validate(schema)` middleware.
- Never return `passwordHash`; schema uses `select: false` and `toJSON` transform removes it
  plus `__v`, and maps `_id` → `id`.
- Controllers never touch Mongoose directly beyond trivial reads; logic lives in services.
- Keep files small and focused (< ~150 lines). Clear names over clever code.

### Response format (every endpoint)

```json
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 42 } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```
Status codes: 200, 201, 204, 400 validation, 401 unauthenticated, 403 forbidden/inactive,
404, 409 conflict (duplicate email, contact limit), 429 rate limit, 502 upstream bot failure.

## Auth & RBAC

- Roles: `user`, `admin`. Signup **always** creates `user`; the role is never read from the body.
- First admin comes from `npm run seed` using `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- JWT in `Authorization: Bearer <token>`, payload `{ sub: userId, role }`, expiry `JWT_EXPIRES_IN`.
- bcrypt with 12 salt rounds. Signin errors are generic ("Invalid email or password").
- `authenticate` loads the user from DB on every request; `isActive: false` → 403.
- `authorize(...roles)` checks `req.user.role`. All `/api/admin/*` routes use `authorize('admin')`.
- An admin cannot demote or deactivate themselves.

## Domain rules

**Emergency contacts**: max **5** per user (409 when exceeded). Phone must be E.164 (`+919876543210`).
**SOS**: `POST /api/sos` with `{ latitude, longitude, accuracy?, message? }`. Sends one SMS to every
contact with Google Maps link `https://maps.google.com/?q=lat,lng`, using `Promise.allSettled`.
Stores per-contact status (`sent` / `failed`, provider SID, error). Only one `active` SOS per user;
a second trigger returns the existing active event. Status: `active` → `resolved` | `cancelled`.
**SMS provider** (`services/sms/`): `SMS_PROVIDER=twilio | console | memory`.
`console` logs messages (default in dev when Twilio keys are missing), `memory` stores them in an
array for tests (`getSentMessages()`, `clearSentMessages()`). Twilio uses `TWILIO_*` env vars.
**Cycle tracker**: logs `{ startDate, endDate?, flow, symptoms[], mood?, notes? }`. Summary computes
average cycle length from the last 6 cycles (default 28, clamp 21–45), average period length
(default 5), next period date, ovulation (next period − 14 days), fertile window (ovulation −5 to +1),
current cycle day and phase (menstrual / follicular / ovulation / luteal), and an `irregular` flag
when cycle lengths vary by more than 7 days. Dates handled in UTC days.
**Legal**: seeded rights (POSH 2013, PWDVA 2005, Dowry Prohibition 1961, Maternity Benefit 2017,
IT Act cyber safety, Indecent Representation 1986, Commission of Sati Prevention 1987, Zero FIR).
`POST /api/legal/drafts` with `type: posh | zero_fir | pwdva | dowry` returns a formatted complaint text.
**Career**: jobs (types: full-time, part-time, remote, returnship, internship), scholarships,
save/unsave toggle (`User.savedJobs`), apply once per job (409 on duplicate).

## Chatbot

Flow: `POST /api/chat/conversations/:id/messages { content, bot? }`
1. Validate (1–2000 chars, trimmed). Save user message.
2. `intentService.detect(content)` → `{ intent: health|legal|career|safety|general, emergency: bool }`
   using keyword lists (English + common Hindi words). Explicit `bot` (`medical|legal|general`)
   overrides routing; `auto` (default) maps health→medical, legal→legal, everything else→general.
3. Load `BotConfig` for that key (DB overrides env). Disabled bot → fall back to `general`.
4. Call provider with axios, passing `{ timeout: timeoutMs }` (axios enforces it in the adapter):
   - **medical / legal** (external RAG bots): `POST {url}/ask` body `{ "question": "..." }` → `{ "answer": "..." }`
   - **general**: OpenAI-compatible `POST {LLM_API_URL}/chat/completions` with system prompt
     + last 10 messages; if `LLM_API_KEY` is empty, return a helpful built-in fallback answer
     that points to the app sections and helplines.
5. If `emergency`, prepend a short safety notice (112, 181, 1091) and set `emergency: true`
   so the UI shows an SOS button.
6. On provider failure/timeout: save assistant message with `status: "failed"` and a friendly
   apology, create a `ChatIssue` (`type: provider_error | timeout`), respond 200 with the failed
   message (the chat must not crash).
Users can report any assistant message (`ChatIssue type: user_report`).
Admins list/filter issues, set `open | in_progress | resolved` with a note, retry a failed
message (re-calls the provider and replaces the content), enable/disable bots, change URL and
timeout, and run a test ping per bot.

## Environment (`backend/.env.example`)

```ini
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/arogyini
JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@arogyini.in
ADMIN_PASSWORD=Admin@12345
SMS_PROVIDER=console
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
MEDICAL_BOT_URL=http://localhost:5000
LEGAL_BOT_URL=http://localhost:8002
LLM_API_URL=https://api.groq.com/openai/v1
LLM_API_KEY=
LLM_MODEL=llama-3.1-8b-instant
BOT_TIMEOUT_MS=30000
```
`frontend/.env.example`: `VITE_API_URL=/api`

## Testing rules

- `NODE_ENV=test`, `SMS_PROVIDER=memory`, rate limiters disabled in test.
- Tests import `app` from `src/app.js` (never start the real server or real DB).
- Under Jest ESM `jest` is **not** a global: `import { jest } from "@jest/globals"` in any test that mocks.
- Mock LLM/bot calls by swapping the axios adapter, not the module (no ESM module mocking):
  save `axios.defaults.adapter`, set it to a `jest.fn(async (config) => ({ data, status, statusText,
  headers, config }))`, restore it in `afterEach`. `config.data` is the serialised request body.
  A stub adapter bypasses axios's `timeout`, so simulate a timeout by throwing
  `new axios.AxiosError(msg, "ECONNABORTED", config)`, and an upstream failure by passing a
  5th `response` argument with `{ status: 502, ... }` — do not hang the adapter.
- Each module test covers: happy path, validation error, 401 without token, 403 for wrong role,
  ownership (user A cannot read/modify user B's data).
- Run `npm test` after every phase; all tests must pass before reporting done.

## Frontend design (similar theme to the original, new layout)

- Feel: soft, calm, trustworthy, frosted glass. Background
  `bg-gradient-to-br from-rose-50 via-white to-teal-50` with 2–3 blurred colour blobs.
- Colours: primary rose-500/600, health rose, legal indigo-600, career teal-600, safety red-600,
  accents amber. Text slate-800/600.
- Glass card: `bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-sm`.
- Fonts (Google Fonts in index.html): **Playfair Display** headings, **Plus Jakarta Sans** body,
  **JetBrains Mono** for numbers/phone numbers. Define in `@theme` in `src/index.css`.
- **Layout differs from the original**: collapsible left sidebar on desktop, bottom tab bar on
  mobile, sticky top bar with page title, user menu and a red SOS pill. Floating SOS button
  bottom-right on every authenticated page.
- Rounded-full buttons, lucide icons, subtle hover lift, skeleton loaders, empty states, toast
  notifications. Fully responsive (mobile first) and keyboard accessible (focus rings, aria labels).

## Frontend structure

```
frontend/src/
  main.jsx  App.jsx  index.css
  api/          # client.js (axios instance: baseURL VITE_API_URL, request interceptor adds the token,
                #            response interceptor unwraps {success,data} and throws ApiError) + one file per module
  context/      # AuthContext (user, token, login, signup, logout), ToastContext
  hooks/        # useSiren, useGeolocation, useAsync
  components/   # ui/ (Button, Card, Input, Select, Modal, Badge, Spinner, EmptyState), layout/, sos/, chat/
  pages/        # Landing, SignIn, SignUp, Dashboard, Health, Legal, Career, Safety, Chat, Profile, admin/*
  routes/       # ProtectedRoute, AdminRoute
```
Token stored in localStorage key `arogyini_token`; on 401 the client logs out and redirects to /signin.