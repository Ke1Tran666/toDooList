import {
  difficultyKey,
  difficultyLabel,
  normalizeSearchText,
  priorityKey,
  priorityLabel,
  statusKey,
  statusLabel,
} from "./format";

export function normalizeTasks(tasks, language) {
  return tasks.map((task, index) => normalizeTask(task, language, index));
}

export function normalizeTask(task, language, index = 0) {
  const normalized = {
    id: String(task.id || `task-${Date.now()}-${index}`),
    title: String(task.title || task.name || `Task ${index + 1}`),
    detail: String(task.detail || task.description || ""),
    priority: priorityLabel(task.priority || "medium", language),
    category: String(task.category || ""),
    selected: task.selected !== false,
    status: statusLabel(task.status || task.completed || "todo", language),
    difficulty: difficultyLabel(
      task.difficulty || inferDifficulty(task),
      language,
    ),
    estimatedMinutes: readMinutes(
      task.estimatedMinutes ?? task.estimateMinutes ?? task.estimate,
      estimateTaskMinutes(task),
    ),
    actualMinutes: readMinutes(
      task.actualMinutes ?? task.spentMinutes ?? task.spent,
      0,
    ),
    trackingNote: String(task.trackingNote || task.note || ""),
    sourceState: task.sourceState || "new",
    planOrder: Number(task.planOrder) || null,
    fitsTimeBudget: task.fitsTimeBudget === true,
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || new Date().toISOString(),
    completedAt: task.completedAt || "",
  };

  return normalizeTaskStatusDates(normalized);
}

export function translateTask(task, language) {
  return {
    ...task,
    priority: priorityLabel(task.priority, language),
    status: statusLabel(task.status, language),
    difficulty: difficultyLabel(task.difficulty, language),
  };
}

export function applyTimePlan(tasks, budgetHours, language) {
  const budgetMinutes = Math.max(0, Math.round(Number(budgetHours || 0) * 60));
  const sortedIds = [...tasks]
    .filter((task) => statusKey(task.status) !== "done")
    .sort(compareForPlan)
    .map((task) => task.id);

  let usedMinutes = 0;
  let planOrder = 1;
  const selectedIds = new Set();

  for (const id of sortedIds) {
    const task = tasks.find((item) => item.id === id);

    if (!task) {
      continue;
    }

    if (budgetMinutes > 0 && usedMinutes + task.estimatedMinutes <= budgetMinutes) {
      selectedIds.add(id);
      usedMinutes += task.estimatedMinutes;
    }
  }

  const plannedTasks = tasks.map((task) => {
    const done = statusKey(task.status) === "done";
    const fitsTimeBudget = !done && selectedIds.has(task.id);
    const nextPlanOrder = fitsTimeBudget ? planOrder : null;

    if (fitsTimeBudget) {
      planOrder += 1;
    }

    return {
      ...task,
      selected: fitsTimeBudget,
      fitsTimeBudget,
      planOrder: nextPlanOrder,
      updatedAt: new Date().toISOString(),
    };
  });

  return {
    tasks: plannedTasks,
    plannedMinutes: usedMinutes,
    budgetMinutes,
    plannedCount: selectedIds.size,
    totalOpenCount: tasks.filter((task) => statusKey(task.status) !== "done").length,
  };
}

export function reconcileTasksWithAnalysis(importedTasks, analysisTasks, language, t) {
  const analyzedById = new Map(
    normalizeTasks(analysisTasks, language).map((task) => [task.id, task]),
  );
  const importedById = new Map(
    normalizeTasks(importedTasks, language).map((task) => [task.id, task]),
  );
  const merged = [];

  for (const importedTask of importedById.values()) {
    const analyzedTask = analyzedById.get(importedTask.id);

    if (statusKey(importedTask.status) === "done") {
      merged.push({
        ...importedTask,
        sourceState: "done",
        trackingNote: mergeNote(importedTask.trackingNote, t.importDoneNote),
      });
      continue;
    }

    if (analyzedTask) {
      merged.push({
        ...analyzedTask,
        ...importedTask,
        sourceState: "active",
        trackingNote: mergeNote(importedTask.trackingNote, t.importStillOpenNote),
      });
      analyzedById.delete(importedTask.id);
      continue;
    }

    if (isGeneratedSourceTask(importedTask.id)) {
      merged.push({
        ...importedTask,
        status: statusLabel("done", language),
        sourceState: "resolved",
        completedAt: importedTask.completedAt || new Date().toISOString(),
        trackingNote: mergeNote(importedTask.trackingNote, t.importResolvedNote),
      });
      continue;
    }

    merged.push({
      ...importedTask,
      sourceState: "unchecked",
      trackingNote: mergeNote(importedTask.trackingNote, t.importUncheckedNote),
    });
  }

  for (const task of analyzedById.values()) {
    merged.push({
      ...task,
      sourceState: "new",
      trackingNote: mergeNote(task.trackingNote, t.importNewTaskNote),
    });
  }

  return merged;
}

export function taskExportRecord(task, language) {
  return {
    id: task.id,
    title: task.title,
    detail: task.detail,
    priority: priorityLabel(task.priority, language),
    category: task.category,
    selected: task.selected,
    status: statusLabel(task.status, language),
    difficulty: difficultyLabel(task.difficulty, language),
    estimatedMinutes: Number(task.estimatedMinutes) || 0,
    actualMinutes: Number(task.actualMinutes) || 0,
    trackingNote: task.trackingNote || "",
    sourceState: task.sourceState || "",
    planOrder: task.planOrder || "",
    fitsTimeBudget: task.fitsTimeBudget === true,
    createdAt: task.createdAt || "",
    updatedAt: task.updatedAt || "",
    completedAt: task.completedAt || "",
  };
}

export function statusClassName(status) {
  return statusKey(status) === "done"
    ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
    : "border-slate-300 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
}

export function difficultyClassName(difficulty) {
  const key = difficultyKey(difficulty);

  if (key === "hard") {
    return "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200";
  }

  if (key === "easy") {
    return "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
  }

  return "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200";
}

function normalizeTaskStatusDates(task) {
  if (statusKey(task.status) === "done" && !task.completedAt) {
    return { ...task, completedAt: new Date().toISOString() };
  }

  if (statusKey(task.status) !== "done" && task.completedAt) {
    return { ...task, completedAt: "" };
  }

  return task;
}

function readMinutes(value, fallback) {
  const minutes = Number(value);
  return Number.isFinite(minutes) && minutes >= 0
    ? Math.round(minutes)
    : fallback;
}

function estimateTaskMinutes(task) {
  const normalized = normalizeSearchText(
    `${task.id} ${task.title} ${task.category} ${task.detail}`,
  );
  const key = priorityKey(task.priority || "medium");
  let minutes = key === "high" ? 120 : key === "low" ? 45 : 75;

  if (normalized.includes("todo") || normalized.includes("fixme")) {
    minutes = Math.max(minutes, 90);
  }
  if (normalized.includes("test") || normalized.includes("kiem thu")) {
    minutes = Math.max(minutes, 120);
  }
  if (normalized.includes("ci") || normalized.includes("automation")) {
    minutes = Math.max(minutes, 120);
  }
  if (normalized.includes("tauri") || normalized.includes("desktop")) {
    minutes = Math.max(minutes, 90);
  }
  if (normalized.includes("readme") || normalized.includes("docs")) {
    minutes = Math.min(minutes, 75);
  }
  if (normalized.includes("env")) {
    minutes = Math.min(minutes, 45);
  }

  if (String(task.detail || "").length > 220) {
    minutes += 30;
  }

  return Math.min(240, Math.max(30, minutes));
}

function inferDifficulty(task) {
  const normalized = normalizeSearchText(
    `${task.id} ${task.title} ${task.category} ${task.detail}`,
  );
  const key = priorityKey(task.priority || "medium");

  if (
    key === "high" ||
    normalized.includes("ci") ||
    normalized.includes("tauri") ||
    normalized.includes("desktop") ||
    normalized.includes("test") ||
    normalized.includes("kiem thu")
  ) {
    return "hard";
  }

  if (key === "low" || normalized.includes("readme") || normalized.includes("env")) {
    return "easy";
  }

  return "medium";
}

function compareForPlan(left, right) {
  return (
    priorityScore(right.priority) - priorityScore(left.priority) ||
    difficultyScore(left.difficulty) - difficultyScore(right.difficulty) ||
    left.estimatedMinutes - right.estimatedMinutes ||
    left.title.localeCompare(right.title)
  );
}

function priorityScore(priority) {
  const key = priorityKey(priority);
  if (key === "high") return 3;
  if (key === "medium") return 2;
  return 1;
}

function difficultyScore(difficulty) {
  const key = difficultyKey(difficulty);
  if (key === "easy") return 1;
  if (key === "medium") return 2;
  return 3;
}

function mergeNote(current, note) {
  if (!note) {
    return current || "";
  }

  if (!current) {
    return note;
  }

  return current.includes(note) ? current : `${current}\n${note}`;
}

function isGeneratedSourceTask(id) {
  return !String(id).startsWith("manual-") && !String(id).startsWith("fallback-");
}
