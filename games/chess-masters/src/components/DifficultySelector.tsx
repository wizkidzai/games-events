
import type { Difficulty } from '../systems/types';

interface Props {
  selected: Difficulty;
  onChange: (d: Difficulty) => void;
}

const OPTIONS: { value: Difficulty; label: string; color: string }[] = [
  { value: 'easy', label: 'Easy', color: '#43A277' },
  { value: 'medium', label: 'Medium', color: '#FFC832' },
  { value: 'hard', label: 'Hard', color: '#FF4747' },
];

export default function DifficultySelector({ selected, onChange }: Props) {
  return (
    <div className="flex gap-3" role="group" aria-label="Select difficulty">
      {OPTIONS.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={selected === o.value}
          className="px-5 py-2 rounded-full text-sm font-semibold border-2 transition-colors"
          style={
            selected === o.value
              ? { background: o.color, borderColor: o.color, color: '#fff' }
              : { borderColor: o.color, color: o.color, background: 'transparent' }
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
