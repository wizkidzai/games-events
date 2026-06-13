import React from 'react';
import { MASCOTS } from '@wizkidz/mascot-system';

interface Props {
  selectedMascotID: number;
  onConfigure: () => void;
  status: string;
}

export default function CardForm({ selectedMascotID, onConfigure, status }: Props) {
  const mascot = MASCOTS[selectedMascotID];

  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200">
      <p className="font-semibold text-sm mb-1 text-gray-700">Configure Card</p>
      <p className="text-xs text-gray-500 mb-4">
        Selected: <span className="font-semibold" style={{ color: mascot.color }}>{mascot.name}</span>
      </p>
      <ol className="text-sm text-gray-600 mb-4 space-y-1 list-decimal list-inside">
        <li>Place a blank card on the ACR122U reader</li>
        <li>Click &ldquo;Initialize &amp; Write&rdquo;</li>
        <li>Wait for confirmation, then remove the card</li>
      </ol>
      <button
        onClick={onConfigure}
        className="w-full py-3 rounded-lg font-bold text-white transition-colors"
        style={{ background: mascot.color }}
      >
        Initialize &amp; Write
      </button>
      {status && (
        <p className="mt-3 text-sm text-center text-gray-600" aria-live="polite">
          {status}
        </p>
      )}
    </div>
  );
}
