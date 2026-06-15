
import type { MascotAnimation } from '../systems/types';

interface Props {
  mascotID: number;
  animation: MascotAnimation;
  dialogue: string;
  color: string;
}

const ANIMATION_EMOJI: Record<MascotAnimation, string> = {
  idle: '🦚',
  happy: '🎉',
  confused: '🤔',
  sad: '😔',
  celebrating: '🏆',
};

export default function MascotContainer({ animation, dialogue, color }: Props) {
  return (
    <div
      className="fixed bottom-6 left-6 z-20 flex items-end gap-3"
      role="status"
      aria-live="polite"
      aria-label="Mascot"
    >
      <div
        className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-4xl shadow-lg border-4"
        style={{ borderColor: color, background: `${color}22` }}
      >
        {ANIMATION_EMOJI[animation]}
      </div>
      {dialogue && (
        <div
          className="max-w-[200px] bg-white rounded-xl shadow-md px-4 py-2 text-sm text-gray-700 border border-gray-100 mb-2"
          style={{ borderLeft: `3px solid ${color}` }}
        >
          {dialogue}
        </div>
      )}
    </div>
  );
}
