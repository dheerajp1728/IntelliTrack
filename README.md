# IntelliTract — Smart Sprint Management System

> Built for teams who want more than just a task board.

IntelliTract is a full-stack Agile project management platform designed for software development teams. It brings together everything you need to run a sprint — issue tracking, backlog grooming, team workload, analytics, and even an AI that reads your GitHub repository and tells you how much of your sprint is actually done.

---

## What it does

Managing a sprint well means knowing where your team stands at any given moment — not just what's marked "Done" in a board, but what's *actually* implemented in the codebase. IntelliTract handles both sides of that.

On the project management side, you get a full Jira-style workspace: issues of every type (Epics, Stories, Tasks, Bugs, Sub-tasks, Spikes, Tech Debt), sprint planning with capacity tracking, a drag-and-drop Kanban board, backlog management with story point estimation, release tracking, a team wiki, and detailed analytics including velocity charts and burndown graphs.

On the AI side, IntelliTract's built-in analysis service connects to your GitHub repository, reads the code using semantic embeddings, and uses an LLM to score how complete each task actually is — giving you an honest 0–100% completion estimate based on what's been written, not just what's been clicked.

---

## Tech Stack

**Frontend**
- React 19 + Vite
- TailwindCSS, Radix UI, Framer Motion
- Recharts for analytics, Three.js for 3D visuals
- Drag-and-drop via dnd-kit

**Backend**
- FastAPI (Python)
- SQLAlchemy + SQLite
- JWT authentication with bcrypt password hashing
- Role-based access: Developer, Scrum Master, Admin

**AI Analysis Service** *(optional)*
- FastAPI microservice on a separate port
- Nomic Embed for 768-dimensional code embeddings
- Qdrant as the vector database
- LLaMA-2 via LM Studio for local inference
- GitHub API to fetch repository source code

---

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+
- Docker *(only needed for the AI service)*
- LM Studio *(only needed for the AI service)*

---

### 1. Run the Backend

```bash
cd Software_Engineering_Project

python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

The API starts at `http://127.0.0.1:8000`.  
You can explore all endpoints at `http://127.0.0.1:8000/docs`.

The database is created automatically on first run. To load sample data:

```bash
python -c "from app.seed import seed_data; seed_data()"
```

---

### 2. Run the Frontend

```bash
cd Software_Engineering_Project/frontend

npm install
npm run dev
```

Open `http://localhost:5173` in your browser. Register an account and you're in.

---

### 3. Run the AI Analysis Service *(optional)*

This service needs two things running first:

**Qdrant** (vector database):
```bash
docker run -p 6333:6333 qdrant/qdrant
```

**LM Studio** — open the app, load a model like `llama-2-7b-chat`, and start the local server. It should be running at `http://127.0.0.1:1234`.

Then start the service:
```bash
cd Software_Engineering_Project/Agile-LLM-main

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

python -m uvicorn main:app --host 127.0.0.1 --port 8004
```

Once it's running, point it at any GitHub repo and a list of tasks:

```bash
curl -X POST "http://127.0.0.1:8004/progress" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/your-org/your-repo",
    "tasks": "Implement login\nBuild dashboard\nWrite unit tests"
  }'
```

It returns a structured analysis with a completion score for each task.

---

## Environment Variables

Create a `.env` file inside `Software_Engineering_Project/`:

```env
ANTHROPIC_API_KEY=your_key_here
```

---

## Project Structure

```
Software_Engineering_Project/
├── app/                        # FastAPI backend
│   ├── main.py                 # All API routes (50+ endpoints)
│   ├── models.py               # Database models
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── auth.py                 # JWT auth logic
│   ├── database.py             # SQLAlchemy setup
│   └── seed.py                 # Sample data seeder
│
├── frontend/                   # React frontend
│   └── src/
│       ├── workspace/          # Main app (board, backlog, sprints, etc.)
│       │   └── pages/          # Dashboard, Board, Backlog, Reports, Wiki...
│       ├── components/         # Shared UI components
│       ├── AuthContext.jsx     # Auth state management
│       └── App.jsx             # Routing
│
├── Agile-LLM-main/             # AI analysis microservice
│   ├── main.py                 # /progress endpoint
│   ├── code_indexer.py         # GitHub → embeddings pipeline
│   ├── qdrant_indexer.py       # Vector storage
│   └── llm_analyzer.py        # LLM task analysis
│
├── intellitrack.db             # SQLite database
└── requirements.txt            # Python dependencies
```

---

## Features at a Glance

| Feature | Details |
|---|---|
| Issue types | Epic, Story, Task, Bug, SubTask, Spike, Tech Debt, Improvement |
| Sprint management | Plan → Active → Complete with velocity tracking |
| Board | Kanban with drag-and-drop across status columns |
| Backlog | Ranked list with story points and sprint assignment |
| Analytics | Velocity, burndown, cycle time, throughput |
| Team | Developer profiles, workload capacity, skill tags |
| Wiki | Hierarchical pages for team documentation |
| Releases | Version management with status tracking |
| Notifications | In-app alerts with read/unread state |
| AI analysis | LLM-powered task completion scoring from repo code |
| Auth | JWT tokens, bcrypt passwords, role-based permissions |

---

## Team

Built as part of a Software Engineering course project.

| Name | Role |
|---|---|
| Raunak | Full Stack |
| Vignesh | Full Stack |
| Dhiraj | Full Stack |
| Hemanesh | Full Stack |
| Upasana | Full Stack |

---

## License

This project was built for academic purposes as part of a Software Engineering course.
