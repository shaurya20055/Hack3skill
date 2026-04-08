import { useCallback, useRef } from 'react';

const SOUND_URLS: Record<string, string> = {
  critical: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  warning: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  notification: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
};

export function useSound() {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const play = useCallback((type: 'critical' | 'warning' | 'notification' = 'notification') => {
    try {
      if (!audioRefs.current[type]) {
        audioRefs.current[type] = new Audio(SOUND_URLS[type] || SOUND_URLS.notification);
        audioRefs.current[type].volume = type === 'critical' ? 0.6 : 0.3;
      }
      audioRefs.current[type].currentTime = 0;
      audioRefs.current[type].play().catch(() => {});
    } catch {}
  }, []);

  return { play };
}
