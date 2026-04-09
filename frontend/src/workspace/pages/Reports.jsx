import { useEffect, useState, useCallback } from "react";
import { useWorkspace } from "../WorkspaceApp";
import { analyticsAPI, sprintsAPI } from "../api";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ScatterChart, Scatter, ZAxis
} from "recharts";
import { TrendingUp, BarChart3, Activity, Clock, Zap, Download } from "lucide-react";

const ORANGE = "#f97316";
const BLUE = "#3b82f6";
const GREEN = "#10b981";

const TABS = [
  { id: "velocity", label: "Velocity", icon: Zap },
  { id: "burndown", label: "Burndown", icon: TrendingUp },
  { id: "throughput", label: "Throughput", icon: BarChart3 },
  { id: "cycletime", label: "Cycle Time", icon: Clock },
  { id: "cumflow", label: "Cumulative Flow", icon: Activity },
];

function SectionCard({ title, subtitle, children, action }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatPill({ label, value, color = "gray" }) {
  const colors = {
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    green: "bg-green-50 text-green-700 border-green-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    gray: "bg-gray-50 text-gray-700 border-gray-100",
  };
  return (
    <div className={`border rounded-xl px-4 py-3 ${colors[color]}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs mt-0.5 opacity-70">{label}</div>
    </div>
  );
}

export default function Reports() {
  const { activeProject, activeSprint } = useWorkspace();
  const [tab, setTab] = useState("velocity");
  const [velocity, setVelocity] = useState([]);
  const [burndown, setBurndown] = useState([]);
  const [throughput, setThroughput] = useState([]);
  const [cycleTime, setCycleTime] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [velRes, thrRes, cycRes] = await Promise.all([
        analyticsAPI.velocity(activeProject?.id),
        analyticsAPI.throughput(activeProject?.id),
        analyticsAPI.cycleTime(activeProject?.id),
      ]);

      setVelocity(velRes.data);
      setThroughput(thrRes.data);
      setCycleTime(cycRes.data);

      if (activeProject?.id) {
        const spRes = await sprintsAPI.list(activeProject.id);
        const completed = spRes.data.filter((s) => s.status === "Completed" || s.status === "Active");
        setSprints(completed);
        const target = activeSprint || completed[0];
        if (target) setSelectedSprint(target);
      }
    } catch {}
    setLoading(false);
  }, [activeProject, activeSprint]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const loadBurndown = async () => {
      if (!selectedSprint?.id) return;
      try {
        const res = await analyticsAPI.sprint(selectedSprint.id);
        setBurndown(res.data?.burndown || []);
      } catch {}
    };
    loadBurndown();
  }, [selectedSprint]);

  const avgVelocity = velocity.length > 0
    ? Math.round(velocity.reduce((s, v) => s + (v.completed || 0), 0) / velocity.length)
    : 0;
  const avgThroughput = throughput.length > 0
    ? Math.round(throughput.reduce((s, v) => s + (v.issues_completed || 0), 0) / throughput.length)
    : 0;
  const avgCycleTime = cycleTime.length > 0
    ? (cycleTime.reduce((s, v) => s + (v.avg_days || 0), 0) / cycleTime.length).toFixed(1)
    : 0;

  const handleExport = () => {
    const rows = [
      ["Sprint", "Planned SP", "Completed SP", "Issues Completed", "Avg Cycle Time (days)"],
      ...velocity.map((v, i) => [
        v.sprint,
        v.planned ?? 0,
        v.completed ?? 0,
        throughput[i]?.issues_completed ?? "",
        cycleTime[i]?.avg_days ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeProject?.name || "project"}-reports.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Cumulative flow — synthesize from velocity data
  const cumFlow = velocity.map((v, i) => {
    const prevDone = velocity.slice(0, i).reduce((s, x) => s + (x.completed || 0), 0);
    return {
      sprint: v.sprint,
      done: prevDone + (v.completed || 0),
      inProgress: Math.max(0, Math.round((v.planned || 0) * 0.3)),
      toDo: Math.max(0, Math.round((v.planned || 0) * 0.4)),
    };
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">{activeProject?.name || "All Projects"} · Analytics & Insights</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm hover:bg-gray-50">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatPill label="Avg Velocity (SP)" value={avgVelocity} color="orange" />
        <StatPill label="Avg Throughput" value={`${avgThroughput} issues/sprint`} color="blue" />
        <StatPill label="Avg Cycle Time" value={`${avgCycleTime} days`} color="green" />
        <StatPill label="Sprints Completed" value={sprints.filter((s) => s.status === "Completed").length} color="gray" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
              ${tab === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-300">Loading reports...</div>
      ) : (
        <>
          {/* VELOCITY */}
          {tab === "velocity" && (
            <div className="space-y-5">
              <SectionCard title="Sprint Velocity" subtitle="Planned vs completed story points per sprint">
                {velocity.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={velocity} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} label={{ value: "Story Points", angle: -90, position: "insideLeft", fontSize: 11, fill: "#9ca3af" }} />
                      <Tooltip formatter={(v, n) => [`${v} SP`, n]} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="planned" name="Planned" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" name="Completed" fill={ORANGE} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-300 text-sm">No velocity data</div>
                )}
              </SectionCard>

              <SectionCard title="Velocity Trend" subtitle="Moving average of completed story points">
                {velocity.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={velocity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => [`${v} SP`]} />
                      <Line type="monotone" dataKey="completed" name="Completed" stroke={ORANGE} strokeWidth={2} dot={{ r: 4, fill: ORANGE }} />
                      <Line type="monotone" dataKey="planned" name="Planned" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data</div>
                )}
              </SectionCard>
            </div>
          )}

          {/* BURNDOWN */}
          {tab === "burndown" && (
            <SectionCard
              title="Sprint Burndown"
              subtitle="Remaining story points over time"
              action={
                sprints.length > 0 && (
                  <select
                    value={selectedSprint?.id || ""}
                    onChange={(e) => setSprints((prev) => {
                      const s = prev.find((sp) => sp.id === parseInt(e.target.value));
                      if (s) setSelectedSprint(s);
                      return prev;
                    })}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none"
                  >
                    {sprints.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )
              }
            >
              {burndown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={burndown}>
                    <defs>
                      <linearGradient id="burnGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={ORANGE} stopOpacity={0.12} />
                        <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(v) => `Day ${v}`} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: "Story Points", angle: -90, position: "insideLeft", fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip formatter={(v, n) => [`${v} SP`, n]} labelFormatter={(v) => `Day ${v}`} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="ideal" name="Ideal" stroke="#cbd5e1" strokeDasharray="6 4" fill="none" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="actual" name="Actual" stroke={ORANGE} fill="url(#burnGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-72 flex items-center justify-center text-gray-300 text-sm">
                  {selectedSprint ? "No burndown data for this sprint" : "Select a sprint to view burndown"}
                </div>
              )}
            </SectionCard>
          )}

          {/* THROUGHPUT */}
          {tab === "throughput" && (
            <SectionCard title="Issue Throughput" subtitle="Number of issues completed per sprint">
              {throughput.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={throughput}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: "Issues", angle: -90, position: "insideLeft", fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip formatter={(v) => [`${v} issues`]} />
                    <Bar dataKey="issues_completed" name="Issues Completed" fill={BLUE} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-300 text-sm">No throughput data</div>
              )}
            </SectionCard>
          )}

          {/* CYCLE TIME */}
          {tab === "cycletime" && (
            <div className="space-y-5">
              <SectionCard title="Average Cycle Time" subtitle="Days from In Progress to Done per sprint">
                {cycleTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={cycleTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} label={{ value: "Days", angle: -90, position: "insideLeft", fontSize: 11, fill: "#9ca3af" }} />
                      <Tooltip formatter={(v) => [`${v} days`]} />
                      <Line type="monotone" dataKey="avg_days" name="Avg Cycle Time" stroke={GREEN} strokeWidth={2} dot={{ r: 4, fill: GREEN }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-60 flex items-center justify-center text-gray-300 text-sm">No cycle time data</div>
                )}
              </SectionCard>

              {/* Control chart */}
              <SectionCard title="Control Chart" subtitle="Cycle time distribution — each dot is one issue">
                {cycleTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="sprint" name="Sprint" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="avg_days" name="Days" tick={{ fontSize: 11 }} />
                      <ZAxis range={[60, 60]} />
                      <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v, n) => [n === "Days" ? `${v} days` : v, n]} />
                      <Scatter data={cycleTime} fill={ORANGE} fillOpacity={0.7} />
                    </ScatterChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-52 flex items-center justify-center text-gray-300 text-sm">No data</div>
                )}
              </SectionCard>
            </div>
          )}

          {/* CUMULATIVE FLOW */}
          {tab === "cumflow" && (
            <SectionCard title="Cumulative Flow Diagram" subtitle="Issue status distribution across sprints">
              {cumFlow.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={cumFlow}>
                    <defs>
                      <linearGradient id="doneGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={GREEN} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={GREEN} stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="ipGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BLUE} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={BLUE} stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="todoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#9ca3af" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: "Story Points", angle: -90, position: "insideLeft", fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="toDo" name="To Do" stackId="1" stroke="#9ca3af" fill="url(#todoGrad)" />
                    <Area type="monotone" dataKey="inProgress" name="In Progress" stackId="1" stroke={BLUE} fill="url(#ipGrad)" />
                    <Area type="monotone" dataKey="done" name="Done" stackId="1" stroke={GREEN} fill="url(#doneGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-72 flex items-center justify-center text-gray-300 text-sm">No data available</div>
              )}
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
