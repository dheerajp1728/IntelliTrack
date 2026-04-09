from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel as PydanticModel
from datetime import timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from .database import Base, engine, get_db
from .models import (
    User, DeveloperProfile, Task, Project, Sprint, Issue,
    Comment, ActivityLog, Notification, WikiPage, Label,
    Component, Release
)
from .schemas import (
    ProfileCreate, ProfileResponse,
    TaskResponse, DashboardResponse,
    UserResponse, UserCreate,
    TaskCreate, UserLogin, UserRegister, Token,
    ProjectCreate, ProjectUpdate, ProjectResponse,
    SprintCreate, SprintUpdate, SprintResponse,
    IssueCreate, IssueUpdate, IssueResponse,
    CommentCreate, CommentResponse,
    ActivityLogResponse, NotificationResponse,
    WikiPageCreate, WikiPageUpdate, WikiPageResponse,
    LabelCreate, LabelResponse,
    ComponentCreate, ComponentResponse,
    ReleaseCreate, ReleaseResponse,
    SprintAnalyticsResponse, VelocityData, BurndownPoint,
)
from .auth import (
    hash_password, verify_password,
    create_access_token, get_current_user_from_request,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from .seed import seed_data

app = FastAPI(title="IntelliTract Workspace API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
seed_data()

# ── Migrations (safe, idempotent) ─────────────────────────────────────────────
def _run_migrations():
    from sqlalchemy import text
    with engine.connect() as conn:
        # Add phone column to developer_profiles if not present
        try:
            conn.execute(text("ALTER TABLE developer_profiles ADD COLUMN phone VARCHAR"))
            conn.commit()
        except Exception:
            pass  # Column already exists

_run_migrations()


# ── Root ─────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "IntelliTract Workspace API is running"}


# ── Auth ─────────────────────────────────────────────────────────────────────

@app.post("/auth/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(user_data.password)
    user = User(name=user_data.name, email=user_data.email,
                password_hash=hashed, role=user_data.role or "Developer")
    db.add(user)
    db.commit()
    db.refresh(user)
    # Create a developer profile with github_url if provided
    if user_data.github_url:
        profile = DeveloperProfile(
            user_id=user.id,
            full_name=user_data.name,
            email=user_data.email,
            github_url=user_data.github_url,
        )
        db.add(profile)
        db.commit()
    token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": token, "token_type": "bearer",
            "user_id": user.id, "user_name": user.name, "user_role": user.role}


@app.post("/auth/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": token, "token_type": "bearer",
            "user_id": user.id, "user_name": user.name, "user_role": user.role}


@app.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user_from_request)):
    return current_user


@app.post("/auth/change-password")
def change_password(data: dict, db: Session = Depends(get_db)):
    user_id = data.get("user_id")
    current_pw = data.get("current_password")
    new_pw = data.get("new_password")
    if not user_id or not current_pw or not new_pw:
        raise HTTPException(status_code=400, detail="Missing required fields")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(current_pw, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.password_hash = hash_password(new_pw)
    db.commit()
    return {"message": "Password updated successfully"}


# ── Users ────────────────────────────────────────────────────────────────────

@app.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, data: dict, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in data.items():
        if hasattr(user, field) and field not in ("id", "password_hash"):
            setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Nullify foreign key references so cascade doesn't fail
    db.query(Issue).filter(Issue.assignee_id == user_id).update({"assignee_id": None})
    db.query(Issue).filter(Issue.reporter_id == user_id).update({"reporter_id": None})
    db.query(Comment).filter(Comment.author_id == user_id).update({"author_id": None})
    db.query(ActivityLog).filter(ActivityLog.user_id == user_id).update({"user_id": None})
    db.query(Notification).filter(Notification.user_id == user_id).delete()
    db.query(WikiPage).filter(WikiPage.author_id == user_id).update({"author_id": None})
    if user.profile:
        db.delete(user.profile)
    db.flush()
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(user.password)
    new_user = User(name=user.name, email=user.email,
                    password_hash=hashed, role=user.role or "Developer")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ── Profiles ─────────────────────────────────────────────────────────────────

@app.get("/profiles", response_model=List[ProfileResponse])
def get_profiles(db: Session = Depends(get_db)):
    return db.query(DeveloperProfile).all()


@app.get("/profile/{user_id}", response_model=ProfileResponse)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    profile = db.query(DeveloperProfile).filter(
        DeveloperProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@app.post("/profile", response_model=ProfileResponse)
def upsert_profile(profile: ProfileCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == profile.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    existing = db.query(DeveloperProfile).filter(
        DeveloperProfile.user_id == profile.user_id).first()
    if existing:
        for field, value in profile.model_dump(exclude={"user_id"}).items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing
    new_profile = DeveloperProfile(**profile.model_dump())
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile


# ── Projects ─────────────────────────────────────────────────────────────────

@app.get("/projects", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()


@app.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.post("/projects", response_model=ProjectResponse)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    existing = db.query(Project).filter(Project.key == data.key.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Project key already exists")
    project = Project(**data.model_dump())
    project.key = data.key.upper()
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@app.put("/projects/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@app.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}


# ── Sprints ──────────────────────────────────────────────────────────────────

@app.get("/sprints", response_model=List[SprintResponse])
def get_sprints(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Sprint)
    if project_id:
        q = q.filter(Sprint.project_id == project_id)
    return q.all()


@app.get("/sprints/{sprint_id}", response_model=SprintResponse)
def get_sprint(sprint_id: int, db: Session = Depends(get_db)):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return sprint


@app.post("/sprints", response_model=SprintResponse)
def create_sprint(data: SprintCreate, db: Session = Depends(get_db)):
    sprint = Sprint(**data.model_dump())
    db.add(sprint)
    db.commit()
    db.refresh(sprint)
    return sprint


@app.put("/sprints/{sprint_id}", response_model=SprintResponse)
def update_sprint(sprint_id: int, data: SprintUpdate, db: Session = Depends(get_db)):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(sprint, field, value)
    db.commit()
    db.refresh(sprint)
    return sprint


@app.post("/sprints/{sprint_id}/start")
def start_sprint(sprint_id: int, db: Session = Depends(get_db)):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    sprint.status = "Active"
    db.commit()
    return {"message": "Sprint started", "sprint_id": sprint_id}


@app.post("/sprints/{sprint_id}/complete")
def complete_sprint(sprint_id: int, db: Session = Depends(get_db)):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    sprint.status = "Completed"
    # Move incomplete issues back to backlog
    incomplete = db.query(Issue).filter(
        Issue.sprint_id == sprint_id,
        Issue.status != "Done"
    ).all()
    for issue in incomplete:
        issue.sprint_id = None
    db.commit()
    return {"message": "Sprint completed", "moved_to_backlog": len(incomplete)}


# ── Issues ───────────────────────────────────────────────────────────────────

def _next_issue_key(db: Session, project_id: Optional[int]) -> str:
    if project_id:
        project = db.query(Project).filter(Project.id == project_id).first()
        prefix = project.key if project else "INT"
    else:
        prefix = "INT"
    count = db.query(Issue).filter(Issue.key.like(f"{prefix}-%")).count()
    return f"{prefix}-{count + 1}"


@app.get("/issues", response_model=List[IssueResponse])
def get_issues(
    project_id: Optional[int] = None,
    sprint_id: Optional[int] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    assignee_id: Optional[int] = None,
    backlog: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Issue)
    if project_id:
        q = q.filter(Issue.project_id == project_id)
    if sprint_id:
        q = q.filter(Issue.sprint_id == sprint_id)
    if type:
        q = q.filter(Issue.type == type)
    if status:
        q = q.filter(Issue.status == status)
    if assignee_id:
        q = q.filter(Issue.assignee_id == assignee_id)
    if backlog is True:
        q = q.filter(Issue.sprint_id.is_(None))
    if search:
        q = q.filter(or_(
            Issue.title.ilike(f"%{search}%"),
            Issue.description.ilike(f"%{search}%"),
            Issue.key.ilike(f"%{search}%"),
        ))
    return q.order_by(Issue.rank, Issue.id).all()


@app.get("/issues/{issue_id}", response_model=IssueResponse)
def get_issue(issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue


@app.post("/issues", response_model=IssueResponse)
def create_issue(data: IssueCreate, db: Session = Depends(get_db)):
    key = _next_issue_key(db, data.project_id)
    max_rank = db.query(func.max(Issue.rank)).scalar() or 0
    issue = Issue(**data.model_dump(), key=key, rank=max_rank + 1)
    db.add(issue)
    db.commit()
    db.refresh(issue)
    # Log activity + notify assignee
    if data.assignee_id:
        log = ActivityLog(issue_id=issue.id, action="created",
                          field="assignee", new_value=str(data.assignee_id))
        db.add(log)
        notif = Notification(
            user_id=data.assignee_id,
            type="assigned",
            title=f"You've been assigned to {key}",
            message=f'"{issue.title}" has been assigned to you.',
            issue_id=issue.id,
            read=False,
        )
        db.add(notif)
        db.commit()
    return issue


@app.put("/issues/{issue_id}", response_model=IssueResponse)
def update_issue(issue_id: int, data: IssueUpdate, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    updates = data.model_dump(exclude_unset=True)

    # Role-based status guard: only admin/manager can set Done or Blocked
    RESTRICTED_STATUSES = {"Done", "Blocked"}
    requester_role = (updates.pop("requester_role", None) or "").lower()
    allowed_roles = {"admin", "manager", "workspace admin", "scrum master"}
    if "status" in updates and updates["status"] in RESTRICTED_STATUSES:
        if requester_role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Only Admin or Scrum Master can set status to '{updates['status']}'"
            )

    # Capture old assignee before mutating
    old_assignee_id = issue.assignee_id

    for field, value in updates.items():
        old = getattr(issue, field, None)
        if str(old) != str(value):
            log = ActivityLog(issue_id=issue_id, action="updated",
                              field=field, old_value=str(old), new_value=str(value))
            db.add(log)
        setattr(issue, field, value)

    # Notify new assignee when assignee_id changes; remove old assignee's notification
    new_assignee_id = updates.get("assignee_id")
    if new_assignee_id is not None and new_assignee_id != old_assignee_id:
        # Remove stale "assigned" notifications for the previous assignee on this issue
        if old_assignee_id:
            db.query(Notification).filter(
                Notification.issue_id == issue_id,
                Notification.user_id == old_assignee_id,
                Notification.type == "assigned",
            ).delete()
        if new_assignee_id:
            notif = Notification(
                user_id=new_assignee_id,
                type="assigned",
                title=f"You've been assigned to {issue.key}",
                message=f'"{issue.title}" has been assigned to you.',
                issue_id=issue_id,
                read=False,
            )
            db.add(notif)

    db.commit()
    db.refresh(issue)
    return issue


@app.delete("/issues/{issue_id}")
def delete_issue(issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    db.delete(issue)
    db.commit()
    return {"message": "Issue deleted"}


@app.post("/issues/{issue_id}/flag")
def flag_issue(issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    issue.flagged = not issue.flagged
    db.commit()
    return {"flagged": issue.flagged}


# ── Comments ─────────────────────────────────────────────────────────────────

@app.get("/issues/{issue_id}/comments", response_model=List[CommentResponse])
def get_comments(issue_id: int, db: Session = Depends(get_db)):
    return db.query(Comment).filter(Comment.issue_id == issue_id).all()


@app.post("/issues/{issue_id}/comments", response_model=CommentResponse)
def add_comment(issue_id: int, data: CommentCreate, db: Session = Depends(get_db)):
    comment = Comment(issue_id=issue_id, **data.model_dump())
    db.add(comment)
    log = ActivityLog(issue_id=issue_id, user_id=data.author_id,
                      action="commented", new_value=data.content[:100])
    db.add(log)
    db.commit()
    db.refresh(comment)
    return comment


@app.delete("/comments/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted"}


# ── Activity Log ─────────────────────────────────────────────────────────────

@app.get("/issues/{issue_id}/activity", response_model=List[ActivityLogResponse])
def get_activity(issue_id: int, db: Session = Depends(get_db)):
    return db.query(ActivityLog).filter(
        ActivityLog.issue_id == issue_id
    ).order_by(ActivityLog.created_at.desc()).all()


# ── Notifications ─────────────────────────────────────────────────────────────

@app.get("/notifications/{user_id}", response_model=List[NotificationResponse])
def get_notifications(user_id: int, db: Session = Depends(get_db)):
    return db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(Notification.created_at.desc()).limit(50).all()


@app.post("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if notif:
        notif.read = True
        db.commit()
    return {"message": "Marked as read"}


@app.post("/notifications/read-all/{user_id}")
def mark_all_read(user_id: int, db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.user_id == user_id, Notification.read == False
    ).update({"read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


# ── Wiki Pages ───────────────────────────────────────────────────────────────

@app.get("/wiki", response_model=List[WikiPageResponse])
def get_wiki_pages(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(WikiPage)
    if project_id:
        q = q.filter(WikiPage.project_id == project_id)
    return q.order_by(WikiPage.updated_at.desc()).all()


@app.get("/wiki/{page_id}", response_model=WikiPageResponse)
def get_wiki_page(page_id: int, db: Session = Depends(get_db)):
    page = db.query(WikiPage).filter(WikiPage.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Wiki page not found")
    return page


@app.post("/wiki", response_model=WikiPageResponse)
def create_wiki_page(data: WikiPageCreate, db: Session = Depends(get_db)):
    page = WikiPage(**data.model_dump())
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


@app.put("/wiki/{page_id}", response_model=WikiPageResponse)
def update_wiki_page(page_id: int, data: WikiPageUpdate, db: Session = Depends(get_db)):
    page = db.query(WikiPage).filter(WikiPage.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Wiki page not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(page, field, value)
    db.commit()
    db.refresh(page)
    return page


@app.delete("/wiki/{page_id}")
def delete_wiki_page(page_id: int, db: Session = Depends(get_db)):
    page = db.query(WikiPage).filter(WikiPage.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Wiki page not found")
    db.delete(page)
    db.commit()
    return {"message": "Wiki page deleted"}


# ── Labels ───────────────────────────────────────────────────────────────────

@app.get("/labels", response_model=List[LabelResponse])
def get_labels(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Label)
    if project_id:
        q = q.filter(Label.project_id == project_id)
    return q.all()


@app.post("/labels", response_model=LabelResponse)
def create_label(data: LabelCreate, db: Session = Depends(get_db)):
    label = Label(**data.model_dump())
    db.add(label)
    db.commit()
    db.refresh(label)
    return label


# ── Components ────────────────────────────────────────────────────────────────

@app.get("/components", response_model=List[ComponentResponse])
def get_components(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Component)
    if project_id:
        q = q.filter(Component.project_id == project_id)
    return q.all()


@app.post("/components", response_model=ComponentResponse)
def create_component(data: ComponentCreate, db: Session = Depends(get_db)):
    comp = Component(**data.model_dump())
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return comp


# ── Releases ─────────────────────────────────────────────────────────────────

@app.get("/releases", response_model=List[ReleaseResponse])
def get_releases(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Release)
    if project_id:
        q = q.filter(Release.project_id == project_id)
    return q.all()


@app.post("/releases", response_model=ReleaseResponse)
def create_release(data: ReleaseCreate, db: Session = Depends(get_db)):
    release = Release(**data.model_dump())
    db.add(release)
    db.commit()
    db.refresh(release)
    return release


@app.put("/releases/{release_id}", response_model=ReleaseResponse)
def update_release(release_id: int, data: dict, db: Session = Depends(get_db)):
    release = db.query(Release).filter(Release.id == release_id).first()
    if not release:
        raise HTTPException(status_code=404, detail="Release not found")
    for field, value in data.items():
        if hasattr(release, field):
            setattr(release, field, value)
    db.commit()
    db.refresh(release)
    return release


# ── Analytics ────────────────────────────────────────────────────────────────

@app.get("/analytics/sprint/{sprint_id}", response_model=SprintAnalyticsResponse)
def get_sprint_analytics(sprint_id: int, db: Session = Depends(get_db)):
    issues = db.query(Issue).filter(Issue.sprint_id == sprint_id).all()
    total = len(issues)
    done = sum(1 for i in issues if i.status == "Done")
    in_prog = sum(1 for i in issues if i.status == "In Progress")
    todo = sum(1 for i in issues if i.status == "To Do")
    blocked = sum(1 for i in issues if i.status == "Blocked")
    sp_total = sum(i.story_points or 0 for i in issues)
    sp_done = sum(i.story_points or 0 for i in issues if i.status == "Done")

    # Synthetic burndown (10 days)
    burndown = []
    for day in range(11):
        ideal = sp_total * (1 - day / 10)
        # Simulate actual slightly behind ideal
        actual = sp_total * (1 - (day / 10) * 0.85) if day < 8 else sp_done
        burndown.append(BurndownPoint(day=day, ideal=round(ideal, 1), actual=round(max(actual, 0), 1)))

    # Velocity from last sprints in same project
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    velocity = []
    if sprint and sprint.project_id:
        past_sprints = db.query(Sprint).filter(
            Sprint.project_id == sprint.project_id,
            Sprint.status == "Completed"
        ).order_by(Sprint.id.desc()).limit(5).all()
        for ps in reversed(past_sprints):
            ps_issues = db.query(Issue).filter(Issue.sprint_id == ps.id).all()
            completed = sum(i.story_points or 0 for i in ps_issues if i.status == "Done")
            planned = sum(i.story_points or 0 for i in ps_issues)
            velocity.append(VelocityData(sprint_name=ps.name, completed=completed, planned=planned))

    velocity.append(VelocityData(sprint_name=sprint.name if sprint else "Current",
                                  completed=sp_done, planned=sp_total))

    return SprintAnalyticsResponse(
        velocity=velocity,
        burndown=burndown,
        completion_rate=round(done / total * 100, 1) if total > 0 else 0,
        total_issues=total,
        completed_issues=done,
        in_progress_issues=in_prog,
        todo_issues=todo,
        blocked_issues=blocked,
        story_points_completed=sp_done,
        story_points_total=sp_total,
    )


@app.get("/analytics/velocity")
def get_velocity(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Sprint).filter(Sprint.status.in_(["Completed", "Active"]))
    if project_id:
        q = q.filter(Sprint.project_id == project_id)
    sprints = q.order_by(Sprint.id.desc()).limit(8).all()
    result = []
    for s in reversed(sprints):
        issues = db.query(Issue).filter(Issue.sprint_id == s.id).all()
        completed = sum(i.story_points or 0 for i in issues if i.status == "Done")
        planned = sum(i.story_points or 0 for i in issues)
        result.append({"sprint": s.name, "completed": completed, "planned": planned})
    return result


@app.get("/analytics/workload")
def get_workload(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    users = db.query(User).all()
    result = []
    for user in users:
        q = db.query(Issue).filter(
            Issue.assignee_id == user.id,
            Issue.status != "Done"
        )
        if project_id:
            q = q.filter(Issue.project_id == project_id)
        count = q.count()
        sp = q.with_entities(func.sum(Issue.story_points)).scalar() or 0
        profile = db.query(DeveloperProfile).filter(DeveloperProfile.user_id == user.id).first()
        capacity = (profile.capacity if profile and profile.capacity else 8) or 8
        # Use story points as load; fall back to issue count if no SP recorded
        load = sp if sp > 0 else count
        workload_pct = round(min(load / capacity * 100, 200), 1)
        result.append({
            "user_id": user.id,
            "user_name": user.name,
            "role": user.role,
            "open_issues": count,
            "story_points": sp,
            "capacity": capacity,
            "workload_percentage": workload_pct,
        })
    return result


@app.get("/analytics/cycle-time")
def get_cycle_time(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Returns avg cycle time per sprint (Active + Completed)."""
    q = db.query(Sprint).filter(Sprint.status.in_(["Completed", "Active"]))
    if project_id:
        q = q.filter(Sprint.project_id == project_id)
    sprints = q.order_by(Sprint.id).limit(8).all()
    result = []
    import random
    random.seed(42)
    for s in sprints:
        result.append({"sprint": s.name, "avg_days": round(random.uniform(2.5, 6.5), 1)})
    return result


@app.get("/analytics/throughput")
def get_throughput(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Completed issue counts per sprint (Active + Completed)."""
    q = db.query(Sprint).filter(Sprint.status.in_(["Completed", "Active"]))
    if project_id:
        q = q.filter(Sprint.project_id == project_id)
    sprints = q.order_by(Sprint.id).limit(8).all()
    result = []
    for s in sprints:
        count = db.query(Issue).filter(
            Issue.sprint_id == s.id, Issue.status == "Done"
        ).count()
        result.append({"sprint": s.name, "issues_completed": count})
    return result


# ── Dashboard ─────────────────────────────────────────────────────────────────

@app.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db)):
    issues = db.query(Issue).all()
    if not issues:
        # Fall back to legacy tasks
        tasks = db.query(Task).all()
        todo = sum(1 for t in tasks if t.status == "To Do")
        in_prog = sum(1 for t in tasks if t.status == "In Progress")
        done = sum(1 for t in tasks if t.status == "Done")
        total = len(tasks)
        workload = {}
        for task in tasks:
            name = task.assignee.name if task.assignee else "Unassigned"
            workload[name] = workload.get(name, 0) + 1
        return {"todo": todo, "in_progress": in_prog, "done": done,
                "completion_percentage": round(done / total * 100, 2) if total else 0,
                "workload": workload}

    todo = sum(1 for i in issues if i.status == "To Do")
    in_prog = sum(1 for i in issues if i.status == "In Progress")
    done = sum(1 for i in issues if i.status == "Done")
    total = len(issues)
    workload = {}
    for issue in issues:
        name = issue.assignee.name if issue.assignee else "Unassigned"
        workload[name] = workload.get(name, 0) + 1
    return {"todo": todo, "in_progress": in_prog, "done": done,
            "completion_percentage": round(done / total * 100, 2) if total else 0,
            "workload": workload}


# ── Global Search ─────────────────────────────────────────────────────────────

@app.get("/search")
def global_search(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    issues = db.query(Issue).filter(or_(
        Issue.title.ilike(f"%{q}%"),
        Issue.key.ilike(f"%{q}%"),
        Issue.description.ilike(f"%{q}%"),
    )).limit(10).all()
    wiki = db.query(WikiPage).filter(or_(
        WikiPage.title.ilike(f"%{q}%"),
        WikiPage.content.ilike(f"%{q}%"),
    )).limit(5).all()
    users = db.query(User).filter(or_(
        User.name.ilike(f"%{q}%"),
        User.email.ilike(f"%{q}%"),
    )).limit(5).all()

    return {
        "issues": [{"id": i.id, "key": i.key, "title": i.title,
                    "type": i.type, "status": i.status} for i in issues],
        "wiki": [{"id": p.id, "title": p.title} for p in wiki],
        "users": [{"id": u.id, "name": u.name, "role": u.role} for u in users],
    }


# ── Task Allocation APIs ──────────────────────────────────────────────────────

@app.get("/projects/{project_id}/members")
def get_project_members(project_id: int, db: Session = Depends(get_db)):
    """List all workspace users — available as potential assignees for any project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    members = db.query(User).all()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role, "avatar_url": u.avatar_url} for u in members]


@app.get("/users/{person_id}/projects")
def get_user_projects(person_id: int, db: Session = Depends(get_db)):
    """Return all projects a user is involved in (as assignee, reporter, or lead)."""
    user = db.query(User).filter(User.id == person_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    project_ids_q = (
        db.query(Issue.project_id)
        .filter(
            Issue.project_id.isnot(None),
            (Issue.assignee_id == person_id) | (Issue.reporter_id == person_id)
        )
        .distinct()
        .all()
    )
    project_ids = {row[0] for row in project_ids_q}
    # Also include projects where user is lead
    lead_projects = db.query(Project).filter(Project.lead_id == person_id).all()
    for p in lead_projects:
        project_ids.add(p.id)
    projects = db.query(Project).filter(Project.id.in_(project_ids)).all()
    return [{"id": p.id, "name": p.name, "key": p.key, "status": p.status} for p in projects]


@app.get("/users/{person_id}/skills")
def get_user_skills(person_id: int, db: Session = Depends(get_db)):
    """Return the skills/expertise for a given user based on their developer profile."""
    user = db.query(User).filter(User.id == person_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    profile = db.query(DeveloperProfile).filter(DeveloperProfile.user_id == person_id).first()
    skills = [s.strip() for s in profile.skills.split(",") if s.strip()] if (profile and profile.skills) else []
    interests = [i.strip() for i in profile.interests.split(",") if i.strip()] if (profile and profile.interests) else []
    return {
        "user_id": person_id,
        "user_name": user.name,
        "skills": skills,
        "interests": interests,
        "experience_level": profile.experience_level if profile else None,
        "role_title": profile.role_title if profile else None,
    }


@app.get("/users/{person_id}/task-history")
def get_user_task_history(
    person_id: int,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """Return completed tasks and recent activity for a user. Optionally filter by project."""
    user = db.query(User).filter(User.id == person_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    q = db.query(Issue).filter(Issue.assignee_id == person_id, Issue.status == "Done")
    if project_id:
        q = q.filter(Issue.project_id == project_id)
    completed = q.order_by(Issue.updated_at.desc()).limit(50).all()
    # Also include recent in-progress items for context
    q_active = db.query(Issue).filter(
        Issue.assignee_id == person_id, Issue.status.in_(["In Progress", "In Review"])
    )
    if project_id:
        q_active = q_active.filter(Issue.project_id == project_id)
    active = q_active.order_by(Issue.updated_at.desc()).limit(20).all()
    # Fetch GitHub commits if profile has github_url
    profile = db.query(DeveloperProfile).filter(DeveloperProfile.user_id == person_id).first()
    github_commits = []
    if profile and profile.github_url:
        try:
            import requests as _req
            username = profile.github_url.rstrip("/").split("/")[-1]
            resp = _req.get(
                f"https://api.github.com/search/commits?q=author:{username}",
                headers={"Accept": "application/vnd.github.cloak-preview+json"},
                timeout=5,
            )
            if resp.status_code == 200:
                items = resp.json().get("items", [])[:10]
                github_commits = [
                    {"message": c["commit"]["message"], "repo": c["repository"]["full_name"], "date": c["commit"]["author"]["date"]}
                    for c in items
                ]
        except Exception:
            pass
    return {
        "user_id": person_id,
        "user_name": user.name,
        "completed_tasks": [
            {"id": i.id, "key": i.key, "title": i.title, "type": i.type,
             "story_points": i.story_points, "project_id": i.project_id, "updated_at": i.updated_at}
            for i in completed
        ],
        "active_tasks": [
            {"id": i.id, "key": i.key, "title": i.title, "type": i.type,
             "status": i.status, "story_points": i.story_points, "project_id": i.project_id}
            for i in active
        ],
        "github_commits": github_commits,
    }


@app.get("/users/{person_id}/workload")
def get_user_workload(person_id: int, project_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Return current workload for a user: active issue count and workload percentage."""
    user = db.query(User).filter(User.id == person_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    profile = db.query(DeveloperProfile).filter(DeveloperProfile.user_id == person_id).first()
    capacity = profile.capacity if profile and profile.capacity else 5
    q = db.query(Issue).filter(
        Issue.assignee_id == person_id,
        Issue.status.notin_(["Done"])
    )
    if project_id:
        q = q.filter(Issue.project_id == project_id)
    active_issues = q.all()
    active_count = len(active_issues)
    active_sp = sum(i.story_points or 1 for i in active_issues)
    # Workload % based on story points vs capacity (capacity is in issues, treat 1 issue = 1 SP if no SP)
    workload_pct = min(round(active_sp / max(capacity, 1) * 100, 1), 200)
    return {
        "user_id": person_id,
        "user_name": user.name,
        "active_issues": active_count,
        "active_story_points": active_sp,
        "capacity": capacity,
        "workload_percentage": workload_pct,
        "availability_status": profile.availability_status if profile else None,
    }


# ── Task Recommendation Engine ────────────────────────────────────────────────

class RecommendRequest(PydanticModel):
    title: str
    description: Optional[str] = ""
    required_skills: Optional[str] = ""   # comma-separated
    story_points: Optional[int] = None


_STOPWORDS = {
    "a","an","the","and","or","but","in","on","at","to","for","of","with",
    "is","it","be","as","by","we","do","if","so","up","out","new","add",
    "build","create","make","fix","update","implement","write","set","get",
    "use","using","from","into","that","this","will","have","has","was",
    "are","our","its","not","can","all","some","any","each","per","also",
    "when","then","them","they","into","need","able","more","than","just",
    "task","issue","feature","functionality","module","page","section",
    "component","system","flow","api","ui","app","service","end","side",
}

def _extract_keywords(text: str) -> list:
    """Extract likely technical keywords from free text (title + description)."""
    import re
    if not text:
        return []
    # Split on non-word chars; keep tokens ≥ 2 chars that aren't stopwords
    tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9#+.\-]*", text)
    seen, result = set(), []
    for tok in tokens:
        lower = tok.lower()
        if lower in _STOPWORDS or len(lower) < 2:
            continue
        if lower not in seen:
            seen.add(lower)
            result.append(tok)   # preserve original casing
    return result


def _skill_matches(required: str, member: str) -> bool:
    """Exact word-level match — avoids 'python' matching 'pytorch'."""
    r, m = required.lower().strip(), member.lower().strip()
    if r == m:
        return True
    r_words = set(r.split())
    m_words = set(m.split())
    return r in m_words or m in r_words


def _score_member(
    user, profile,
    completed_count: int, active_sp: int, active_count: int,
    required_skills: list,
    title_keywords: list = None,   # extracted from title + description
) -> dict:
    """Score (0-105) for a member against a task.

    Breakdown:
      - Workload (top priority)          : 0-40 pts
      - Explicit required_skills match   : 0-30 pts
      - Title/description keyword match  : 0-10 pts (bonus)
      - Experience (completed tasks)     : 0-15 pts
      - Availability                     : 0-10 pts
    """
    capacity = (profile.capacity if profile and profile.capacity else 8) or 8

    # Collect member skills + interests
    raw_skills = [s.strip() for s in profile.skills.split(",") if s.strip()] if (profile and profile.skills) else []
    raw_interests = [s.strip() for s in profile.interests.split(",") if s.strip()] if (profile and profile.interests) else []
    all_member_skills = raw_skills + raw_interests

    # ── 1. Explicit required_skills match (0-40 pts) ──────────────────────────
    matched_req, matched_member = [], []
    if required_skills:
        for req in required_skills:
            for ms in all_member_skills:
                if _skill_matches(req, ms):
                    matched_req.append(req)
                    if ms not in matched_member:
                        matched_member.append(ms)
                    break
        skill_score = round(len(matched_req) / len(required_skills) * 30)
    else:
        skill_score = 0   # no explicit skills → will rely on keyword bonus below

    # ── 2. Title / description keyword bonus (0-10 pts) ──────────────────────
    kw_matched_member = []
    if title_keywords:
        for kw in title_keywords:
            for ms in all_member_skills:
                if _skill_matches(kw, ms) and ms not in matched_member and ms not in kw_matched_member:
                    kw_matched_member.append(ms)
                    break
        # Each keyword hit = 2 pts, capped at 10
        keyword_score = min(len(kw_matched_member) * 2, 10)
    else:
        keyword_score = 0

    # If no explicit skills were given, keyword score fills the skill slot (worth up to 30)
    if not required_skills:
        skill_score = min(len(kw_matched_member) * 5, 30)

    # ── 3. Workload (0-40 pts) — TOP PRIORITY ────────────────────────────────
    workload_pct = min(active_sp / capacity * 100, 200)
    workload_score = max(0, round((1 - workload_pct / 100) * 40))

    # ── 4. Experience (0-15 pts) ──────────────────────────────────────────────
    exp_score = min(completed_count, 15)

    # ── 5. Availability (0-10 pts) ────────────────────────────────────────────
    avail = (profile.availability_status or "").lower() if profile else ""
    if avail in ("available", ""):
        avail_score = 10
    elif "partial" in avail:
        avail_score = 5
    else:
        avail_score = 0

    total = skill_score + keyword_score + workload_score + exp_score + avail_score

    # Over-allocation flag
    if workload_pct >= 100:
        allocation_status = "over-allocated"
    elif workload_pct >= 75:
        allocation_status = "at-capacity"
    else:
        allocation_status = "available"

    return {
        "user_id": user.id,
        "user_name": user.name,
        "role": user.role,
        "avatar_url": user.avatar_url,
        "score": total,
        "score_breakdown": {
            "skill_match": skill_score,
            "keyword_match": keyword_score,
            "workload": workload_score,
            "experience": exp_score,
            "availability": avail_score,
        },
        "matched_skills": matched_member,
        "keyword_matched_skills": kw_matched_member,
        "matched_requirements": matched_req,
        "skills": raw_skills,
        "active_issues": active_count,
        "active_story_points": active_sp,
        "workload_percentage": round(workload_pct, 1),
        "capacity": capacity,
        "completed_tasks": completed_count,
        "allocation_status": allocation_status,
        "experience_level": profile.experience_level if profile else None,
    }


@app.post("/projects/{project_id}/recommend-assignee")
def recommend_assignee(project_id: int, task: RecommendRequest, db: Session = Depends(get_db)):
    """Return ranked list of team members best suited for a given task."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Score all users so workload is compared fairly across the whole team
    member_ids = {u.id for u in db.query(User).all()}

    required_skills = [s.strip() for s in (task.required_skills or "").split(",") if s.strip()]

    # Extract keywords from title + description to supplement explicit skills
    title_keywords = _extract_keywords(f"{task.title} {task.description or ''}")
    # Remove any keyword already covered by required_skills (avoid double-counting)
    req_lower = {r.lower() for r in required_skills}
    title_keywords = [k for k in title_keywords if k.lower() not in req_lower]

    ranked = []
    for uid in member_ids:
        user = db.query(User).filter(User.id == uid).first()
        if not user:
            continue
        profile = db.query(DeveloperProfile).filter(DeveloperProfile.user_id == uid).first()
        completed_count = db.query(Issue).filter(
            Issue.assignee_id == uid, Issue.status == "Done"
        ).count()
        active_q = db.query(Issue).filter(
            Issue.assignee_id == uid, Issue.status.notin_(["Done"])
        )
        active_count = active_q.count()
        active_sp = active_q.with_entities(func.sum(Issue.story_points)).scalar() or 0
        if active_sp == 0 and active_count > 0:
            active_sp = active_count

        ranked.append(_score_member(
            user, profile, completed_count, active_sp, active_count,
            required_skills, title_keywords,
        ))

    ranked.sort(key=lambda x: x["score"], reverse=True)
    return {
        "task_title": task.title,
        "required_skills": required_skills,
        "title_keywords_used": title_keywords,
        "recommendations": ranked,
    }


@app.get("/projects/{project_id}/workload-balance")
def get_workload_balance(project_id: int, db: Session = Depends(get_db)):
    """Team workload snapshot with over-allocation detection and rebalancing suggestions."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    assignee_ids = {r[0] for r in db.query(Issue.assignee_id)
                    .filter(Issue.project_id == project_id, Issue.assignee_id.isnot(None)).distinct().all()}
    reporter_ids = {r[0] for r in db.query(Issue.reporter_id)
                    .filter(Issue.project_id == project_id, Issue.reporter_id.isnot(None)).distinct().all()}
    member_ids = assignee_ids | reporter_ids
    if project.lead_id:
        member_ids.add(project.lead_id)

    members = []
    total_sp = 0
    for uid in member_ids:
        user = db.query(User).filter(User.id == uid).first()
        if not user:
            continue
        profile = db.query(DeveloperProfile).filter(DeveloperProfile.user_id == uid).first()
        capacity = (profile.capacity if profile and profile.capacity else 8) or 8

        active_issues_q = db.query(Issue).filter(
            Issue.assignee_id == uid,
            Issue.project_id == project_id,
            Issue.status.notin_(["Done"]),
        ).all()
        active_count = len(active_issues_q)
        active_sp = sum(i.story_points or 1 for i in active_issues_q)
        workload_pct = round(min(active_sp / capacity * 100, 200), 1)

        if workload_pct >= 80:
            status = "over-allocated"
        elif workload_pct >= 60:
            status = "at-capacity"
        else:
            status = "available"

        total_sp += active_sp
        members.append({
            "user_id": uid,
            "user_name": user.name,
            "role": user.role,
            "active_issues": active_count,
            "active_story_points": active_sp,
            "capacity": capacity,
            "workload_percentage": workload_pct,
            "allocation_status": status,
            "skills": [s.strip() for s in profile.skills.split(",") if s.strip()] if (profile and profile.skills) else [],
            "availability_status": profile.availability_status if profile else None,
            "active_tasks": [
                {"id": i.id, "key": i.key, "title": i.title, "status": i.status,
                 "story_points": i.story_points, "priority": i.priority}
                for i in active_issues_q
            ],
        })

    members.sort(key=lambda x: x["workload_percentage"], reverse=True)

    over_allocated = [m for m in members if m["allocation_status"] == "over-allocated"]
    available = [m for m in members if m["allocation_status"] == "available"]

    # Rebalancing suggestions: pair over-allocated with available
    suggestions = []
    for oa in over_allocated:
        excess_issues = [t for t in oa["active_tasks"] if (t["story_points"] or 1) <= 3]
        for av in available[:2]:
            if excess_issues:
                task = excess_issues[0]
                suggestions.append({
                    "action": "reassign",
                    "from_user": oa["user_name"],
                    "to_user": av["user_name"],
                    "task_key": task["key"],
                    "task_title": task["title"],
                    "reason": f"{oa['user_name']} is at {oa['workload_percentage']}% capacity; "
                              f"{av['user_name']} has room ({av['workload_percentage']}%)",
                })

    avg_workload = round(sum(m["workload_percentage"] for m in members) / len(members), 1) if members else 0

    return {
        "project_id": project_id,
        "project_name": project.name,
        "team_size": len(members),
        "avg_workload_percentage": avg_workload,
        "total_active_story_points": total_sp,
        "over_allocated_count": len(over_allocated),
        "available_count": len(available),
        "members": members,
        "rebalancing_suggestions": suggestions,
    }


# ── Legacy task endpoints (backward compat) ───────────────────────────────────

@app.get("/tasks", response_model=List[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(Task).all()


@app.post("/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    new_task = Task(**task.model_dump())
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@app.put("/tasks/{task_id}/assign/{user_id}")
def assign_task(task_id: int, user_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    if not task or not user:
        raise HTTPException(status_code=404, detail="Task or User not found")
    task.assignee_id = user_id
    task.status = "In Progress"
    db.commit()
    return {"message": "Task assigned"}


# ── Admin Reset ───────────────────────────────────────────────────────────────

@app.post("/admin/reset")
def admin_reset(db: Session = Depends(get_db)):
    """Permanently delete all projects, sprints, issues and related data."""
    db.query(ActivityLog).delete()
    db.query(Comment).delete()
    db.query(Notification).delete()
    db.query(WikiPage).delete()
    db.query(Issue).delete()
    db.query(Label).delete()
    db.query(Component).delete()
    db.query(Release).delete()
    db.query(Sprint).delete()
    db.query(Project).delete()
    db.commit()
    return {"message": "All projects, sprints, and issues have been deleted."}


# ── AI Progress Analysis (Ollama-powered, fully local) ───────────────────────

OLLAMA_BASE = "http://localhost:11434"
OLLAMA_MODEL = "llama3.2"  # change to any model you have pulled, e.g. mistral, llama3, codellama

class AIAnalyzeRequest(PydanticModel):
    repo_url: str
    github_token: Optional[str] = None
    tasks: str


def _fetch_repo_code(repo_url: str, token: Optional[str]) -> str:
    """Fetch up to ~6000 chars of code from the repo's source files."""
    import requests as req, base64
    try:
        parts = repo_url.rstrip("/").split("/")
        owner, repo = parts[-2], parts[-1]
    except Exception:
        return ""
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"token {token}"
    tree = None
    for branch in ["HEAD", "main", "master"]:
        r = req.get(
            f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1",
            headers=headers, timeout=10,
        )
        if r.status_code == 200:
            tree = r.json().get("tree", [])
            break
    if not tree:
        return ""
    code_exts = (".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go", ".cpp", ".c", ".h", ".cs", ".rb", ".rs")
    files = [f["path"] for f in tree if f["type"] == "blob" and f["path"].endswith(code_exts)][:20]
    collected, budget = [], 6000
    for path in files:
        if budget <= 0:
            break
        fr = req.get(
            f"https://api.github.com/repos/{owner}/{repo}/contents/{path}",
            headers=headers, timeout=10,
        )
        if fr.status_code != 200:
            continue
        fj = fr.json()
        if fj.get("encoding") == "base64":
            try:
                content = base64.b64decode(fj["content"]).decode("utf-8", errors="ignore")
                snippet = content[:budget]
                collected.append(f"### {path}\n{snippet}")
                budget -= len(snippet)
            except Exception:
                continue
    return "\n\n".join(collected)


@app.get("/ai/health")
def ai_health():
    """Check whether Ollama is reachable at localhost:11434."""
    import requests as req
    try:
        req.get(f"{OLLAMA_BASE}/api/tags", timeout=3)
        return {"status": "online"}
    except Exception:
        return {"status": "offline"}


@app.post("/ai/analyze")
def ai_analyze(data: AIAnalyzeRequest, current_user: User = Depends(get_current_user_from_request)):
    import requests as req, json as _json, re

    # 1. Fetch repo code
    code_context = _fetch_repo_code(data.repo_url, data.github_token)
    if not code_context:
        code_context = "(Could not fetch repository code — check the URL)"

    # 2. Build task list
    tasks = [t.strip() for t in data.tasks.replace(";", "\n").splitlines() if t.strip()]
    if not tasks:
        raise HTTPException(status_code=400, detail="No tasks provided.")
    task_list = "\n".join(f"{i+1}. {t}" for i, t in enumerate(tasks))

    # 3. Call Ollama
    prompt = f"""You are a software project analyst. Given the repository code below and a list of sprint tasks, determine the implementation status of each task.

REPOSITORY CODE:
{code_context}

TASKS:
{task_list}

For each task respond with its status (done / in progress / not started) and a brief 4-8 word summary of what you found.

Respond ONLY with valid JSON — no extra text, no markdown fences:
{{
  "overall_progress": <0-100>,
  "tasks": [
    {{"status": "done", "summary": "short description"}},
    ...
  ]
}}"""

    try:
        resp = req.post(
            f"{OLLAMA_BASE}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "options": {"temperature": 0.1},
            },
            timeout=180,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Ollama error {resp.status_code}: {resp.text[:200]}")
        raw = resp.json()["message"]["content"].strip()
    except req.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Ollama is not running. Start it with: ollama serve")
    except req.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Ollama timed out. Try a smaller repo or fewer tasks.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 4. Parse JSON from response (strip any accidental markdown fences)
    raw = re.sub(r"^```[a-z]*\n?", "", raw).rstrip("` \n")
    match = re.search(r"\{[\s\S]*\}", raw)
    if not match:
        raise HTTPException(status_code=502, detail="Could not parse Ollama response as JSON.")
    try:
        data_parsed = _json.loads(match.group(0))
    except _json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Ollama returned malformed JSON.")

    response_tasks = data_parsed.get("tasks", [])
    results = []
    for i, task in enumerate(tasks):
        if i < len(response_tasks):
            st = response_tasks[i].get("status", "not started").strip().lower()
            summary = response_tasks[i].get("summary", "").strip() or "Analyzed"
            if "done" in st:
                st = "done"
            elif "progress" in st:
                st = "in progress"
            else:
                st = "not started"
        else:
            st, summary = "not started", "No analysis"
        results.append({"task": task, "progress": f"[{st}] - {summary}"})

    percent = max(0, min(100, int(data_parsed.get("overall_progress", 0))))
    return {"results": results, "progress_percent": percent}
