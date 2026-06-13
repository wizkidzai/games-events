import React from 'react';
import type { CardLogEntry } from '../types';

interface Props {
  entries: CardLogEntry[];
  onExport: () => void;
}

export default function CardLog({ entries, onExport }: Props) {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-sm text-gray-700">
          Configured Today: {entries.length} cards
        </p>
        {entries.length > 0 && (
          <button
            onClick={onExport}
            className="text-xs px-3 py-1.5 rounded-lg bg-wk-teal text-white font-semibold"
          >
            Export CSV
          </button>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">No cards configured yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4">Mascot</th>
                <th className="pb-2 pr-4">Unique ID</th>
                <th className="pb-2 pr-4">Time</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} className="border-b border-gray-50">
                  <td className="py-1.5 pr-4 font-semibold">{e.mascotName}</td>
                  <td className="py-1.5 pr-4 font-mono text-gray-600">{e.uniqueID}</td>
                  <td className="py-1.5 pr-4 text-gray-500">
                    {new Date(e.configuredAt).toLocaleTimeString()}
                  </td>
                  <td className="py-1.5 text-green-600 font-semibold">✓</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
