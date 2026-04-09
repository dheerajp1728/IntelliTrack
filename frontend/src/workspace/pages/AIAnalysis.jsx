import { useState, useEffect } from "react";
import { useWorkspace } from "../WorkspaceApp";
import { agileAPI, issuesAPI } from "../api";
import { LiquidMetalButton } from "../../components/ui/liquid-metal-button";
import ShimmerText from "../../components/ui/shimmer-text";
import {
  Loader2, CheckCircle2, Clock, Circle,
  AlertTriangle, RefreshCw, ChevronDown, ChevronUp,
  Zap, Lock, GitBranch, CheckSquare, Square,
} from "lucide-react";

const STATUS_META = {
  done:           { label: "Done",        bg: "bg-green-50 text-green-700 border-green-200",  icon: CheckCircle2, dot: "bg-green-500" },
  "in progress":  { label: "In Progress", bg: "bg-blue-50 text-blue-700 border-blue-200",     icon: Clock,        dot: "bg-blue-500" },
  "not started":  { label: "Not Started", bg: "bg-gray-100 text-gray-600 border-gray-200",    icon: Circle,       dot: "bg-gray-400" },
};

function parseProgress(raw) {
  const match = raw.match(/^\[(.+?)\]\s*-\s*(.+)$/);
  if (!match) return { status: "not started", summary: raw };
  return { status: match[1].trim().toLowerCase(), summary: match[2].trim() };
}

function TaskResultRow({ task, progress }) {
  const { status, summary } = parseProgress(progress);
  const meta = STATUS_META[status] || STATUS_META["not started"];
  const Icon = meta.icon;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className={`mt-0.5 p-1 rounded-lg ${meta.bg} border flex-shrink-0`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-800">{task}</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${meta.bg}`}>
            {meta.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{summary}</p>
      </div>
    </div>
  );
}

function ProgressRing({ percent }) {
  const r = 28, circ = 2 * Math.PI * r;
  const fill = circ - (percent / 100) * circ;
  const color = percent >= 70 ? "#16a34a" : percent >= 40 ? "#f97316" : "#dc2626";
  return (
    <svg width="72" height="72" className="flex-shrink-0">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={fill}
        strokeLinecap="round" transform="rotate(-90 36 36)"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>{percent}%</text>
    </svg>
  );
}

function TaskCheckItem({ task, selected, onToggle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all border
        ${selected
          ? "bg-orange-50 border-orange-200"
          : "bg-gray-50 border-gray-100 hover:border-gray-200 hover:bg-gray-100"
        }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onToggle}
    >
      <div className="flex-shrink-0 transition-transform duration-150" style={{ transform: hovered ? "scale(1.1)" : "scale(1)" }}>
        {selected
          ? <CheckSquare className="w-4 h-4 text-orange-500" />
          : <Square className="w-4 h-4 text-gray-400" />
        }
      </div>
      <span className={`flex-1 text-sm truncate ${selected ? "text-gray-800" : "text-gray-500"}`}>
        {task}
      </span>
    </div>
  );
}

export default function AIAnalysis() {
  const { activeSprint } = useWorkspace();
  const [repoUrl, setRepoUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [taskItems, setTaskItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [serviceOnline, setServiceOnline] = useState(null);

  const steps = [
    "Checking GitHub repository access...",
    "Initializing vector database...",
    "Fetching & indexing repository code...",
    "Parsing task list...",
    "Searching for relevant code...",
    "Analysing with LLM (30–60 s)...",
    "Formatting results...",
  ];

  useEffect(() => {
    agileAPI.health()
      .then((r) => setServiceOnline(r.data.status === "online"))
      .catch(() => setServiceOnline(false));
  }, []);

  useEffect(() => {
    if (!activeSprint) return;
    issuesAPI.list({ sprint_id: activeSprint.id }).then((r) => {
      setTaskItems(r.data.map((i) => ({ text: i.title, selected: true })));
    }).catch(() => {});
  }, [activeSprint]);

  const loadSprintTasks = async () => {
    if (!activeSprint) return;
    try {
      const r = await issuesAPI.list({ sprint_id: activeSprint.id });
      setTaskItems(r.data.map((i) => ({ text: i.title, selected: true })));
    } catch {}
  };

  const toggleTask = (i) =>
    setTaskItems((prev) => prev.map((t, idx) => idx === i ? { ...t, selected: !t.selected } : t));

  const selectAll  = () => setTaskItems((prev) => prev.map((t) => ({ ...t, selected: true })));
  const selectNone = () => setTaskItems((prev) => prev.map((t) => ({ ...t, selected: false })));

  const selectedTasks = taskItems.filter((t) => t.selected).map((t) => t.text);

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) { setError("Please enter a GitHub repository URL."); return; }
    if (selectedTasks.length === 0) { setError("Select at least one task to analyse."); return; }

    setError(null);
    setResult(null);
    setLoading(true);
    setStepIdx(0);
    setStep(steps[0]);

    const ticker = setInterval(() => {
      setStepIdx((prev) => {
        const next = Math.min(prev + 1, steps.length - 1);
        setStep(steps[next]);
        return next;
      });
    }, 8000);

    try {
      const r = await agileAPI.analyze({
        repo_url: repoUrl.trim(),
        github_token: githubToken.trim() || null,
        tasks: selectedTasks.join("\n"),
      });
      setResult(r.data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Analysis failed.");
    } finally {
      clearInterval(ticker);
      setLoading(false);
      setStep("");
    }
  };

  const doneCnt     = result?.results.filter((r) => parseProgress(r.progress).status === "done").length ?? 0;
  const inProgCnt   = result?.results.filter((r) => parseProgress(r.progress).status === "in progress").length ?? 0;
  const notStartCnt = result?.results.filter((r) => parseProgress(r.progress).status === "not started").length ?? 0;

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <ShimmerText className="text-xl font-bold" variant="orange">
            AI Progress Analysis
          </ShimmerText>
          <p className="text-xs text-gray-500">Analyse your GitHub repo against sprint tasks using LLM</p>
        </div>
        {serviceOnline !== null && (
          <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium
            ${serviceOnline
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-600 border-red-200"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${serviceOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            {serviceOnline ? "AI service online" : "AI service offline"}
          </div>
        )}
      </div>

      {/* ── Offline warning ── */}
      {serviceOnline === false && (
        <div className="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <span className="font-semibold">Ollama is not running.</span>{" "}
            Start it with: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">ollama serve</code>
          </div>
        </div>
      )}

      {/* ── Config card ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5 mb-4 shadow-sm">

        {/* Repo URL */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            GitHub Repository URL *
          </label>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5
            focus-within:border-orange-400 focus-within:bg-orange-50 transition-all">
            <GitBranch className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              className="flex-1 text-sm outline-none text-gray-800 placeholder-gray-400 bg-transparent"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
          </div>
        </div>

        {/* Task checklist */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Tasks
              <span className="ml-2 font-normal text-gray-400 normal-case">
                {selectedTasks.length}/{taskItems.length} selected
              </span>
            </label>
            <div className="flex items-center gap-2">
              {taskItems.length > 0 && (
                <>
                  <button onClick={selectAll}  className="text-[11px] text-gray-500 hover:text-orange-500 transition-colors">All</button>
                  <span className="text-gray-300">·</span>
                  <button onClick={selectNone} className="text-[11px] text-gray-500 hover:text-orange-500 transition-colors">None</button>
                  <span className="text-gray-300">·</span>
                </>
              )}
              {activeSprint && (
                <button onClick={loadSprintTasks}
                  className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors">
                  <Zap className="w-3 h-3" />
                  Load from "{activeSprint.name}"
                </button>
              )}
            </div>
          </div>

          {/* Task list */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
            {taskItems.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">
                {activeSprint ? "Loading tasks from sprint..." : "No active sprint — start a sprint to load tasks."}
              </div>
            )}
            {taskItems.map((t, i) => (
              <TaskCheckItem
                key={i}
                task={t.text} selected={t.selected}
                onToggle={() => toggleTask(i)}
              />
            ))}
          </div>
        </div>

        {/* Advanced */}
        <div>
          <button onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
            {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Advanced options
          </button>
          {showAdvanced && (
            <div className="mt-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                GitHub Token <span className="font-normal text-gray-400 normal-case">(optional — for private repos)</span>
              </label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2
                focus-within:border-orange-400 transition-all">
                <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  className="flex-1 text-sm outline-none text-gray-800 placeholder-gray-400 bg-transparent font-mono"
                  placeholder="ghp_xxxxxxxxxxxx"
                  type={showToken ? "text" : "password"}
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                />
                <button onClick={() => setShowToken((v) => !v)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  {showToken ? "hide" : "show"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Analyse button */}
        <div className="flex justify-center pt-1">
          <LiquidMetalButton
            label={loading ? "Analysing..." : `Analyse ${selectedTasks.length} Task${selectedTasks.length !== 1 ? "s" : ""}`}
            onClick={handleAnalyze}
            disabled={loading || selectedTasks.length === 0}
            width={220}
          />
        </div>
      </div>

      {/* ── Loading steps ── */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
            <span className="text-sm font-medium text-blue-700">{step}</span>
          </div>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i}
                className={`flex-1 h-1 rounded-full transition-all duration-500
                  ${i <= stepIdx ? "bg-blue-500" : "bg-blue-200"}`}
              />
            ))}
          </div>
          <p className="text-xs text-blue-500 mt-2">First analysis may take 45–90 s while indexing the repo.</p>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5 shadow-sm">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Analysis Results</h2>
            <button onClick={handleAnalyze}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 transition-colors">
              <RefreshCw className="w-3 h-3" /> Re-run
            </button>
          </div>

          {/* Progress ring + counters */}
          <div className="flex items-center gap-5">
            <ProgressRing percent={result.progress_percent} />
            <div className="grid grid-cols-3 gap-3 flex-1">
              {[
                { label: "Done",        count: doneCnt,     s: "done" },
                { label: "In Progress", count: inProgCnt,   s: "in progress" },
                { label: "Not Started", count: notStartCnt, s: "not started" },
              ].map(({ label, count, s }) => {
                const meta = STATUS_META[s];
                return (
                  <div key={s} className={`rounded-xl border px-3 py-2.5 text-center ${meta.bg}`}>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-[11px] mt-0.5 opacity-80">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task breakdown */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Task Breakdown</h3>
            <div>
              {result.results.map((r, i) => (
                <TaskResultRow key={i} task={r.task} progress={r.progress} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
