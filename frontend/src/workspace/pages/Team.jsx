import { useEffect, useState, useCallback, useRef } from "react";
import { useWorkspace } from "../WorkspaceApp";
import { usersAPI, analyticsAPI, profilesAPI, taskAllocationAPI } from "../api";
import { Users, Mail, Shield, Search, User, UserPlus, Phone, GitBranch, Link2, X, ExternalLink, Code2, FolderKanban } from "lucide-react";
import { BentoGrid } from "../../components/ui/bento-grid";

const ROLE_COLORS = {
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  developer: "bg-green-100 text-green-700",
  viewer: "bg-gray-100 text-gray-600",
};

const ROLE_LABELS = {
  admin: "Admin",
  manager: "Manager",
  developer: "Developer",
  viewer: "Viewer",
};

function RoleBadge({ role }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[role] || "bg-gray-100 text-gray-600"}`}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function Avatar({ name, size = "md" }) {
  const sizes = { sm: "w-7 h-7 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg" };
  const initials = name ? name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() : "?";
  return (
    <div className={`rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center flex-shrink-0 ${sizes[size]}`}>
      {initials}
    </div>
  );
}

// ── Profile Modal ─────────────────────────────────────────────────────────────
const PROJECT_STATUS_COLORS = {
  Active: "bg-green-100 text-green-700",
  Archived: "bg-gray-100 text-gray-500",
  Completed: "bg-blue-100 text-blue-700",
};

function ProfileModal({ member, workload, onClose }) {
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);
  const wl = workload.find((w) => w.user_id === member.id);

  useEffect(() => {
    Promise.all([
      profilesAPI.get(member.id).catch(() => ({ data: null })),
      taskAllocationAPI.userProjects(member.id).catch(() => ({ data: [] })),
    ]).then(([profRes, projRes]) => {
      setProfile(profRes.data);
      setProjects(projRes.data || []);
    }).finally(() => setLoading(false));
  }, [member.id]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const skills = (profile?.skills || "").split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        ref={ref}
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200 text-gray-900"
        style={{ colorScheme: "light" }}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-orange-50 to-orange-100 rounded-t-2xl p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-200 text-orange-700 text-2xl font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
              {member.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "#111827" }}>{member.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <RoleBadge role={member.role} />
                {(profile?.role_title || member.title) && (
                  <span className="text-xs" style={{ color: "#6b7280" }}>{profile?.role_title || member.title}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center text-sm text-gray-300 py-6">Loading profile...</div>
          ) : (
            <>
              {/* Contact info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{member.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{profile.phone}</span>
                  </div>
                )}
              </div>

              {/* GitHub / LinkedIn */}
              {(profile?.github_url || profile?.linkedin_url) && (
                <div className="flex flex-wrap gap-2">
                  {profile.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors">
                      <GitBranch className="w-3.5 h-3.5" /> GitHub
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Link2 className="w-3.5 h-3.5" /> LinkedIn
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}
                </div>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    <Code2 className="w-3.5 h-3.5" /> Skills
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <span key={s} className="text-xs px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-full font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {projects.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    <FolderKanban className="w-3.5 h-3.5" /> Assigned Projects
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {projects.map((p) => (
                      <span key={p.id} className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${PROJECT_STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"} border-transparent`}>
                        <span className="font-mono text-[10px] opacity-60">{p.key}</span>
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {profile?.bio && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bio</div>
                  <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Workload */}
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Workload</div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{wl?.open_issues ?? 0}</div>
                    <div className="text-xs text-gray-400">Open Issues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{wl?.story_points ?? 0}</div>
                    <div className="text-xs text-gray-400">Story Points</div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${(wl?.open_issues || 0) > 8 ? "bg-red-400" : (wl?.open_issues || 0) > 5 ? "bg-yellow-400" : "bg-green-400"}`}
                        style={{ width: `${Math.min(100, ((wl?.open_issues || 0) / 10) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1 text-right">
                      {(wl?.open_issues || 0) > 8 ? "Overloaded" : (wl?.open_issues || 0) > 5 ? "Busy" : "Available"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Empty state */}
              {!profile?.phone && !profile?.github_url && !profile?.linkedin_url && skills.length === 0 && !profile?.bio && (
                <div className="text-center text-sm text-gray-300 py-2">
                  No additional profile info. Ask them to update their Settings → Profile.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberRow({ member, workload, projectCounts, onViewProfile }) {
  const wl = workload.find((w) => w.user_id === member.id);
  const projCount = projectCounts[member.id] ?? 0;
  return (
    <div className="flex items-center px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors">
      <div className="flex items-center gap-3 w-44 min-w-0">
        <Avatar name={member.name} size="sm" />
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{member.name}</div>
          <div className="text-xs text-gray-400 truncate">{member.email}</div>
        </div>
      </div>
      <div className="hidden sm:block w-28 flex-shrink-0">
        <RoleBadge role={member.role} />
      </div>
      <div className="hidden md:flex flex-1 items-center gap-2 ml-4">
        <div className="bg-gray-100 rounded-full h-1.5 flex-1">
          <div
            className={`h-1.5 rounded-full ${(wl?.open_issues || 0) > 8 ? "bg-red-400" : (wl?.open_issues || 0) > 5 ? "bg-yellow-400" : "bg-green-400"}`}
            style={{ width: `${Math.min(100, ((wl?.open_issues || 0) / 10) * 100)}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 w-24 text-right flex-shrink-0">
          {wl?.open_issues ?? 0} issues · {wl?.story_points ?? 0} SP
        </span>
      </div>
      {projCount > 0 && (
        <span className="hidden sm:flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full ml-3 flex-shrink-0">
          <FolderKanban className="w-3 h-3" /> {projCount} project{projCount !== 1 ? "s" : ""}
        </span>
      )}
      <button
        onClick={() => onViewProfile(member)}
        className="text-xs text-orange-500 hover:text-orange-700 font-medium px-2 py-1 rounded-lg hover:bg-orange-50 transition-colors flex-shrink-0 ml-auto"
      >
        View →
      </button>
    </div>
  );
}

export default function Team() {
  const { activeProject, navigate } = useWorkspace();
  const [members, setMembers] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [projectCounts, setProjectCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [view, setView] = useState("grid");
  const [profileMember, setProfileMember] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, wlRes] = await Promise.all([
        usersAPI.list(),
        analyticsAPI.workload(activeProject?.id),
      ]);
      setMembers(userRes.data);
      setWorkload(wlRes.data);
      // Fetch project counts for all members in parallel
      const counts = {};
      await Promise.all(userRes.data.map(async (u) => {
        try {
          const r = await taskAllocationAPI.userProjects(u.id);
          counts[u.id] = (r.data || []).length;
        } catch { counts[u.id] = 0; }
      }));
      setProjectCounts(counts);
    } catch {}
    setLoading(false);
  }, [activeProject]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = members.filter((m) => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleGroups = ["admin", "manager", "developer", "viewer"];
  const byRole = Object.fromEntries(roleGroups.map((r) => [r, filtered.filter((m) => m.role === r)]));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">{members.length} members · {activeProject?.name || "All Projects"}</p>
        </div>
        <button onClick={() => navigate("settings")} className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600">
          <UserPlus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {roleGroups.map((r) => {
          const count = members.filter((m) => m.role === r).length;
          return (
            <div key={r} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-500 mt-0.5 capitalize">{r}s</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
        >
          <option value="all">All Roles</option>
          {roleGroups.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {["grid", "list"].map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              {v === "grid" ? "Grid" : "List"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-gray-300">Loading team...</div>
      ) : filtered.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            <div>No members found</div>
          </div>
        </div>
      ) : view === "grid" ? (
        <div className="space-y-8">
          {roleGroups.map((r) => byRole[r]?.length > 0 && (
            <div key={r}>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-700 capitalize">{r}s</h2>
                <span className="text-xs text-gray-400">({byRole[r].length})</span>
              </div>
              <BentoGrid
                items={byRole[r].map((m) => {
                  const wl = workload.find((w) => w.user_id === m.id);
                  const load = wl?.open_issues ?? 0;
                  return {
                    title: m.name,
                    meta: m.title || undefined,
                    description: m.bio || m.email,
                    icon: (
                      <div className="w-4 h-4 rounded-full bg-orange-200 text-orange-700 text-[9px] font-bold flex items-center justify-center">
                        {m.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                    ),
                    status: ROLE_LABELS[m.role] || m.role,
                    tags: [`${load} issues`, `${wl?.story_points ?? 0} SP`, ...(projectCounts[m.id] ? [`${projectCounts[m.id]} project${projectCounts[m.id] !== 1 ? "s" : ""}`] : [])],
                    cta: "View profile →",
                    onClick: () => setProfileMember(m),
                  };
                })}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-50 flex items-center text-xs font-medium text-gray-400">
            <span className="w-44">Member</span>
            <span className="hidden sm:block w-28">Role</span>
            <span className="hidden md:block flex-1 ml-4">Workload</span>
          </div>
          <div className="divide-y divide-gray-50">
            {filtered.map((m) => (
              <MemberRow key={m.id} member={m} workload={workload} projectCounts={projectCounts} onViewProfile={setProfileMember} />
            ))}
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {profileMember && (
        <ProfileModal
          member={profileMember}
          workload={workload}
          onClose={() => setProfileMember(null)}
        />
      )}
    </div>
  );
}
