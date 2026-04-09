import { useEffect, useState, useCallback, useRef } from "react";
import { useWorkspace } from "../WorkspaceApp";
import { issuesAPI, sprintsAPI } from "../api";
import { ButtonColorful } from "../../components/ui/button-colorful";
import { canCreate, canComplete } from "../permissions";
import { IssueTypeIcon, ISSUE_TYPES } from "../IssueTypeIcon";
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors,
  useDroppable
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus, Flag, User, AlertTriangle,
  Filter, RefreshCw, Layers, Lock
} from "lucide-react";

const COLUMNS = [
  { id: "To Do",      label: "To Do",       color: "bg-gray-100 text-gray-600" },
  { id: "In Progress",label: "In Progress", color: "bg-blue-100 text-blue-700" },
  { id: "In Review",  label: "In Review",   color: "bg-purple-100 text-purple-700" },
  { id: "Done",       label: "Done",        color: "bg-green-100 text-green-700" },
];

const PRIORITY_COLORS = {
  Blocker:  "text-red-600",
  Critical: "text-orange-600",
  Major:    "text-yellow-600",
  Minor:    "text-blue-500",
  Trivial:  "text-gray-400",
};

function PriorityDot({ priority }) {
  return (
    <span className={`text-xs font-bold ${PRIORITY_COLORS[priority] || "text-gray-400"}`} title={priority}>
      ●
    </span>
  );
}

function IssueCard({ issue, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-xl border ${issue.flagged ? "border-red-300 hover:border-red-400" : "border-gray-100 hover:border-orange-300"} p-3 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-150 cursor-grab active:cursor-grabbing active:scale-100 group`}
    >
      {issue.flagged && (
        <div className="flex items-center gap-1 text-red-500 text-xs mb-2 font-medium">
          <Flag className="w-3 h-3" />
          Blocked
        </div>
      )}
      <div className="flex items-start gap-2">
        <span className="flex-shrink-0 mt-0.5"><IssueTypeIcon type={issue.type} /></span>
        <button
          className="flex-1 text-left text-sm text-gray-800 font-medium leading-snug hover:text-orange-600 line-clamp-2"
          onClick={() => onOpen(issue.id)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {issue.title}
        </button>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono">{issue.key}</span>
          <PriorityDot priority={issue.priority} />
          {issue.story_points && (
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
              {issue.story_points}
            </span>
          )}
        </div>
        {issue.assignee ? (
          <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center"
            title={issue.assignee.name}>
            {issue.assignee.name[0]}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-3 h-3 text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}

function Column({ col, issues, onOpen, onAddIssue, wipLimit }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  const isOverWIP = wipLimit && issues.length > wipLimit;

  return (
    <div className="flex flex-col min-w-64 max-w-64 flex-shrink-0">
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${col.color}`}>{col.label}</span>
        <span className={`text-xs font-medium ${isOverWIP ? "text-red-500" : "text-gray-400"}`}>
          {issues.length}{wipLimit ? `/${wipLimit}` : ""}
        </span>
        {isOverWIP && <AlertTriangle className="w-3 h-3 text-red-500" />}
        {onAddIssue && (
          <button
            onClick={() => onAddIssue(col.id)}
            className="ml-auto text-gray-300 hover:text-orange-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Drop Zone — useDroppable ref makes the entire area a valid drop target */}
      <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex-1 space-y-2 min-h-40 p-2 rounded-xl transition-all duration-150 ${
            isOver
              ? "bg-orange-50 ring-2 ring-orange-300 ring-inset"
              : isOverWIP
              ? "bg-red-50"
              : "bg-gray-50"
          }`}
        >
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onOpen={onOpen} />
          ))}
          {issues.length === 0 && (
            <div className={`text-center text-xs py-8 ${isOver ? "text-orange-400" : "text-gray-300"}`}>
              {isOver ? "Release to drop" : "Drop tasks here"}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function CreateIssueModal({ defaultStatus, onClose, onCreated, projectId, sprints = [], defaultSprintId, allowComplete }) {
  const { user } = useWorkspace();
  const allowedStatuses = COLUMNS.filter((c) => allowComplete || !BOARD_RESTRICTED.has(c.id));
  const [form, setForm] = useState({
    title: "",
    type: "Story",
    priority: "Major",
    story_points: "",
    status: defaultStatus || "To Do",
  });
  const [selectedSprintId, setSelectedSprintId] = useState(defaultSprintId ?? "backlog");
  const [saving, setSaving] = useState(false);

  const activeSprints = sprints.filter((s) => s.status !== "Completed");

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
      });
      onCreated(r.data);
      onClose();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-900 mb-4">Create Task</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
            placeholder="Task title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
              value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {ISSUE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
              value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {["Blocker","Critical","Major","Minor","Trivial"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
            placeholder="Story points (optional)" value={form.story_points}
            onChange={(e) => setForm({ ...form, story_points: e.target.value })} />
          <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
            value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {allowedStatuses.map((c) => <option key={c.id}>{c.id}</option>)}
          </select>

          {/* Sprint / Backlog selector */}
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

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-orange-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const BOARD_RESTRICTED = new Set(["Done", "Blocked"]);

export default function Board() {
  const { activeProject, navigate, user } = useWorkspace();
  const allowed = canCreate(user);
  const allowComplete = canComplete(user);
  const [boardToast, setBoardToast] = useState(null);
  const boardToastTimer = useRef(null);

  const showBoardToast = (msg) => {
    setBoardToast(msg);
    clearTimeout(boardToastTimer.current);
    boardToastTimer.current = setTimeout(() => setBoardToast(null), 3500);
  };
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [createModal, setCreateModal] = useState(null);
  const [sprints, setSprints] = useState([]);
  // "all" | "backlog" | <sprintId number> — default to active sprint or "all"
  const [selectedView, setSelectedView] = useState("all");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const dragOriginStatus = useRef(null); // track where the drag started

  // When project changes: load sprints, pick default view, then load issues — all in one go
  useEffect(() => {
    if (!activeProject?.id) return;
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      setIssues([]);
      try {
        const spRes = await sprintsAPI.list(activeProject.id);
        if (cancelled) return;
        setSprints(spRes.data);
        // Always default to "all" view
        setSelectedView("all");
        const r = await issuesAPI.list({ project_id: activeProject.id });
        if (!cancelled) setIssues(r.data.filter((i) => i.type !== "Epic"));
      } catch {}
      if (!cancelled) setLoading(false);
    };
    init();
    return () => { cancelled = true; };
  }, [activeProject]);

  // When user manually changes the view dropdown
  const loadIssues = useCallback(async () => {
    if (!activeProject?.id) return;
    setLoading(true);
    try {
      if (selectedView === "all" || selectedView === "backlog") {
        const r = await issuesAPI.list({ project_id: activeProject.id });
        const all = r.data.filter((i) => i.type !== "Epic");
        setIssues(selectedView === "backlog" ? all.filter((i) => !i.sprint_id) : all);
      } else {
        const r = await issuesAPI.list({ sprint_id: selectedView });
        setIssues(r.data.filter((i) => i.type !== "Epic"));
      }
    } catch {}
    setLoading(false);
  }, [selectedView, activeProject]);

  // Only re-run when selectedView changes (not on project change — handled above)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    loadIssues();
  }, [selectedView]);

  const filteredIssues = issues.filter((i) => {
    if (filterAssignee !== "all" && String(i.assignee_id) !== filterAssignee) return false;
    if (filterType !== "all" && i.type !== filterType) return false;
    return true;
  });

  const byStatus = (status) => filteredIssues.filter((i) => i.status === status);

  // Resolve which column an over-id belongs to (could be a column id or an issue id)
  const resolveTargetColumn = (overId) => {
    const asCol = COLUMNS.find((c) => c.id === String(overId));
    if (asCol) return asCol.id;
    const asIssue = issues.find((i) => i.id === overId);
    return asIssue ? asIssue.status : null;
  };

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
    const issue = issues.find((i) => i.id === active.id);
    dragOriginStatus.current = issue?.status ?? null;
  };

  // Optimistically move card to the hovered column while dragging
  const handleDragOver = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const targetStatus = resolveTargetColumn(over.id);
    if (!targetStatus) return;
    setIssues((prev) =>
      prev.map((i) => i.id === active.id && i.status !== targetStatus
        ? { ...i, status: targetStatus }
        : i
      )
    );
  };

  // On drop: persist the final column to the backend
  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);

    if (!over) {
      // Cancelled — revert to original column
      if (dragOriginStatus.current) {
        setIssues((prev) =>
          prev.map((i) => i.id === active.id ? { ...i, status: dragOriginStatus.current } : i)
        );
      }
      dragOriginStatus.current = null;
      return;
    }

    const finalStatus = resolveTargetColumn(over.id)
      ?? issues.find((i) => i.id === active.id)?.status;

    const originalStatus = dragOriginStatus.current;
    dragOriginStatus.current = null;

    if (!finalStatus || finalStatus === originalStatus) return;

    // Block restricted statuses for developers
    if (BOARD_RESTRICTED.has(finalStatus) && !allowComplete) {
      setIssues((prev) =>
        prev.map((i) => i.id === active.id ? { ...i, status: originalStatus } : i)
      );
      showBoardToast(`Only Admin or Scrum Master can move issues to "${finalStatus}"`);
      return;
    }

    // State is already updated optimistically — just save to backend
    try {
      await issuesAPI.update(active.id, {
        status: finalStatus,
        requester_role: user?.role || user?.user_role || "",
      });
    } catch {
      // Revert on error
      setIssues((prev) =>
        prev.map((i) => i.id === active.id ? { ...i, status: originalStatus } : i)
      );
    }
  };

  const activeIssue = activeId ? issues.find((i) => i.id === activeId) : null;

  const uniqueAssignees = [...new Map(
    issues.filter((i) => i.assignee).map((i) => [i.assignee_id, i.assignee])
  ).entries()].map(([id, a]) => ({ id, name: a.name }));

  const selectedSprint = sprints.find((s) => s.id === selectedView);
  const viewLabel = selectedView === "all" ? "All Issues"
    : selectedView === "backlog" ? "Backlog"
    : selectedSprint ? `${selectedSprint.name} · ${selectedSprint.status}`
    : "Board";

  return (
    <div className="p-6">
      {/* Permission toast */}
      {boardToast && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">
          <Lock className="w-4 h-4 flex-shrink-0" />
          {boardToast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Board</h1>
          <p className="text-sm text-gray-500 mt-0.5">{viewLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadIssues} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="w-4 h-4" />
          </button>
          {allowed && (
            <ButtonColorful
              label="Create Task"
              onClick={() => setCreateModal("To Do")}
            />
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Filter className="w-3 h-3" /> View:
        </div>
        {/* Sprint / Backlog / All selector */}
        <select
          className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 outline-none font-medium"
          value={selectedView}
          onChange={(e) => setSelectedView(e.target.value === "all" || e.target.value === "backlog" ? e.target.value : parseInt(e.target.value))}
        >
          <option value="all">All</option>
          <option value="backlog">Backlog</option>
          {sprints.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}{s.status === "Active" ? " ✓" : ""}
            </option>
          ))}
        </select>

        <div className="w-px h-4 bg-gray-200" />

        <select
          className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 outline-none"
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
        >
          <option value="all">All Assignees</option>
          {uniqueAssignees.map((a) => (
            <option key={a.id} value={String(a.id)}>{a.name}</option>
          ))}
        </select>
        <select
          className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 outline-none"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          {ISSUE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <div className="ml-auto text-xs text-gray-400">
          {filteredIssues.length} issues · {filteredIssues.reduce((s, i) => s + (i.story_points || 0), 0)} SP
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-300">Loading board...</div>
      ) : issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-300">
          <Layers className="w-10 h-10" />
          <div className="text-sm">No tasks for this selection</div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                col={col}
                issues={byStatus(col.id)}
                onOpen={(id) => navigate("issue", { issueId: id })}
                onAddIssue={allowed ? (status) => setCreateModal(status) : null}
                wipLimit={col.id === "In Progress" ? 5 : null}
              />
            ))}
          </div>
          <DragOverlay>
            {activeIssue && (
              <div className="bg-white rounded-xl border border-orange-300 p-3 shadow-xl w-64 opacity-90">
                <div className="text-sm font-medium text-gray-800 line-clamp-2">{activeIssue.title}</div>
                <div className="text-xs text-gray-400 mt-1">{activeIssue.key}</div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {createModal && (
        <CreateIssueModal
          defaultStatus={createModal}
          onClose={() => setCreateModal(null)}
          onCreated={(issue) => {
            // Only add to the current view's issue list if it belongs here
            const isSprintView = typeof selectedView === "number";
            const isBacklogView = selectedView === "backlog";
            const inCurrentView =
              !isSprintView && !isBacklogView ? true          // "all" view: always show
              : isBacklogView ? !issue.sprint_id              // backlog view: no sprint
              : issue.sprint_id === selectedView;             // sprint view: must match
            if (inCurrentView) setIssues((prev) => [...prev, issue]);
          }}
          projectId={activeProject?.id}
          sprints={sprints}
          defaultSprintId={typeof selectedView === "number" ? selectedView : "backlog"}
          allowComplete={allowComplete}
        />
      )}
    </div>
  );
}
