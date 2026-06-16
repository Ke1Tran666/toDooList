import { copy } from "./i18n";

export function detectSourceKind(value) {
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) return "empty";
  if (trimmed.includes("github.com/")) return "github";
  if (
    /^[a-z]:\\/i.test(trimmed) ||
    trimmed.startsWith("/") ||
    trimmed.startsWith(".")
  ) {
    return "local";
  }

  return "unknown";
}

export function formatSourceKind(value, language) {
  const labels = copy[language].sourceLabels;
  return labels[value] ?? value;
}

export function priorityKey(priority) {
  const normalized = normalizeSearchText(priority);

  if (normalized === "cao" || normalized === "high") {
    return "high";
  }

  if (normalized === "thap" || normalized === "low") {
    return "low";
  }

  return "medium";
}

export function priorityLabel(priority, language) {
  return copy[language].priorities[priorityKey(priority)];
}

export function statusKey(status) {
  const normalized = normalizeSearchText(status);

  if (
    normalized === "done" ||
    normalized === "completed" ||
    normalized === "hoan thanh" ||
    normalized === "xong"
  ) {
    return "done";
  }

  return "todo";
}

export function statusLabel(status, language) {
  return copy[language].statuses[statusKey(status)];
}

export function difficultyKey(difficulty) {
  const normalized = normalizeSearchText(difficulty);

  if (normalized === "hard" || normalized === "kho") {
    return "hard";
  }

  if (normalized === "easy" || normalized === "de") {
    return "easy";
  }

  return "medium";
}

export function difficultyLabel(difficulty, language) {
  return copy[language].difficulties[difficultyKey(difficulty)];
}

export function formatMinutes(minutes, language) {
  const safeMinutes = Math.max(0, Math.round(Number(minutes) || 0));

  if (safeMinutes < 60) {
    return `${safeMinutes} ${copy[language].minutesShort}`;
  }

  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;

  if (rest === 0) {
    return `${hours} ${copy[language].hoursShort}`;
  }

  return `${hours} ${copy[language].hoursShort} ${rest} ${copy[language].minutesShort}`;
}

export function parseGithubLabel(input) {
  try {
    const url = new URL(input);
    const [owner, repo] = url.pathname.split("/").filter(Boolean);
    return owner && repo ? `${owner}/${repo.replace(/\.git$/, "")}` : input;
  } catch {
    return input;
  }
}

export function normalizeSearchText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
