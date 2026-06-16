export function SettingsGroup({ label, children }) {
  return (
    <div className="grid gap-2">
      <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children}
    </div>
  );
}

export function SegmentedControl({ children }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-950">
      {children}
    </div>
  );
}

export function SegmentButton({ active, onClick, children }) {
  const base =
    "inline-flex h-9 items-center justify-center gap-2 rounded-[7px] text-sm font-semibold transition";
  const className = active
    ? `${base} bg-white text-teal-800 shadow-sm dark:bg-slate-800 dark:text-teal-200`
    : `${base} text-slate-500 hover:bg-white/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100`;

  return (
    <button className={className} onClick={onClick} type="button">
      {children}
    </button>
  );
}

