import * as XLSX from "xlsx";
import { taskExportRecord } from "./tasks";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const TASK_HEADERS = [
  "Id",
  "Title",
  "Detail",
  "Priority",
  "Category",
  "Selected",
  "Status",
  "Difficulty",
  "Estimated Minutes",
  "Actual Minutes",
  "Tracking Note",
  "Source State",
  "Plan Order",
  "Fits Time Budget",
  "Created At",
  "Updated At",
  "Completed At",
  "Source",
  "Source Type",
  "GitHub Target",
  "Time Budget Hours",
  "Exported At",
  "Version",
];

export function createTaskExportPayload({
  source,
  sourceType,
  githubTarget,
  language,
  tasks,
  timeBudgetHours,
  importContext,
}) {
  const exportedAt = new Date().toISOString();
  const history = [
    ...(importContext?.history ?? []),
    {
      action: "export",
      at: exportedAt,
      source,
      sourceType,
      taskCount: tasks.length,
    },
  ];

  return {
    version: 2,
    source,
    sourceType,
    exportedAt,
    githubTarget,
    language,
    timeBudgetHours,
    importedFrom: importContext?.fileName ?? "",
    history,
    tasks: tasks.map((task) => taskExportRecord(task, language)),
  };
}

export async function parseTaskImportFile(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "json") {
    const payload = JSON.parse(await file.text());
    return normalizeImportedPayload(payload, file.name);
  }

  if (extension === "xlsx" || extension === "xls") {
    const rows = await parseWorkbookRows(file);
    return normalizeImportedPayload(rowsToPayload(rows), file.name);
  }

  throw new Error("Unsupported task file type.");
}

export function createTaskWorkbookBlob(payload) {
  const rows = [
    TASK_HEADERS,
    ...payload.tasks.map((task) => [
      task.id,
      task.title,
      task.detail,
      task.priority,
      task.category,
      task.selected ? "Yes" : "No",
      task.status,
      task.difficulty,
      task.estimatedMinutes,
      task.actualMinutes,
      task.trackingNote,
      task.sourceState,
      task.planOrder,
      task.fitsTimeBudget ? "Yes" : "No",
      task.createdAt,
      task.updatedAt,
      task.completedAt,
      payload.source,
      payload.sourceType,
      payload.githubTarget,
      payload.timeBudgetHours,
      payload.exportedAt,
      payload.version,
    ]),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = TASK_HEADERS.map((header) => ({
    wch: Math.max(12, Math.min(32, header.length + 4)),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");

  const data = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    compression: true,
  });

  return new Blob([data], { type: XLSX_MIME });
}

function normalizeImportedPayload(payload, fileName) {
  if (!payload || !Array.isArray(payload.tasks)) {
    throw new Error("Imported task file does not contain a tasks array.");
  }

  return {
    version: payload.version ?? 1,
    source: payload.source ?? "",
    sourceType: payload.sourceType ?? "",
    exportedAt: payload.exportedAt ?? "",
    githubTarget: payload.githubTarget ?? "",
    language: payload.language ?? "vi",
    timeBudgetHours: payload.timeBudgetHours ?? "",
    importedFrom: fileName,
    history: [
      ...(payload.history ?? []),
      {
        action: "import",
        at: new Date().toISOString(),
        fileName,
        taskCount: payload.tasks.length,
      },
    ],
    tasks: payload.tasks,
  };
}

async function parseWorkbookRows(file) {
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: false,
    dense: false,
  });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("Workbook does not contain any sheets.");
  }

  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  });
}

function rowsToPayload(rows) {
  const [headerRow, ...taskRows] = rows;

  if (!headerRow?.length) {
    throw new Error("Workbook does not contain a task header row.");
  }

  const headers = headerRow.map(normalizeHeader);
  const records = taskRows
    .filter((row) => row.some((cell) => String(cell ?? "").trim()))
    .map((row) => rowToRecord(headers, row));
  const firstRecord = records[0] ?? {};

  return {
    version: Number(firstRecord.version) || 2,
    source: firstRecord.source ?? "",
    sourceType: firstRecord.sourceType ?? "",
    exportedAt: firstRecord.exportedAt ?? "",
    githubTarget: firstRecord.githubTarget ?? "",
    timeBudgetHours: firstRecord.timeBudgetHours ?? "",
    tasks: records.map((record) => ({
      id: record.id,
      title: record.title,
      detail: record.detail,
      priority: record.priority,
      category: record.category,
      selected: readBoolean(record.selected),
      status: record.status,
      difficulty: record.difficulty,
      estimatedMinutes: Number(record.estimatedMinutes) || 0,
      actualMinutes: Number(record.actualMinutes) || 0,
      trackingNote: record.trackingNote,
      sourceState: record.sourceState,
      planOrder: Number(record.planOrder) || null,
      fitsTimeBudget: readBoolean(record.fitsTimeBudget),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      completedAt: record.completedAt,
    })),
  };
}

function rowToRecord(headers, row) {
  return headers.reduce((record, header, index) => {
    record[header] = row[index] ?? "";
    return record;
  }, {});
}

function normalizeHeader(header) {
  const normalized = String(header).trim();
  const directKey = HEADER_KEY_MAP[normalized.toLowerCase()];

  if (directKey) {
    return directKey;
  }

  return normalized
    .replace(/\s+([a-z])/gi, (_, letter) => letter.toUpperCase())
    .replace(/\s+/g, "")
    .replace(/^./, (letter) => letter.toLowerCase());
}

function readBoolean(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return [
    "yes",
    "true",
    "1",
    "x",
    "done",
    "selected",
    "co",
    "completed",
    "hoan thanh",
  ].includes(normalized);
}

const HEADER_KEY_MAP = {
  id: "id",
  title: "title",
  detail: "detail",
  priority: "priority",
  category: "category",
  selected: "selected",
  status: "status",
  difficulty: "difficulty",
  "estimated minutes": "estimatedMinutes",
  "actual minutes": "actualMinutes",
  "tracking note": "trackingNote",
  "source state": "sourceState",
  "plan order": "planOrder",
  "fits time budget": "fitsTimeBudget",
  "created at": "createdAt",
  "updated at": "updatedAt",
  "completed at": "completedAt",
  source: "source",
  "source type": "sourceType",
  "github target": "githubTarget",
  "time budget hours": "timeBudgetHours",
  "exported at": "exportedAt",
  version: "version",
};
