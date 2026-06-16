import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ClipboardList,
  Download,
  Eye,
  FileJson,
  Plus,
  Table2,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  difficultyKey,
  difficultyLabel,
  formatMinutes,
  priorityKey,
  priorityLabel,
  statusKey,
  statusLabel,
} from "../lib/format";
import { difficultyClassName, statusClassName } from "../lib/tasks";
import { fieldClass, secondaryButtonClass } from "../lib/ui";
import { TaskDetailModal } from "./TaskDetailModal";

export function TaskBoard({
  t,
  language,
  summary,
  tasks,
  error,
  importNotice,
  warnings,
  selectedCount,
  timeBudgetHours,
  planStats,
  onAddTask,
  onExport,
  onImport,
  onTimeBudgetChange,
  onUpdateTask,
  onRemoveTask,
}) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [openTaskId, setOpenTaskId] = useState(null);
  const importInputRef = useRef(null);
  const openTask = tasks.find((task) => task.id === openTaskId);

  function chooseExport(format) {
    setIsExportOpen(false);
    onExport(format);
  }

  function chooseImport(event) {
    const file = event.target.files?.[0];
    onImport(file);
    event.target.value = "";
  }

  return (
    <section className="grid min-h-0 min-w-0 grid-rows-[auto_auto_1fr] gap-3 rounded-lg border border-slate-200 bg-white/95 p-3.5 shadow-[0_16px_40px_rgba(38,53,77,0.08)] dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-[0_16px_40px_rgba(0,0,0,0.26)]">
      <div className="flex items-center justify-between gap-3.5 max-sm:flex-col max-sm:items-stretch">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold">{t.draftTasks}</h2>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            {summary ?? t.waiting}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 max-sm:items-stretch">
          <label className="inline-flex min-h-[38px] items-center gap-2 rounded-[7px] border border-slate-300 bg-white px-2.5 text-[13px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <Clock3 size={17} />
            <span>{t.timeBudget}</span>
            <input
              className="h-7 w-16 rounded-[6px] border border-slate-200 bg-slate-50 px-2 text-right outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950"
              min="0"
              step="0.5"
              type="number"
              value={timeBudgetHours}
              onChange={(event) => onTimeBudgetChange(event.target.value)}
            />
            <span>{t.hoursShort}</span>
          </label>
          <input
            ref={importInputRef}
            className="hidden"
            type="file"
            accept=".json,.xlsx,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={chooseImport}
          />
          <button
            className={secondaryButtonClass}
            onClick={() => importInputRef.current?.click()}
          >
            <Upload size={18} />
            <span>{t.importTasks}</span>
          </button>
          <button className={secondaryButtonClass} onClick={onAddTask}>
            <Plus size={18} />
            <span>{t.add}</span>
          </button>
          <div className="relative max-sm:flex-1">
            <button
              className={`${secondaryButtonClass} w-full`}
              onClick={() => setIsExportOpen((value) => !value)}
              disabled={tasks.length === 0}
            >
              <Download size={18} />
              <span>{t.export}</span>
              <ChevronDown size={16} />
            </button>

            {isExportOpen ? (
              <div className="absolute right-0 top-[calc(100%+6px)] z-20 grid w-44 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <ExportChoice
                  icon={<FileJson size={17} />}
                  label={t.exportJson}
                  onClick={() => chooseExport("json")}
                />
                <ExportChoice
                  icon={<Table2 size={17} />}
                  label={t.exportXlsx}
                  onClick={() => chooseExport("xlsx")}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {planStats ? (
        <Notice
          message={t.planSummary(
            planStats.plannedCount,
            formatMinutes(planStats.plannedMinutes, language),
            formatMinutes(planStats.budgetMinutes, language),
            planStats.openCount,
          )}
        />
      ) : null}
      {importNotice ? <Notice tone="success" message={importNotice} /> : null}
      {error ? <Notice tone="warning" message={error} /> : null}
      {warnings?.length ? <Notice message={warnings[0]} /> : null}

      <div className="grid min-h-0 content-start gap-2.5 overflow-auto pr-0.5">
        {tasks.length ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              t={t}
              language={language}
              task={task}
              onOpen={() => setOpenTaskId(task.id)}
              onUpdate={(changes) => onUpdateTask(task.id, changes)}
              onRemove={() => onRemoveTask(task.id)}
            />
          ))
        ) : (
          <div className="grid min-h-60 place-items-center content-center gap-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
            <ClipboardList size={28} />
            <span>{t.noTasks}</span>
          </div>
        )}
      </div>
      <TaskDetailModal
        t={t}
        task={openTask}
        onClose={() => setOpenTaskId(null)}
      />
    </section>
  );
}

function ExportChoice({ icon, label, onClick }) {
  return (
    <button
      className="flex min-h-9 items-center gap-2 rounded-[7px] px-2.5 text-left text-[13px] font-bold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Notice({ tone, message }) {
  const className =
    tone === "warning"
      ? "flex items-center gap-2 rounded-[7px] border border-amber-300 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
      : tone === "success"
        ? "flex items-center gap-2 rounded-[7px] border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
      : "flex items-center gap-2 rounded-[7px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300";

  return (
    <div className={className}>
      <AlertCircle size={18} />
      <span>{message}</span>
    </div>
  );
}

function TaskCard({ t, language, task, onOpen, onUpdate, onRemove }) {
  return (
    <article
      className="grid cursor-pointer grid-cols-[auto_1fr] gap-2.5 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-teal-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:hover:border-teal-700"
      onClick={onOpen}
    >
      <label
        className="relative grid h-7 w-7 place-items-center text-teal-700 dark:text-teal-300"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          className="peer absolute inset-0 cursor-pointer opacity-0"
          type="checkbox"
          checked={statusKey(task.status) === "done"}
          onChange={(event) =>
            onUpdate({
              status: event.target.checked ? t.statuses.done : t.statuses.todo,
            })
          }
        />
        <CheckCircle2
          className="opacity-30 transition peer-checked:opacity-100"
          size={18}
        />
      </label>

      <div className="grid min-w-0 gap-2">
        <div className="grid grid-cols-[minmax(0,1fr)_120px_140px] items-center gap-2 max-md:grid-cols-1">
          <input
            className={`${fieldClass} h-[34px] font-bold`}
            value={task.title}
            onChange={(event) => onUpdate({ title: event.target.value })}
            onClick={(event) => event.stopPropagation()}
          />
          <select
            value={priorityKey(task.priority)}
            onChange={(event) =>
              onUpdate({
                priority: priorityLabel(event.target.value, language),
              })
            }
            className={prioritySelectClass(task.priority)}
            onClick={(event) => event.stopPropagation()}
          >
            <option value="high">{t.priorities.high}</option>
            <option value="medium">{t.priorities.medium}</option>
            <option value="low">{t.priorities.low}</option>
          </select>
          <select
            value={statusKey(task.status)}
            onChange={(event) =>
              onUpdate({
                status: statusLabel(event.target.value, language),
              })
            }
            className={`${fieldClass} h-[34px] font-bold ${statusClassName(
              task.status,
            )}`}
            onClick={(event) => event.stopPropagation()}
          >
            <option value="todo">{t.statuses.todo}</option>
            <option value="done">{t.statuses.done}</option>
          </select>
        </div>
        <textarea
          className={`${fieldClass} min-h-[72px] resize-y py-2 leading-relaxed`}
          value={task.detail}
          onChange={(event) => onUpdate({ detail: event.target.value })}
          onClick={(event) => event.stopPropagation()}
        />
        <div className="grid grid-cols-[140px_130px_130px_minmax(0,1fr)] gap-2 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <label
            className="grid gap-1 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400"
            onClick={(event) => event.stopPropagation()}
          >
            <span>{t.difficulty}</span>
            <select
              value={difficultyKey(task.difficulty)}
              onChange={(event) =>
                onUpdate({
                  difficulty: difficultyLabel(event.target.value, language),
                })
              }
              className={`${fieldClass} h-[34px] text-[13px] font-bold normal-case ${difficultyClassName(
                task.difficulty,
              )}`}
            >
              <option value="easy">{t.difficulties.easy}</option>
              <option value="medium">{t.difficulties.medium}</option>
              <option value="hard">{t.difficulties.hard}</option>
            </select>
          </label>
          <label
            className="grid gap-1 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400"
            onClick={(event) => event.stopPropagation()}
          >
            <span>{t.estimatedTime}</span>
            <input
              className={`${fieldClass} h-[34px] text-right text-[13px] normal-case`}
              min="0"
              step="15"
              type="number"
              value={task.estimatedMinutes}
              onChange={(event) =>
                onUpdate({ estimatedMinutes: event.target.value })
              }
            />
          </label>
          <label
            className="grid gap-1 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400"
            onClick={(event) => event.stopPropagation()}
          >
            <span>{t.actualTime}</span>
            <input
              className={`${fieldClass} h-[34px] text-right text-[13px] normal-case`}
              min="0"
              step="15"
              type="number"
              value={task.actualMinutes}
              onChange={(event) => onUpdate({ actualMinutes: event.target.value })}
            />
          </label>
          <label
            className="grid gap-1 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400"
            onClick={(event) => event.stopPropagation()}
          >
            <span>{t.trackingNote}</span>
            <input
              className={`${fieldClass} h-[34px] text-[13px] normal-case`}
              value={task.trackingNote}
              onChange={(event) =>
                onUpdate({ trackingNote: event.target.value })
              }
              placeholder={t.trackingNotePlaceholder}
            />
          </label>
        </div>
        <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span>{task.category}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1 normal-case text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {task.selected
                ? t.inTimePlan(
                    task.planOrder,
                    formatMinutes(task.estimatedMinutes, language),
                  )
                : t.outsideTimePlan(formatMinutes(task.estimatedMinutes, language))}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] border border-slate-300 bg-white text-slate-500 transition hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-600 dark:hover:bg-teal-950 dark:hover:text-teal-200"
              title={t.openTaskDetail}
              aria-label={t.openTaskDetail}
              onClick={(event) => {
                event.stopPropagation();
                onOpen();
              }}
            >
              <Eye size={17} />
            </button>
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] border border-slate-300 bg-white text-slate-500 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800"
              title={t.deleteTask}
              aria-label={t.deleteTask}
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function prioritySelectClass(priority) {
  const base = `${fieldClass} h-[34px] font-bold`;
  const key = priorityKey(priority);

  if (key === "high") {
    return `${base} bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200`;
  }

  if (key === "medium") {
    return `${base} bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200`;
  }

  return `${base} bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200`;
}
