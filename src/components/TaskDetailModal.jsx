import {
  BookOpen,
  CheckCircle2,
  Clock3,
  ClipboardList,
  FolderKanban,
  Info,
  ListChecks,
  X,
} from "lucide-react";
import { formatMinutes, normalizeSearchText, priorityKey } from "../lib/format";
import { iconButtonClass } from "../lib/ui";

export function TaskDetailModal({ t, task, onClose }) {
  if (!task) {
    return null;
  }

  const guide = buildTaskGuide(task, t);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm dark:bg-black/55"
      onMouseDown={onClose}
    >
      <section
        className="grid max-h-[calc(100vh-32px)] w-full max-w-[820px] grid-rows-[auto_1fr] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              <BookOpen size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">
                {t.taskDetail}
              </p>
              <h2 className="truncate text-base font-bold">{task.title}</h2>
            </div>
          </div>
          <button
            className={iconButtonClass}
            title={t.closeTaskDetail}
            aria-label={t.closeTaskDetail}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        <div className="grid gap-4 overflow-auto p-4">
          <section className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700 dark:text-slate-200">
              <ClipboardList size={17} />
              <span>{t.taskDescription}</span>
            </div>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
              {task.detail}
            </p>
          </section>

          <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
            <InfoBox
              icon={<Info size={16} />}
              label={t.priorityNote}
              value={priorityExplanation(task.priority, t)}
            />
            <InfoBox
              icon={<FolderKanban size={16} />}
              label={t.categoryNote}
              value={categoryExplanation(task.category, t)}
            />
            <InfoBox
              icon={<CheckCircle2 size={16} />}
              label={t.exportNote}
              value={task.selected ? t.selectedForExport : t.notSelectedForExport}
            />
          </div>

          <div className="grid grid-cols-4 gap-2.5 max-md:grid-cols-2 max-sm:grid-cols-1">
            <InfoBox
              icon={<CheckCircle2 size={16} />}
              label={t.status}
              value={task.status}
            />
            <InfoBox
              icon={<Info size={16} />}
              label={t.difficulty}
              value={task.difficulty}
            />
            <InfoBox
              icon={<Clock3 size={16} />}
              label={t.estimatedTime}
              value={formatMinutes(task.estimatedMinutes, t.languageCode)}
            />
            <InfoBox
              icon={<Clock3 size={16} />}
              label={t.actualTime}
              value={formatMinutes(task.actualMinutes, t.languageCode)}
            />
          </div>

          <section className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700 dark:text-slate-200">
              <Clock3 size={18} />
              <span>{t.timePlan}</span>
            </div>
            <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
              {task.selected
                ? t.inTimePlan(
                    task.planOrder,
                    formatMinutes(task.estimatedMinutes, t.languageCode),
                  )
                : t.outsideTimePlan(
                    formatMinutes(task.estimatedMinutes, t.languageCode),
                  )}
            </p>
            <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
              {sourceStateExplanation(task.sourceState, t)}
            </p>
            {task.trackingNote ? (
              <p className="whitespace-pre-wrap rounded-[7px] bg-slate-50 p-2 text-[13px] leading-relaxed text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                {task.trackingNote}
              </p>
            ) : null}
          </section>

          <GuideSection
            icon={<ListChecks size={18} />}
            title={t.howToDo}
            items={guide.steps}
          />

          <GuideSection
            icon={<CheckCircle2 size={18} />}
            title={t.doneCriteria}
            items={guide.done}
          />

          <section className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-[13px] leading-relaxed text-teal-900 dark:border-teal-900 dark:bg-teal-950/60 dark:text-teal-100">
            <div className="mb-1 flex items-center gap-2 font-bold">
              <Info size={17} />
              <span>{t.clearAnnotation}</span>
            </div>
            <p>{guide.note}</p>
          </section>
        </div>
      </section>
    </div>
  );
}

function InfoBox({ icon, label, value }) {
  return (
    <div className="grid gap-1.5 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
      <div className="flex items-center gap-2 text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
        {value}
      </p>
    </div>
  );
}

function GuideSection({ icon, title, items }) {
  return (
    <section className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
      <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700 dark:text-slate-200">
        {icon}
        <span>{title}</span>
      </div>
      <ol className="grid gap-2 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
        {items.map((item, index) => (
          <li key={item} className="grid grid-cols-[24px_1fr] gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function buildTaskGuide(task, t) {
  const normalized = normalizeSearchText(`${task.id} ${task.title} ${task.category}`);

  if (normalized.includes("todo") || normalized.includes("fixme")) {
    return t.taskGuides.todo;
  }

  if (normalized.includes("readme") || normalized.includes("docs")) {
    return t.taskGuides.docs;
  }

  if (normalized.includes("test") || normalized.includes("kiem thu")) {
    return t.taskGuides.tests;
  }

  if (normalized.includes("ci") || normalized.includes("automation")) {
    return t.taskGuides.ci;
  }

  if (normalized.includes("env")) {
    return t.taskGuides.env;
  }

  if (normalized.includes("tauri") || normalized.includes("desktop")) {
    return t.taskGuides.desktop;
  }

  if (normalized.includes("github")) {
    return t.taskGuides.github;
  }

  return t.taskGuides.generic;
}

function priorityExplanation(priority, t) {
  const normalized = priorityKey(priority);

  if (normalized === "high") {
    return t.priorityDescriptions.high;
  }

  if (normalized === "low") {
    return t.priorityDescriptions.low;
  }

  return t.priorityDescriptions.medium;
}

function categoryExplanation(category, t) {
  return t.categoryDescription(category);
}

function sourceStateExplanation(sourceState, t) {
  return t.sourceStateDescriptions[sourceState] ?? t.sourceStateDescriptions.unchecked;
}
