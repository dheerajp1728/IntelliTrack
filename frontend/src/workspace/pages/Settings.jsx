import { useEffect, useState } from "react";
import { useWorkspace } from "../WorkspaceApp";
import { projectsAPI, usersAPI, profilesAPI, adminAPI, authAPI } from "../api";
import { ButtonColorful } from "../../components/ui/button-colorful";
import { isAdmin as checkAdmin } from "../permissions";
import {
  User, Shield, Bell, FolderOpen, Users, Save, ChevronRight,
  Check, AlertTriangle, Plus, Trash2, Database
} from "lucide-react";

const ROLES = ["admin", "manager", "developer", "viewer"];
const PROJECT_STATUSES = ["Active", "Planning", "On Hold", "Completed"];

function SectionCard({ title, description, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-400 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mb-4">
      <label className="text-sm text-gray-500 w-36 flex-shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{ height: 22, width: 40 }}
        className={`rounded-full transition-colors relative flex-shrink-0 ${value ? "bg-orange-500" : "bg-gray-200"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

function SaveButton({ onClick, saving, saved }) {
  return (
    <ButtonColorful
      label={saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
      onClick={onClick}
      disabled={saving}
      showArrow={false}
    />
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileSettings({ user }) {
  const userId = user?.user_id || user?.id;
  const [form, setForm] = useState({
    full_name: user?.name || "",
    email: user?.email || "",
    phone: "",
    role_title: "",
    bio: "",
    skills: "",
    github_url: "",
    linkedin_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!userId) return;
    profilesAPI.get(userId).then((r) => {
      const p = r.data;
      setForm({
        full_name: p.full_name || user?.name || "",
        email: p.email || user?.email || "",
        phone: p.phone || "",
        role_title: p.role_title || "",
        bio: p.bio || "",
        skills: p.skills || "",
        github_url: p.github_url || "",
        linkedin_url: p.linkedin_url || "",
      });
    }).catch(() => {});
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await profilesAPI.upsert({ ...form, user_id: userId });
      // Also update the user's name in the users table
      await usersAPI.update(userId, { name: form.full_name });
      setSaved(true);
      setToast({ msg: "Profile saved!", error: false });
      setTimeout(() => { setSaved(false); setToast(null); }, 2500);
    } catch (e) {
      setToast({ msg: e?.response?.data?.detail || "Failed to save", error: true });
      setTimeout(() => setToast(null), 3000);
    }
    setSaving(false);
  };

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg ${toast.error ? "bg-red-600" : "bg-gray-900"}`}>
          {toast.msg}
        </div>
      )}
      <SectionCard title="Personal Information" description="Update your personal details and public profile.">
        <FieldRow label="Full Name"><TextInput value={form.full_name} onChange={set("full_name")} placeholder="Your full name" /></FieldRow>
        <FieldRow label="Email"><TextInput value={form.email} onChange={set("email")} placeholder="you@example.com" type="email" /></FieldRow>
        <FieldRow label="Phone"><TextInput value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" /></FieldRow>
        <FieldRow label="Job Title"><TextInput value={form.role_title} onChange={set("role_title")} placeholder="e.g. Senior Engineer" /></FieldRow>
        <FieldRow label="GitHub URL"><TextInput value={form.github_url} onChange={set("github_url")} placeholder="https://github.com/username" /></FieldRow>
        <FieldRow label="LinkedIn URL"><TextInput value={form.linkedin_url} onChange={set("linkedin_url")} placeholder="https://linkedin.com/in/username" /></FieldRow>
        <FieldRow label="Skills">
          <TextInput value={form.skills} onChange={set("skills")} placeholder="e.g. React, Python, Node.js (comma separated)" />
        </FieldRow>
        <FieldRow label="Bio">
          <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none resize-none focus:border-orange-400"
            rows={3} value={form.bio} onChange={(e) => set("bio")(e.target.value)} placeholder="A short bio..." />
        </FieldRow>
        <div className="pt-2"><SaveButton onClick={handleSave} saving={saving} saved={saved} /></div>
      </SectionCard>
      <SectionCard title="Avatar" description="Generated from your initials.">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 text-2xl font-bold flex items-center justify-center">
            {form.full_name ? form.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() : "?"}
          </div>
          <div className="text-sm text-gray-400">Avatar is automatically generated from your name initials.</div>
        </div>
      </SectionCard>
    </>
  );
}

// ── Project Tab ───────────────────────────────────────────────────────────────
function ProjectSettings() {
  const { projects, setProjects, activeProject, setActiveProject } = useWorkspace();
  const [newProject, setNewProject] = useState({ name: "", key: "", description: "", status: "Active" });
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState({ msg: "", error: false });
  // Edit form for the active project
  const [editForm, setEditForm] = useState({ name: "", description: "", status: "Active" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (activeProject) setEditForm({ name: activeProject.name || "", description: activeProject.description || "", status: activeProject.status || "Active" });
  }, [activeProject]);

  const showToast = (msg, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast({ msg: "", error: false }), 5000);
  };

  const handleCreate = async () => {
    if (!newProject.name.trim() || !newProject.key.trim()) return showToast("Name and key are required", true);
    setCreating(true);
    try {
      await projectsAPI.create(newProject);
      const listRes = await projectsAPI.list();
      setProjects(listRes.data);
      setNewProject({ name: "", key: "", description: "", status: "Active" });
      showToast(`Project "${newProject.name}" created! Select it from the sidebar.`);
    } catch (e) {
      showToast(e?.response?.data?.detail || e?.message || "Failed to create project", true);
    }
    setCreating(false);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete project "${name}"? This will permanently delete all its sprints and issues.`)) return;
    try {
      await projectsAPI.delete(id);
      const listRes = await projectsAPI.list();
      setProjects(listRes.data);
      if (activeProject?.id === id) setActiveProject(listRes.data[0] || null);
      showToast(`Project "${name}" deleted.`);
    } catch (e) {
      showToast(e?.response?.data?.detail || "Failed to delete project", true);
    }
  };

  const handleSave = async () => {
    if (!activeProject?.id) return;
    setSaving(true);
    try {
      await projectsAPI.update(activeProject.id, editForm);
      const listRes = await projectsAPI.list();
      setProjects(listRes.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  return (
    <>
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg ${toast.error ? "bg-red-600" : "bg-gray-900"}`}>
          {toast.msg}
        </div>
      )}

      {/* All Projects */}
      <SectionCard title="All Projects" description="Switch between projects or delete ones you no longer need.">
        {projects.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-4">No projects yet. Create one below.</div>
        ) : (
          <div className="divide-y divide-gray-100 mb-2">
            {projects.map((p) => (
              <div key={p.id} className={`flex items-center gap-3 py-3 rounded-xl px-2 transition-colors ${activeProject?.id === p.id ? "bg-orange-50" : ""}`}>
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{p.key[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{p.name}</span>
                    {activeProject?.id === p.id && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">Active</span>}
                  </div>
                  <div className="text-xs text-gray-400">{p.key} · {p.status}</div>
                </div>
                <button
                  onClick={() => setActiveProject(p)}
                  disabled={activeProject?.id === p.id}
                  className="text-xs text-orange-600 border border-orange-200 px-2.5 py-1 rounded-lg hover:bg-orange-50 disabled:opacity-30 disabled:cursor-default font-medium"
                >
                  Select
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="p-1.5 text-gray-300 hover:text-red-500 border border-transparent hover:border-red-200 rounded-lg transition-colors"
                  title="Delete project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Create New Project */}
      <SectionCard title="Create New Project" description="Each project has its own sprints, backlog, and issues.">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white"
              placeholder="Project name *"
              value={newProject.name}
              onChange={(e) => setNewProject((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white uppercase"
              placeholder="Key (e.g. MOB) *"
              value={newProject.key}
              onChange={(e) => setNewProject((f) => ({ ...f, key: e.target.value.toUpperCase().slice(0, 6) }))}
            />
          </div>
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white"
            placeholder="Description (optional)"
            value={newProject.description}
            onChange={(e) => setNewProject((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="flex items-center gap-3">
            <select
              value={newProject.status}
              onChange={(e) => setNewProject((f) => ({ ...f, status: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white"
            >
              {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ButtonColorful
              label={creating ? "Creating..." : "Create Project"}
              onClick={handleCreate}
              disabled={creating}
            />
          </div>
        </div>
      </SectionCard>

      {/* Edit Active Project */}
      {activeProject && (
        <SectionCard title="Edit Active Project" description={`Editing: ${activeProject.name}`}>
          <FieldRow label="Project Name">
            <TextInput value={editForm.name} onChange={(v) => setEditForm((f) => ({ ...f, name: v }))} placeholder="Project name" />
          </FieldRow>
          <FieldRow label="Project Key">
            <div className="px-3 py-2 border border-gray-100 rounded-xl text-sm text-gray-400 bg-gray-100">
              {activeProject.key} <span className="text-xs ml-1">(cannot be changed)</span>
            </div>
          </FieldRow>
          <FieldRow label="Description">
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none resize-none focus:border-orange-400"
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Project description..."
            />
          </FieldRow>
          <FieldRow label="Status">
            <select
              value={editForm.status}
              onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
            >
              {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FieldRow>
          <div className="pt-2"><SaveButton onClick={handleSave} saving={saving} saved={saved} /></div>
        </SectionCard>
      )}
    </>
  );
}

// ── Members Tab ───────────────────────────────────────────────────────────────
function MembersSettings({ canEditRoles }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersAPI.list().then((r) => setMembers(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, role) => {
    if (!canEditRoles) return;
    try {
      await usersAPI.update(userId, { role });
      setMembers((prev) => prev.map((m) => m.id === userId ? { ...m, role } : m));
    } catch {}
  };

  return (
    <SectionCard
      title="Team Members"
      description={canEditRoles ? "Manage who has access and their roles." : "View team members and their roles."}
    >
      {!canEditRoles && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4">
          <Shield className="w-3.5 h-3.5 flex-shrink-0" />
          You need Admin or Manager access to change roles.
        </div>
      )}
      {loading ? (
        <div className="text-sm text-gray-400 py-4 text-center">Loading members...</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-sm font-bold flex items-center justify-center flex-shrink-0">
                {m.name ? m.name[0].toUpperCase() : "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{m.name}</div>
                <div className="text-xs text-gray-400">{m.email}</div>
              </div>
              {canEditRoles ? (
                <select value={m.role || "developer"} onChange={(e) => handleRoleChange(m.id, e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none">
                  {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              ) : (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-lg capitalize">
                  {m.role || "developer"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ── Notifications Tab ─────────────────────────────────────────────────────────
const NOTIF_DEFAULTS = { issue_assigned: true, issue_commented: true, sprint_started: true, sprint_completed: true, issue_status_changed: false, daily_digest: false, mention: true };
function NotificationSettings() {
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("notif_prefs")) || NOTIF_DEFAULTS; } catch { return NOTIF_DEFAULTS; }
  });
  const [saved, setSaved] = useState(false);
  const labels = { issue_assigned: "When an issue is assigned to me", issue_commented: "When someone comments on my issues", sprint_started: "When a sprint starts", sprint_completed: "When a sprint is completed", issue_status_changed: "When issue status changes", daily_digest: "Daily digest email", mention: "When I'm mentioned" };

  const handleSave = () => {
    localStorage.setItem("notif_prefs", JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionCard title="Notification Preferences" description="Choose what events you'd like to be notified about.">
      {Object.entries(labels).map(([k, label]) => (
        <Toggle key={k} label={label} value={prefs[k]} onChange={(v) => setPrefs((p) => ({ ...p, [k]: v }))} />
      ))}
      <div className="pt-3">
        <button onClick={handleSave} className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600">
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save Preferences"}
        </button>
      </div>
    </SectionCard>
  );
}

// ── Security Tab ──────────────────────────────────────────────────────────────
function SecuritySettings() {
  const { user } = useWorkspace();
  const [pwForm, setPwForm] = useState({ current: "", new: "", confirm: "" });
  const [pwStatus, setPwStatus] = useState(null); // null | "saving" | "success" | string(error)

  const handleChangePassword = async () => {
    setPwStatus("saving");
    try {
      await authAPI.changePassword({
        user_id: user?.user_id || user?.id,
        current_password: pwForm.current,
        new_password: pwForm.new,
      });
      setPwStatus("success");
      setPwForm({ current: "", new: "", confirm: "" });
      setTimeout(() => setPwStatus(null), 3000);
    } catch (e) {
      setPwStatus(e?.response?.data?.detail || "Failed to update password");
      setTimeout(() => setPwStatus(null), 4000);
    }
  };

  const canSubmit = pwForm.current && pwForm.new && pwForm.new === pwForm.confirm && pwStatus !== "saving";

  return (
    <>
      <SectionCard title="Change Password" description="Update your account password.">
        <FieldRow label="Current Password"><TextInput type="password" value={pwForm.current} onChange={(v) => setPwForm((f) => ({ ...f, current: v }))} placeholder="••••••••" /></FieldRow>
        <FieldRow label="New Password"><TextInput type="password" value={pwForm.new} onChange={(v) => setPwForm((f) => ({ ...f, new: v }))} placeholder="••••••••" /></FieldRow>
        <FieldRow label="Confirm Password"><TextInput type="password" value={pwForm.confirm} onChange={(v) => setPwForm((f) => ({ ...f, confirm: v }))} placeholder="••••••••" /></FieldRow>
        {pwForm.new && pwForm.confirm && pwForm.new !== pwForm.confirm && (
          <div className="flex items-center gap-1.5 text-red-500 text-xs mb-3">
            <AlertTriangle className="w-3.5 h-3.5" /> Passwords do not match
          </div>
        )}
        {pwStatus && pwStatus !== "saving" && pwStatus !== "success" && (
          <div className="flex items-center gap-1.5 text-red-500 text-xs mb-3">
            <AlertTriangle className="w-3.5 h-3.5" /> {pwStatus}
          </div>
        )}
        {pwStatus === "success" && (
          <div className="flex items-center gap-1.5 text-green-600 text-xs mb-3">
            <Check className="w-3.5 h-3.5" /> Password updated successfully
          </div>
        )}
        <button onClick={handleChangePassword} disabled={!canSubmit}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-40">
          <Save className="w-4 h-4" /> {pwStatus === "saving" ? "Updating..." : "Update Password"}
        </button>
      </SectionCard>
      <SectionCard title="Two-Factor Authentication" description="Add an extra layer of security.">
        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <Shield className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-gray-700">2FA is not enabled</div>
            <div className="text-xs text-gray-400 mt-0.5">Two-factor authentication support is coming soon.</div>
          </div>
          <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">Coming Soon</span>
        </div>
      </SectionCard>
    </>
  );
}

// ── Reset Button ──────────────────────────────────────────────────────────────
function ResetButton({ showToast, setProjects, setActiveProject }) {
  const [confirm, setConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await adminAPI.reset();
      setProjects([]);
      setActiveProject(null);
      showToast("Workspace reset — all projects and issues deleted.");
    } catch (e) {
      showToast(e.response?.data?.detail || "Reset failed");
    }
    setResetting(false);
    setConfirm(false);
  };

  if (confirm) {
    return (
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-red-600 font-medium">Are you sure?</span>
        <button onClick={handleReset} disabled={resetting}
          className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">
          {resetting ? "Resetting..." : "Yes, delete all"}
        </button>
        <button onClick={() => setConfirm(false)}
          className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirm(true)}
      className="flex-shrink-0 flex items-center gap-1.5 text-sm text-red-600 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-100 font-medium transition-colors">
      <Trash2 className="w-4 h-4" /> Reset
    </button>
  );
}

// ── Admin Tab ─────────────────────────────────────────────────────────────────
function AdminSettings() {
  const { projects, setProjects, setActiveProject, activeProject } = useWorkspace();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [toast, setToast] = useState({ msg: "", error: false });

  // New project form
  const [newProject, setNewProject] = useState({ name: "", key: "", description: "", status: "Active" });
  const [creatingProject, setCreatingProject] = useState(false);

  // New user form
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "developer" });
  const [creatingUser, setCreatingUser] = useState(false);

  const showToast = (msg, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast({ msg: "", error: false }), 5000);
  };

  useEffect(() => {
    usersAPI.list().then((r) => setUsers(r.data)).catch(() => {}).finally(() => setLoadingUsers(false));
  }, []);

  const handleCreateProject = async () => {
    if (!newProject.name.trim() || !newProject.key.trim()) {
      showToast("Name and key are required");
      return;
    }
    setCreatingProject(true);
    try {
      const r = await projectsAPI.create(newProject);
      const created = r.data;
      // Re-fetch the full list so sidebar stays in sync (keep current active project)
      const listRes = await projectsAPI.list();
      setProjects(listRes.data);
      setNewProject({ name: "", key: "", description: "", status: "Active" });
      showToast(`Project "${created.name}" created! Select it from the sidebar.`);
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Failed to create project";
      showToast(msg, true);
    }
    setCreatingProject(false);
  };

  const handleDeleteProject = async (id, name) => {
    if (!confirm(`Delete project "${name}"? This will also delete all its issues and sprints.`)) return;
    try {
      await projectsAPI.delete(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProject?.id === id) setActiveProject(null);
      showToast("Project deleted");
    } catch (e) {
      showToast(e.response?.data?.detail || "Failed to delete project", true);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) return showToast("All fields are required", true);
    setCreatingUser(true);
    try {
      const r = await usersAPI.create(newUser);
      setUsers((prev) => [...prev, r.data]);
      setNewUser({ name: "", email: "", password: "", role: "developer" });
      showToast("User created successfully");
    } catch (e) {
      showToast(e.response?.data?.detail || "Failed to create user", true);
    }
    setCreatingUser(false);
  };

  const handleDeleteUser = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await usersAPI.delete(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast("User deleted");
    } catch (e) {
      showToast(e.response?.data?.detail || "Failed to delete user", true);
    }
  };

  return (
    <>
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg ${toast.error ? "bg-red-600" : "bg-gray-900"}`}>
          {toast.msg}
        </div>
      )}

      {/* Manage Projects */}
      <SectionCard title="Manage Projects" description="Create or delete projects from the workspace.">
        {/* Project list */}
        <div className="divide-y divide-gray-50 mb-4">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2.5">
              <div className="w-7 h-7 rounded bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{p.key[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{p.name}</div>
                <div className="text-xs text-gray-400">{p.key} · {p.status}</div>
              </div>
              <button onClick={() => handleDeleteProject(p.id, p.name)}
                className="p-1.5 text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg hover:border-red-200 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Create project form */}
        <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-gray-100">
          <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New Project
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white"
              placeholder="Project name *" value={newProject.name} onChange={(e) => setNewProject((f) => ({ ...f, name: e.target.value }))} />
            <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white uppercase"
              placeholder="Key (e.g. INT) *" value={newProject.key}
              onChange={(e) => setNewProject((f) => ({ ...f, key: e.target.value.toUpperCase().slice(0, 6) }))} />
          </div>
          <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white mb-3"
            placeholder="Description (optional)" value={newProject.description}
            onChange={(e) => setNewProject((f) => ({ ...f, description: e.target.value }))} />
          <div className="flex items-center gap-3">
            <select value={newProject.status} onChange={(e) => setNewProject((f) => ({ ...f, status: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white">
              {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ButtonColorful
              label={creatingProject ? "Creating..." : "Create Project"}
              onClick={handleCreateProject}
              disabled={creatingProject}
            />
          </div>
        </div>
      </SectionCard>

      {/* Danger Zone – Reset */}
      <SectionCard title="Danger Zone" description="Irreversible actions that affect the entire workspace.">
        <div className="p-4 border border-red-200 rounded-xl bg-red-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Reset Workspace
              </div>
              <div className="text-xs text-red-500 mt-1">
                Permanently deletes <strong>all projects, sprints, and issues</strong> from the database. Users are kept. This cannot be undone.
              </div>
            </div>
            <ResetButton showToast={showToast} setProjects={setProjects} setActiveProject={setActiveProject} />
          </div>
        </div>
      </SectionCard>

      {/* Manage Users */}
      <SectionCard title="Manage Users" description="Add new users or remove existing ones from the workspace.">
        {/* User list */}
        <div className="divide-y divide-gray-50 mb-4">
          {loadingUsers ? (
            <div className="text-sm text-gray-400 py-3 text-center">Loading users...</div>
          ) : users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-2.5">
              <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 text-sm font-bold flex items-center justify-center flex-shrink-0">
                {u.name ? u.name[0].toUpperCase() : "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{u.name}</div>
                <div className="text-xs text-gray-400">{u.email} · {u.role}</div>
              </div>
              <button onClick={() => handleDeleteUser(u.id, u.name)}
                className="p-1.5 text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg hover:border-red-200 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Create user form */}
        <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-gray-100">
          <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add User
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white"
              placeholder="Full name *" value={newUser.name} onChange={(e) => setNewUser((f) => ({ ...f, name: e.target.value }))} />
            <input type="email" className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white"
              placeholder="Email *" value={newUser.email} onChange={(e) => setNewUser((f) => ({ ...f, email: e.target.value }))} />
            <input type="password" className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white"
              placeholder="Password *" value={newUser.password} onChange={(e) => setNewUser((f) => ({ ...f, password: e.target.value }))} />
            <select value={newUser.role} onChange={(e) => setNewUser((f) => ({ ...f, role: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white">
              {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <button onClick={handleCreateUser} disabled={creatingUser}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
            <Plus className="w-4 h-4" /> {creatingUser ? "Creating..." : "Add User"}
          </button>
        </div>
      </SectionCard>
    </>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function Settings() {
  const { user } = useWorkspace();
  const [tab, setTab] = useState("profile");

  const isAdmin = checkAdmin(user);
  const canEditRoles = isAdmin ||
    ["manager", "scrum master", "product owner"].includes((user?.role || user?.user_role || "").toLowerCase());

  const TABS = [
    { id: "profile",       label: "Profile",       icon: User },
    ...(canEditRoles ? [{ id: "project", label: "Project", icon: FolderOpen }] : []),
    { id: "members",       label: "Members",        icon: Users },
    { id: "notifications", label: "Notifications",  icon: Bell },
    { id: "security",      label: "Security",       icon: Shield },
    ...(isAdmin ? [{ id: "admin", label: "Admin", icon: Database }] : []),
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and project preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-44 flex-shrink-0">
          <nav className="space-y-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                  ${tab === id ? "bg-orange-50 text-orange-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}
                  ${id === "admin" ? "border border-red-100 text-red-600 hover:bg-red-50 mt-2" : ""}`}>
                <Icon className="w-4 h-4" />
                {label}
                {tab === id && id !== "admin" && <ChevronRight className="w-3 h-3 ml-auto" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {tab === "profile"       && <ProfileSettings user={user} />}
          {tab === "project"       && <ProjectSettings />}
          {tab === "members"       && <MembersSettings canEditRoles={canEditRoles} />}
          {tab === "notifications" && <NotificationSettings />}
          {tab === "security"      && <SecuritySettings />}
          {tab === "admin"         && isAdmin && <AdminSettings />}
        </div>
      </div>
    </div>
  );
}
