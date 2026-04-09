from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


# ── Auth ─────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "Developer"
    github_url: Optional[str] = ""


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    user_name: str
    user_role: str


# ── User ─────────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "Developer"


# ── Developer Profile ────────────────────────────────────────────────────────

class ProfileCreate(BaseModel):
    user_id: int
    full_name: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    role_title: Optional[str] = ""
    department: Optional[str] = ""
    bio: Optional[str] = ""
    skills: Optional[str] = ""
    interests: Optional[str] = ""
    experience_level: Optional[str] = ""
    github_url: Optional[str] = ""
    linkedin_url: Optional[str] = ""
    current_workload: Optional[int] = 0
    capacity: Optional[int] = 5
    availability_status: Optional[str] = ""


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    role_title: Optional[str]
    department: Optional[str]
    bio: Optional[str]
    skills: Optional[str]
    interests: Optional[str]
    experience_level: Optional[str]
    github_url: Optional[str]
    linkedin_url: Optional[str]
    current_workload: Optional[int]
    capacity: Optional[int]
    availability_status: Optional[str]

    class Config:
        from_attributes = True


# ── Project ──────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    key: str
    description: Optional[str] = ""
    status: Optional[str] = "Active"
    category: Optional[str] = ""
    lead_id: Optional[int] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    lead_id: Optional[int] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    key: str
    description: Optional[str]
    status: str
    category: Optional[str]
    lead_id: Optional[int]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Sprint ───────────────────────────────────────────────────────────────────

class SprintCreate(BaseModel):
    name: str
    goal: Optional[str] = ""
    project_id: Optional[int] = None
    status: Optional[str] = "Planning"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    capacity: Optional[int] = 40


class SprintUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    capacity: Optional[int] = None


class SprintResponse(BaseModel):
    id: int
    name: str
    goal: Optional[str]
    project_id: Optional[int]
    status: str
    start_date: Optional[str]
    end_date: Optional[str]
    capacity: Optional[int]

    class Config:
        from_attributes = True


# ── Issue ────────────────────────────────────────────────────────────────────

class IssueCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    type: Optional[str] = "Story"
    status: Optional[str] = "To Do"
    priority: Optional[str] = "Major"
    story_points: Optional[int] = None
    project_id: Optional[int] = None
    sprint_id: Optional[int] = None
    epic_id: Optional[int] = None
    parent_id: Optional[int] = None
    assignee_id: Optional[int] = None
    reporter_id: Optional[int] = None
    labels: Optional[str] = ""
    components: Optional[str] = ""
    required_skills: Optional[str] = ""
    due_date: Optional[str] = None
    start_date: Optional[str] = None
    fix_version_id: Optional[int] = None
    time_estimate: Optional[int] = None


class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    story_points: Optional[int] = None
    sprint_id: Optional[int] = None
    epic_id: Optional[int] = None
    assignee_id: Optional[int] = None
    labels: Optional[str] = None
    components: Optional[str] = None
    due_date: Optional[str] = None
    start_date: Optional[str] = None
    fix_version_id: Optional[int] = None
    flagged: Optional[bool] = None
    rank: Optional[int] = None
    time_estimate: Optional[int] = None
    time_logged: Optional[int] = None
    requester_role: Optional[str] = None  # Used for role-based status guard


class IssueResponse(BaseModel):
    id: int
    key: str
    title: str
    description: Optional[str]
    type: str
    status: str
    priority: str
    story_points: Optional[int]
    time_estimate: Optional[int]
    time_logged: Optional[int]
    project_id: Optional[int]
    sprint_id: Optional[int]
    epic_id: Optional[int]
    parent_id: Optional[int]
    fix_version_id: Optional[int]
    assignee_id: Optional[int]
    reporter_id: Optional[int]
    labels: Optional[str]
    components: Optional[str]
    required_skills: Optional[str]
    due_date: Optional[str]
    start_date: Optional[str]
    flagged: bool
    rank: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    assignee: Optional[UserResponse] = None
    reporter: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ── Comment ──────────────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    content: str
    author_id: int


class CommentResponse(BaseModel):
    id: int
    issue_id: int
    author_id: int
    content: str
    created_at: Optional[datetime]
    author: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ── Activity Log ─────────────────────────────────────────────────────────────

class ActivityLogResponse(BaseModel):
    id: int
    issue_id: int
    user_id: Optional[int]
    action: str
    field: Optional[str]
    old_value: Optional[str]
    new_value: Optional[str]
    created_at: Optional[datetime]
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ── Notification ─────────────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    message: Optional[str]
    read: bool
    issue_id: Optional[int]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Wiki Page ────────────────────────────────────────────────────────────────

class WikiPageCreate(BaseModel):
    title: str
    content: Optional[str] = ""
    project_id: Optional[int] = None
    author_id: Optional[int] = None
    parent_id: Optional[int] = None


class WikiPageUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class WikiPageResponse(BaseModel):
    id: int
    title: str
    content: Optional[str]
    project_id: Optional[int]
    author_id: Optional[int]
    parent_id: Optional[int]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    author: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ── Label ────────────────────────────────────────────────────────────────────

class LabelCreate(BaseModel):
    name: str
    color: Optional[str] = "#6366f1"
    project_id: int


class LabelResponse(BaseModel):
    id: int
    name: str
    color: str
    project_id: int

    class Config:
        from_attributes = True


# ── Component ────────────────────────────────────────────────────────────────

class ComponentCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    project_id: int
    lead_id: Optional[int] = None


class ComponentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    project_id: int
    lead_id: Optional[int]

    class Config:
        from_attributes = True


# ── Release ──────────────────────────────────────────────────────────────────

class ReleaseCreate(BaseModel):
    name: str
    version: Optional[str] = ""
    description: Optional[str] = ""
    project_id: int
    status: Optional[str] = "Unreleased"
    release_date: Optional[str] = None


class ReleaseResponse(BaseModel):
    id: int
    name: str
    version: Optional[str]
    description: Optional[str]
    project_id: int
    status: str
    release_date: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Dashboard ────────────────────────────────────────────────────────────────

class DashboardResponse(BaseModel):
    todo: int
    in_progress: int
    done: int
    completion_percentage: float
    workload: dict


# ── Analytics ────────────────────────────────────────────────────────────────

class VelocityData(BaseModel):
    sprint_name: str
    completed: int
    planned: int


class BurndownPoint(BaseModel):
    day: int
    ideal: float
    actual: float


class SprintAnalyticsResponse(BaseModel):
    velocity: List[VelocityData]
    burndown: List[BurndownPoint]
    completion_rate: float
    total_issues: int
    completed_issues: int
    in_progress_issues: int
    todo_issues: int
    blocked_issues: int
    story_points_completed: int
    story_points_total: int


# ── Task (backward compat) ───────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    required_skills: Optional[str] = ""
    status: Optional[str] = "To Do"
    assignee_id: Optional[int] = None

    class Config:
        from_attributes = True


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    required_skills: Optional[str]
    assignee_id: Optional[int]
    sprint_id: Optional[int]

    class Config:
        from_attributes = True
