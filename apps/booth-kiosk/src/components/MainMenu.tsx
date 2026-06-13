import React, { useEffect, useState } from 'react';
import type { CardData } from '@wizkidz/card-io';
import { getMascotByID } from '@wizkidz/mascot-system';
import type { Game } from '../types';

const AGE_GROUPS = [
  { index: 0, label: '7-10' },
  { index: 1, label: '10-16' },
  { index: 2, label: '16+' },
];

interface Props {
  cardData: CardData | null;
  onCardDetected: (card: CardData) => void;
  selectedAgeGroups: number[];
  onAgeGroupChange: (groups: number[]) => void;
  isOfflineMode: boolean;
  onOfflineModeChange: (offline: boolean) => void;
}

export default function MainMenu({
  cardData,
  selectedAgeGroups,
  onAgeGroupChange,
  isOfflineMode,
}: Props) {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    fetch('/gameRegistry.json')
      .then(r => r.json())
      .then(data => setGames(data.games ?? []));
  }, []);

  const filteredGames = games.filter(game => {
    if (!isOfflineMode && cardData && game.mascotID !== cardData.mascotID) return false;
    return game.ageGroups.some(ag => selectedAgeGroups.includes(ag));
  });

  const mascot = cardData ? getMascotByID(cardData.mascotID) : null;

  const toggleAgeGroup = (index: number) => {
    const next = selectedAgeGroups.includes(index)
      ? selectedAgeGroups.filter(ag => ag !== index)
      : [...selectedAgeGroups, index];
    if (next.length > 0) onAgeGroupChange(next);
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {cardData ? (
        <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-lg font-semibold" style={{ color: mascot?.color }}>
            Welcome back, {mascot?.name}!
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Total Score: <span className="font-bold text-gray-800">{cardData.totalPoints} pts</span>
          </p>
          <p className="text-gray-400 text-xs mt-1">Card ID: {cardData.uniqueID}</p>
        </div>
      ) : (
        <div className="mb-8 p-6 bg-wk-teal/10 rounded-xl border-2 border-dashed border-wk-teal text-center">
          <p className="text-wk-teal font-semibold text-lg">Scan your RFID card to play</p>
          <p className="text-gray-500 text-sm mt-1">
            Place your Wiz Kidz card on the reader below
          </p>
        </div>
      )}

      <div className="mb-8">
        <p className="text-sm font-semibold text-gray-600 mb-3">Select age group:</p>
        <div className="flex gap-3" role="group" aria-label="Age group filter">
          {AGE_GROUPS.map(({ index, label }) => (
            <button
              key={index}
              onClick={() => toggleAgeGroup(index)}
              aria-pressed={selectedAgeGroups.includes(index)}
              className={`px-5 py-2 rounded-full font-semibold text-sm border-2 transition-colors ${
                selectedAgeGroups.includes(index)
                  ? 'bg-wk-teal text-white border-wk-teal'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-wk-teal'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <h2 className="text-xl font-bold font-display text-gray-800 mb-4">
        {filteredGames.length > 0 ? 'Available Games' : 'No games available for this selection'}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredGames.map(game => {
          const gameMascot = getMascotByID(game.mascotID);
          return (
            <a
              key={game.id}
              href={`/games/${game.id}/`}
              className="block p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-800">{game.name}</h3>
                {game.featured && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-white font-semibold"
                    style={{ background: gameMascot.color }}
                  >
                    Featured
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm">{game.description}</p>
              <p className="mt-3 text-xs font-semibold" style={{ color: gameMascot.color }}>
                {gameMascot.name}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
