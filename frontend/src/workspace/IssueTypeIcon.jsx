import {
  BookOpen, CheckSquare, Bug, Zap, GitBranch,
  FlaskConical, Package, TrendingUp, FileText,
} from "lucide-react";

// Neon color map per issue type
const TYPE_CONFIG = {
  Story:       { icon: BookOpen,     color: "#a855f7" }, // neon purple
  Task:        { icon: CheckSquare,  color: "#22d3ee" }, // neon cyan
  Bug:         { icon: Bug,          color: "#f43f5e" }, // neon rose
  Epic:        { icon: Zap,          color: "#facc15" }, // neon yellow
  SubTask:     { icon: GitBranch,    color: "#38bdf8" }, // neon sky
  Spike:       { icon: FlaskConical, color: "#34d399" }, // neon emerald
  TechDebt:    { icon: Package,      color: "#fb923c" }, // neon orange
  Improvement: { icon: TrendingUp,   color: "#f472b6" }, // neon pink
};

const DEFAULT = { icon: FileText, color: "#94a3b8" };

// Keys array — used anywhere a type <select> needs options
export const ISSUE_TYPES = Object.keys(TYPE_CONFIG);

export function IssueTypeIcon({ type, size = 14 }) {
  const { icon: Icon, color } = TYPE_CONFIG[type] || DEFAULT;
  return (
    <Icon
      width={size}
      height={size}
      style={{ color, filter: `drop-shadow(0 0 4px ${color}88)` }}
      strokeWidth={2}
      aria-label={type}
    />
  );
}
