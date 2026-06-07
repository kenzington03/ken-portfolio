import { useEffect, useRef } from 'react';
import { createOnekoPet } from '../../utils/onekoEngine.js';
import { useOS } from '../../context/OSContext.jsx';

/** Desktop oneko pet — behind windows, above wallpaper. */
export default function OnekoPet({ mountRef }) {
  const { petVisible, petCharacter, setPetCharacter } = useOS();
  const engineRef = useRef(null);

  useEffect(() => {
    const mount = mountRef?.current;
    if (!mount) return undefined;

    const engine = createOnekoPet({
      mountEl: mount,
      onCharacterMenu: setPetCharacter,
    });
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [mountRef, setPetCharacter]);

  useEffect(() => {
    engineRef.current?.setVisible(petVisible);
  }, [petVisible]);

  useEffect(() => {
    engineRef.current?.setCharacter(petCharacter);
  }, [petCharacter]);

  return null;
}
