import { useEffect, useState, useCallback, useRef } from "react";
import { useWorkspace } from "../WorkspaceApp";
import { issuesAPI, sprintsAPI } from "../api";
import { Calendar, ChevronLeft, ChevronRight, Filter } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TYPE_COLORS = {
  Epic: "bg-purple-500",
  Story: "bg-blue-500",
  Task: "bg-gray-400",
  Bug: "bg-red-500",
  Spike: "bg-yellow-500",
  Improvement: "bg-green-500",
  TechDebt: "bg-orange-400",
};


function parseDate(str) {
  if (!str) return null;
  return new Date(str);
}

function formatDate(d) {
  if (!d) return "";
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function GanttBar({ issue, viewStart, dayWidth }) {
  const start = parseDate(issue.start_date || issue.created_at?.slice(0, 10));
  const end = parseDate(issue.due_date);
  if (!start || !end) return null;

  const viewStartDate = new Date(viewStart);
  const left = Math.max(0, (start - viewStartDate) / (24 * 60 * 60 * 1000)) * dayWidth;
  const width = Math.max(dayWidth, ((end - start) / (24 * 60 * 60 * 1000)) * dayWidth);
  const color = TYPE_COLORS[issue.type] || "bg-gray-400";
  const pct = issue.status === "Done" ? 100 : issue.status === "In Progress" ? 50 : issue.status === "In Review" ? 75 : 0;

  return (
    <div
      className={`absolute top-2 h-6 rounded-lg flex items-center px-2 text-white text-xs font-medium shadow-sm cursor-pointer overflow-hidden ${color}`}
      style={{ left, width: Math.min(width, 800), minWidth: 40 }}
      title={`${issue.title}\n${formatDate(start)} → ${formatDate(end)}`}
    >
      {/* Progress fill */}
      <div className="absolute inset-0 bg-black/15 rounded-lg" style={{ width: `${pct}%` }} />
      <span className="relative truncate">{issue.key} {issue.title}</span>
    </div>
  );
}

export default function Roadmap() {
  const { activeProject } = useWorkspace();
  const [issues, setIssues] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [view, setView] = useState("month"); // month | quarter
  const containerRef = useRef(null);

  // View window: start = first of current month
  const today = new Date();
  const [viewOffset, setViewOffset] = useState(0); // months offset

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [issRes, spRes] = await Promise.all([
        issuesAPI.list({ project_id: activeProject?.id }),
        activeProject?.id ? sprintsAPI.list(activeProject.id) : Promise.resolve({ data: [] }),
      ]);
      setIssues(issRes.data.filter((i) => i.due_date));
      setSprints(spRes.data.filter((s) => s.start_date && s.end_date));
    } catch {}
    setLoading(false);
  }, [activeProject]);

  useEffect(() => { loadData(); }, [loadData]);

  // Compute view window
  const viewMonths = view === "month" ? 3 : 6;
  const viewStartDate = new Date(today.getFullYear(), today.getMonth() + viewOffset, 1);
  const viewEndDate = new Date(viewStartDate.getFullYear(), viewStartDate.getMonth() + viewMonths, 0);
  const totalDays = Math.ceil((viewEndDate - viewStartDate) / (24 * 60 * 60 * 1000));
  const DAY_WIDTH = view === "month" ? 28 : 14;
  const TOTAL_WIDTH = totalDays * DAY_WIDTH;

  // Build month headers
  const monthHeaders = [];
  let cur = new Date(viewStartDate);
  while (cur <= viewEndDate) {
    const daysInMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
    const clampStart = Math.max(0, (new Date(cur.getFullYear(), cur.getMonth(), 1) - viewStartDate) / (24 * 60 * 60 * 1000));
    const clampWidth = Math.min(daysInMonth, totalDays - clampStart) * DAY_WIDTH;
    monthHeaders.push({ label: `${MONTHS[cur.getMonth()]} ${cur.getFullYear()}`, left: clampStart * DAY_WIDTH, width: clampWidth });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }

  // Today marker
  const todayOffset = Math.ceil((today - viewStartDate) / (24 * 60 * 60 * 1000)) * DAY_WIDTH;

  const filtered = typeFilter === "all" ? issues : issues.filter((i) => i.type === typeFilter);
  const types = [...new Set(issues.map((i) => i.type))].filter(Boolean);

  const LABEL_WIDTH = 220;
  const ROW_H = 44;

  return (
    <div className="p-6 max-w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roadmap</h1>
          <p className="text-sm text-gray-500 mt-0.5">{activeProject?.name || "All Projects"} · Timeline View</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {["month","quarter"].map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize
                  ${view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                {v === "month" ? "3 months" : "6 months"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm outline-none">
            <option value="all">All Types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewOffset((v) => v - 1)}
            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={() => setViewOffset(0)}
            className="text-xs text-orange-500 font-medium px-2 py-1.5 border border-orange-200 rounded-lg hover:bg-orange-50">
            Today
          </button>
          <button onClick={() => setViewOffset((v) => v + 1)}
            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-300">Loading roadmap...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Sprint bands header label */}
          <div className="flex">
            <div className="flex-shrink-0 border-r border-gray-100" style={{ width: LABEL_WIDTH }}>
              <div className="h-8 border-b border-gray-100 flex items-center px-3">
                <span className="text-xs font-medium text-gray-400">Issue</span>
              </div>
            </div>
            <div className="flex-1 overflow-x-auto" ref={containerRef}>
              <div style={{ width: TOTAL_WIDTH, position: "relative" }}>
                {/* Month headers */}
                <div className="h-8 border-b border-gray-100 relative" style={{ width: TOTAL_WIDTH }}>
                  {monthHeaders.map((m, i) => (
                    <div key={i} className="absolute top-0 h-full flex items-center border-r border-gray-100"
                      style={{ left: m.left, width: m.width }}>
                      <span className="text-xs font-medium text-gray-500 px-2">{m.label}</span>
                    </div>
                  ))}
                  {/* Today line header dot */}
                  {todayOffset >= 0 && todayOffset <= TOTAL_WIDTH && (
                    <div className="absolute top-0 h-full w-px bg-orange-400 opacity-60" style={{ left: todayOffset }} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sprint rows — one row per sprint */}
          {sprints.length > 0 && sprints.map((s, idx) => {
            const start = parseDate(s.start_date);
            const end = parseDate(s.end_date);
            if (!start || !end) return null;
            const left = Math.max(0, (start - viewStartDate) / (24 * 60 * 60 * 1000)) * DAY_WIDTH;
            const width = Math.max(DAY_WIDTH * 2, ((end - start) / (24 * 60 * 60 * 1000)) * DAY_WIDTH);
            const color = s.status === "Active" ? "bg-orange-100 border-orange-300 text-orange-700"
              : s.status === "Completed" ? "bg-green-50 border-green-200 text-green-600"
              : "bg-gray-50 border-gray-200 text-gray-500";
            return (
              <div key={s.id} className="flex border-b border-gray-50">
                <div className="flex-shrink-0 border-r border-gray-100 flex items-center px-3"
                  style={{ width: LABEL_WIDTH, height: ROW_H }}>
                  {idx === 0 && (
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sprints</span>
                  )}
                </div>
                <div className="flex-1 overflow-x-hidden relative" style={{ height: ROW_H }}>
                  <div style={{ width: TOTAL_WIDTH, height: ROW_H, position: "relative" }}>
                    <div
                      className={`absolute top-2 h-7 rounded-lg border flex items-center px-2 text-xs font-medium overflow-hidden ${color}`}
                      style={{ left, width: Math.min(width, TOTAL_WIDTH - left - 4) }}
                      title={s.name}>
                      {s.name}
                    </div>
                    {todayOffset >= 0 && todayOffset <= TOTAL_WIDTH && (
                      <div className="absolute top-0 bottom-0 w-px bg-orange-400 opacity-40" style={{ left: todayOffset }} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Issue rows */}
          {filtered.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                <div className="text-sm">No issues with due dates found</div>
                <div className="text-xs text-gray-300 mt-1">Set due dates on issues to see them here</div>
              </div>
            </div>
          ) : (
            filtered.map((issue, idx) => (
              <div key={issue.id} className={`flex border-b border-gray-50 ${idx % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                <div className="flex-shrink-0 border-r border-gray-100 flex items-center gap-2 px-3"
                  style={{ width: LABEL_WIDTH, height: ROW_H }}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${TYPE_COLORS[issue.type] || "bg-gray-300"}`} />
                  <span className="text-xs font-mono text-gray-400 flex-shrink-0">{issue.key}</span>
                  <span className="text-xs text-gray-700 truncate">{issue.title}</span>
                </div>
                <div className="flex-1 overflow-x-hidden relative" style={{ height: ROW_H }}>
                  <div style={{ width: TOTAL_WIDTH, height: ROW_H, position: "relative" }}>
                    <GanttBar issue={issue} viewStart={viewStartDate.toISOString().slice(0, 10)} dayWidth={DAY_WIDTH} />
                    {todayOffset >= 0 && todayOffset <= TOTAL_WIDTH && (
                      <div className="absolute top-0 bottom-0 w-px bg-orange-400 opacity-20" style={{ left: todayOffset }} />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-4">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${color}`} />
            <span className="text-xs text-gray-500">{type}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-200">
          <div className="w-0.5 h-3 bg-orange-400" />
          <span className="text-xs text-gray-500">Today</span>
        </div>
      </div>
    </div>
  );
}
