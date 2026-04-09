import { useState, useEffect, createContext, useContext } from "react";
import { useAuth } from "../AuthContext";
import { projectsAPI, sprintsAPI, notificationsAPI } from "./api";
import Sidebar from "./Sidebar";
import Dashboard from "./pages/Dashboard";
import Board from "./pages/Board";
import Backlog from "./pages/Backlog";
import SprintsPage from "./pages/Sprints";
import IssueDetail from "./pages/IssueDetail";
import Reports from "./pages/Reports";
import Team from "./pages/Team";
import Roadmap from "./pages/Roadmap";
import Wiki from "./pages/Wiki";
import Settings from "./pages/Settings";
import AIAnalysis from "./pages/AIAnalysis";

// ── Workspace Context ─────────────────────────────────────────────────────────
export const WorkspaceContext = createContext(null);
export const useWorkspace = () => useContext(WorkspaceContext);

export default function WorkspaceApp() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeSprint, setActiveSprint] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Ensure <html> never carries dark-mode (only #workspace-root should)
  // Apply saved theme to workspace-root once it mounts
  useEffect(() => {
    document.documentElement.classList.remove('dark-mode', 'light-mode');
    const saved = localStorage.getItem('intellitrack-theme');
    const root = document.getElementById('workspace-root');
    if (root && saved) {
      root.classList.add(saved === 'dark' ? 'dark-mode' : 'light-mode');
    }
    return () => {
      document.documentElement.classList.remove('dark-mode', 'light-mode');
    };
  }, []);

  // Load projects on mount
  useEffect(() => {
    projectsAPI.list().then((r) => {
      setProjects(r.data);
      if (r.data.length > 0) setActiveProject(r.data[0]);
    }).catch(() => {});
  }, []);

  // Load active sprint when project changes — only a truly "Active" sprint counts
  useEffect(() => {
    if (!activeProject) return;
    sprintsAPI.list(activeProject.id).then((r) => {
      const active = r.data.find((s) => s.status === "Active");
      setActiveSprint(active || null);
    }).catch(() => {});
  }, [activeProject]);

  // Load notifications
  useEffect(() => {
    if (!user) return;
    notificationsAPI.list(user.user_id || user.id).then((r) => {
      setNotifications(r.data);
    }).catch(() => {});
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navigate = (page, extra = {}) => {
    setActivePage(page);
    if (extra.issueId) setSelectedIssueId(extra.issueId);
  };

  const ctx = {
    user,
    projects,
    setProjects,
    activeProject,
    setActiveProject,
    activeSprint,
    setActiveSprint,
    notifications,
    setNotifications,
    unreadCount,
    navigate,
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":   return <Dashboard />;
      case "board":       return <Board />;
      case "backlog":     return <Backlog />;
      case "sprints":     return <SprintsPage />;
      case "issue":       return <IssueDetail issueId={selectedIssueId} onBack={() => setActivePage("backlog")} />;
      case "reports":     return <Reports />;
      case "team":        return <Team />;
      case "roadmap":     return <Roadmap />;
      case "wiki":        return <Wiki />;
      case "settings":    return <Settings />;
      case "ai-analysis": return <AIAnalysis />;
      default:            return <Dashboard />;
    }
  };

  return (
    <WorkspaceContext.Provider value={ctx}>
      <div id="workspace-root" className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
        <main
          className="flex-1 overflow-y-auto"
          style={{ marginLeft: sidebarCollapsed ? 64 : 240, transition: "margin 0.2s" }}
        >
          {renderPage()}
        </main>
      </div>
    </WorkspaceContext.Provider>
  );
}
