import { Moon, Settings, Sun, X } from "lucide-react";
import { iconButtonClass } from "../lib/ui";
import {
  SegmentButton,
  SegmentedControl,
  SettingsGroup,
} from "./SegmentedControl";

export function SettingsModal({
  t,
  theme,
  language,
  onThemeChange,
  onLanguageChange,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm dark:bg-black/55"
      onMouseDown={onClose}
    >
      <section
        className="grid max-h-[calc(100vh-32px)] w-full max-w-140 grid-rows-[auto_1fr] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <Settings size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold">{t.settings}</h2>
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                {t.settingsDescription}
              </p>
            </div>
          </div>
          <button
            className={iconButtonClass}
            title={t.closeSettings}
            aria-label={t.closeSettings}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        <div className="grid gap-4 overflow-auto p-4">
          <SettingsGroup label={t.theme}>
            <SegmentedControl>
              <SegmentButton
                active={theme === "light"}
                onClick={() => onThemeChange("light")}
              >
                <Sun size={16} />
                <span>{t.light}</span>
              </SegmentButton>
              <SegmentButton
                active={theme === "dark"}
                onClick={() => onThemeChange("dark")}
              >
                <Moon size={16} />
                <span>{t.dark}</span>
              </SegmentButton>
            </SegmentedControl>
          </SettingsGroup>

          <SettingsGroup label={t.language}>
            <SegmentedControl>
              <SegmentButton
                active={language === "vi"}
                onClick={() => onLanguageChange("vi")}
              >
                <span>{t.vietnamese}</span>
              </SegmentButton>
              <SegmentButton
                active={language === "en"}
                onClick={() => onLanguageChange("en")}
              >
                <span>{t.english}</span>
              </SegmentButton>
            </SegmentedControl>
          </SettingsGroup>
        </div>
      </section>
    </div>
  );
}
