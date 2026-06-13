import React, { useState, useEffect } from 'react';
import { getMascotByID } from '@wizkidz/mascot-system';
import { SessionManager } from '@wizkidz/analytics';
import MainMenu from './components/MainMenu';
import type { CardData } from '@wizkidz/card-io';

const sessionManager = new SessionManager({
  onTimeout: () => window.location.reload(),
});

export default function App() {
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<number[]>([0, 1, 2]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    sessionManager.start();
    return () => sessionManager.stop();
  }, []);

  const mascot = cardData ? getMascotByID(cardData.mascotID) : null;

  return (
    <div className="min-h-screen bg-[--color-bg] text-[--color-text] font-ui">
      <header className="flex items-center justify-between px-8 py-4 border-b border-[--color-border]">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold font-display text-wk-teal">Wiz Kidz</span>
          {isOfflineMode && (
            <span className="text-xs bg-wk-yellow text-wk-dark px-2 py-1 rounded-full font-semibold">
              OFFLINE MODE
            </span>
          )}
        </div>
        {mascot && (
          <div className="text-sm text-right">
            <p className="font-semibold" style={{ color: mascot.color }}>
              {mascot.name}
            </p>
            <p className="text-[--color-text-muted]">{cardData?.totalPoints ?? 0} pts</p>
          </div>
        )}
      </header>

      <main className="flex-1">
        <MainMenu
          cardData={cardData}
          onCardDetected={setCardData}
          selectedAgeGroups={selectedAgeGroups}
          onAgeGroupChange={setSelectedAgeGroups}
          isOfflineMode={isOfflineMode}
          onOfflineModeChange={setIsOfflineMode}
        />
      </main>
    </div>
  );
}
