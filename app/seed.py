from .database import SessionLocal, engine, Base
from .models import (
    User, DeveloperProfile, Sprint, Task, Project,
    Issue, Comment, ActivityLog, Notification, WikiPage,
    Label, Component, Release
)
from .auth import hash_password


def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(User).first():
        db.close()
        return

    # ── Users ────────────────────────────────────────────────────────────────
    users_data = [
        {"name": "Alice Chen",      "email": "alice@intellitract.io",   "role": "admin"},
        {"name": "Bob Martinez",    "email": "bob@intellitract.io",     "role": "manager"},
        {"name": "Carol Kim",       "email": "carol@intellitract.io",   "role": "manager"},
        {"name": "David Osei",      "email": "david@intellitract.io",   "role": "developer"},
        {"name": "Eva Singh",       "email": "eva@intellitract.io",     "role": "developer"},
        {"name": "Frank Liu",       "email": "frank@intellitract.io",   "role": "developer"},
        {"name": "Grace Patel",     "email": "grace@intellitract.io",   "role": "developer"},
        {"name": "Hiro Tanaka",     "email": "hiro@intellitract.io",    "role": "developer"},
    ]
    users = []
    for ud in users_data:
        u = User(name=ud["name"], email=ud["email"],
                 password_hash=hash_password("rosy@1234"), role=ud["role"])
        db.add(u)
        users.append(u)
    db.commit()
    for u in users:
        db.refresh(u)

    alice, bob, carol, david, eva, frank, grace, hiro = users

    # ── Developer Profiles ───────────────────────────────────────────────────
    profiles = [
        DeveloperProfile(user_id=alice.id, full_name="Alice Chen",
            email="alice@intellitract.io", phone="+1 (415) 555-0192",
            role_title="Engineering Lead", department="Engineering",
            bio="Full-stack engineer and team lead with 8 years of experience building scalable platforms.",
            skills="Python,React,TypeScript,FastAPI,PostgreSQL,Docker",
            interests="System Design,AI,Leadership", experience_level="Senior",
            github_url="", linkedin_url="",
            current_workload=3, capacity=6, availability_status="Available"),
        DeveloperProfile(user_id=bob.id, full_name="Bob Martinez",
            email="bob@intellitract.io", phone="+1 (312) 555-0847",
            role_title="Engineering Manager", department="Engineering",
            bio="Certified Scrum Master with 5 years running agile teams across distributed environments.",
            skills="Agile,Scrum,Jira,Confluence,Leadership",
            interests="Process Improvement,Team Health,Metrics", experience_level="Senior",
            github_url="", linkedin_url="",
            current_workload=2, capacity=5, availability_status="Available"),
        DeveloperProfile(user_id=carol.id, full_name="Carol Kim",
            email="carol@intellitract.io", phone="+1 (646) 555-0374",
            role_title="Product Manager", department="Product",
            bio="Product strategist focused on user-centric design and data-driven roadmaps.",
            skills="Product Management,User Research,Figma,Analytics,Roadmapping",
            interests="UX,Growth,Strategy", experience_level="Senior",
            github_url="", linkedin_url="",
            current_workload=4, capacity=6, availability_status="Available"),
        DeveloperProfile(user_id=david.id, full_name="David Osei",
            email="david@intellitract.io", phone="+1 (202) 555-0561",
            role_title="Backend Developer", department="Engineering",
            bio="Backend specialist focused on high-performance APIs and distributed systems architecture.",
            skills="Python,Go,PostgreSQL,Redis,Kafka,Docker",
            interests="Distributed Systems,Performance,Backend", experience_level="Intermediate",
            github_url="", linkedin_url="",
            current_workload=4, capacity=5, availability_status="Available"),
        DeveloperProfile(user_id=eva.id, full_name="Eva Singh",
            email="eva@intellitract.io", phone="+1 (503) 555-0219",
            role_title="Frontend Developer", department="Engineering",
            bio="React expert passionate about performance optimization, accessibility, and great user experiences.",
            skills="React,TypeScript,Tailwind CSS,CSS,Testing Library",
            interests="Frontend,Accessibility,UI/UX", experience_level="Intermediate",
            github_url="", linkedin_url="",
            current_workload=3, capacity=5, availability_status="Partially Available"),
        DeveloperProfile(user_id=frank.id, full_name="Frank Liu",
            email="frank@intellitract.io", phone="+1 (737) 555-0483",
            role_title="DevOps Engineer", department="Infrastructure",
            bio="Cloud and infrastructure engineer specializing in Kubernetes, CI/CD pipelines, and reliability.",
            skills="Kubernetes,Terraform,AWS,GitHub Actions,Docker,Helm",
            interests="DevOps,Cloud,Automation,SRE", experience_level="Senior",
            github_url="", linkedin_url="",
            current_workload=2, capacity=5, availability_status="Available"),
        DeveloperProfile(user_id=grace.id, full_name="Grace Patel",
            email="grace@intellitract.io", phone="+1 (858) 555-0726",
            role_title="QA Engineer", department="Quality",
            bio="Quality engineer with deep expertise in automated end-to-end testing and shift-left QA practices.",
            skills="Playwright,Cypress,Jest,Python,SQL,Selenium",
            interests="Testing,Quality Assurance,Automation", experience_level="Intermediate",
            github_url="", linkedin_url="",
            current_workload=3, capacity=5, availability_status="Available"),
        DeveloperProfile(user_id=hiro.id, full_name="Hiro Tanaka",
            email="hiro@intellitract.io", phone="+1 (408) 555-0938",
            role_title="ML Engineer", department="AI/ML",
            bio="Machine learning engineer building intelligent product features using NLP and recommendation systems.",
            skills="Python,PyTorch,FastAPI,SQL,Data Science,LLMs",
            interests="AI,Machine Learning,NLP,Generative AI", experience_level="Senior",
            github_url="", linkedin_url="",
            current_workload=4, capacity=5, availability_status="Available"),
    ]
    db.add_all(profiles)
    db.commit()

    # ── Projects ─────────────────────────────────────────────────────────────
    proj1 = Project(name="IntelliTract Platform", key="INT",
                    description="Core workspace platform — issues, sprints, boards, and analytics.",
                    status="Active", category="Platform", lead_id=alice.id)
    proj2 = Project(name="Mobile App", key="MOB",
                    description="Native iOS and Android companion application.",
                    status="Active", category="Mobile", lead_id=eva.id)
    proj3 = Project(name="API Gateway", key="API",
                    description="Unified API gateway with authentication and rate limiting.",
                    status="Active", category="Infrastructure", lead_id=david.id)
    db.add_all([proj1, proj2, proj3])
    db.commit()
    db.refresh(proj1)
    db.refresh(proj2)
    db.refresh(proj3)

    # ── Labels ────────────────────────────────────────────────────────────────
    labels = [
        Label(name="frontend", color="#3b82f6", project_id=proj1.id),
        Label(name="backend", color="#10b981", project_id=proj1.id),
        Label(name="ui-polish", color="#f59e0b", project_id=proj1.id),
        Label(name="performance", color="#ef4444", project_id=proj1.id),
        Label(name="security", color="#8b5cf6", project_id=proj1.id),
        Label(name="breaking-change", color="#dc2626", project_id=proj1.id),
    ]
    db.add_all(labels)
    db.commit()

    # ── Components ────────────────────────────────────────────────────────────
    comps = [
        Component(name="Frontend", description="React UI layer", project_id=proj1.id, lead_id=eva.id),
        Component(name="Backend", description="FastAPI service", project_id=proj1.id, lead_id=david.id),
        Component(name="Database", description="PostgreSQL schema", project_id=proj1.id, lead_id=david.id),
        Component(name="Infrastructure", description="K8s / Terraform", project_id=proj1.id, lead_id=frank.id),
        Component(name="AI/ML", description="Recommendation engine", project_id=proj1.id, lead_id=hiro.id),
    ]
    db.add_all(comps)
    db.commit()

    # ── Releases ──────────────────────────────────────────────────────────────
    rel1 = Release(name="v1.0 - Launch", version="1.0.0",
                   description="Initial public release", project_id=proj1.id,
                   status="Released", release_date="2025-03-01")
    rel2 = Release(name="v1.1 - Kanban", version="1.1.0",
                   description="Kanban board and backlog management", project_id=proj1.id,
                   status="Unreleased", release_date="2025-05-15")
    db.add_all([rel1, rel2])
    db.commit()
    db.refresh(rel1)
    db.refresh(rel2)

    # ── Sprints ───────────────────────────────────────────────────────────────
    s_past1 = Sprint(name="Sprint 01", goal="Foundation & auth system",
                     project_id=proj1.id, status="Completed",
                     start_date="2025-01-06", end_date="2025-01-17", capacity=40)
    s_past2 = Sprint(name="Sprint 02", goal="Dashboard & analytics v1",
                     project_id=proj1.id, status="Completed",
                     start_date="2025-01-20", end_date="2025-01-31", capacity=45)
    s_past3 = Sprint(name="Sprint 03", goal="Backlog & issue management",
                     project_id=proj1.id, status="Completed",
                     start_date="2025-02-03", end_date="2025-02-14", capacity=42)
    s_active = Sprint(name="Sprint 04", goal="Kanban board and sprint retrospectives",
                      project_id=proj1.id, status="Active",
                      start_date="2025-04-01", end_date="2025-04-14", capacity=50)
    s_next = Sprint(name="Sprint 05", goal="Reports, wiki, and mobile push",
                    project_id=proj1.id, status="Planning",
                    start_date="2025-04-15", end_date="2025-04-28", capacity=50)
    db.add_all([s_past1, s_past2, s_past3, s_active, s_next])
    db.commit()
    for s in [s_past1, s_past2, s_past3, s_active, s_next]:
        db.refresh(s)

    # ── Issues ────────────────────────────────────────────────────────────────
    issue_data = [
        # Epic
        dict(key="INT-1", title="Workspace Core Platform",
             description="Build the foundational workspace: auth, projects, issues, sprints.",
             type="Epic", status="In Progress", priority="Blocker",
             story_points=None, project_id=proj1.id, sprint_id=None,
             assignee_id=alice.id, reporter_id=carol.id,
             labels="backend,frontend", components="Backend,Frontend",
             rank=1),
        dict(key="INT-2", title="Analytics & Reporting Engine",
             description="Build comprehensive analytics dashboards and reports.",
             type="Epic", status="To Do", priority="Critical",
             story_points=None, project_id=proj1.id, sprint_id=None,
             assignee_id=hiro.id, reporter_id=carol.id,
             labels="backend,frontend", rank=2),
        # Completed sprint issues
        dict(key="INT-3", title="User authentication system (JWT)",
             description="Implement JWT-based auth with login/register/me endpoints.",
             type="Story", status="Done", priority="Blocker",
             story_points=8, project_id=proj1.id, sprint_id=s_past1.id,
             assignee_id=david.id, reporter_id=alice.id,
             labels="backend,security", components="Backend",
             fix_version_id=rel1.id, rank=3),
        dict(key="INT-4", title="Project & sprint CRUD APIs",
             description="REST endpoints for creating and managing projects and sprints.",
             type="Story", status="Done", priority="Critical",
             story_points=5, project_id=proj1.id, sprint_id=s_past1.id,
             assignee_id=david.id, reporter_id=alice.id,
             labels="backend", components="Backend",
             fix_version_id=rel1.id, rank=4),
        dict(key="INT-5", title="React app scaffolding and routing",
             description="Set up Vite + React + Tailwind with state-based routing.",
             type="Task", status="Done", priority="Major",
             story_points=3, project_id=proj1.id, sprint_id=s_past1.id,
             assignee_id=eva.id, reporter_id=alice.id,
             labels="frontend", components="Frontend",
             fix_version_id=rel1.id, rank=5),
        dict(key="INT-6", title="Login and register UI",
             description="Build beautiful login/register forms with validation.",
             type="Story", status="Done", priority="Critical",
             story_points=5, project_id=proj1.id, sprint_id=s_past1.id,
             assignee_id=eva.id, reporter_id=carol.id,
             labels="frontend,ui-polish", components="Frontend",
             fix_version_id=rel1.id, rank=6),
        dict(key="INT-7", title="Landing page with hero and features",
             description="Build the marketing landing page with animations.",
             type="Story", status="Done", priority="Major",
             story_points=8, project_id=proj1.id, sprint_id=s_past1.id,
             assignee_id=eva.id, reporter_id=carol.id,
             labels="frontend,ui-polish", rank=7),
        # Sprint 2 - completed
        dict(key="INT-8", title="Dashboard sprint analytics overview",
             description="Build the sprint analytics section with burndown and velocity charts.",
             type="Story", status="Done", priority="Critical",
             story_points=8, project_id=proj1.id, sprint_id=s_past2.id,
             assignee_id=hiro.id, reporter_id=carol.id,
             labels="frontend,backend", rank=8),
        dict(key="INT-9", title="Team workload heatmap",
             description="Visualize workload distribution across team members.",
             type="Story", status="Done", priority="Major",
             story_points=5, project_id=proj1.id, sprint_id=s_past2.id,
             assignee_id=hiro.id, reporter_id=bob.id,
             labels="frontend", rank=9),
        dict(key="INT-10", title="Project-level KPI cards",
             description="Active projects summary with status, lead, and milestone.",
             type="Story", status="Done", priority="Major",
             story_points=3, project_id=proj1.id, sprint_id=s_past2.id,
             assignee_id=eva.id, reporter_id=carol.id,
             labels="frontend", rank=10),
        dict(key="INT-11", title="CI/CD pipeline with GitHub Actions",
             description="Automated test, build, and deploy pipeline.",
             type="Task", status="Done", priority="Critical",
             story_points=5, project_id=proj1.id, sprint_id=s_past2.id,
             assignee_id=frank.id, reporter_id=alice.id,
             labels="backend", components="Infrastructure", rank=11),
        dict(key="INT-12", title="Developer profile management",
             description="CRUD for developer profiles with skills, capacity, and workload.",
             type="Story", status="Done", priority="Major",
             story_points=5, project_id=proj1.id, sprint_id=s_past2.id,
             assignee_id=eva.id, reporter_id=carol.id,
             labels="frontend,backend", rank=12),
        # Sprint 3 - completed
        dict(key="INT-13", title="Issue creation and editing",
             description="Full CRUD for issues with all PRD fields.",
             type="Story", status="Done", priority="Blocker",
             story_points=8, project_id=proj1.id, sprint_id=s_past3.id,
             assignee_id=david.id, reporter_id=alice.id,
             labels="backend", components="Backend", rank=13),
        dict(key="INT-14", title="Backlog flat list view",
             description="Sortable, filterable backlog list with inline editing.",
             type="Story", status="Done", priority="Critical",
             story_points=5, project_id=proj1.id, sprint_id=s_past3.id,
             assignee_id=eva.id, reporter_id=carol.id,
             labels="frontend", rank=14),
        dict(key="INT-15", title="Bug: Sprint dates not saving",
             description="Sprint start/end dates reset to null after page refresh.",
             type="Bug", status="Done", priority="Critical",
             story_points=2, project_id=proj1.id, sprint_id=s_past3.id,
             assignee_id=david.id, reporter_id=grace.id,
             labels="backend", rank=15),
        dict(key="INT-16", title="Global search endpoint",
             description="Full-text search across issues, wiki pages, and users.",
             type="Story", status="Done", priority="Major",
             story_points=3, project_id=proj1.id, sprint_id=s_past3.id,
             assignee_id=david.id, reporter_id=carol.id,
             labels="backend", rank=16),
        # Sprint 4 - active
        dict(key="INT-17", title="Kanban board with drag-and-drop",
             description="Build Scrum/Kanban board with column management, swimlanes, and card interactions.",
             type="Story", status="In Progress", priority="Blocker",
             story_points=13, project_id=proj1.id, sprint_id=s_active.id,
             assignee_id=eva.id, reporter_id=carol.id,
             labels="frontend,ui-polish", components="Frontend",
             fix_version_id=rel2.id, rank=17),
        dict(key="INT-18", title="Issue detail view",
             description="Comprehensive issue workspace with comments, activity, and developer panel.",
             type="Story", status="In Progress", priority="Critical",
             story_points=8, project_id=proj1.id, sprint_id=s_active.id,
             assignee_id=eva.id, reporter_id=carol.id,
             labels="frontend", rank=18),
        dict(key="INT-19", title="Sprint retrospective board",
             description="Built-in retro board with What went well / Improve / Action items.",
             type="Story", status="To Do", priority="Major",
             story_points=5, project_id=proj1.id, sprint_id=s_active.id,
             assignee_id=david.id, reporter_id=bob.id,
             labels="frontend,backend", rank=19),
        dict(key="INT-20", title="WIP limits and column alerts",
             description="Per-column WIP limits with visual warning and hard block thresholds.",
             type="Story", status="To Do", priority="Major",
             story_points=3, project_id=proj1.id, sprint_id=s_active.id,
             assignee_id=eva.id, reporter_id=bob.id,
             labels="frontend", rank=20),
        dict(key="INT-21", title="Bug: Assignee avatar missing on cards",
             description="Cards on the board do not show assignee avatar in Firefox.",
             type="Bug", status="In Progress", priority="Minor",
             story_points=1, project_id=proj1.id, sprint_id=s_active.id,
             assignee_id=grace.id, reporter_id=grace.id,
             labels="frontend", flagged=True, rank=21),
        dict(key="INT-22", title="Automated standup summary (AI)",
             description="Generate daily standup summaries from issue activity using Claude API.",
             type="Story", status="To Do", priority="Major",
             story_points=8, project_id=proj1.id, sprint_id=s_active.id,
             assignee_id=hiro.id, reporter_id=carol.id,
             labels="backend", components="AI/ML", rank=22),
        dict(key="INT-23", title="Kubernetes deployment config",
             description="Deploy to K8s with health checks, rolling updates, and autoscaling.",
             type="Task", status="Done", priority="Critical",
             story_points=5, project_id=proj1.id, sprint_id=s_active.id,
             assignee_id=frank.id, reporter_id=alice.id,
             labels="backend", components="Infrastructure", rank=23),
        dict(key="INT-24", title="Sprint completion flow",
             description="One-click sprint complete with option to move incomplete issues.",
             type="Story", status="To Do", priority="Major",
             story_points=3, project_id=proj1.id, sprint_id=s_active.id,
             assignee_id=david.id, reporter_id=bob.id,
             labels="backend,frontend", rank=24),
        # Backlog (no sprint)
        dict(key="INT-25", title="Roadmap / Gantt chart view",
             description="Interactive Gantt chart with drag-to-reschedule and dependency lines.",
             type="Story", status="To Do", priority="Major",
             story_points=13, project_id=proj1.id, sprint_id=None,
             assignee_id=eva.id, reporter_id=carol.id,
             labels="frontend,ui-polish", rank=25),
        dict(key="INT-26", title="Reports: velocity and burndown export",
             description="PDF and CSV export for all report types.",
             type="Story", status="To Do", priority="Minor",
             story_points=5, project_id=proj1.id, sprint_id=None,
             assignee_id=None, reporter_id=carol.id,
             labels="frontend,backend", rank=26),
        dict(key="INT-27", title="SLA management and breach alerts",
             description="Define SLA policies by priority with countdown timers and escalation.",
             type="Story", status="To Do", priority="Major",
             story_points=8, project_id=proj1.id, sprint_id=None,
             assignee_id=None, reporter_id=carol.id,
             labels="backend", rank=27),
        dict(key="INT-28", title="Slack integration",
             description="Bi-directional Slack integration: notifications, create issues from messages.",
             type="Story", status="To Do", priority="Major",
             story_points=8, project_id=proj1.id, sprint_id=None,
             assignee_id=None, reporter_id=carol.id,
             labels="backend", rank=28),
        dict(key="INT-29", title="Technical Debt: Refactor issue query layer",
             description="Extract query logic into a service layer for testability.",
             type="TechDebt", status="To Do", priority="Minor",
             story_points=3, project_id=proj1.id, sprint_id=None,
             assignee_id=david.id, reporter_id=david.id,
             labels="backend", rank=29),
        dict(key="INT-30", title="Mobile push notifications",
             description="Push notifications for critical events on iOS and Android.",
             type="Story", status="To Do", priority="Major",
             story_points=5, project_id=proj1.id, sprint_id=s_next.id,
             assignee_id=None, reporter_id=carol.id,
             labels="backend", rank=30),
        dict(key="INT-31", title="Wiki collaborative editing",
             description="Real-time multi-user wiki editing with cursor presence.",
             type="Story", status="To Do", priority="Major",
             story_points=13, project_id=proj1.id, sprint_id=s_next.id,
             assignee_id=eva.id, reporter_id=carol.id,
             labels="frontend", rank=31),
        dict(key="INT-32", title="Custom dashboard widgets",
             description="Drag-and-drop widget builder for personalized dashboards.",
             type="Story", status="To Do", priority="Minor",
             story_points=8, project_id=proj1.id, sprint_id=s_next.id,
             assignee_id=None, reporter_id=carol.id,
             labels="frontend", rank=32),
        dict(key="INT-33", title="Spike: WebSocket real-time updates",
             description="Evaluate Socket.io vs native WebSocket for live board updates.",
             type="Spike", status="To Do", priority="Major",
             story_points=3, project_id=proj1.id, sprint_id=s_next.id,
             assignee_id=david.id, reporter_id=alice.id,
             labels="backend", rank=33),
    ]

    issues = []
    for d in issue_data:
        issue = Issue(**d)
        db.add(issue)
        issues.append(issue)
    db.commit()
    for issue in issues:
        db.refresh(issue)

    # Find specific issues for comments
    issue_17 = next(i for i in issues if i.key == "INT-17")
    issue_18 = next(i for i in issues if i.key == "INT-18")
    issue_21 = next(i for i in issues if i.key == "INT-21")

    # ── Comments ──────────────────────────────────────────────────────────────
    comments = [
        Comment(issue_id=issue_17.id, author_id=bob.id,
                content="Using @dnd-kit/core for the drag-and-drop implementation. Supports touch and pointer events."),
        Comment(issue_id=issue_17.id, author_id=alice.id,
                content="Make sure we handle multi-select drag for batch column transitions."),
        Comment(issue_id=issue_17.id, author_id=eva.id,
                content="Will do! Also adding card aging indicators and inline editing."),
        Comment(issue_id=issue_18.id, author_id=carol.id,
                content="Priority: comment thread with @mentions needs to be in this sprint."),
        Comment(issue_id=issue_18.id, author_id=eva.id,
                content="Agreed. Activity log and developer integration panel will follow."),
        Comment(issue_id=issue_21.id, author_id=grace.id,
                content="Reproduced on Firefox 124. Avatar element has overflow:hidden missing."),
        Comment(issue_id=issue_21.id, author_id=eva.id,
                content="Found it — the Tailwind `rounded-full` class is not being purged correctly. Fix incoming."),
    ]
    db.add_all(comments)
    db.commit()

    # ── Activity Logs ─────────────────────────────────────────────────────────
    logs = [
        ActivityLog(issue_id=issue_17.id, user_id=alice.id, action="status_changed",
                    field="status", old_value="To Do", new_value="In Progress"),
        ActivityLog(issue_id=issue_17.id, user_id=alice.id, action="assigned",
                    field="assignee_id", old_value=None, new_value=str(eva.id)),
        ActivityLog(issue_id=issue_21.id, user_id=grace.id, action="flagged",
                    field="flagged", old_value="False", new_value="True"),
        ActivityLog(issue_id=issue_18.id, user_id=bob.id, action="status_changed",
                    field="status", old_value="To Do", new_value="In Progress"),
    ]
    db.add_all(logs)
    db.commit()

    # ── Notifications ─────────────────────────────────────────────────────────
    notifs = [
        Notification(user_id=eva.id, type="assigned", title="New issue assigned",
                     message="INT-17: Kanban board with drag-and-drop has been assigned to you.",
                     issue_id=issue_17.id),
        Notification(user_id=eva.id, type="comment", title="New comment on INT-18",
                     message="Carol Kim commented: Priority: comment thread with @mentions...",
                     issue_id=issue_18.id),
        Notification(user_id=alice.id, type="status_change", title="INT-21 flagged as blocked",
                     message="Grace Patel flagged INT-21 as blocked.", issue_id=issue_21.id),
        Notification(user_id=bob.id, type="mentioned", title="You were mentioned",
                     message="Alice Chen mentioned @bob in a comment on INT-17.", issue_id=issue_17.id),
        Notification(user_id=david.id, type="assigned", title="New issue assigned",
                     message="INT-19: Sprint retrospective board assigned to you.", issue_id=None, read=True),
    ]
    db.add_all(notifs)
    db.commit()

    # ── Wiki Pages ────────────────────────────────────────────────────────────
    wiki_pages = [
        WikiPage(title="Getting Started", project_id=proj1.id, author_id=alice.id,
                 content="# Getting Started\n\nWelcome to **IntelliTract**! This guide will help you get up and running.\n\n## Quick Start\n\n1. Create a project\n2. Add team members\n3. Create a sprint\n4. Add issues to your backlog\n5. Start sprinting!\n\n## Key Concepts\n\n- **Issues** are the fundamental unit of work\n- **Sprints** are time-boxed iterations (1-4 weeks)\n- **Epics** group related stories and tasks\n- **Boards** visualize work in progress"),
        WikiPage(title="Architecture Decision Records", project_id=proj1.id, author_id=alice.id,
                 content="# Architecture Decision Records\n\n## ADR-001: FastAPI over Django\n\n**Status:** Accepted\n\n**Context:** We needed a lightweight, async-capable Python backend.\n\n**Decision:** Use FastAPI with SQLAlchemy for the backend service layer.\n\n**Consequences:** Faster development, automatic OpenAPI docs, async support for future WebSocket integration.\n\n## ADR-002: SQLite for Development, PostgreSQL for Production\n\n**Status:** Accepted\n\nSQLite enables zero-config local development. The ORM abstraction ensures a clean migration path to PostgreSQL."),
        WikiPage(title="Sprint Process", project_id=proj1.id, author_id=bob.id,
                 content="# Sprint Process\n\n## Sprint Cadence\n\nWe run **2-week sprints** starting Monday and ending Friday.\n\n## Ceremonies\n\n| Ceremony | When | Duration |\n|---|---|---|\n| Sprint Planning | Monday (Sprint start) | 2h |\n| Daily Standup | Every morning | 15min |\n| Sprint Review | Friday (Sprint end) | 1h |\n| Retrospective | Friday (Sprint end) | 1h |\n\n## Definition of Done\n\n- Code reviewed and approved\n- Tests written and passing\n- Deployed to staging\n- Product Owner accepted"),
        WikiPage(title="API Documentation", project_id=proj1.id, author_id=david.id,
                 content="# IntelliTract API Documentation\n\nBase URL: `http://localhost:8000`\n\n## Authentication\n\nAll authenticated endpoints require the `Authorization: Bearer <token>` header.\n\n## Key Endpoints\n\n### Issues\n- `GET /issues` — List all issues with filters\n- `POST /issues` — Create a new issue\n- `PUT /issues/{id}` — Update an issue\n- `DELETE /issues/{id}` — Delete an issue\n\n### Sprints\n- `GET /sprints` — List sprints\n- `POST /sprints/{id}/start` — Start a sprint\n- `POST /sprints/{id}/complete` — Complete a sprint"),
        WikiPage(title="On-Call Runbook", project_id=proj1.id, author_id=frank.id,
                 content="# On-Call Runbook\n\n## Severity Levels\n\n| Severity | Response Time | Resolution Time |\n|---|---|---|\n| P0 - Critical | 15 min | 4 hours |\n| P1 - High | 1 hour | 8 hours |\n| P2 - Medium | 4 hours | 24 hours |\n\n## Common Issues\n\n### Database Connection Pool Exhausted\n1. Check `pg_stat_activity` for long-running queries\n2. Kill blocking queries: `SELECT pg_terminate_backend(pid)`\n3. Restart the connection pool\n\n### High Memory Usage\n1. Check for memory leaks in recent deployments\n2. Review Datadog dashboards for anomalies\n3. Rolling restart pods if needed"),
    ]
    db.add_all(wiki_pages)
    db.commit()

    # ── Legacy Tasks (backward compat) ───────────────────────────────────────
    sprint_legacy = Sprint(name="Sprint 04 (Legacy)", goal="Build dashboard and AI recommendation MVP")
    db.add(sprint_legacy)
    db.commit()
    db.refresh(sprint_legacy)

    tasks = [
        Task(title="Build dashboard API", description="Return sprint progress metrics",
             status="In Progress", required_skills="Python,SQL",
             assignee_id=david.id, sprint_id=sprint_legacy.id),
        Task(title="Create profile form UI", description="Frontend form for editing developer profile",
             status="To Do", required_skills="React,JavaScript",
             assignee_id=eva.id, sprint_id=sprint_legacy.id),
        Task(title="Write notification logic", description="Detect stale and overloaded tasks",
             status="Done", required_skills="Python",
             assignee_id=david.id, sprint_id=sprint_legacy.id),
    ]
    db.add_all(tasks)
    db.commit()
    db.close()
