"use client";
import { startTour } from "./Tour";

export function TourLink({ className = "", label = "Take the 2-minute tour" }: { className?: string; label?: string }) {
  return (
    <button type="button" onClick={startTour} className={className}>
      {label}
    </button>
  );
}
