import { useEffect, useState, useCallback, useRef } from "react";
import { useWorkspace } from "../WorkspaceApp";
import { issuesAPI, sprintsAPI, taskAllocationAPI } from "../api";
import { ButtonColorful } from "../../components/ui/button-colorful";
import { canCreate, canDelete, canComplete } from "../permissions";
import { IssueTypeIcon, ISSUE_TYPES } from "../IssueTypeIcon";
import {
  Search, ChevronDown, ChevronRight, User,
  Trash2, ArrowRight, RefreshCw, X, Play, LayoutGrid
} from "lucide-react";
const PRIORITY_COLORS = { Blocker:"bg-red-500", Critical:"bg-orange-500", Major:"bg-yellow-400", Minor:"bg-blue-400", Trivial:"bg-gray-300" };
const STATUS_COLORS = { "To Do":"bg-gray-100 text-gray-600", "In Progress":"bg-blue-100 text-blue-700", "In Review":"bg-purple-100 text-purple-700", Done:"bg-green-100 text-green-700", Blocked:"bg-red-100 text-red-700" };

const ALL_STATUS_OPTIONS = ["To Do", "In Progress", "In Review", "Done", "Blocked"];
const RESTRICTED_STATUSES = new Set(["Done", "Blocked"]);

const STATUS_DOT = {
  "Done": "bg-green-400",
  "In Review": "bg-purple-400",
  "In Progress": "bg-blue-400",
  "Blocked": "bg-red-400",
  "To Do": "bg-gray-300",
};

function StatusDropdown({ issue, onStatusChange, allowComplete }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const ref = useRef(null);
  const toastTimer = useRef(null);
  const currentColors = STATUS_COLORS[issue.status] || "bg-gray-100 text-gray-600";

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const handleSelect = (e, s) => {
    e.stopPropagation();
    if (RESTRICTED_STATUSES.has(s) && !allowComplete) {
      showToast("Only Admin or Scrum Master can set this status.");
      return;
    }
    onStatusChange(issue.id, s);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={`text-xs px-2 py-0.5 rounded-full border border-transparent hover:border-gray-200 cursor-pointer transition-colors ${currentColors}`}
        title="Change status"
      >
        {issue.status}
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-30 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 min-w-44">
          <div className="text-xs text-gray-400 px-2 py-1 font-medium mb-0.5">Set status</div>
          {toast && (
            <div className="mx-1 mb-1.5 px-2 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
              <span className="flex-shrink-0">🔒</span>
              {toast}
            </div>
          )}
          {ALL_STATUS_OPTIONS.map((s) => {
            const restricted = RESTRICTED_STATUSES.has(s) && !allowComplete;
            return (
              <button key={s}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => handleSelect(e, s)}
                className={`w-full text-left text-xs px-2 py-1.5 rounded-lg flex items-center gap-2 transition-colors
                  ${restricted
                    ? "text-gray-300 cursor-pointer hover:bg-red-50"
                    : issue.status === s
                      ? "font-semibold text-gray-900 bg-gray-50"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${restricted ? "bg-gray-200" : STATUS_DOT[s] || "bg-gray-300"}`} />
                <span className="flex-1">{s}</span>
                {restricted && <span className="text-gray-300 text-[10px]">🔒</span>}
                {!restricted && issue.status === s && <span className="ml-auto text-orange-500">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IssueRow({ issue, onOpen, onDelete, onAssignSprint, onStatusChange, sprints, allowDelete, allowComplete }) {
  const [sprintMenuOpen, setSprintMenuOpen] = useState(false);

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50 group ${issue.flagged ? "bg-red-50" : ""}`}>
      {/* Priority dot */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[issue.priority] || "bg-gray-300"}`} title={issue.priority} />

      {/* Type */}
      <span className="flex-shrink-0"><IssueTypeIcon type={issue.type} /></span>

      {/* Key */}
      <span className="text-xs text-gray-400 font-mono w-16 flex-shrink-0">{issue.key}</span>

      {/* Title */}
      <button
        className="flex-1 text-left text-sm text-gray-800 hover:text-orange-600 font-medium truncate"
        onClick={() => onOpen(issue.id)}
      >
        {issue.title}
        {issue.flagged && <span className="ml-2 text-xs text-red-500">🚩 Blocked</span>}
      </button>

      {/* Status dropdown */}
      <StatusDropdown issue={issue} onStatusChange={onStatusChange} allowComplete={allowComplete} />

      {/* Story points */}
      <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${issue.story_points ? "bg-gray-100 text-gray-600" : "text-gray-300"}`}>
        {issue.story_points || "–"}
      </span>

      {/* Assignee */}
      {issue.assignee ? (
        <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0" title={issue.assignee.name}>
          {issue.assignee.name[0]}
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <User className="w-3 h-3 text-gray-300" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        {sprints.length > 0 && (
          <div className="relative">
            <button onClick={() => setSprintMenuOpen((v) => !v)}
              title="Move to sprint"
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 border transition-colors ${issue.sprint_id ? "text-orange-500 border-orange-200 bg-orange-50" : "text-gray-400 border-gray-200 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50"}`}>
              <ArrowRight className="w-3 h-3" />
            </button>
            {sprintMenuOpen && (
              <div className="absolute right-0 top-7 z-20 bg-white border border-gray-200 rounded-xl shadow-xl p-2 min-w-44">
                <div className="text-xs text-gray-400 px-2 py-1 font-medium">Move to sprint</div>
                {sprints.filter((s) => s.status !== "Completed").map((s) => (
                  <button key={s.id} onClick={() => { onAssignSprint(issue.id, s.id); setSprintMenuOpen(false); }}
                    className={`w-full text-left text-xs px-2 py-1.5 hover:bg-orange-50 hover:text-orange-700 rounded-lg ${issue.sprint_id === s.id ? "text-orange-600 font-medium" : "text-gray-700"}`}>
                    {s.name}
                    {issue.sprint_id === s.id && " ✓"}
                  </button>
                ))}
                {issue.sprint_id && (
                  <button onClick={() => { onAssignSprint(issue.id, null); setSprintMenuOpen(false); }}
                    className="w-full text-left text-xs px-2 py-1.5 hover:bg-gray-50 rounded-lg text-gray-400 border-t border-gray-100 mt-1 pt-2">
                    ✕ Remove from sprint
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {allowDelete && (
          <button onClick={() => onDelete(issue.id)} title="Delete issue"
            className="p-1.5 text-gray-300 hover:text-red-500 border border-transparent hover:border-red-200 rounded-lg transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

const ALLOC_COLORS = {
  "over-allocated": "bg-red-100 text-red-600 border-red-200",
  "at-capacity":    "bg-yellow-100 text-yellow-700 border-yellow-200",
  "available":      "bg-green-100 text-green-700 border-green-200",
};
const ALLOC_DOT = {
  "over-allocated": "bg-red-500",
  "at-capacity":    "bg-yellow-400",
  "available":      "bg-green-500",
};

function CreateIssueInlineModal({ onClose, onCreated, projectId, sprints = [], defaultSprintId }) {
  const { user } = useWorkspace();
  const [form, setForm] = useState({
    title: "", type: "Story", priority: "Major",
    story_points: "", description: "", required_skills: "",
  });
  const [selectedSprintId, setSelectedSprintId] = useState(defaultSprintId ?? "backlog");
  const [assigneeId, setAssigneeId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Recommendation state
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRec, setLoadingRec] = useState(false);
  const recTimerRef = useRef(null);

  const activeSprints = sprints.filter((s) => s.status !== "Completed");

  // Debounce recommendation fetch when title or skills change
  const fetchRecommendations = useCallback(async (title, skills) => {
    if (!title.trim() || !projectId) return;
    setLoadingRec(true);
    try {
      const r = await taskAllocationAPI.recommend(projectId, {
        title,
        description: form.description,
        required_skills: skills,
        story_points: form.story_points ? parseInt(form.story_points) : null,
      });
      setRecommendations(r.data.recommendations || []);
    } catch {
      setRecommendations([]);
    }
    setLoadingRec(false);
  }, [projectId, form.description, form.story_points]);

  useEffect(() => {
    clearTimeout(recTimerRef.current);
    if (!form.title.trim()) { setRecommendations([]); return; }
    recTimerRef.current = setTimeout(() => fetchRecommendations(form.title, form.required_skills), 700);
    return () => clearTimeout(recTimerRef.current);
  }, [form.title, form.required_skills, fetchRecommendations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const r = await issuesAPI.create({
        ...form,
        story_points: form.story_points ? parseInt(form.story_points) : null,
        project_id: projectId,
        sprint_id: selectedSprintId === "backlog" ? null : selectedSprintId,
        reporter_id: user?.user_id || user?.id,
        assignee_id: assigneeId || null,
      });
      onCreated(r.data);
      onClose();
    } catch {}
    setSaving(false);
  };

  const selectedLabel = selectedSprintId === "backlog"
    ? "Backlog"
    : activeSprints.find((s) => s.id === selectedSprintId)?.name || "Backlog";

  const top3 = recommendations.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Create Issue</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
        </div>

        <div className="flex gap-5">
          {/* ── Left: form ── */}
          <form onSubmit={handleSubmit} className="flex-1 space-y-3 min-w-0">
            <input autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400"
              placeholder="Issue title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 resize-none"
              rows={2} placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            {/* Required skills */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Required skills <span className="font-normal text-gray-400">(comma-separated)</span></label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                placeholder="e.g. React, Python, SQL"
                value={form.required_skills}
                onChange={(e) => setForm({ ...form, required_skills: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {ISSUE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {["Blocker","Critical","Major","Minor","Trivial"].map((p) => <option key={p}>{p}</option>)}
              </select>
              <input type="number"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                placeholder="SP" value={form.story_points}
                onChange={(e) => setForm({ ...form, story_points: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Add to</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                value={selectedSprintId}
                onChange={(e) => setSelectedSprintId(e.target.value === "backlog" ? "backlog" : parseInt(e.target.value))}
              >
                <option value="backlog">Backlog (no sprint)</option>
                {activeSprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.status === "Active" ? " (Active)" : " (Planning)"}
                  </option>
                ))}
              </select>
            </div>

            {assigneeId && top3.length > 0 && (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-xs text-orange-700">
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                Assigned to <span className="font-semibold">{top3.find(r => r.user_id === assigneeId)?.user_name || "selected member"}</span>
                <button type="button" className="ml-auto text-orange-400 hover:text-orange-600" onClick={() => setAssigneeId(null)}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-orange-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                {saving ? "Creating..." : `Create in ${selectedLabel}`}
              </button>
            </div>
          </form>

          {/* ── Right: recommendations ── */}
          <div className="w-64 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Recommendations</span>
              {loadingRec && <RefreshCw className="w-3 h-3 text-orange-400 animate-spin" />}
            </div>

            {!form.title.trim() ? (
              <p className="text-xs text-gray-400 leading-relaxed">
                Enter a title and skills to get assignee recommendations.
              </p>
            ) : loadingRec && top3.length === 0 ? (
              <div className="space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : top3.length === 0 ? (
              <p className="text-xs text-gray-400">No members found for this project.</p>
            ) : (
              <div className="space-y-2">
                {top3.map((rec, idx) => {
                  const isSelected = assigneeId === rec.user_id;
                  const allocColor = ALLOC_COLORS[rec.allocation_status] || ALLOC_COLORS["available"];
                  const allocDot = ALLOC_DOT[rec.allocation_status] || ALLOC_DOT["available"];
                  return (
                    <button
                      key={rec.user_id}
                      type="button"
                      onClick={() => setAssigneeId(isSelected ? null : rec.user_id)}
                      className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${
                        isSelected
                          ? "border-orange-400 bg-orange-50 ring-1 ring-orange-300"
                          : "border-gray-100 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600 flex-shrink-0">
                          {idx === 0 ? "★" : rec.user_name[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-800 truncate">{rec.user_name}</span>
                        <span className="ml-auto text-xs font-bold text-orange-500">{rec.score}</span>
                      </div>

                      {/* Workload bar */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              rec.workload_percentage >= 80 ? "bg-red-400" :
                              rec.workload_percentage >= 60 ? "bg-yellow-400" : "bg-green-400"
                            }`}
                            style={{ width: `${Math.min(rec.workload_percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400">{rec.workload_percentage}%</span>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${allocColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${allocDot}`} />
                          {rec.allocation_status}
                        </span>
                        {rec.matched_skills.slice(0, 2).map(s => (
                          <span key={s} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100">
                            {s}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Backlog() {
  const { activeProject, setActiveSprint, navigate, user } = useWorkspace();
  const allowed = canCreate(user);
  const allowedDelete = canDelete(user);
  const allowedComplete = canComplete(user);
  const [issues, setIssues] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [expandedSprints, setExpandedSprints] = useState({});
  const [startingSprint, setStartingSprint] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [issueRes, sprintRes] = await Promise.all([
        issuesAPI.list({ project_id: activeProject?.id }),
        activeProject?.id ? sprintsAPI.list(activeProject.id) : Promise.resolve({ data: [] }),
      ]);
      setIssues(issueRes.data);
      setSprints(sprintRes.data);
      // Expand active sprint by default
      const active = sprintRes.data.find((s) => s.status === "Active");
      if (active) setExpandedSprints({ [active.id]: true, backlog: true });
      else setExpandedSprints({ backlog: true });
    } catch {}
    setLoading(false);
  }, [activeProject]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = issues.filter((i) => {
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !i.key.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== "all" && i.type !== filterType) return false;
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    return true;
  });

  const getSprintIssues = (sprintId) => filtered.filter((i) => i.sprint_id === sprintId);
  const backlogIssues = filtered.filter((i) => !i.sprint_id);

  const handleDelete = async (id) => {
    if (!confirm("Delete this issue?")) return;
    await issuesAPI.delete(id);
    setIssues((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAssignSprint = async (issueId, sprintId) => {
    await issuesAPI.update(issueId, { sprint_id: sprintId });
    setIssues((prev) => prev.map((i) => i.id === issueId ? { ...i, sprint_id: sprintId } : i));
  };

  const handleStatusChange = async (issueId, status) => {
    try {
      const payload = { status };
      if (status === "Done") {
        payload.requester_role = user?.role || user?.user_role || "";
      }
      await issuesAPI.update(issueId, payload);
      setIssues((prev) => prev.map((i) => i.id === issueId ? { ...i, status } : i));
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to update status";
      alert(msg);
    }
  };

  const handleStartSprint = async (sprint) => {
    setStartingSprint(sprint.id);
    try {
      await sprintsAPI.start(sprint.id);
      const started = { ...sprint, status: "Active" };
      setSprints((prev) => prev.map((s) => s.id === sprint.id ? started : s));
      setActiveSprint(started);
      navigate("board");
    } catch {}
    setStartingSprint(null);
  };

  const toggle = (key) => setExpandedSprints((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderIssueSection = (sectionIssues, key, label, badge, badgeColor, sprint = null) => (
    <div key={key} className="mb-2">
      <div className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl">
        <button onClick={() => toggle(key)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          {expandedSprints[key] ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          <span className="font-semibold text-gray-800 text-sm">{label}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${badgeColor}`}>{badge}</span>
          <span className="text-xs text-gray-400 flex-shrink-0">{sectionIssues.length} issues · {sectionIssues.reduce((s,i) => s+(i.story_points||0),0)} SP</span>
        </button>
        {/* Sprint action buttons */}
        {sprint && sprint.status === "Planning" && allowed && (
          <button
            onClick={() => handleStartSprint(sprint)}
            disabled={startingSprint === sprint.id}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium"
          >
            <Play className="w-3 h-3" />
            {startingSprint === sprint.id ? "Starting..." : "Start Sprint"}
          </button>
        )}
        {sprint && sprint.status === "Active" && (
          <button
            onClick={() => navigate("board")}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs text-orange-600 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 font-medium"
          >
            <LayoutGrid className="w-3 h-3" /> View Board
          </button>
        )}
      </div>
      {expandedSprints[key] && (
        <div className="mt-1 bg-white border border-gray-100 rounded-xl overflow-hidden">
          {/* Column headers */}
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 border-b border-gray-100 text-xs text-gray-500 font-semibold">
            <div className="w-2" />
            <div className="w-4" />
            <div className="w-16">Key</div>
            <div className="flex-1">Title</div>
            <div className="w-20">Status</div>
            <div className="w-8 text-center">SP</div>
            <div className="w-6" />
            <div className="w-16" />
          </div>
          {sectionIssues.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-300">No issues {key === "backlog" ? "in backlog" : "in this sprint"}</div>
          ) : (
            sectionIssues.map((issue) => (
              <IssueRow key={issue.id} issue={issue}
                onOpen={(id) => navigate("issue", { issueId: id })}
                onDelete={handleDelete}
                onAssignSprint={handleAssignSprint}
                onStatusChange={handleStatusChange}
                sprints={sprints}
                allowDelete={allowedDelete}
                allowComplete={allowedComplete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Backlog</h1>
          <p className="text-sm text-gray-500 mt-0.5">{activeProject?.name || "All Projects"} · {issues.length} total issues</p>
        </div>
        {allowed && (
          <ButtonColorful
            label="Create Task"
            onClick={() => setShowCreate(true)}
          />
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 bg-white border border-gray-100 rounded-xl p-3">
        <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-lg px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <input className="bg-transparent flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
            placeholder="Search issues..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")}><X className="w-3 h-3 text-gray-400" /></button>}
        </div>
        <select className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none"
          value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          {ISSUE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none"
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          {["To Do","In Progress","In Review","Done"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <button onClick={loadData} className="p-1.5 text-gray-400 hover:text-gray-600">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-300">Loading backlog...</div>
      ) : (
        <div className="space-y-2">
          {/* Sprint sections */}
          {sprints.filter((s) => s.status !== "Completed").map((sprint) =>
            renderIssueSection(
              getSprintIssues(sprint.id),
              sprint.id,
              sprint.name,
              sprint.status,
              sprint.status === "Active" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700",
              sprint
            )
          )}

          {/* Backlog */}
          {renderIssueSection(backlogIssues, "backlog", "Backlog", `${backlogIssues.length}`, "bg-gray-100 text-gray-600")}
        </div>
      )}

      {showCreate && (
        <CreateIssueInlineModal
          onClose={() => setShowCreate(false)}
          onCreated={(issue) => { setIssues((prev) => [...prev, issue]); }}
          projectId={activeProject?.id}
          sprints={sprints}
          defaultSprintId="backlog"
        />
      )}
    </div>
  );
}
