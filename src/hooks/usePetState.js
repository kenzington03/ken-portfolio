import { useCallback, useState } from 'react';

export function usePetState() {
  const [petVisible, setPetVisible] = useState(false);
  const [petCharacter, setPetCharacter] = useState('cat');

  const togglePet = useCallback(() => {
    setPetVisible((v) => !v);
  }, []);

  const showPet = useCallback(() => {
    setPetVisible(true);
  }, []);

  return {
    petVisible,
    petCharacter,
    setPetCharacter,
    togglePet,
    showPet,
  };
}

export function useMusicPlayerUi() {
  const [musicMinimized, setMusicMinimized] = useState(false);

  const toggleMusicMinimized = useCallback(() => {
    setMusicMinimized((m) => !m);
  }, []);

  return {
    musicMinimized,
    setMusicMinimized,
    toggleMusicMinimized,
  };
}
