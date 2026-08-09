# How to Run GigScore

This guide gets GigScore running locally on **Windows**, **Linux**, or **macOS** after
cloning the repo. You need two terminals running at the same time — one for the backend,
one for the frontend.

## Prerequisites

Install these first if you don't have them:

- **Python 3.10+** — [python.org/downloads](https://www.python.org/downloads/)
  - Windows: during install, check **"Add Python to PATH"**.
- **Node.js 18+** (includes npm) — [nodejs.org](https://nodejs.org/)
- **Git** — [git-scm.com](https://git-scm.com/downloads)

Check they're installed by running:
```
python --version     (or python3 --version on Linux/Mac)
node --version
npm --version
git --version
```

---

## 1. Clone the repo

```
git clone https://github.com/ChethanKumarr2276/GigScore.git
cd GigScore
```

---

## 2. Backend setup

### Windows (Command Prompt or PowerShell)
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements_full.txt
python -m uvicorn main:app --reload
```

### Linux / macOS
```
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements_full.txt
python -m uvicorn main:app --reload
```

**Important:** always use `python -m uvicorn`, not plain `uvicorn` — on some machines
plain `uvicorn` resolves to a different, system-wide install and throws a false
`ModuleNotFoundError`.

If it worked, you'll see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Leave this terminal open and running. To verify it's actually working, open a browser (or
a second terminal) and check `http://127.0.0.1:8000/applicants` — you should see JSON
data with worker records.

---

## 3. Frontend setup (in a new, second terminal)

### Windows
```
cd GigScore\frontend
copy .env.example .env
npm install
npm run dev
```

### Linux / macOS
```
cd GigScore/frontend
cp .env.example .env
npm install
npm run dev
```

If it worked, you'll see something like:
```
  VITE ready in ___ ms
  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser — you should see the GigScore landing
page, with Worker Portal / Lender Portal buttons and a Demo Presets button.

---

## Common problems

**"python: command not found" (Linux/Mac)**
Use `python3` instead of `python` for every command above.

**"'venv' is not recognized" or activation doesn't seem to do anything (Windows)**
Make sure you're using `venv\Scripts\activate` (backslash), not the Linux-style
`venv/bin/activate`. If using PowerShell and you get a script-execution error, run:
```
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
then try activating again.

**Backend crashes on startup with an import error**
Make sure you pulled the latest version of the repo (`git pull`) — an earlier bug where
`backend/utils/` had duplicate misplaced files has been fixed, but only in the latest
commit.

**Frontend loads but shows no data / network errors in browser console**
Check that `.env` was actually created in `frontend/` (not just `.env.example`) and
contains:
```
VITE_API_BASE_URL=http://127.0.0.1:8000
```
Also make sure the backend terminal (step 2) is still running — the frontend depends on
it being live at the same time.

**Port already in use**
Something else on your machine is using port 8000 or 5173. Either close that other
program, or run the backend on a different port:
```
python -m uvicorn main:app --reload --port 8001
```
(and update `VITE_API_BASE_URL` in `frontend/.env` to match).

---

## Quick reference — every time you come back to work on this

Backend (terminal 1):
```
cd GigScore/backend
source venv/bin/activate      (Windows: venv\Scripts\activate)
python -m uvicorn main:app --reload
```

Frontend (terminal 2):
```
cd GigScore/frontend
npm run dev
```

You do **not** need to repeat `pip install` / `npm install` / copying `.env` every time —
only the first time you set up the project.
