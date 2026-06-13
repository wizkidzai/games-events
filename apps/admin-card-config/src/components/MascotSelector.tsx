import React from 'react';
import { MASCOTS } from '@wizkidz/mascot-system';

interface Props {
  selected: number;
  onSelect: (id: number) => void;
}

export default function MascotSelector({ selected, onSelect }: Props) {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200">
      <p className="font-semibold text-sm mb-3 text-gray-700">Select Mascot:</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Mascot selection">
        {MASCOTS.map(m => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            aria-pressed={selected === m.id}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
              selected === m.id ? 'text-white' : 'text-gray-700 bg-white border-gray-300'
            }`}
            style={selected === m.id ? { background: m.color, borderColor: m.color } : {}}
          >
            {m.name}
          </button>
        ))}
      </div>
    </div>
  );
}
