import { useEffect, useState, useCallback } from "react";
import { useWorkspace } from "../WorkspaceApp";
import { wikiAPI } from "../api";
import { BookOpen, Plus, Search, ChevronRight, Edit3, Save, X, Trash2, Clock, User, FileText } from "lucide-react";
import { BentoGrid } from "../../components/ui/bento-grid";

function PageTree({ pages, activePage, onSelect, depth = 0 }) {
  const roots = pages.filter((p) => !p.parent_id || depth === 0 && !pages.find((x) => x.id === p.parent_id));
  const topLevel = depth === 0 ? pages.filter((p) => !p.parent_id) : pages.filter((p) => p.parent_id);

  const items = depth === 0 ? topLevel : pages;

  return (
    <div className={depth > 0 ? "ml-4 border-l border-gray-100 pl-2" : ""}>
      {items.map((page) => {
        const children = pages.filter((p) => p.parent_id === page.id);
        const isActive = activePage?.id === page.id;
        return (
          <div key={page.id}>
            <button
              onClick={() => onSelect(page)}
              className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors
                ${isActive ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <FileText className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
              <span className="truncate">{page.title}</span>
              {children.length > 0 && <ChevronRight className="w-3 h-3 ml-auto opacity-40" />}
            </button>
            {children.length > 0 && (
              <PageTree pages={children} activePage={activePage} onSelect={onSelect} depth={depth + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PageEditor({ page, onSave, onCancel }) {
  const [title, setTitle] = useState(page?.title || "");
  const [content, setContent] = useState(page?.content || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({ title, content });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <input
          className="flex-1 text-2xl font-bold text-gray-900 outline-none border-b-2 border-orange-300 pb-1 bg-transparent"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Page title..."
          autoFocus
        />
        <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
        </button>
      </div>
      <textarea
        className="flex-1 text-gray-700 text-sm leading-relaxed outline-none resize-none bg-transparent"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your page content here... (Markdown supported)"
        style={{ minHeight: 400 }}
      />
    </div>
  );
}

function PageViewer({ page, onEdit, onDelete }) {
  // Simple markdown-ish rendering
  const renderContent = (text) => {
    if (!text) return <p className="text-gray-400 italic text-sm">This page has no content yet.</p>;
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold text-gray-900 mt-4 mb-2">{line.slice(2)}</h1>;
      if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-semibold text-gray-800 mt-3 mb-2">{line.slice(3)}</h2>;
      if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold text-gray-700 mt-2 mb-1">{line.slice(4)}</h3>;
      if (line.startsWith("- ")) return <li key={i} className="text-sm text-gray-700 ml-4 list-disc">{line.slice(2)}</li>;
      if (line.startsWith("* ")) return <li key={i} className="text-sm text-gray-700 ml-4 list-disc">{line.slice(2)}</li>;
      if (line.startsWith("> ")) return <blockquote key={i} className="border-l-4 border-orange-300 pl-3 text-sm text-gray-600 italic my-2">{line.slice(2)}</blockquote>;
      if (line === "") return <br key={i} />;
      // Bold & inline code
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs font-mono">$1</code>');
      return <p key={i} className="text-sm text-gray-700 mb-1" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{page.title}</h1>
        <div className="flex items-center gap-2">
          <button onClick={onEdit}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50">
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400 mb-6 pb-4 border-b border-gray-100">
        {page.author && (
          <span className="flex items-center gap-1"><User className="w-3 h-3" />{page.author.name}</span>
        )}
        {page.updated_at && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />Updated {new Date(page.updated_at).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="prose prose-sm max-w-none">{renderContent(page.content)}</div>
    </div>
  );
}

export default function Wiki() {
  const { activeProject, user } = useWorkspace();
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await wikiAPI.list(activeProject?.id);
      setPages(res.data);
      if (!activePage && res.data.length > 0) setActivePage(res.data[0]);
    } catch {}
    setLoading(false);
  }, [activeProject]);

  useEffect(() => { loadPages(); }, [loadPages]);

  const handleSave = async ({ title, content }) => {
    try {
      if (creating) {
        const res = await wikiAPI.create({
          title,
          content,
          project_id: activeProject?.id,
          author_id: user?.user_id || user?.id,
        });
        setPages((prev) => [...prev, res.data]);
        setActivePage(res.data);
        setCreating(false);
      } else if (editing && activePage) {
        const res = await wikiAPI.update(activePage.id, { title, content });
        setPages((prev) => prev.map((p) => p.id === activePage.id ? res.data : p));
        setActivePage(res.data);
        setEditing(false);
      }
    } catch {}
  };

  const handleDelete = async () => {
    if (!activePage || !confirm("Delete this page?")) return;
    try {
      await wikiAPI.delete(activePage.id);
      const remaining = pages.filter((p) => p.id !== activePage.id);
      setPages(remaining);
      setActivePage(remaining[0] || null);
    } catch {}
  };

  const filteredPages = search
    ? pages.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.content?.toLowerCase().includes(search.toLowerCase()))
    : pages;

  const topLevel = filteredPages.filter((p) => !p.parent_id);

  return (
    <div className="flex h-full" style={{ minHeight: "calc(100vh - 64px)" }}>
      {/* Sidebar */}
      <div className="w-60 flex-shrink-0 border-r border-gray-100 bg-gray-50/50 flex flex-col">
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Wiki</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none bg-white focus:border-orange-400"
              placeholder="Search pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="text-xs text-gray-400 text-center py-4">Loading...</div>
          ) : topLevel.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-4">No pages yet</div>
          ) : (
            <PageTree pages={filteredPages} activePage={activePage} onSelect={(p) => { setActivePage(p); setEditing(false); setCreating(false); }} />
          )}
        </div>

        <div className="p-2 border-t border-gray-100">
          <button
            onClick={() => { setCreating(true); setEditing(false); setActivePage(null); }}
            className="w-full flex items-center gap-2 px-2 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg font-medium"
          >
            <Plus className="w-4 h-4" /> New Page
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {creating ? (
          <PageEditor
            page={{ title: "", content: "" }}
            onSave={handleSave}
            onCancel={() => setCreating(false)}
          />
        ) : editing && activePage ? (
          <PageEditor
            page={activePage}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        ) : activePage ? (
          <PageViewer
            page={activePage}
            onEdit={() => setEditing(true)}
            onDelete={handleDelete}
          />
        ) : pages.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Wiki</h1>
                <p className="text-sm text-gray-400 mt-0.5">{pages.length} pages · Select one to read or edit</p>
              </div>
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-1.5 bg-orange-500 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-orange-600"
              >
                <Plus className="w-4 h-4" /> New Page
              </button>
            </div>
            <BentoGrid
              items={filteredPages.map((p) => ({
                title: p.title,
                meta: p.updated_at ? new Date(p.updated_at).toLocaleDateString() : undefined,
                description: p.content
                  ? p.content.replace(/^#+\s/gm, "").slice(0, 100) + (p.content.length > 100 ? "…" : "")
                  : "No content yet. Click to start writing.",
                icon: <FileText className="w-4 h-4 text-orange-400" />,
                status: p.parent_id ? "Sub-page" : "Page",
                tags: p.author?.name ? [p.author.name] : [],
                cta: "Read →",
                onClick: () => { setActivePage(p); setEditing(false); setCreating(false); },
              }))}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-200" />
              <h2 className="text-lg font-semibold text-gray-700 mb-1">Welcome to the Wiki</h2>
              <p className="text-sm text-gray-400 mb-4">Create pages to document your project, decisions, and processes.</p>
              <button
                onClick={() => setCreating(true)}
                className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600"
              >
                Create First Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
