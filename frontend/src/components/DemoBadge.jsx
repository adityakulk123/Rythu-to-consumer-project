import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function DemoBadge({ text = "DEMO SIMULATION" }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
      {text}
    </span>
  );
}
