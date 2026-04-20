import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

const api = axios.create({ baseURL: BASE });

// Attach token if stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
  changePassword: (data) => api.post("/auth/change-password", data),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectsAPI = {
  list: () => api.get("/projects"),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post("/projects", data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// ── Sprints ───────────────────────────────────────────────────────────────────
export const sprintsAPI = {
  list: (projectId) => api.get("/sprints", { params: { project_id: projectId } }),
  get: (id) => api.get(`/sprints/${id}`),
  create: (data) => api.post("/sprints", data),
  update: (id, data) => api.put(`/sprints/${id}`, data),
  start: (id) => api.post(`/sprints/${id}/start`),
  complete: (id) => api.post(`/sprints/${id}/complete`),
};

// ── Issues ────────────────────────────────────────────────────────────────────
export const issuesAPI = {
  list: (params) => api.get("/issues", { params }),
  get: (id) => api.get(`/issues/${id}`),
  create: (data) => api.post("/issues", data),
  update: (id, data) => api.put(`/issues/${id}`, data),
  delete: (id) => api.delete(`/issues/${id}`),
  flag: (id) => api.post(`/issues/${id}/flag`),
  comments: (id) => api.get(`/issues/${id}/comments`),
  addComment: (id, data) => api.post(`/issues/${id}/comments`, data),
  activity: (id) => api.get(`/issues/${id}/activity`),
};

// ── Users & Profiles ──────────────────────────────────────────────────────────
export const usersAPI = {
  list: () => api.get("/users"),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const profilesAPI = {
  list: () => api.get("/profiles"),
  get: (userId) => api.get(`/profile/${userId}`),
  upsert: (data) => api.post("/profile", data),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  sprint: (sprintId) => api.get(`/analytics/sprint/${sprintId}`),
  velocity: (projectId) => api.get("/analytics/velocity", { params: { project_id: projectId } }),
  workload: (projectId) => api.get("/analytics/workload", { params: { project_id: projectId } }),
  cycleTime: (projectId) => api.get("/analytics/cycle-time", { params: { project_id: projectId } }),
  throughput: (projectId) => api.get("/analytics/throughput", { params: { project_id: projectId } }),
  dashboard: () => api.get("/dashboard"),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsAPI = {
  list: (userId) => api.get(`/notifications/${userId}`),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: (userId) => api.post(`/notifications/read-all/${userId}`),
};

// ── Wiki ──────────────────────────────────────────────────────────────────────
export const wikiAPI = {
  list: (projectId) => api.get("/wiki", { params: { project_id: projectId } }),
  get: (id) => api.get(`/wiki/${id}`),
  create: (data) => api.post("/wiki", data),
  update: (id, data) => api.put(`/wiki/${id}`, data),
  delete: (id) => api.delete(`/wiki/${id}`),
};

// ── Labels & Components ───────────────────────────────────────────────────────
export const labelsAPI = {
  list: (projectId) => api.get("/labels", { params: { project_id: projectId } }),
  create: (data) => api.post("/labels", data),
};

export const componentsAPI = {
  list: (projectId) => api.get("/components", { params: { project_id: projectId } }),
  create: (data) => api.post("/components", data),
};

// ── Releases ──────────────────────────────────────────────────────────────────
export const releasesAPI = {
  list: (projectId) => api.get("/releases", { params: { project_id: projectId } }),
  create: (data) => api.post("/releases", data),
};

// ── Search ────────────────────────────────────────────────────────────────────
export const searchAPI = {
  global: (q) => api.get("/search", { params: { q } }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  reset: () => api.post("/admin/reset"),
};

// ── Task Allocation & Recommendations ─────────────────────────────────────────
export const taskAllocationAPI = {
  members:         (projectId) => api.get(`/projects/${projectId}/members`),
  userProjects:    (userId) => api.get(`/users/${userId}/projects`),
  skills:          (userId) => api.get(`/users/${userId}/skills`),
  taskHistory:     (userId, projectId) => api.get(`/users/${userId}/task-history`, { params: { project_id: projectId } }),
  workload:        (userId, projectId) => api.get(`/users/${userId}/workload`, { params: { project_id: projectId } }),
  recommend:       (projectId, task) => api.post(`/projects/${projectId}/recommend-assignee`, task),
  workloadBalance: (projectId) => api.get(`/projects/${projectId}/workload-balance`),
};

// ── AI Analysis (Agile-LLM) ───────────────────────────────────────────────────
export const agileAPI = {
  analyze: (data) => api.post("/ai/analyze", data, { timeout: 200000 }),
  health: () => api.get("/ai/health"),
};

export default api;
