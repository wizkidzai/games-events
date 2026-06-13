import React, { useState, useEffect } from 'react';
import { MASCOTS } from '@wizkidz/mascot-system';
import { generateUniqueID } from '@wizkidz/card-io';
import ReaderStatus from './components/ReaderStatus';
import MascotSelector from './components/MascotSelector';
import CardForm from './components/CardForm';
import CardLog from './components/CardLog';
import type { CardLogEntry } from './types';

export default function App() {
  const [readerConnected, setReaderConnected] = useState(false);
  const [selectedMascotID, setSelectedMascotID] = useState<number>(0);
  const [cardLog, setCardLog] = useState<CardLogEntry[]>([]);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    const interval = setInterval(() => {
      // TODO: replace with real ACR122U detection via nfc-pcsc or Web NFC
      setReaderConnected(false);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleConfigureCard = async () => {
    const uniqueID = generateUniqueID();
    setStatus('Writing to card...');

    // TODO: wire up real ACR122U write via packages/card-io
    await new Promise(r => setTimeout(r, 800));

    const entry: CardLogEntry = {
      id: crypto.randomUUID(),
      mascotID: selectedMascotID,
      mascotName: MASCOTS[selectedMascotID].name,
      uniqueID,
      configuredAt: new Date().toISOString(),
      status: 'success',
    };
    setCardLog(prev => [entry, ...prev]);
    setStatus(`✓ Card configured: ${MASCOTS[selectedMascotID].name} — ${uniqueID}`);
  };

  const exportCSV = () => {
    const header = 'Mascot ID,Mascot Name,Unique ID,Configured At,Status';
    const rows = cardLog
      .map(e => `${e.mascotID},${e.mascotName},${e.uniqueID},${e.configuredAt},${e.status}`)
      .join('\n');
    const blob = new Blob([`${header}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `card-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-ui">
      <header className="bg-wk-teal text-white px-8 py-4">
        <h1 className="text-xl font-bold">Wiz Kidz Card Configurator</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <ReaderStatus connected={readerConnected} />
        <MascotSelector selected={selectedMascotID} onSelect={setSelectedMascotID} />
        <CardForm
          selectedMascotID={selectedMascotID}
          onConfigure={handleConfigureCard}
          status={status}
        />
        <CardLog entries={cardLog} onExport={exportCSV} />
      </main>
    </div>
  );
}
