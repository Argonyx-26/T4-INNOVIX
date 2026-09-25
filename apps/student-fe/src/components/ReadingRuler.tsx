import React, { useState, useEffect } from "react";
import { useThemeMode } from "../context/ThemeModeContext";

export const ReadingRuler: React.FC = () => {
  const { mode } = useThemeMode();
  const [mouseY, setMouseY] = useState<number | null>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (mode !== "dyslexic") return;

    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mode]);

  if (mode !== "dyslexic" || !enabled || mouseY === null) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 z-35 transition-all duration-75"
      style={{
        top: `${mouseY - 24}px`,
        height: "48px",
      }}
    >
      <div
        className="w-full h-full border-y border-amber-400/40"
        style={{
          backgroundColor: "rgba(254, 240, 138, 0.22)",
          backdropFilter: "contrast(105%)",
        }}
      />
    </div>
  );
};
