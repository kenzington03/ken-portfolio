import { useOS } from '../../context/OSContext.jsx';
import Window from './Window.jsx';

export default function WindowLayer() {
  const { windows } = useOS();
  const visible = windows.filter((w) => !w.minimized);

  return (
    <>
      {visible.map((win) => (
        <Window key={win.id} win={win} />
      ))}
    </>
  );
}
