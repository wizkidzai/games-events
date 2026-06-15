
import type { LeaderboardEntry } from '../systems/types';

interface Props {
  entries: LeaderboardEntry[];
}

export default function LeaderboardDisplay({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <section aria-label="Session Leaderboard" className="mt-6">
      <h3 className="text-sm font-bold text-gray-600 mb-2">Session Scores</h3>
      <table className="w-full text-sm" aria-label="Leaderboard scores">
        <thead>
          <tr className="border-b text-left text-gray-500 text-xs">
            <th scope="col" className="pb-1 pr-4">#</th>
            <th scope="col" className="pb-1 pr-4">Score</th>
            <th scope="col" className="pb-1 pr-4">Total</th>
            <th scope="col" className="pb-1">Difficulty</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={i} className="border-b border-gray-50">
              <td className="py-1 pr-4 text-gray-400">{i + 1}</td>
              <td className="py-1 pr-4 font-semibold text-wk-teal">{e.gameScore}</td>
              <td className="py-1 pr-4 text-gray-700">{e.totalScore}</td>
              <td className="py-1 capitalize text-gray-500">{e.difficulty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
