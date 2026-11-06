
"use client";

import { useEffect, useState } from "react";

const themes = [
  { id: "dark", label: "Dark", color: "#1f2937", icon: "🌙" },
  { id: "white", label: "White", color: "#ffffff", icon: "🤍" },
  { id: "pink", label: "Pink", color: "#d63384", icon: "🌸" },
  { id: "blue", label: "Blue", color: "#2878d0", icon: "💙" },
  { id: "purple", label: "Purple", color: "#805ad5", icon: "💜" },
  { id: "green", label: "Green", color: "#168653", icon: "💚" },
  { id: "yellow", label: "Yellow", color: "#c79500", icon: "💛" },
  { id: "red", label: "Red", color: "#dc3545", icon: "❤️" },
  { id: "magenta", label: "Magenta", color: "#c026d3", icon: "🩷" },
  { id: "orange", label: "Orange", color: "#ea580c", icon: "🧡" },
  { id: "teal", label: "Teal", color: "#0d9488", icon: "🩵" },
  { id: "mint", label: "Mint", color: "#10b981", icon: "🌿" },
  { id: "lavender", label: "Lavender", color: "#9b87f5", icon: "🪻" },
  { id: "brown", label: "Mocha", color: "#8b5e3c", icon: "🤎" },
] as const;

type Theme = (typeof themes)[number]["id"];

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("white");
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("takatrack-theme");
    const valid = themes.some((item) => item.id === saved);
    const initial = valid ? (saved as Theme) : "white";

    setTheme(initial);
    document.documentElement.dataset.theme = initial;
    setReady(true);
  }, []);

  function changeTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("takatrack-theme", nextTheme);
    setOpen(false);
  }

  return (
    <div className="theme-menu">
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="theme-toggle-dot"
          style={{
            background:
              themes.find((item) => item.id === theme)?.color,
          }}
        />
        Theme
        <span className="theme-chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="theme-backdrop"
            aria-label="Close theme menu"
            onClick={() => setOpen(false)}
          />

          <div className="theme-dropdown">
            <div className="theme-dropdown-heading">
              <strong>Choose your theme</strong>
              
            </div>

            <div className="theme-grid">
              {themes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`theme-choice ${
                    ready && theme === item.id ? "selected" : ""
                  }`}
                  aria-pressed={ready && theme === item.id}
                  onClick={() => changeTheme(item.id)}
                >
                  <span
                    className="theme-swatch"
                    style={{ background: item.color }}
                  >
                    {theme === item.id ? "✓" : ""}
                  </span>
                  <span>{item.icon} {item.label}</span>
                </button>
              ))}
            </div>

            <p className="theme-footer">
             
            </p>
          </div>
        </>
      )}
    </div>
  );
}

