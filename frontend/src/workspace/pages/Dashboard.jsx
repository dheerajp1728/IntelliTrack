import { useEffect, useState } from "react";
import { useWorkspace } from "../WorkspaceApp";
import { analyticsAPI, notificationsAPI, sprintsAPI } from "../api";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Zap, CheckCircle2, Clock, AlertCircle, TrendingUp,
  Users, BarChart3, Bell,
  LayoutGrid, ListTodo, BookOpen, Map
} from "lucide-react";
import { BentoGrid } from "../../components/ui/bento-grid";

const ORANGE = "#f97316";
const COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];

function StatCard({ icon: Icon, label, value, sub, color = "orange" }) {
  const colors = {
    orange: "bg-orange-50 text-orange-600",
    blue:   "bg-blue-50 text-blue-600",
    green:  "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    red:    "bg-red-50 text-red-600",
  };
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { activeProject, setActiveProject, projects, notifications, setNotifications, user, navigate } = useWorkspace();
  const [analytics, setAnalytics] = useState(null);
  const [workload, setWorkload] = useState([]);
  const [velocity, setVelocity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sprints, setSprints] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState(null);

  // Effect 1: when project changes, reload everything from scratch
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      // Immediately clear stale data from previous project
      setAnalytics(null);
      setWorkload([]);
      setVelocity([]);
      setSprints([]);
      setSelectedSprint(null);

      try {
        const [wl, vel, spRes] = await Promise.all([
          analyticsAPI.workload(activeProject?.id),
          analyticsAPI.velocity(activeProject?.id),
          activeProject?.id
            ? sprintsAPI.list(activeProject.id)
            : Promise.resolve({ data: [] }),
        ]);
        if (cancelled) return;
        setWorkload(wl.data);
        setVelocity(vel.data);

        const list = spRes.data.filter((s) => s.status !== "Planning");
        setSprints(list);
        const picked = list.find((s) => s.status === "Active") || list[0] || null;
        setSelectedSprint(picked);

        if (picked?.id) {
          const an = await analyticsAPI.sprint(picked.id);
          if (!cancelled) setAnalytics(an.data);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [activeProject]);

  // Effect 2: when user manually picks a different sprint from the dropdown
  useEffect(() => {
    if (!selectedSprint?.id) { setAnalytics(null); return; }
    analyticsAPI.sprint(selectedSprint.id)
      .then((r) => setAnalytics(r.data))
      .catch(() => {});
  }, [selectedSprint]);

  const markAllRead = async () => {
    if (!user) return;
    await notificationsAPI.markAllRead(user.user_id || user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotifClick = async (n) => {
    if (!n.read) {
      try {
        await notificationsAPI.markRead(n.id);
        setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
      } catch {}
    }
    if (n.issue_id) navigate("issue", { issueId: n.issue_id });
  };

  const unread = notifications.filter((n) => !n.read);
  const pieData = analytics ? [
    { name: "Done", value: analytics.completed_issues },
    { name: "In Progress", value: analytics.in_progress_issues },
    { name: "To Do", value: analytics.todo_issues },
    { name: "Blocked", value: analytics.blocked_issues },
  ].filter((d) => d.value > 0) : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeProject ? activeProject.name : "All Projects"}
          </p>
        </div>
        {sprints.length > 0 && (
          <select
            value={selectedSprint?.id || ""}
            onChange={(e) => {
              const s = sprints.find((sp) => sp.id === parseInt(e.target.value));
              setSelectedSprint(s || null);
            }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
          >
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.status === "Active" ? "(Active)" : s.status === "Completed" ? "(Completed)" : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={CheckCircle2} label="Issues Done" color="green"
          value={analytics?.completed_issues ?? "–"}
          sub={`of ${analytics?.total_issues ?? "–"} total`} />
        <StatCard icon={Clock} label="In Progress" color="blue"
          value={analytics?.in_progress_issues ?? "–"}
          sub={`${analytics?.story_points_completed ?? 0} SP completed`} />
        <StatCard icon={Zap} label="Sprint Velocity" color="orange"
          value={`${analytics?.story_points_completed ?? 0} SP`}
          sub={`of ${analytics?.story_points_total ?? 0} planned`} />
        <StatCard icon={AlertCircle} label="Blocked Issues" color="red"
          value={analytics?.blocked_issues ?? "–"}
          sub="Flagged as impediment" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Burndown Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Sprint Burndown</h2>
              <p className="text-xs text-gray-400">{selectedSprint?.name || "Select a sprint"}</p>
            </div>
            <TrendingUp className="w-4 h-4 text-gray-300" />
          </div>
          {analytics?.burndown ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={analytics.burndown}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ORANGE} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(v) => `D${v}`} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} SP`]} />
                <Area type="monotone" dataKey="ideal" stroke="#cbd5e1" strokeDasharray="5 5" fill="none" name="Ideal" />
                <Area type="monotone" dataKey="actual" stroke={ORANGE} fill="url(#actualGrad)" strokeWidth={2} name="Actual" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">
              {loading ? "Loading..." : "No sprint data"}
            </div>
          )}
        </div>

        {/* Issue Breakdown Pie */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Issue Breakdown</h2>
          <p className="text-xs text-gray-400 mb-3">Current sprint distribution</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-300 text-sm">No data</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Velocity Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Team Velocity</h2>
              <p className="text-xs text-gray-400">Story points per sprint</p>
            </div>
            <BarChart3 className="w-4 h-4 text-gray-300" />
          </div>
          {velocity.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={velocity} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="planned" name="Planned" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill={ORANGE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-300 text-sm">No velocity data yet</div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900 text-sm">Notifications</h2>
              {unread.length > 0 && (
                <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                  {unread.length}
                </span>
              )}
            </div>
            {unread.length > 0 && (
              <button onClick={markAllRead} className="text-xs text-orange-500 hover:text-orange-700 font-medium transition-colors">
                Mark all read
              </button>
            )}
          </div>
          <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
            {notifications.slice(0, 8).map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotifClick(n)}
                className={[
                  "group relative w-full text-left p-3 rounded-xl border transition-all duration-200 will-change-transform",
                  "hover:shadow-[0_4px_20px_rgba(249,115,22,0.15)] hover:-translate-y-0.5 hover:border-orange-300",
                  !n.read ? "bg-orange-50/60 border-orange-100" : "bg-gray-50/50 border-gray-100",
                ].join(" ")}
              >
                {/* Orange top bar — bento style */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-t-xl pointer-events-none" />
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? "bg-orange-500" : "bg-gray-300"}`} />
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs font-semibold truncate ${!n.read ? "text-gray-900" : "text-gray-500"}`}>
                      {n.title}
                    </div>
                    <div className="text-xs text-gray-400 truncate mt-0.5">{n.message}</div>
                  </div>
                  {n.issue_id && (
                    <span className="text-[10px] text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium whitespace-nowrap self-center">
                      View →
                    </span>
                  )}
                </div>
              </button>
            ))}
            {notifications.length === 0 && (
              <div className="py-6 text-center text-sm text-gray-400">All caught up!</div>
            )}
          </div>
        </div>
      </div>

      {/* Team Workload */}
      {workload.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Team Workload</h2>
            {workload.some((m) => (m.workload_percentage ?? 0) > 100) && (
              <span className="ml-auto flex items-center gap-1 text-xs font-medium text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" />
                Overallocation detected
              </span>
            )}
          </div>
          <div className="space-y-3">
            {workload.map((m) => {
              const rawPct = m.workload_percentage ?? Math.round((m.open_issues / Math.max(m.capacity ?? 8, 1)) * 100);
              const barPct = Math.min(rawPct, 100);
              const overloaded = rawPct > 100;
              const color = overloaded ? "bg-red-500" : rawPct >= 80 ? "bg-red-400" : rawPct >= 60 ? "bg-yellow-400" : "bg-green-400";
              const label = overloaded ? "text-red-500" : rawPct >= 80 ? "text-red-500" : rawPct >= 60 ? "text-yellow-600" : "text-green-600";
              return (
                <div key={m.user_id} className={`flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors ${overloaded ? "bg-red-50 border border-red-100" : ""}`}>
                  <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${overloaded ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>
                    {m.user_name[0]}
                  </div>
                  <div className="w-24 text-xs text-gray-700 truncate">{m.user_name}</div>
                  <div className="flex-1 relative bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${color} ${overloaded ? "animate-pulse" : ""}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <div className={`text-xs font-semibold w-12 text-right ${label}`}>{rawPct}%</div>
                  {overloaded ? (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-red-500 bg-red-100 px-1.5 py-0.5 rounded-full w-28 justify-center flex-shrink-0">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      Workload warning
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 w-28 text-right flex-shrink-0">{m.open_issues} issues · {m.story_points} SP</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Workspace Quick Access — BentoGrid */}
      <div className="mt-6">
        <h2 className="font-semibold text-gray-900 mb-3">Workspace</h2>
        <BentoGrid
          items={[
            {
              title: "Sprint Board",
              meta: selectedSprint ? selectedSprint.name : "No active sprint",
              description: selectedSprint
                ? `${analytics?.completed_issues ?? 0} done · ${analytics?.in_progress_issues ?? 0} in progress · ${analytics?.story_points_completed ?? 0} SP completed`
                : "Start a sprint to track work in progress across columns.",
              icon: <LayoutGrid className="w-4 h-4 text-orange-500" />,
              status: selectedSprint?.status === "Active" ? "Active" : selectedSprint ? "Completed" : "Idle",
              tags: ["Kanban", "Sprint"],
              cta: "Go to Board →",
              colSpan: 2,
              hasPersistentHover: selectedSprint?.status === "Active",
              onClick: () => navigate("board"),
            },
            {
              title: "Backlog",
              meta: `${analytics?.total_issues ?? "–"} issues`,
              description: "Prioritize and assign stories to sprints. Drag items into upcoming sprints to plan your next cycle.",
              icon: <ListTodo className="w-4 h-4 text-blue-500" />,
              status: "Planning",
              tags: ["Backlog", "Stories"],
              cta: "View Backlog →",
              onClick: () => navigate("backlog"),
            },
            {
              title: "Reports",
              meta: velocity.length > 0
                ? `${Math.round(velocity.reduce((s, v) => s + (v.completed || 0), 0) / velocity.length)} SP avg`
                : "No data yet",
              description: "Velocity, burndown, cycle time, and cumulative flow diagrams for your team.",
              icon: <BarChart3 className="w-4 h-4 text-purple-500" />,
              status: velocity.length > 0 ? "Live" : "Pending",
              tags: ["Velocity", "Analytics"],
              cta: "View Reports →",
              onClick: () => navigate("reports"),
            },
            {
              title: "Team",
              meta: `${workload.length} members`,
              description: "View team capacity, workload distribution, and individual contributor profiles.",
              icon: <Users className="w-4 h-4 text-emerald-500" />,
              status: "Active",
              tags: ["Members", "Roles"],
              cta: "View Team →",
              onClick: () => navigate("team"),
            },
            {
              title: "Roadmap",
              meta: activeProject?.name ?? "—",
              description: "Timeline view of sprints and issues with due dates. Navigate forward to plan future milestones.",
              icon: <Map className="w-4 h-4 text-sky-500" />,
              tags: ["Timeline", "Milestones"],
              cta: "View Roadmap →",
              onClick: () => navigate("roadmap"),
            },
            {
              title: "Wiki",
              description: "Team knowledge base — document processes, decisions, and onboarding guides for the project.",
              icon: <BookOpen className="w-4 h-4 text-pink-500" />,
              tags: ["Docs", "Knowledge"],
              cta: "Open Wiki →",
              onClick: () => navigate("wiki"),
            },
          ]}
        />
      </div>

      {/* Active Projects */}
      {projects.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Active Projects</h2>
          <BentoGrid
            items={projects.map((p) => ({
              title: p.name,
              meta: p.key,
              description: p.description?.slice(0, 80) || "No description.",
              icon: (
                <div className="w-4 h-4 rounded bg-orange-200 text-orange-700 text-[10px] font-bold flex items-center justify-center">
                  {p.key[0]}
                </div>
              ),
              status: p.status,
              tags: [p.methodology || "Scrum"],
              cta: "Open →",
              onClick: () => { setActiveProject(p); navigate("sprints"); },
            }))}
          />
        </div>
      )}
    </div>
  );
}
