/**
 * Role-based permission helpers.
 *
 * Roles in system:
 *   "admin" / "Workspace Admin"  → full access
 *   "manager" / "Scrum Master"   → manage sprints, create/edit/delete issues, mark Done/Blocked
 *   "developer" / "Developer"    → create & edit issues, update own task status (not Done/Blocked)
 *   "viewer"                     → read only
 *
 * Permission tiers:
 *   canCreate       — create new issues/tasks
 *   canEdit         — edit issue fields (title, description, type, priority, SP, labels)
 *   canDelete       — delete issues
 *   canAssign       — change assignee / move to sprint
 *   canManageSprints— start/complete sprints
 *   canComplete     — set status to Done or Blocked
 */

const normalize = (role) => (role || "").toLowerCase();

const is = (user, ...roles) => roles.includes(normalize(user?.role || user?.user_role));

// Developers CAN create tasks, but cannot delete, assign, manage sprints, or set restricted statuses
export const canCreate        = (user) => !is(user, "viewer");
export const canEdit          = (user) => !is(user, "viewer");
export const canDelete        = (user) => is(user, "admin", "manager", "workspace admin", "scrum master");
export const canAssign        = (user) => is(user, "admin", "manager", "workspace admin", "scrum master", "product owner");
export const canManageSprints = (user) => is(user, "admin", "manager", "workspace admin", "scrum master");
export const canComplete      = (user) => is(user, "admin", "manager", "workspace admin", "scrum master");
export const isAdmin          = (user) => normalize(user?.role || user?.user_role).includes("admin");
