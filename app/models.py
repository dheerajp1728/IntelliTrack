from sqlalchemy import (
    Column, Integer, String, ForeignKey, Text, Boolean, DateTime
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="Developer")
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    profile = relationship("DeveloperProfile", back_populates="user", uselist=False)
    assigned_issues = relationship("Issue", back_populates="assignee", foreign_keys="Issue.assignee_id")
    reported_issues = relationship("Issue", back_populates="reporter", foreign_keys="Issue.reporter_id")
    comments = relationship("Comment", back_populates="author")
    notifications = relationship("Notification", back_populates="user")
    wiki_pages = relationship("WikiPage", back_populates="author")


class DeveloperProfile(Base):
    __tablename__ = "developer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)

    full_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    role_title = Column(String, nullable=True)
    department = Column(String, nullable=True)
    bio = Column(Text, nullable=True)

    skills = Column(Text, nullable=True)
    interests = Column(Text, nullable=True)
    experience_level = Column(String, nullable=True)

    github_url = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    current_workload = Column(Integer, default=0)
    capacity = Column(Integer, default=5)
    availability_status = Column(String, nullable=True)

    user = relationship("User", back_populates="profile")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    key = Column(String, nullable=False, unique=True)  # e.g. "INT", "MOB"
    description = Column(Text, nullable=True)
    status = Column(String, default="Active")  # Active, Archived, Completed
    category = Column(String, nullable=True)
    lead_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("User", foreign_keys=[lead_id])
    sprints = relationship("Sprint", back_populates="project")
    issues = relationship("Issue", back_populates="project")
    components = relationship("Component", back_populates="project")
    labels = relationship("Label", back_populates="project")
    wiki_pages = relationship("WikiPage", back_populates="project")
    releases = relationship("Release", back_populates="project")


class Sprint(Base):
    __tablename__ = "sprints"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    goal = Column(Text, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    status = Column(String, default="Planning")  # Planning, Active, Completed
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    capacity = Column(Integer, default=40)  # story points
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="sprints")
    issues = relationship("Issue", back_populates="sprint")


class Component(Base):
    __tablename__ = "components"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    lead_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    project = relationship("Project", back_populates="components")
    lead = relationship("User", foreign_keys=[lead_id])


class Label(Base):
    __tablename__ = "labels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    color = Column(String, default="#6366f1")
    project_id = Column(Integer, ForeignKey("projects.id"))

    project = relationship("Project", back_populates="labels")


class Release(Base):
    __tablename__ = "releases"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    version = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    status = Column(String, default="Unreleased")  # Unreleased, Released, Archived
    release_date = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="releases")
    issues = relationship("Issue", back_populates="fix_version")


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, nullable=False, index=True)  # e.g. "INT-42"
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    type = Column(String, default="Story")  # Epic, Story, Task, Bug, SubTask, Spike, TechDebt, Improvement
    status = Column(String, default="To Do")  # To Do, In Progress, In Review, Done, Blocked
    priority = Column(String, default="Major")  # Blocker, Critical, Major, Minor, Trivial

    story_points = Column(Integer, nullable=True)
    time_estimate = Column(Integer, nullable=True)  # minutes
    time_logged = Column(Integer, default=0)  # minutes

    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    sprint_id = Column(Integer, ForeignKey("sprints.id"), nullable=True)
    epic_id = Column(Integer, ForeignKey("issues.id"), nullable=True)
    parent_id = Column(Integer, ForeignKey("issues.id"), nullable=True)
    fix_version_id = Column(Integer, ForeignKey("releases.id"), nullable=True)

    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    labels = Column(Text, nullable=True)  # comma-separated label names
    components = Column(Text, nullable=True)  # comma-separated component names
    required_skills = Column(Text, nullable=True)  # for backward compat

    due_date = Column(String, nullable=True)
    start_date = Column(String, nullable=True)

    flagged = Column(Boolean, default=False)
    rank = Column(Integer, default=0)  # for backlog ordering

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="issues")
    sprint = relationship("Sprint", back_populates="issues")
    assignee = relationship("User", back_populates="assigned_issues", foreign_keys=[assignee_id])
    reporter = relationship("User", back_populates="reported_issues", foreign_keys=[reporter_id])
    fix_version = relationship("Release", back_populates="issues")
    comments = relationship("Comment", back_populates="issue", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="issue", cascade="all, delete-orphan")
    notifications = relationship("Notification", cascade="all, delete-orphan", foreign_keys="Notification.issue_id")
    sub_tasks = relationship("Issue", foreign_keys="Issue.parent_id", back_populates="parent", uselist=True)
    parent = relationship("Issue", foreign_keys="Issue.parent_id", back_populates="sub_tasks", remote_side="[Issue.id]", uselist=False)
    child_stories = relationship("Issue", foreign_keys="Issue.epic_id", back_populates="epic_issue", uselist=True)
    epic_issue = relationship("Issue", foreign_keys="Issue.epic_id", back_populates="child_stories", remote_side="[Issue.id]", uselist=False)


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"))
    author_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    issue = relationship("Issue", back_populates="comments")
    author = relationship("User", back_populates="comments")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)  # "status_changed", "assigned", "commented", etc.
    field = Column(String, nullable=True)
    old_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    issue = relationship("Issue", back_populates="activity_logs")
    user = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String, nullable=False)  # "assigned", "mentioned", "status_change", "comment"
    title = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    read = Column(Boolean, default=False)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")
    issue = relationship("Issue")


class WikiPage(Base):
    __tablename__ = "wiki_pages"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    parent_id = Column(Integer, ForeignKey("wiki_pages.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="wiki_pages")
    author = relationship("User", back_populates="wiki_pages")
    children = relationship("WikiPage", foreign_keys=[parent_id], back_populates="parent_page", uselist=True)
    parent_page = relationship("WikiPage", foreign_keys=[parent_id], back_populates="children", remote_side="WikiPage.id", uselist=False)


# Keep Task for backward compat (maps to issues conceptually)
class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="To Do")
    required_skills = Column(Text, nullable=True)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    sprint_id = Column(Integer, ForeignKey("sprints.id"), nullable=True)

    assignee = relationship("User")
    sprint = relationship("Sprint")
