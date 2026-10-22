import {useRef, useState} from 'react';
import {Copy, Share2} from 'lucide-react';
import {copyText, shareText} from '../sharing.ts';

export function SharePanel({text, link, result}: {text: string; link: string; result: boolean}) {
  const [status, setStatus] = useState(''), area = useRef<HTMLTextAreaElement>(null);
  const copy = typeof navigator.clipboard?.writeText === 'function' ? (value: string) => navigator.clipboard.writeText(value) : undefined;
  const manual = (message: string) => { setStatus(message); area.current?.focus(); area.current?.select(); };
  const share = async () => {
    setStatus('');
    const outcome = await shareText(text, {share: navigator.share ? data => navigator.share(data) : undefined, copy});
    if (outcome === 'copied') setStatus('Risultato e link copiati. Incollali nella chat con i tuoi amici.');
    else if (outcome === 'manual') manual('Puoi copiare il testo selezionato e incollarlo nella chat.');
    else if (outcome === 'shared') setStatus('Condivisione completata.');
  };
  const copyResult = async () => await copyText(text, copy)
    ? setStatus('Testo e link copiati. Nessun nome del misterioso è incluso.') : manual('Copia il testo qui sotto per condividere la sfida.');
  const copyLink = async () => {
    if (await copyText(link, copy)) setStatus('Link copiato. Chi lo apre giocherà la stessa sfida.');
    else manual('La copia automatica non è disponibile: il link è nell’ultima riga del testo selezionato.');
  };
  return <div className="sharePanel"><p>Il link apre la stessa risposta, difficoltà ed epoca. Ogni giocatore parte da zero; il risultato indica se ha usato l’indizio.</p>
    <div className="shareActions"><button className="primaryButton" onClick={share}><Share2 size={16}/>{result ? 'CONDIVIDI RISULTATO' : 'INVITA UN AMICO'}</button>
      <button onClick={copyResult}><Copy size={16}/>COPIA TESTO</button><button onClick={copyLink}>COPIA LINK</button>
      <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">WHATSAPP</a></div>
    <label className="fieldLabel" htmlFor="share-text">ANTEPRIMA SENZA SPOILER</label><textarea ref={area} id="share-text" readOnly value={text} rows={Math.min(12, text.split('\n').length + 1)} onFocus={event => event.currentTarget.select()}/>
    <p className="shareStatus" role="status">{status}</p>
  </div>;
}
