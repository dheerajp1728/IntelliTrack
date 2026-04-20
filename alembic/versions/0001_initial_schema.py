"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-04-20 00:00:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    op.create_table(
        "developer_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("role_title", sa.String(), nullable=True),
        sa.Column("department", sa.String(), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("skills", sa.Text(), nullable=True),
        sa.Column("interests", sa.Text(), nullable=True),
        sa.Column("experience_level", sa.String(), nullable=True),
        sa.Column("github_url", sa.String(), nullable=True),
        sa.Column("linkedin_url", sa.String(), nullable=True),
        sa.Column("current_workload", sa.Integer(), nullable=True),
        sa.Column("capacity", sa.Integer(), nullable=True),
        sa.Column("availability_status", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_developer_profiles_id"), "developer_profiles", ["id"], unique=False)

    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("lead_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["lead_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
    )
    op.create_index(op.f("ix_projects_id"), "projects", ["id"], unique=False)

    op.create_table(
        "sprints",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("goal", sa.Text(), nullable=True),
        sa.Column("project_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("start_date", sa.String(), nullable=True),
        sa.Column("end_date", sa.String(), nullable=True),
        sa.Column("capacity", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sprints_id"), "sprints", ["id"], unique=False)

    op.create_table(
        "components",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("project_id", sa.Integer(), nullable=True),
        sa.Column("lead_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["lead_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_components_id"), "components", ["id"], unique=False)

    op.create_table(
        "labels",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("color", sa.String(), nullable=True),
        sa.Column("project_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_labels_id"), "labels", ["id"], unique=False)

    op.create_table(
        "releases",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("version", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("project_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("release_date", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_releases_id"), "releases", ["id"], unique=False)

    op.create_table(
        "wiki_pages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("project_id", sa.Integer(), nullable=True),
        sa.Column("author_id", sa.Integer(), nullable=True),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["parent_id"], ["wiki_pages.id"]),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_wiki_pages_id"), "wiki_pages", ["id"], unique=False)

    op.create_table(
        "issues",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("type", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("priority", sa.String(), nullable=True),
        sa.Column("story_points", sa.Integer(), nullable=True),
        sa.Column("time_estimate", sa.Integer(), nullable=True),
        sa.Column("time_logged", sa.Integer(), nullable=True),
        sa.Column("project_id", sa.Integer(), nullable=True),
        sa.Column("sprint_id", sa.Integer(), nullable=True),
        sa.Column("epic_id", sa.Integer(), nullable=True),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("fix_version_id", sa.Integer(), nullable=True),
        sa.Column("assignee_id", sa.Integer(), nullable=True),
        sa.Column("reporter_id", sa.Integer(), nullable=True),
        sa.Column("labels", sa.Text(), nullable=True),
        sa.Column("components", sa.Text(), nullable=True),
        sa.Column("required_skills", sa.Text(), nullable=True),
        sa.Column("due_date", sa.String(), nullable=True),
        sa.Column("start_date", sa.String(), nullable=True),
        sa.Column("flagged", sa.Boolean(), nullable=True),
        sa.Column("rank", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["assignee_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["epic_id"], ["issues.id"]),
        sa.ForeignKeyConstraint(["fix_version_id"], ["releases.id"]),
        sa.ForeignKeyConstraint(["parent_id"], ["issues.id"]),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.ForeignKeyConstraint(["reporter_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["sprint_id"], ["sprints.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_issues_id"), "issues", ["id"], unique=False)
    op.create_index(op.f("ix_issues_key"), "issues", ["key"], unique=False)

    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("issue_id", sa.Integer(), nullable=True),
        sa.Column("author_id", sa.Integer(), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["issue_id"], ["issues.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_comments_id"), "comments", ["id"], unique=False)

    op.create_table(
        "activity_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("issue_id", sa.Integer(), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("field", sa.String(), nullable=True),
        sa.Column("old_value", sa.String(), nullable=True),
        sa.Column("new_value", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["issue_id"], ["issues.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_activity_logs_id"), "activity_logs", ["id"], unique=False)

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("read", sa.Boolean(), nullable=True),
        sa.Column("issue_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["issue_id"], ["issues.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_id"), "notifications", ["id"], unique=False)

    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("required_skills", sa.Text(), nullable=True),
        sa.Column("assignee_id", sa.Integer(), nullable=True),
        sa.Column("sprint_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["assignee_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["sprint_id"], ["sprints.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tasks_id"), "tasks", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_tasks_id"), table_name="tasks")
    op.drop_table("tasks")
    op.drop_index(op.f("ix_notifications_id"), table_name="notifications")
    op.drop_table("notifications")
    op.drop_index(op.f("ix_activity_logs_id"), table_name="activity_logs")
    op.drop_table("activity_logs")
    op.drop_index(op.f("ix_comments_id"), table_name="comments")
    op.drop_table("comments")
    op.drop_index(op.f("ix_issues_key"), table_name="issues")
    op.drop_index(op.f("ix_issues_id"), table_name="issues")
    op.drop_table("issues")
    op.drop_index(op.f("ix_wiki_pages_id"), table_name="wiki_pages")
    op.drop_table("wiki_pages")
    op.drop_index(op.f("ix_releases_id"), table_name="releases")
    op.drop_table("releases")
    op.drop_index(op.f("ix_labels_id"), table_name="labels")
    op.drop_table("labels")
    op.drop_index(op.f("ix_components_id"), table_name="components")
    op.drop_table("components")
    op.drop_index(op.f("ix_sprints_id"), table_name="sprints")
    op.drop_table("sprints")
    op.drop_index(op.f("ix_projects_id"), table_name="projects")
    op.drop_table("projects")
    op.drop_index(op.f("ix_developer_profiles_id"), table_name="developer_profiles")
    op.drop_table("developer_profiles")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")