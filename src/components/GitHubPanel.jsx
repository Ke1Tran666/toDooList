import { AlertCircle, GitBranch } from "lucide-react";
import { fieldClass, panelClass } from "../lib/ui";

export function GitHubPanel({ t, githubTarget, onGithubTargetChange }) {
  return (
    <section className={panelClass}>
      <div className="mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-200">
        <GitBranch size={18} />
        <h2 className="text-[15px] font-bold">GitHub</h2>
      </div>
      <label
        className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400"
        htmlFor="githubTarget"
      >
        {t.githubTarget}
      </label>
      <input
        id="githubTarget"
        className={`${fieldClass} mt-2 h-[38px]`}
        value={githubTarget}
        onChange={(event) => onGithubTargetChange(event.target.value)}
        placeholder="owner/repo"
      />
      <div className="mt-3 flex items-center gap-2 text-[13px] leading-snug text-amber-800 dark:text-amber-300">
        <AlertCircle size={16} />
        <span>{t.issueQueued}</span>
      </div>
    </section>
  );
}

