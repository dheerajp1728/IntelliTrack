import { useState } from "react";
import { useWorkspace } from "./WorkspaceApp";
import { useAuth } from "../AuthContext";
import {
  LayoutDashboard, Kanban, List, Zap, BarChart3, Users,
  Map, BookOpen, Settings, Bell, ChevronLeft, ChevronRight,
  LogOut, FolderKanban, ChevronDown, Plus, Search, X, Bot
} from "lucide-react";
import { searchAPI } from "./api";
import { ThemeToggle } from "../components/ui/theme-toggle";

const NAV = [
  { id: "dashboard",   label: "Dashboard",   icon: LayoutDashboard, section: "main" },
  { id: "board",       label: "Board",        icon: Kanban,           section: "main" },
  { id: "backlog",     label: "Backlog",      icon: List,             section: "main" },
  { id: "sprints",     label: "Sprints",      icon: Zap,              section: "main" },
  { id: "roadmap",     label: "Roadmap",      icon: Map,              section: "plan"  },
  { id: "reports",     label: "Reports",      icon: BarChart3,        section: "plan"  },
  { id: "ai-analysis", label: "AI Analysis",  icon: Bot,              section: "plan"  },
  { id: "team",        label: "Team",         icon: Users,            section: "team"  },
  { id: "settings",    label: "Settings",     icon: Settings,         section: "admin" },
];

function SearchModal({ onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const { navigate } = useWorkspace();

  const handleSearch = async (q) => {
    setQuery(q);
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const r = await searchAPI.global(q);
      setResults(r.data);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            autoFocus
            className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400"
            placeholder="Search issues, wiki, people..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults(null); }}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        {loading && <div className="p-4 text-sm text-gray-400">Searching...</div>}
        {results && (
          <div className="max-h-80 overflow-y-auto">
            {results.issues?.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Issues</div>
                {results.issues.map((i) => (
                  <button key={i.id} className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg"
                    onClick={() => { navigate("issue", { issueId: i.id }); onClose(); }}>
                    <span className="text-xs text-gray-400 font-mono">{i.key}</span>
                    <span className="text-sm text-gray-800 truncate">{i.title}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${statusColor(i.status)}`}>{i.status}</span>
                  </button>
                ))}
              </div>
            )}
            {results.wiki?.length > 0 && (
              <div className="p-2 border-t">
                <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Wiki</div>
                {results.wiki.map((p) => (
                  <button key={p.id} className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg"
                    onClick={() => { navigate("wiki"); onClose(); }}>
                    <BookOpen className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-gray-800">{p.title}</span>
                  </button>
                ))}
              </div>
            )}
            {results.users?.length > 0 && (
              <div className="p-2 border-t">
                <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">People</div>
                {results.users.map((u) => (
                  <button key={u.id} className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg"
                    onClick={() => { navigate("team"); onClose(); }}>
                    <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-bold">
                      {u.name[0]}
                    </div>
                    <span className="text-sm text-gray-800">{u.name}</span>
                    <span className="ml-auto text-xs text-gray-400">{u.role}</span>
                  </button>
                ))}
              </div>
            )}
            {results.issues?.length === 0 && results.wiki?.length === 0 && results.users?.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-400">No results found for "{query}"</div>
            )}
          </div>
        )}
        {!results && !loading && (
          <div className="p-4 text-xs text-gray-400 text-center">Type to search across issues, wiki, and people</div>
        )}
      </div>
    </div>
  );
}

function statusColor(s) {
  if (s === "Done") return "bg-green-100 text-green-700";
  if (s === "In Progress") return "bg-blue-100 text-blue-700";
  if (s === "In Review") return "bg-purple-100 text-purple-700";
  return "bg-gray-100 text-gray-600";
}

export default function Sidebar({ activePage, onNavigate, collapsed, onToggleCollapse }) {
  const { projects, activeProject, setActiveProject, unreadCount, user } = useWorkspace();
  const { logout } = useAuth();
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  const initials = (name) => name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  const sections = {
    main: { label: "Workspace" },
    plan: { label: "Planning" },
    team: { label: "Collaboration" },
    admin: { label: "Admin" },
  };

  const grouped = Object.entries(sections).map(([key, meta]) => ({
    key,
    label: meta.label,
    items: NAV.filter((n) => n.section === key),
  }));

  return (
    <>
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
      <aside
        className="fixed left-0 top-0 h-full bg-white border-r border-gray-100 flex flex-col z-40"
        style={{ width: collapsed ? 64 : 240, transition: "width 0.2s" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-4 border-b border-gray-100">
          <img src="/intellitract-logo.png" alt="IntelliTract" className="w-8 h-8 object-contain flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="font-bold text-gray-900 text-sm tracking-widest" style={{ fontFamily: '"Saira Stencil", sans-serif' }}>
                INTELLITRACT
              </span>
              <ThemeToggle />
            </>
          )}
          <button
            onClick={onToggleCollapse}
            className="ml-auto text-gray-400 hover:text-gray-600 p-1 rounded"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Search */}
        <div className="px-2 pt-2">
          <button
            onClick={() => setShowSearch(true)}
            className={`w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-xs">Search... ⌘K</span>}
          </button>
        </div>

        {/* Project switcher */}
        {!collapsed && (
          <div className="px-2 pt-1">
            <button
              onClick={() => setProjectsOpen((v) => !v)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
            >
              <FolderKanban className="w-3 h-3" />
              Projects
              <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${projectsOpen ? "" : "-rotate-90"}`} />
            </button>
            {projectsOpen && (
              <div className="mt-1 space-y-0.5">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveProject(p)}
                    className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                      activeProject?.id === p.id ? "bg-orange-50 text-orange-600 font-medium" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="w-5 h-5 rounded bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {p.key[0]}
                    </span>
                    <span className="truncate text-xs">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 pt-2 pb-2">
          {grouped.map(({ key, label, items }) => (
            <div key={key} className="mb-3">
              {!collapsed && (
                <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                      active
                        ? "bg-orange-50 text-orange-600 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && item.id === "dashboard" && unreadCount > 0 && (
                      <span className="ml-auto bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User & logout */}
        <div className={`border-t border-gray-100 p-2 flex items-center gap-2 ${collapsed ? "justify-center flex-col" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-sm font-bold flex items-center justify-center flex-shrink-0">
            {initials(user?.user_name || user?.name || "U")}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-800 truncate">{user?.user_name || user?.name}</div>
                <div className="text-xs text-gray-400 truncate">{user?.user_role || user?.role}</div>
              </div>
              <button onClick={logout} title="Logout" className="text-gray-400 hover:text-red-500 p-1">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
