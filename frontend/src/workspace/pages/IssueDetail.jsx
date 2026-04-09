import { useEffect, useState, useRef } from "react";
import { useWorkspace } from "../WorkspaceApp";
import { issuesAPI, usersAPI, sprintsAPI, labelsAPI, taskAllocationAPI } from "../api";
import {
  ArrowLeft, Flag, Edit3, Save, X, MessageSquare,
  Activity, Clock, Zap,
  ChevronDown, GitBranch, GitPullRequest, Plus, Tag, Lock
} from "lucide-react";
import { IssueTypeIcon } from "../IssueTypeIcon";
import { Calendar } from "../../components/ui/calendar";
import { canAssign, canComplete } from "../permissions";

const ALLOC_DOT = {
  "over-allocated": "bg-red-500",
  "at-capacity":    "bg-yellow-400",
  "available":      "bg-green-500",
};
const ALLOC_LABEL = {
  "over-allocated": "text-red-500",
  "at-capacity":    "text-yellow-600",
  "available":      "text-green-600",
};

function AssigneeRecommendDropdown({ value, users, issue, projectId, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const current = users.find((u) => u.id === Number(value));

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Fetch recommendations when opened
  useEffect(() => {
    if (!open || !projectId || !issue?.title) return;
    setLoading(true);
    taskAllocationAPI.recommend(projectId, {
      title: issue.title,
      description: issue.description || "",
      required_skills: issue.required_skills || "",
    }).then((r) => setRecs(r.data.recommendations || []))
      .catch(() => setRecs([]))
      .finally(() => setLoading(false));
  }, [open, projectId, issue?.title, issue?.description, issue?.required_skills]);

  const select = (uid) => { onChange(uid); setOpen(false); };

  // Split into recommended (score ≥ 30, available/at-capacity) and others
  const recommended = recs.filter((r) => r.score >= 30 && r.allocation_status !== "over-allocated");
  const others = recs.filter((r) => !recommended.find((x) => x.user_id === r.user_id));

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-2 py-1.5 hover:border-orange-300 transition-colors text-left"
      >
        <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
          {current ? current.name[0].toUpperCase() : "?"}
        </div>
        <span className={`flex-1 truncate ${current ? "text-gray-800" : "text-gray-400"}`}>
          {current ? current.name : "Unassigned"}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
          style={{ minWidth: "260px" }}>

          {/* Unassigned */}
          <button
            onClick={() => select("")}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 border-b border-gray-50"
          >
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">—</div>
            Unassigned
          </button>

          {loading ? (
            <div className="px-3 py-4 text-xs text-gray-400 text-center">Loading recommendations...</div>
          ) : (
            <>
              {/* Recommended section */}
              {recommended.length > 0 && (
                <div>
                  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3 h-3 text-orange-400" /> AI Recommended
                  </div>
                  {recommended.map((rec, idx) => (
                    <button
                      key={rec.user_id}
                      onClick={() => select(rec.user_id)}
                      className={`w-full flex items-start gap-2.5 px-3 py-2 hover:bg-orange-50 text-left transition-colors
                        ${Number(value) === rec.user_id ? "bg-orange-50" : ""}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx === 0 ? "★" : rec.user_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-gray-800 truncate">{rec.user_name}</span>
                          <span className="text-[10px] font-bold text-orange-500 ml-auto flex-shrink-0">{rec.score}pt</span>
                        </div>
                        {/* Workload bar */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${rec.workload_percentage >= 80 ? "bg-red-400" : rec.workload_percentage >= 60 ? "bg-yellow-400" : "bg-green-400"}`}
                              style={{ width: `${Math.min(rec.workload_percentage, 100)}%` }}
                            />
                          </div>
                          <span className={`text-[10px] flex-shrink-0 flex items-center gap-0.5 ${ALLOC_LABEL[rec.allocation_status]}`}>
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${ALLOC_DOT[rec.allocation_status]}`} />
                            {rec.workload_percentage}%
                          </span>
                        </div>
                        {rec.matched_skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {rec.matched_skills.slice(0, 3).map((s) => (
                              <span key={s} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Others section */}
              {others.length > 0 && (
                <div className="border-t border-gray-50">
                  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Others</div>
                  {others.map((rec) => (
                    <button
                      key={rec.user_id}
                      onClick={() => select(rec.user_id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left transition-colors
                        ${Number(value) === rec.user_id ? "bg-orange-50" : ""}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {rec.user_name[0]}
                      </div>
                      <span className="text-sm text-gray-600 flex-1 truncate">{rec.user_name}</span>
                      <span className={`text-[10px] flex items-center gap-1 ${ALLOC_LABEL[rec.allocation_status] || "text-gray-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${ALLOC_DOT[rec.allocation_status] || "bg-gray-300"}`} />
                        {rec.workload_percentage}%
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Fallback: if no recs loaded, show plain user list */}
              {recs.length === 0 && (
                <div className="border-t border-gray-50">
                  {users.map((u) => (
                    <button key={u.id} onClick={() => select(u.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left ${Number(value) === u.id ? "bg-orange-50 text-orange-700" : "text-gray-700"}`}>
                      <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold flex items-center justify-center">{u.name[0]}</div>
                      {u.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const STATUS_OPTIONS = ["To Do", "In Progress", "In Review", "Done", "Blocked"];
const PRIORITY_OPTIONS = ["Blocker", "Critical", "Major", "Minor", "Trivial"];
const STATUS_COLORS = { "To Do":"bg-gray-100 text-gray-700", "In Progress":"bg-blue-100 text-blue-700", "In Review":"bg-purple-100 text-purple-700", Done:"bg-green-100 text-green-700", Blocked:"bg-red-100 text-red-700" };
const PRIORITY_COLORS = { Blocker:"bg-red-100 text-red-700", Critical:"bg-orange-100 text-orange-700", Major:"bg-yellow-100 text-yellow-700", Minor:"bg-blue-100 text-blue-700", Trivial:"bg-gray-100 text-gray-600" };

function DueDatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value) : undefined;

  const handleSelect = (date) => {
    if (date) {
      // Format as YYYY-MM-DD for the backend
      const iso = date.toISOString().split("T")[0];
      onChange(iso);
    } else {
      onChange(null);
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="text-xs text-gray-400 mb-1">Due Date</div>
      <div className="w-full flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-2 py-1.5 hover:border-orange-300 transition-colors cursor-pointer">
        <span
          className={`flex-1 ${selected ? "text-gray-800" : "text-gray-400"}`}
          onClick={() => setOpen((v) => !v)}
        >
          {selected ? selected.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Pick a date"}
        </span>
        {selected ? (
          <button
            onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false); }}
            className="ml-auto text-gray-300 hover:text-red-400 leading-none"
          >✕</button>
        ) : (
          <span className="ml-auto" onClick={() => setOpen((v) => !v)} />
        )}
      </div>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-gray-200 rounded-2xl shadow-xl p-2">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected || new Date()}
          />
          <div className="flex justify-between px-2 pb-2 pt-1">
            <button onClick={() => { onChange(null); setOpen(false); }}
              className="text-xs text-orange-500 hover:underline">Clear</button>
            <button onClick={() => { handleSelect(new Date()); }}
              className="text-xs text-orange-500 hover:underline">Today</button>
          </div>
        </div>
      )}
    </div>
  );
}

const RESTRICTED_STATUSES = new Set(["Done", "Blocked"]);

function FieldDropdown({ value, options, onChange, colorMap, restrictedOptions, onRestricted }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium ${colorMap?.[value] || "bg-gray-100 text-gray-700"}`}
      >
        {value} <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute top-8 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-40">
          {options.map((opt) => {
            const restricted = restrictedOptions?.has(opt);
            return (
              <button key={opt}
                onClick={() => {
                  if (restricted) { onRestricted?.(`Only Admin or Scrum Master can set status to "${opt}"`); return; }
                  onChange(opt); setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2
                  ${restricted ? "text-gray-300 hover:bg-red-50" : `hover:bg-gray-50 ${colorMap?.[opt] || "text-gray-700"}`}`}>
                {restricted && <Lock className="w-3 h-3 flex-shrink-0" />}
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CommentSection({ issueId }) {
  const { user } = useWorkspace();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    issuesAPI.comments(issueId).then((r) => {
      setComments(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [issueId]);

  const handlePost = async () => {
    if (!newComment.trim() || !user) return;
    setPosting(true);
    try {
      const r = await issuesAPI.addComment(issueId, {
        content: newComment.trim(),
        author_id: user.user_id || user.id,
      });
      setComments((prev) => [...prev, r.data]);
      setNewComment("");
    } catch {}
    setPosting(false);
  };

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" /> Comments ({comments.length})
      </h3>
      <div className="space-y-3 mb-4">
        {loading && <div className="text-xs text-gray-400">Loading...</div>}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {(c.author?.name || "U")[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-700">{c.author?.name || "Unknown"}</span>
                <span className="text-xs text-gray-400">{c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}</span>
              </div>
              <div className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2">{c.content}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
          {(user?.user_name || user?.name || "U")[0]}
        </div>
        <div className="flex-1">
          <textarea
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none"
            rows={3}
            placeholder="Add a comment... (@mention supported)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handlePost}
              disabled={!newComment.trim() || posting}
              className="bg-orange-500 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-orange-600 disabled:opacity-40"
            >
              {posting ? "Posting..." : "Comment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivitySection({ issueId }) {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    issuesAPI.activity(issueId).then((r) => setLogs(r.data)).catch(() => {});
  }, [issueId]);

  const actionLabel = (log) => {
    if (log.action === "status_changed") return `changed status from "${log.old_value}" to "${log.new_value}"`;
    if (log.action === "assigned") return `assigned this issue`;
    if (log.action === "commented") return `commented`;
    if (log.action === "flagged") return `flagged as blocked`;
    if (log.action === "updated") return `updated ${log.field} to "${log.new_value}"`;
    return log.action;
  };

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4" /> Activity
      </h3>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 text-xs text-gray-500">
            <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0 font-bold text-[10px] mt-0.5">
              {(log.user?.name || "S")[0]}
            </div>
            <div>
              <span className="font-medium text-gray-700">{log.user?.name || "System"}</span>{" "}
              {actionLabel(log)}
              <span className="ml-2 text-gray-400">{log.created_at ? new Date(log.created_at).toLocaleDateString() : ""}</span>
            </div>
          </div>
        ))}
        {logs.length === 0 && <div className="text-xs text-gray-400">No activity yet</div>}
      </div>
    </div>
  );
}

export default function IssueDetail({ issueId, onBack }) {
  const { activeProject, user } = useWorkspace();
  const allowAssign = canAssign(user);
  const allowComplete = canComplete(user);
  const [issue, setIssue] = useState(null);
  const [users, setUsers] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [availableLabels, setAvailableLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // Sidebar draft state — only committed on Save
  const [sidebarDraft, setSidebarDraft] = useState({});
  const [sidebarDirty, setSidebarDirty] = useState(false);

  const showToast = (msg, isError = true) => {
    setToast({ msg, isError });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!issueId) return;
    setLoading(true);
    Promise.all([
      issuesAPI.get(issueId),
      usersAPI.list(),
      activeProject?.id ? sprintsAPI.list(activeProject.id) : Promise.resolve({ data: [] }),
      activeProject?.id ? labelsAPI.list(activeProject.id) : Promise.resolve({ data: [] }),
    ]).then(([issueRes, usersRes, sprintRes, labelsRes]) => {
      const i = issueRes.data;
      setIssue(i);
      setTitleDraft(i.title);
      setDescDraft(i.description || "");
      setSidebarDraft({
        assignee_id: i.assignee_id || "",
        sprint_id: i.sprint_id || "",
        story_points: i.story_points || "",
        labels: i.labels || "",
        due_date: i.due_date || "",
      });
      setSidebarDirty(false);
      setUsers(usersRes.data);
      setSprints(sprintRes.data);
      setAvailableLabels(labelsRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [issueId, activeProject]);

  // Update sidebar draft without hitting the API
  const setSidebar = (field, value) => {
    setSidebarDraft((prev) => ({ ...prev, [field]: value }));
    setSidebarDirty(true);
  };

  // Save sidebar fields all at once
  const saveSidebar = async () => {
    if (!issue) return;
    setSaving(true);
    try {
      const payload = {
        assignee_id: sidebarDraft.assignee_id || null,
        sprint_id: sidebarDraft.sprint_id || null,
        story_points: sidebarDraft.story_points ? parseInt(sidebarDraft.story_points) : null,
        labels: sidebarDraft.labels || "",
        due_date: sidebarDraft.due_date || null,
      };
      const r = await issuesAPI.update(issue.id, payload);
      setIssue(r.data);
      setSidebarDirty(false);
      showToast("Changes saved", false);
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to save");
    }
    setSaving(false);
  };

  // Immediate save for status/priority (these stay auto-save)
  const updateField = async (field, value) => {
    if (!issue) return;
    setSaving(true);
    try {
      const payload = { [field]: value };
      if (field === "status") payload.requester_role = user?.role || user?.user_role || "";
      const r = await issuesAPI.update(issue.id, payload);
      setIssue(r.data);
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to save");
    }
    setSaving(false);
  };

  const saveTitle = async () => {
    if (!titleDraft.trim()) return;
    await updateField("title", titleDraft.trim());
    setEditingTitle(false);
  };

  const saveDesc = async () => {
    await updateField("description", descDraft);
    setEditingDesc(false);
  };

  const handleFlag = async () => {
    const r = await issuesAPI.flag(issue.id);
    setIssue((prev) => ({ ...prev, flagged: r.data.flagged }));
  };

  const currentLabels = (sidebarDraft.labels || "").split(",").filter(Boolean).map((l) => l.trim());

  const removeLabel = (label) => {
    const updated = currentLabels.filter((l) => l !== label).join(",");
    setSidebar("labels", updated);
  };

  const addLabel = async (name) => {
    const trimmed = name.trim();
    if (!trimmed || currentLabels.includes(trimmed)) { setLabelInput(""); return; }
    if (activeProject?.id && !availableLabels.find((l) => l.name === trimmed)) {
      try {
        const r = await labelsAPI.create({ name: trimmed, project_id: activeProject.id });
        setAvailableLabels((prev) => [...prev, r.data]);
      } catch {}
    }
    const updated = [...currentLabels, trimmed].join(",");
    setSidebar("labels", updated);
    setLabelInput("");
    setShowLabelPicker(false);
  };

  if (!issueId) return (
    <div className="p-12 text-center text-gray-400">Select an issue to view details</div>
  );

  if (loading) return (
    <div className="p-12 text-center text-gray-300">Loading issue...</div>
  );

  if (!issue) return (
    <div className="p-12 text-center text-gray-400">Issue not found</div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to Backlog
      </button>

      {/* Permission toast */}
      {toast && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border
          ${toast.isError ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
          <Lock className="w-4 h-4 flex-shrink-0" />
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {/* Issue key + type */}
            <div className="flex items-center gap-3 mb-4">
              <IssueTypeIcon type={issue.type} size={18} />
              <span className="text-sm text-gray-400 font-mono">{issue.key}</span>
              <span className="text-xs text-gray-400">{issue.type}</span>
              {issue.flagged && (
                <span className="flex items-center gap-1 text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                  <Flag className="w-3 h-3" /> Blocked
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <button onClick={handleFlag}
                  className={`p-1.5 rounded-lg ${issue.flagged ? "text-red-500 bg-red-50" : "text-gray-400 hover:text-red-400 hover:bg-red-50"}`}>
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Title */}
            {editingTitle ? (
              <div className="flex gap-2 mb-4">
                <input autoFocus
                  className="flex-1 text-xl font-bold text-gray-900 border border-orange-400 rounded-xl px-3 py-2 outline-none"
                  value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} />
                <button onClick={saveTitle} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Save className="w-4 h-4" /></button>
                <button onClick={() => setEditingTitle(false)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <h1 className="text-xl font-bold text-gray-900 mb-4 group flex items-start gap-2">
                <span className="flex-1">{issue.title}</span>
                <button onClick={() => setEditingTitle(true)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-orange-500 flex-shrink-0">
                  <Edit3 className="w-4 h-4" />
                </button>
              </h1>
            )}

            {/* Status + Priority row */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <FieldDropdown value={issue.status} options={STATUS_OPTIONS}
                onChange={(v) => updateField("status", v)} colorMap={STATUS_COLORS}
                restrictedOptions={allowComplete ? null : RESTRICTED_STATUSES}
                onRestricted={(msg) => showToast(msg)} />
              <FieldDropdown value={issue.priority} options={PRIORITY_OPTIONS}
                onChange={(v) => updateField("priority", v)} colorMap={PRIORITY_COLORS} />
              {issue.story_points !== null && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">
                  {issue.story_points} SP
                </span>
              )}
              {saving && <span className="text-xs text-gray-400 animate-pulse">Saving...</span>}
            </div>

            {/* Description */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</span>
                {!editingDesc && (
                  <button onClick={() => setEditingDesc(true)}
                    className="text-gray-300 hover:text-orange-500 p-0.5">
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
              </div>
              {editingDesc ? (
                <div>
                  <textarea
                    autoFocus
                    className="w-full border border-orange-400 rounded-xl px-3 py-2 text-sm outline-none resize-none text-gray-700"
                    rows={6}
                    value={descDraft}
                    onChange={(e) => setDescDraft(e.target.value)}
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={saveDesc}
                      className="flex items-center gap-1 text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600">
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <button onClick={() => { setDescDraft(issue.description || ""); setEditingDesc(false); }}
                      className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`text-sm text-gray-700 leading-relaxed whitespace-pre-wrap ${!issue.description ? "text-gray-300 italic" : ""}`}
                  onClick={() => setEditingDesc(true)}
                >
                  {issue.description || "Add a description..."}
                </div>
              )}
            </div>

            {/* Developer Integration Panel */}
            <div className="border border-gray-100 rounded-xl p-4 mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Developer Integration</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span className="text-gray-400">No branch linked</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span className="text-gray-400">No PRs</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Zap className="w-3.5 h-3.5" />
                  <span className="text-gray-400">No CI status</span>
                </div>
              </div>
            </div>

            {/* Comments */}
            <CommentSection issueId={issue.id} />

            {/* Activity */}
            <ActivitySection issueId={issue.id} />
          </div>
        </div>

        {/* Sidebar fields */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</h3>
              <button
                onClick={saveSidebar}
                disabled={saving || !sidebarDirty}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all
                  ${sidebarDirty
                    ? "bg-orange-500 text-white hover:bg-orange-600 shadow-sm"
                    : "bg-gray-100 text-gray-400 cursor-default"}`}
              >
                <Save className="w-3 h-3" />
                {saving ? "Saving..." : sidebarDirty ? "Save Changes" : "Saved"}
              </button>
            </div>
            <div className="space-y-3">
              {/* Assignee */}
              <div>
                <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  Assignee {!allowAssign && <Lock className="w-2.5 h-2.5 text-gray-300" />}
                </div>
                {allowAssign ? (
                  <AssigneeRecommendDropdown
                    value={sidebarDraft.assignee_id || ""}
                    users={users}
                    issue={issue}
                    projectId={activeProject?.id}
                    onChange={(uid) => setSidebar("assignee_id", uid)}
                  />
                ) : (
                  <div
                    className="flex items-center gap-2 cursor-not-allowed"
                    onClick={() => showToast("Only Admin or Scrum Master can reassign issues")}
                  >
                    <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {(issue.assignee?.name || "?")[0]}
                    </div>
                    <span className="text-sm text-gray-600">{issue.assignee?.name || "Unassigned"}</span>
                  </div>
                )}
              </div>

              {/* Reporter */}
              <div>
                <div className="text-xs text-gray-400 mb-1">Reporter</div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center">
                    {(users.find((u) => u.id === issue.reporter_id)?.name || "U")[0]}
                  </div>
                  <span className="text-sm text-gray-700">{users.find((u) => u.id === issue.reporter_id)?.name || "Unknown"}</span>
                </div>
              </div>

              {/* Sprint */}
              <div>
                <div className="text-xs text-gray-400 mb-1">Sprint</div>
                <select
                  className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none"
                  value={sidebarDraft.sprint_id || ""}
                  onChange={(e) => setSidebar("sprint_id", e.target.value)}
                >
                  <option value="">No Sprint (Backlog)</option>
                  {sprints.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}
                </select>
              </div>

              {/* Story Points */}
              <div>
                <div className="text-xs text-gray-400 mb-1">Story Points</div>
                <select
                  className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none"
                  value={sidebarDraft.story_points || ""}
                  onChange={(e) => setSidebar("story_points", e.target.value)}
                >
                  <option value="">Not estimated</option>
                  {[1,2,3,5,8,13,21].map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>

              {/* Labels */}
              <div className="relative">
                <div className="text-xs text-gray-400 mb-1 flex items-center">
                  <Tag className="w-3 h-3 mr-1" /> Labels
                  <button
                    onClick={() => { setShowLabelPicker((v) => !v); setLabelInput(""); }}
                    className="ml-auto text-gray-300 hover:text-orange-500 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 min-h-[22px]">
                  {currentLabels.map((l) => (
                    <span key={l} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full group">
                      {l}
                      <button onClick={() => removeLabel(l)}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  {currentLabels.length === 0 && <span className="text-xs text-gray-300">None</span>}
                </div>
                {showLabelPicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5">
                    {availableLabels.filter((l) => !currentLabels.includes(l.name)).map((l) => (
                      <button key={l.id} onClick={() => addLabel(l.name)}
                        className="w-full text-left text-xs px-3 py-1.5 hover:bg-orange-50 hover:text-orange-700 text-gray-700 transition-colors">
                        {l.name}
                      </button>
                    ))}
                    {availableLabels.filter((l) => !currentLabels.includes(l.name)).length === 0 && (
                      <div className="text-xs text-gray-400 px-3 py-1">No labels available</div>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1 px-2 flex gap-1">
                      <input
                        autoFocus
                        value={labelInput}
                        onChange={(e) => setLabelInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addLabel(labelInput)}
                        placeholder="New label..."
                        className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-orange-400"
                      />
                      <button onClick={() => addLabel(labelInput)}
                        className="text-xs px-2.5 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Components */}
              {issue.components && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">Components</div>
                  <div className="flex flex-wrap gap-1">
                    {issue.components.split(",").filter(Boolean).map((c) => (
                      <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Due Date */}
              <DueDatePicker
                value={sidebarDraft.due_date}
                onChange={(val) => setSidebar("due_date", val)}
              />

              {/* Created */}
              <div>
                <div className="text-xs text-gray-400 mb-1">Created</div>
                <div className="text-sm text-gray-600">
                  {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Time tracking */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Time Tracking
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Logged</span>
                <span className="font-medium">{issue.time_logged ? `${Math.round(issue.time_logged / 60)}h` : "0h"}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Estimate</span>
                <span className="font-medium">{issue.time_estimate ? `${Math.round(issue.time_estimate / 60)}h` : "—"}</span>
              </div>
              {issue.time_estimate > 0 && (
                <div className="bg-gray-100 rounded-full h-1.5 mt-2">
                  <div
                    className="bg-orange-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (issue.time_logged / issue.time_estimate) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
