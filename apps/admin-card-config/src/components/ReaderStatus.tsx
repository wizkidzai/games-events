import React from 'react';

export default function ReaderStatus({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
      <span
        className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-400'}`}
        aria-hidden="true"
      />
      <span className="font-semibold text-sm">
        Reader Status:{' '}
        <span className={connected ? 'text-green-700' : 'text-red-600'}>
          {connected ? 'ACR122U Connected ✓' : 'No reader detected ✗'}
        </span>
      </span>
    </div>
  );
}
