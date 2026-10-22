import {useEffect, useRef} from 'react';
import type {ReactNode} from 'react';
import {X} from 'lucide-react';

export function Modal({title, onClose, children, alert = false}: {title: string; onClose: () => void; children: ReactNode; alert?: boolean}) {
  const ref = useRef<HTMLDivElement>(null), closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement, dialog = ref.current;
    const controls = () => [...(dialog?.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex="0"]') || [])].filter(el => !el.hasAttribute('disabled') && el.getClientRects().length > 0);
    controls()[0]?.focus();
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const elements = controls(), first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', keyDown);
    return () => { window.removeEventListener('keydown', keyDown); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  return <div className="overlay" onClick={onClose}><div ref={ref} className="dialog" role={alert ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby="dialog-title" onClick={event => event.stopPropagation()}>
    <button className="close" aria-label="Chiudi" onClick={onClose}><X/></button><h2 id="dialog-title">{title}</h2>{children}
  </div></div>;
}
