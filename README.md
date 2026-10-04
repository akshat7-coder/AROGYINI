# AROGYINI

A women's empowerment and safety platform for India, built around four pillars:

| Pillar | What it does |
| --- | --- |
| **Health** | Period and cycle tracker with predictions: next period, fertile window, current phase |
| **Legal** | Plain-language guides to eight Indian laws, plus generated complaint drafts |
| **Career** | Jobs, returnships and scholarships, with saving and applications |
| **Safety** | SOS that texts your live location to up to five contacts, a siren and a fake call |

An AI assistant sits across all four, routing each question to a medical RAG bot, a legal RAG bot
or a general LLM. Admins manage users, SOS events, content and chatbot issues.

> AROGYINI gives information and support. It is **not** medical or legal advice.
> In an emergency in India, call **112**.

---

## Architecture

```
                         ┌───────────────────────────┐
   browser ──────────────►  frontend  (React 19)     │
                         │  Vite · Tailwind v4       │
                         │  localhost:5173           │
                         └─────────────┬─────────────┘
                                       │  /api/*  (Vite proxy in dev,
                                       │           so no CORS locally)
                         ┌─────────────▼─────────────┐
                         │  backend  (Express 5)     │
                         │  localhost:3000           │
                         │                           │
                         │  routes → controllers     │
                         │        → services         │
                         │        → Mongoose models  │
                         └──┬────────┬────────┬──────┘
                            │        │        │
          ┌─────────────────┘        │        └──────────────────┐
          │                          │                           │
┌─────────▼─────────┐   ┌────────────▼────────────┐   ┌──────────▼──────────┐
│  MongoDB          │   │  SMS provider           │   │  AI providers       │
│  local or Atlas   │   │  twilio │ console │ mem  │   │                     │
│                   │   │                         │   │  medical bot :5000  │
│  users, cycles,   │   │  console logs to the    │   │  legal bot   :8002  │
│  contacts, SOS,   │   │  terminal in dev        │   │  POST /ask          │
│  rights, jobs,    │   │                         │   │                     │
│  chats, issues    │   │  twilio sends real SMS  │   │  general LLM        │
└───────────────────┘   └─────────────────────────┘   │  OpenAI-compatible  │
                                                      └─────────────────────┘
```

**Chat routing.** A message is sanitised, then keyword intent detection picks a bot
(`health → medical`, `legal → legal`, everything else → `general`); an explicit choice in the UI
overrides it. A disabled bot falls back to general. If no `LLM_API_KEY` is set, the general bot
returns a useful built-in answer instead of failing. If a bot errors or times out, the reply is
saved as `failed` with an apology, an admin issue is raised, and **the chat does not break**.
Anything detected as an emergency gets a 112 / 181 / 1091 notice prepended and an SOS button.

```
backend/                      frontend/src/
  src/                          api/         axios client + one file per module
    config/   env (zod), db     context/     Auth, Toast, SOS
    models/   Mongoose          hooks/       useSiren, useGeolocation, useAsync, useDebounced
    routes/   one per module    components/  ui/ layout/ safety/ health/ legal/ career/ chat/ admin/
    controllers/  thin          pages/       one per route, admin/ nested
    services/ all the logic     lib/         dates, validation, markdown, field specs
    middleware/ validators/     routes/      ProtectedRoute, AdminRoute
    seed/     seed.js + data
  tests/      353 tests
```

---

## Running it

You need **Node.js 22+**, **MongoDB**, and (optionally) **Python 3.10+** for the two bots.

### 1. MongoDB

Either a local server or a free Atlas cluster.

**Local — Windows:** install MongoDB Community Server; it runs as a service on
`mongodb://127.0.0.1:27017`. Check with `mongosh`.

**Local — macOS:**
```bash
brew tap mongodb/brew && brew install mongodb-community
brew services start mongodb-community
```

**Local — Linux:** install `mongodb-org`, then `sudo systemctl start mongod`.

**Atlas:** create a free cluster, add a database user, allow your IP, and copy the connection
string into `MONGODB_URI`.

The test suite needs none of this — it starts an in-memory MongoDB of its own.

### 2. Backend — port 3000

```bash
cd backend
npm install
cp .env.example .env          # then set JWT_SECRET to something long
npm run seed                  # admin + 8 legal rights + 8 jobs + 5 scholarships + bot configs
npm run dev
```

Expect `AROGYINI API listening on http://localhost:3000 (development)`, then:

```bash
curl http://localhost:3000/api/health
```

`npm run seed` is safe to run repeatedly. It refreshes content from the data files but never
overwrites a bot URL or timeout you have changed in the admin UI.

See **[backend/README.md](backend/README.md)** for every environment variable, the full endpoint
table and the Twilio setup.

### 3. Frontend — port 5173

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` to `http://localhost:3000`, so there is no
CORS to configure in development.

### 4. The two Python bots (optional)

Without them, health and legal questions return a failed-reply apology and raise an admin issue —
which is itself worth seeing. With them, you get real answers. Each needs only `POST /ask` taking
`{"question": "..."}` and returning `{"answer": "..."}`.

**Medical bot — Flask on 5000**

```bash
mkdir -p bots/medical && cd bots/medical
python -m venv .venv
.venv\Scripts\activate          # Windows;  source .venv/bin/activate on macOS/Linux
pip install flask
```

```python
# app.py
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.post("/ask")
def ask():
    question = (request.get_json(silent=True) or {}).get("question", "").strip()
    if not question:
        return jsonify({"error": "question is required"}), 400
    # replace this with your RAG pipeline
    return jsonify({"answer": f"**Medical assistant**\nYou asked: {question}"})

if __name__ == "__main__":
    app.run(port=5000)
```

```bash
python app.py
```

**Legal bot — FastAPI on 8002**

```bash
mkdir -p bots/legal && cd bots/legal
python -m venv .venv && .venv\Scripts\activate
pip install fastapi uvicorn
```

```python
# main.py
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Query(BaseModel):
    question: str

@app.post("/ask")
def ask(query: Query):
    # replace this with your RAG pipeline
    return {"answer": f"**Legal assistant**\nYou asked: {query.question}"}
```

```bash
uvicorn main:app --port 8002
```

Check both before using the app:

```bash
curl -s -X POST http://localhost:5000/ask -H "Content-Type: application/json" -d "{\"question\":\"ping\"}"
curl -s -X POST http://localhost:8002/ask -H "Content-Type: application/json" -d "{\"question\":\"ping\"}"
```

The URLs come from `MEDICAL_BOT_URL` / `LEGAL_BOT_URL`, but **a URL saved in the admin UI wins
over the env file**. `Admin → Chatbot` shows which is in effect (`env` or `database`) and has a
Test button.

### 5. A general LLM (optional)

Set `LLM_API_KEY` (and `LLM_API_URL` / `LLM_MODEL` if you are not using Groq) for real answers to
career, safety and general questions. Left empty, those questions get a built-in fallback answer
that points at the right section and the helplines — which is a supported state, not an error.

---

## Accounts

| Account | Credentials | How to get it |
| --- | --- | --- |
| **Admin** | `admin@arogyini.in` / `Admin@12345` | Created by `npm run seed`, from `ADMIN_EMAIL` and `ADMIN_PASSWORD` |
| **User** | whatever you choose | Sign up at `/signup` — signup always creates a `user`, never an admin |

Change `ADMIN_PASSWORD` in `.env` and re-run `npm run seed` before putting this anywhere public.
There is no way to become an admin through the UI: an existing admin must promote you from
`Admin → Users`.

---

## 10-step manual test

Backend and frontend running, bots optional. Takes about ten minutes and touches every feature.

**1. Sign up and sign in**
Go to `/signup`. Try the password `abcdefgh` — it is rejected inline before any request ("must
contain at least one number"), because the client mirrors the server rules. Fix it to `Secret123`
and submit. You land on the Dashboard with a welcome toast. Sign out from the user menu, then
sign back in. A wrong password gives "Invalid email or password" with no hint about which was
wrong.

**2. Dashboard**
Four pillar cards load independently, each with its own skeleton. They should read "Not tracking
yet", "Not ready" (no contacts), "Nothing saved" and the number of legal guides. The four quick
actions and the helpline numbers are `tel:` links.

**3. Health — log a period**
Dashboard → **Log period** (it opens the modal on the Health page). Log three periods about 28
days apart, the newest ending in the last few days: pick dates, a flow chip, a few symptom chips,
a mood, and a note. After the first one the hero appears with a progress ring, current phase, next
period date, fertile window and phase tips. The calendar fills in: solid rose for logged days,
dashed outline for predicted, teal tint for fertile, solid teal for ovulation, a ring on today.
Edit one log and delete another — the ring and calendar both update.

To see the irregular warning, log starts 28 then 18 days apart; the amber "consult a
gynaecologist" panel appears and the badge switches to "Irregular".

**4. Safety — contacts and SOS**
Go to **Safety**. Add a contact with the phone `98765 43210`; it is stored as `+919876543210`.
Try `12345` — rejected inline. Add five and the button disables at the limit.

Now press the floating red SOS button. You get a **3-second countdown** — press Cancel once to
check it aborts. Press it again and let it run: it asks for location permission (**allow it**),
then shows per-contact delivery, the maps link, Call 112, Stop siren and "I am safe now". **The
siren starts by itself.** Watch the backend terminal for one `[sms:console]` block per contact
containing the Google Maps link and IST time.

Close the modal with "keep the alert open": a pulsing red strip appears in the top bar on every
page, and survives a refresh. Press "I am safe now" to clear it; the history below gains a
`resolved` badge.

Also on this page: the siren test with a volume slider, and the fake call — set a caller name,
start it, and you get a full-screen ringing UI with a real ringtone; Answer starts a timer.

**5. Legal — guides and a draft**
**Legal → Your rights**. Search `POSH` (debounced), filter by category, and expand a card to see
protections, numbered filing steps, penalties, helplines as `tel:` links, and FAQs.

**Draft a complaint** → pick **Zero FIR**, fill the required fields, Generate. The draft appears
in a document-style panel. **Copy** and **Download** both work; the file is a `.txt`. Submit with
a required field blank to see the error land on that exact field.

**6. Career — browse, save, apply**
**Career → Jobs**. Filter by type `returnship`, tick "Only roles open to a career break", and
search. Open a job's details, **Save** it, then **Apply** with a cover note. Applying again shows
"already applied" rather than an error. Check the **Saved** and **Applications** tabs — the counts
in the tab bar update immediately. **Scholarships** shows deadline countdown badges, with
Stand-Up India as "Always open".

**7. Chat — routing and emergency**
**Assistant**. With an empty conversation you get starter questions grouped by pillar. Tap a
health one: it fills the composer and preselects the medical bot. Send it. The reply shows which
bot answered, the latency, and renders bold and lists. Try a legal question — it routes to the
legal bot automatically.

Now send **"bachao someone is following me"**. The reply is flagged as an emergency: a red card
appears inside the bubble with **Send SOS now** and the helpline numbers.

Stop the Python bots and send a health question: you get a soft amber "this answer did not come
through" message rather than a crash. Use **Report** on any reply and give a reason.

**8. Profile**
Edit your name, phone, city and blood group. Change your password: a wrong current password lands
the error on that field, and the new password must satisfy the same rules.

**9. Admin**
Sign in as `admin@arogyini.in`. An **Admin** entry appears in the sidebar that a normal user never
sees. Check each section:
- **Overview** — counts, with a pulsing dot on active SOS and open chat issues
- **Users** — search, filter, promote someone to admin, deactivate them. Your own row's buttons
  are disabled; the server refuses it too
- **SOS** — the event from step 4 with per-contact delivery; resolve one
- **Chatbot** — toggle a bot off, edit a URL and timeout, press **Test** for ok/latency. Open the
  issue from step 7, read the question and answer, add a note, and press **Retry** (restart the
  bot first and it succeeds, replacing the message the user sees)
- **Content** — create a job, edit a scholarship, open a job's applications and change a status

**10. Responsiveness, keyboard and motion**
Narrow the window to phone width: the sidebar is replaced by a bottom tab bar, the floating SOS
sits above it, and no page scrolls sideways. Tab through any page — every control shows a focus
ring, modals trap focus, and **Esc** closes them. Turn on your OS "reduce motion" setting and
reload: the pulsing, ping and bounce animations stop.

---

## Tests

```bash
cd backend && npm test              # 353 tests
cd backend && npm run test:coverage # with enforced thresholds
cd frontend && npm run build        # must compile
cd frontend && npm run lint
```

The backend suite runs against an in-memory MongoDB and never touches your real database.
Coverage thresholds are enforced in `jest.config.js`: services at 80% on every metric, global at
85% statements.

---

## A note on the seeded data

- The **legal rights are real** summaries of Indian law, citing both the IPC/CrPC and the
  BNS/BNSS that replaced them on 1 July 2024. They are information, not advice.
- The **scholarships are real schemes** (AICTE Pragati, Stand-Up India, Google Generation APAC,
  L'Oréal India, UGC Indira Gandhi). Amounts are marked approximate and deadlines are indicative —
  always check the official portal.
- The **jobs are illustrative demo rows, not live vacancies.** The two returnships are modelled on
  real public programmes but the roles themselves are invented. Replace them through
  `Admin → Content` before real users see them.
