import { useEffect, useState, useCallback } from "react";
import { useWorkspace } from "../WorkspaceApp";
import { sprintsAPI, issuesAPI } from "../api";
import { ButtonColorful } from "../../components/ui/button-colorful";
import { canManageSprints } from "../permissions";
import { Play, CheckCircle, Zap, Target, Calendar, X, LayoutGrid } from "lucide-react";

const STATUS_COLORS = { Planning:"bg-gray-100 text-gray-600", Active:"bg-green-100 text-green-700", Completed:"bg-blue-100 text-blue-700" };
const ISSUE_STATUS_COLORS = { "To Do":"bg-gray-100 text-gray-600", "In Progress":"bg-blue-100 text-blue-700", "In Review":"bg-purple-100 text-purple-700", Done:"bg-green-100 text-green-700" };

function CreateSprintModal({ onClose, onCreated, projectId }) {
  const [form, setForm] = useState({ name: "", goal: "", start_date: "", end_date: "", capacity: 40 });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const r = await sprintsAPI.create({ ...form, project_id: projectId, status: "Planning" });
      onCreated(r.data);
      onClose();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Create Sprint</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input autoFocus className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
            placeholder="Sprint name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none resize-none"
            rows={2} placeholder="Sprint goal" value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Start Date</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none mt-1"
                value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500">End Date</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none mt-1"
                value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Capacity (story points)</label>
            <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none mt-1"
              value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 40 })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-orange-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
              {saving ? "Creating..." : "Create Sprint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SprintCard({ sprint, issues, onStart, onComplete, canManage, onNavigate }) {
  const [expanded, setExpanded] = useState(sprint.status === "Active");
  const sprintIssues = issues.filter((i) => i.sprint_id === sprint.id);
  const done = sprintIssues.filter((i) => i.status === "Done").length;
  const total = sprintIssues.length;
  const sp = sprintIssues.reduce((s, i) => s + (i.story_points || 0), 0);
  const spDone = sprintIssues.filter((i) => i.status === "Done").reduce((s, i) => s + (i.story_points || 0), 0);
  const pct = total > 0 ? Math.round(done / total * 100) : 0;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${sprint.status === "Active" ? "border-orange-200" : "border-gray-100"}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[sprint.status]}`}>{sprint.status}</span>
              {sprint.status === "Active" && <Zap className="w-3.5 h-3.5 text-orange-500" />}
            </div>
            <h3 className="font-semibold text-gray-900">{sprint.name}</h3>
            {sprint.goal && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{sprint.goal}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              {sprint.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{sprint.start_date} → {sprint.end_date}</span>}
              <span className="flex items-center gap-1"><Target className="w-3 h-3" />{sp} SP capacity: {sprint.capacity}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManage && sprint.status === "Planning" && (
              <button onClick={() => onStart(sprint.id)}
                className="flex items-center gap-1.5 text-sm bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600">
                <Play className="w-3.5 h-3.5" /> Start Sprint
              </button>
            )}
            {sprint.status === "Active" && (
              <button onClick={() => onNavigate("board")}
                className="flex items-center gap-1.5 text-sm text-orange-600 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50">
                <LayoutGrid className="w-3.5 h-3.5" /> View Board
              </button>
            )}
            {canManage && sprint.status === "Active" && (
              <button onClick={() => onComplete(sprint.id)}
                className="flex items-center gap-1.5 text-sm bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600">
                <CheckCircle className="w-3.5 h-3.5" /> Complete
              </button>
            )}
            <button onClick={() => setExpanded((v) => !v)}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 border border-gray-200 rounded-lg">
              {expanded ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{done}/{total} issues done</span>
            <span>{spDone}/{sp} SP</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <div className="bg-gray-100 rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {["To Do","In Progress","In Review","Done"].map((s) => {
            const count = sprintIssues.filter((i) => i.status === s).length;
            return (
              <div key={s} className="text-center">
                <div className="text-lg font-bold text-gray-900">{count}</div>
                <div className={`text-xs px-1 py-0.5 rounded ${ISSUE_STATUS_COLORS[s]}`}>{s}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Issue list */}
      {expanded && sprintIssues.length > 0 && (
        <div className="border-t border-gray-50">
          {sprintIssues.slice(0, 10).map((issue) => (
            <div key={issue.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-50 hover:bg-gray-50/80">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${issue.flagged ? "bg-red-500" : "bg-gray-300"}`} />
              <span className="text-xs text-gray-400 font-mono w-14">{issue.key}</span>
              <span className="flex-1 text-sm text-gray-700 truncate">{issue.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${ISSUE_STATUS_COLORS[issue.status]}`}>{issue.status}</span>
              {issue.story_points && (
                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">{issue.story_points}</span>
              )}
              {issue.assignee && (
                <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center" title={issue.assignee.name}>
                  {issue.assignee.name[0]}
                </div>
              )}
            </div>
          ))}
          {sprintIssues.length > 10 && (
            <div className="px-5 py-2 text-xs text-gray-400 text-center">{sprintIssues.length - 10} more issues...</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SprintsPage() {
  const { activeProject, activeSprint, setActiveSprint, navigate, user } = useWorkspace();
  const allowedSprints = canManageSprints(user);
  const [sprints, setSprints] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState("active");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sprintRes, issueRes] = await Promise.all([
        activeProject?.id ? sprintsAPI.list(activeProject.id) : Promise.resolve({ data: [] }),
        issuesAPI.list({ project_id: activeProject?.id }),
      ]);
      setSprints(sprintRes.data);
      setIssues(issueRes.data);
    } catch {}
    setLoading(false);
  }, [activeProject]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStart = async (id) => {
    await sprintsAPI.start(id);
    setSprints((prev) => prev.map((s) => s.id === id ? { ...s, status: "Active" } : s));
    const started = sprints.find((s) => s.id === id);
    if (started) setActiveSprint({ ...started, status: "Active" });
  };

  const handleComplete = async (id) => {
    if (!confirm("Complete this sprint? Incomplete issues will be moved to backlog.")) return;
    await sprintsAPI.complete(id);
    setSprints((prev) => prev.map((s) => s.id === id ? { ...s, status: "Completed" } : s));
    // Clear activeSprint from context since the sprint is now done
    if (activeSprint?.id === id) setActiveSprint(null);
    await loadData();
  };

  const filteredSprints = sprints.filter((s) => {
    if (tab === "active") return s.status === "Active" || s.status === "Planning";
    return s.status === "Completed";
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sprints</h1>
          <p className="text-sm text-gray-500 mt-0.5">{activeProject?.name || "All Projects"} · {sprints.length} sprints</p>
        </div>
        {allowedSprints && (
          <ButtonColorful
            label="Create Sprint"
            onClick={() => setShowCreate(true)}
          />
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {[["active","Active & Planning"],["completed","Completed"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {label} ({sprints.filter((s) => id === "active" ? (s.status === "Active" || s.status === "Planning") : s.status === "Completed").length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-300">Loading sprints...</div>
      ) : (
        <div className="space-y-4">
          {filteredSprints.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Zap className="w-8 h-8 mx-auto mb-3 text-gray-200" />
              <div>No {tab === "active" ? "active" : "completed"} sprints</div>
              {tab === "active" && (
                <button onClick={() => setShowCreate(true)}
                  className="mt-3 text-orange-500 hover:text-orange-600 text-sm font-medium">
                  Create your first sprint →
                </button>
              )}
            </div>
          ) : (
            filteredSprints.map((sprint) => (
              <SprintCard key={sprint.id} sprint={sprint} issues={issues}
                onStart={handleStart} onComplete={handleComplete} onRefresh={loadData}
                canManage={allowedSprints} onNavigate={navigate} />
            ))
          )}
        </div>
      )}

      {showCreate && (
        <CreateSprintModal
          onClose={() => setShowCreate(false)}
          onCreated={(s) => { setSprints((prev) => [...prev, s]); }}
          projectId={activeProject?.id}
        />
      )}
    </div>
  );
}
