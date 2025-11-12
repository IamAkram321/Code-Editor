import React from "react";
import ACTIONS from "../pages/Actions";

const ThemeSelector = ({ theme, onThemeChange, socketRef, roomId }) => {
  const themes = [
    { value: "dracula", label: "Dracula" },
    { value: "monokai", label: "Monokai" },
    { value: "material", label: "Material" },
    { value: "nord", label: "Nord" },
    { value: "solarized", label: "Solarized Dark" },
    { value: "tomorrow-night-bright", label: "Tomorrow Night" },
  ];

  const handleChange = (e) => {
    const newTheme = e.target.value;
    if (newTheme && newTheme !== theme) {
      onThemeChange(newTheme);
      if (socketRef?.current?.connected) {
        socketRef.current.emit(ACTIONS.THEME_CHANGE, { roomId, theme: newTheme });
      }
    }
  };

  return (
    <select
      value={theme}
      onChange={handleChange}
      className="px-3 py-1.5 bg-gray-700 text-white rounded border border-gray-600 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
    >
      {themes.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  );
};

export default ThemeSelector;
