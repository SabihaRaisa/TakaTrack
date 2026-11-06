
"use client";

import { useEffect, useState } from "react";
import { Settings2, Eye, EyeOff, GripVertical, RotateCcw } from "lucide-react";

export type DashboardWidget = {
  id: string;
  label: string;
};

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: "stats", label: "Summary cards" },
  { id: "expenses", label: "Income vs expenses chart" },
  { id: "categories", label: "Expense categories chart" },
  { id: "budgets", label: "Monthly budgets" },
  { id: "goals", label: "Savings goals" },
  { id: "transactions", label: "Recent transactions" },
];

const STORAGE_KEY = "takatrack-dashboard-layout";

export default function DashboardCustomizer({
  onApply,
}: {
  onApply: (widgets: DashboardWidget[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed.widgets) || !Array.isArray(parsed.hidden)) return;

      const savedWidgets = parsed.widgets as DashboardWidget[];
      const validIds = new Set(DEFAULT_WIDGETS.map((w) => w.id));
      const ordered = savedWidgets.filter(
        (w) => w && validIds.has(w.id) && DEFAULT_WIDGETS.some((d) => d.id === w.id)
      );
      const missing = DEFAULT_WIDGETS.filter(
        (w) => !ordered.some((savedWidget) => savedWidget.id === w.id)
      );

      setWidgets([...ordered, ...missing]);
      setHidden(parsed.hidden.filter((id: string) => validIds.has(id)));
    } catch {
      // Ignore invalid saved preferences.
    }
  }, []);

  useEffect(() => {
    onApply(widgets.filter((w) => !hidden.includes(w.id)));
  }, [widgets, hidden, onApply]);

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets, hidden }));
    setOpen(false);
  }

  function toggleWidget(id: string) {
    setHidden((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function moveWidget(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= widgets.length) return;

    setWidgets((current) => {
      const updated = [...current];
      [updated[index], updated[nextIndex]] = [
        updated[nextIndex],
        updated[index],
      ];
      return updated;
    });
  }

  function reset() {
    setWidgets(DEFAULT_WIDGETS);
    setHidden([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="dashboard-customizer">
      <button
        type="button"
        className="btn secondary"
        onClick={() => setOpen((value) => !value)}
      >
        <Settings2 size={16} />
        Customize dashboard
      </button>

      {open && (
        <div className="customizer-panel">
          <div className="card-title">
            <h3>Dashboard layout</h3>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>

          <p className="muted small-text">
            Show or hide cards and use the arrows to change their order.
          </p>

          {widgets.map((widget, index) => {
            const isHidden = hidden.includes(widget.id);

            return (
              <div className="customizer-row" key={widget.id}>
                <GripVertical size={16} />
                <span>{widget.label}</span>

                <button
                  type="button"
                  className="btn secondary"
                  title="Move up"
                  aria-label={`Move ${widget.label} up`}
                  disabled={index === 0}
                  onClick={() => moveWidget(index, -1)}
                >
                  ↑
                </button>

                <button
                  type="button"
                  className="btn secondary"
                  title="Move down"
                  aria-label={`Move ${widget.label} down`}
                  disabled={index === widgets.length - 1}
                  onClick={() => moveWidget(index, 1)}
                >
                  ↓
                </button>

                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => toggleWidget(widget.id)}
                >
                  {isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
                  {isHidden ? "Show" : "Hide"}
                </button>
              </div>
            );
          })}

          <div className="customizer-actions">
            <button
              type="button"
              className="btn secondary"
              onClick={reset}
            >
              <RotateCcw size={15} /> Reset
            </button>

            <button type="button" className="btn" onClick={save}>
              Save layout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
