import { ChevronRight, FileText, Folder, FolderTree } from "lucide-react";
import { panelClass } from "../lib/ui";

export function ProjectTreePanel({ t, tree }) {
  return (
    <section className={panelClass}>
      <div className="mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-200">
        <FolderTree size={18} />
        <h2 className="text-[15px] font-bold">{t.projectTree}</h2>
      </div>

      {tree ? (
        <div className="max-h-[360px] overflow-auto pr-1">
          <TreeNode node={tree} depth={0} />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
          {t.treeEmpty}
        </div>
      )}
    </section>
  );
}

function TreeNode({ node, depth }) {
  const isFolder = node.kind === "folder";
  const children = Array.isArray(node.children) ? node.children : [];

  return (
    <div>
      <div
        className="grid min-h-7 grid-cols-[18px_18px_minmax(0,1fr)] items-center gap-1.5 rounded-[6px] px-1 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
        title={node.path}
      >
        <span className="grid place-items-center text-slate-400">
          {isFolder && children.length ? <ChevronRight size={14} /> : null}
        </span>
        <span className={isFolder ? "text-amber-600 dark:text-amber-300" : "text-slate-500 dark:text-slate-400"}>
          {isFolder ? <Folder size={16} /> : <FileText size={16} />}
        </span>
        <span className="truncate">{node.name}</span>
      </div>

      {children.length ? (
        <div>
          {children.map((child) => (
            <TreeNode
              key={`${child.path}-${child.name}`}
              node={child}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

