import {useState} from 'react';

const hints = [
  {label: 'CEN', color: 'miss', description: 'Ruolo diverso: Pirlo è CEN, Ronaldinho nel gioco è ATT.'},
  {label: '1 CLUB', color: 'match', description: 'Hanno un club in comune nelle nostre liste: il Milan. Non serve aver giocato insieme.'},
  {label: 'Italia', color: 'miss', description: 'Nazionalità diversa: Pirlo rappresenta l’Italia, Ronaldinho il Brasile.'},
  {label: '2006–2015 ↓', color: 'near', description: 'Il centro dell’epoca di Ronaldinho (2004–2006) è precedente e vicino: giallo con freccia ↓.'},
];
export function HelpExample() {
  const [active, setActive] = useState(1);
  return <div className="helpExample"><p><strong>Esempio:</strong> cerchiamo Ronaldinho e proviamo Andrea Pirlo. Tocca gli indizi per capire il feedback.</p>
    <div className="exampleTiles">{hints.map((hint, index) => <button key={hint.label} aria-pressed={active === index} className={`tile ${hint.color}`} onClick={() => setActive(index)}>{hint.label}</button>)}</div>
    <p className="exampleExplanation" role="status">{hints[active].description}</p><p>Per vincere serve il nome esatto: anche quattro indizi compatibili possono appartenere a un altro giocatore.</p>
  </div>;
}
