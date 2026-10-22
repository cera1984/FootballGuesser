import React, {useEffect, useMemo, useReducer, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowRight, RotateCcw, Trophy, Info, BarChart3, Search, Share2, Check, X, ChevronDown} from 'lucide-react';
import raw from './players.json';
import {addGuess, clubHint, commonClubs, datasetVersion, isFinished, peakDirection, peakHint,
  pickPlayer, restartProgress, searchPlayers} from './game.ts';
import type {Difficulty, Player, Progress} from './game.ts';
import {loadProgress, saveProgress} from './storage.ts';
import './style.css';

const players = raw as Player[];
const version = datasetVersion(players);
// Access storage inside the guarded read/write functions: even the browser getter can throw.
const storage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
};
type Action = {type: 'guess'; playerId: number} | {type: 'restart'; target: Player};
const reducer = (state: Progress, action: Action) => action.type === 'guess'
  ? addGuess(state, action.playerId, players) : restartProgress(state, action.target);

function App() {
  const [progress, dispatch] = useReducer(reducer, undefined, () => loadProgress(storage, players, version));
  const {level, stats} = progress;
  const target = players.find(player => player.id === progress.targetId)!;
  const guesses = progress.guessIds.map(id => players.find(player => player.id === id)!);
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [modal, setModal] = useState<'help' | 'stats' | 'restart' | null>(null);
  const [pendingLevel, setPendingLevel] = useState<Difficulty>('facile');
  const dialogRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(true);
  const [shareError, setShareError] = useState(false);
  const won = progress.guessIds.includes(target.id);
  const finished = isFinished(progress);
  const results = useMemo(() => searchPlayers(players, query, progress.guessIds), [query, progress.guessIds]);
  const showSuggestions = menu && query.trim().length > 0;
  const compatible = !won && guesses.length > 0 && (() => {
    const guess = guesses.at(-1)!;
    return guess.role === target.role && guess.nationality === target.nationality
      && clubHint(guess, target) === 'match' && peakHint(guess.peak, target.peak) === 'match';
  })();

  useEffect(() => { setSaved(saveProgress(storage, progress)); }, [progress]);
  useEffect(() => {
    if (showSuggestions && activeIndex >= 0) {
      resultsRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({block: 'nearest'});
    }
  }, [activeIndex, showSuggestions]);
  useEffect(() => {
    if (!modal) return;
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLButtonElement>('button')?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal(null);
      if (event.key !== 'Tab' || !dialog) return;
      const controls = [...dialog.querySelectorAll<HTMLButtonElement>('button')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('keydown', close);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [modal]);

  const performRestart = (difficulty: Difficulty) => {
    dispatch({type: 'restart', target: pickPlayer(players, difficulty, progress.recentIds)});
    setQuery(''); setMenu(false); setActiveIndex(-1); setCopied(false); setShareError(false);
    setModal(null);
  };
  const restart = (difficulty = level) => {
    if (guesses.length > 0 && !finished) { setPendingLevel(difficulty); setModal('restart'); }
    else performRestart(difficulty);
  };
  const submit = (player: Player) => {
    if (finished) return;
    dispatch({type: 'guess', playerId: player.id});
    setQuery(''); setMenu(false); setActiveIndex(-1);
  };
  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Escape') { setMenu(false); setActiveIndex(-1); return; }
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && results.length) {
      event.preventDefault(); setMenu(true);
      setActiveIndex(index => !menu || index < 0
        ? event.key === 'ArrowDown' ? 0 : results.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length);
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (showSuggestions && activeIndex >= 0 && results[activeIndex]) submit(results[activeIndex]);
    }
  };
  const share = async () => {
    const symbols = guesses.map(player => [player.role === target.role ? '🟩' : '🟥',
      clubHint(player, target) === 'match' ? '🟩' : clubHint(player, target) === 'unknown' ? '⬜' : '🟥',
      player.nationality === target.nationality ? '🟩' : '🟥',
      (peakHint(player.peak, target.peak) === 'match' ? '🟩' : peakHint(player.peak, target.peak) === 'near' ? '🟨' : '🟥')
        + peakDirection(player.peak, target.peak).trim()].join('')).join('\n');
    const text = `FOOTBALL GUESSER ⚽ ${level.toUpperCase()} ${won ? guesses.length + '/8' : 'X/8'}\n${symbols}`;
    setShareError(false);
    try {
      if (navigator.share) await navigator.share({text});
      else { await navigator.clipboard.writeText(text); setCopied(true); }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setShareError(true); }
    }
  };

  return <div className="app"><div className="noise"/>
    <header>
      <div className="topline"><span>EST. 1986 — LEGENDS EDITION</span><span>VOL. 01 / 2026</span></div>
      <div className="brand"><div className="ball">⚽</div><div><div className="eyebrow">THE BEAUTIFUL GAME PRESENTS</div><h1>FOOTBALL<br/><em>GUESSER</em></h1></div></div>
      <div className="nav"><button onClick={() => setModal('help')}><Info size={17}/> REGOLE</button><span className="navtag">500 LEGGENDE • 40 ANNI</span><button onClick={() => setModal('stats')}><BarChart3 size={17}/> STATS</button></div>
    </header>
    <main>
      <section className="intro"><span className="kicker">◆ INDOVINA LA LEGGENDA ◆</span><h2>CHI È IL <i>MISTERIOSO?</i></h2><p>Hai <strong>8 tentativi</strong> per indovinare il calciatore. Confronta ruolo, club, nazionalità ed epoca d'oro.</p></section>
      <div className="difficulty"><span>DIFFICOLTÀ</span><div className="levels">{(['facile', 'media', 'difficile'] as const).map(l => <button key={l} className={level === l ? 'active' : ''} aria-pressed={level === l} onClick={() => { if (l !== level) restart(l); }}>{l.toUpperCase()}</button>)}</div></div>
      <div className="status"><div><span className="smalllabel">TENTATIVI</span><strong>{String(guesses.length).padStart(2, '0')} <small>/ 08</small></strong></div><div className="ticks">{Array.from({length: 8}, (_, i) => <span key={i} className={i < guesses.length ? 'used' : ''}/>)}</div><button className="new" onClick={() => restart()} title="Nuova partita"><RotateCcw size={18}/><span>NUOVA</span></button></div>
      {!saved && <p className="notice" role="status">Il browser non consente il salvataggio: la partita resterà disponibile solo in questa pagina.</p>}
      {!finished ? <div className="searchArea">
        <label htmlFor="player">IL TUO PROSSIMO TENTATIVO</label>
        <div className="searchControl"><div className="searchWrap"><Search size={21}/><input id="player" role="combobox" aria-autocomplete="list" aria-expanded={showSuggestions} aria-controls="player-results" aria-activedescendant={showSuggestions && results[activeIndex] ? `player-option-${results[activeIndex].id}` : undefined} aria-describedby="search-help" autoComplete="off" placeholder="Cerca un calciatore..." value={query}
          onChange={event => { setQuery(event.target.value); setMenu(true); setActiveIndex(-1); }}
          onFocus={() => setMenu(true)} onBlur={() => { setMenu(false); setActiveIndex(-1); }} onKeyDown={onSearchKeyDown}/><ChevronDown size={17}/></div>
        <div className="srOnly" role="status" aria-live="polite">{showSuggestions ? `${results.length} risultati mostrati. Usa le frecce per selezionare un calciatore.` : ''}</div>
        {showSuggestions && <div className="suggestions" ref={resultsRef} id="player-results" role="listbox" aria-label="Calciatori trovati">{results.length ? results.map((player, index) => <button type="button" role="option" aria-selected={activeIndex === index} id={`player-option-${player.id}`} tabIndex={-1} key={player.id} onMouseDown={event => event.preventDefault()} onMouseMove={() => setActiveIndex(index)} onClick={() => submit(player)}><span>{player.name}</span><small>{player.nationality} · {player.role}</small><ArrowRight size={15}/></button>) : <div className="noresult">Nessun calciatore trovato. Prova un altro nome.</div>}</div>}</div>
        <p id="search-help" className="searchHelp">Scegli un nome oppure usa ↑ e ↓, poi Invio per confermare.</p>
      </div> : <div className={'outcome ' + (won ? 'victory' : 'defeat')} role="status"><Trophy size={28}/><div><strong>{won ? 'LEGGENDA INDOVINATA!' : 'FISCHIO FINALE!'}</strong><p>{won ? `Hai trovato ${target.name} in ${guesses.length} tentativi.` : `Il calciatore era ${target.name}.`}</p></div><div className="outcomeButtons"><button onClick={share}><Share2 size={16}/>{copied ? 'COPIATO' : 'CONDIVIDI'}</button><button onClick={() => restart()}><RotateCcw size={16}/>RIGIOCA</button></div></div>}
      {shareError && <p className="notice" role="status">Condivisione non disponibile in questo browser. Puoi salvare una schermata del risultato.</p>}
      {compatible && <p className="notice" role="status">Tutti gli indizi sono compatibili, ma il giocatore è diverso. Prova un altro nome.</p>}
      <div className="board"><div className="boardhead"><span>CALCIATORE</span><span>RUOLO</span><span>CLUB</span><span>NAZIONE</span><span>EPOCA</span></div>
        {guesses.length === 0 ? <div className="empty"><div>★</div><strong>IL CAMPO TI ASPETTA</strong><span>Scrivi un nome per iniziare la partita.</span></div> : guesses.map((player, index) => <div className="guess" key={player.id}>
          <div className="playername"><small>#{String(index + 1).padStart(2, '0')}</small><strong>{player.name}</strong></div>
          <div className={'tile ' + (player.role === target.role ? 'match' : 'miss')}>{player.role === target.role ? <Check size={13}/> : <X size={12}/>}<span>{player.role}</span></div>
          <div className={'tile ' + clubHint(player, target)}><span>{clubHint(player, target) === 'unknown' ? 'N/D' : clubHint(player, target) === 'match' ? 'SÌ' : 'NO'}</span></div>
          <div className={'tile ' + (player.nationality === target.nationality ? 'match' : 'miss')}><span>{player.nationality}</span></div>
          <div className={'tile ' + peakHint(player.peak, target.peak)}><span>{player.peak}{peakDirection(player.peak, target.peak)}</span></div>
        </div>)}
      </div>
      <div className="legend"><span><b className="green"/>COMPATIBILE</span><span><b className="gold"/>EPOCA VICINA</span><span><b className="red"/>DIVERSO</span></div>
      {finished && <section className="reveal" aria-label="Scheda del calciatore misterioso"><h3>{target.name}</h3><p>{target.nationality} · {target.role} · Epoca: {target.peak}</p><p><strong>Club nel gioco:</strong> {target.clubs.join(', ') || 'N/D'}</p><details><summary>Rivedi i club condivisi nei tuoi tentativi</summary><ul>{guesses.map(player => <li key={player.id}><strong>{player.name}:</strong> {clubHint(player, target) === 'unknown' ? 'dato mancante' : commonClubs(player, target).join(', ') || 'nessun club comune nelle liste'}</li>)}</ul></details></section>}
      <aside><span>⚑</span> <strong>NOTA SUI CLUB:</strong> verde indica almeno un club comune nelle liste del gioco. Le carriere sono ancora in revisione: rosso significa nessuna corrispondenza nelle liste, che possono essere incomplete; N/D indica un dato mancante. Le epoche sono stime editoriali. Quattro indizi verdi non garantiscono che il nome sia quello giusto.</aside>
    </main>
    <footer><div>FOOTBALL GUESSER © 2026</div><div>BUILT FOR THE LOVE OF FOOTBALL ⚽</div></footer>
    {modal && <div className="overlay" onClick={() => setModal(null)}><div className="dialog" ref={dialogRef} role={modal === 'restart' ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby="dialog-title" onClick={event => event.stopPropagation()}><button className="close" aria-label="Chiudi" onClick={() => setModal(null)}><X/></button>
      {modal === 'restart' ? <><span className="kicker">PARTITA IN CORSO</span><h2 id="dialog-title">ABBANDONARE LA PARTITA?</h2><p>I tentativi saranno cancellati e la partita verrà conteggiata come abbandonata. La serie di vittorie si interromperà.</p><div className="confirmButtons"><button onClick={() => setModal(null)}>ANNULLA</button><button onClick={() => performRestart(pendingLevel)}>ABBANDONA E CONTINUA</button></div></> : modal === 'help' ? <><span className="kicker">MANUALE DEL GIOCATORE</span><h2 id="dialog-title">COME SI GIOCA</h2><p>Indovina il calciatore misterioso entro 8 tentativi. Puoi cercare fra tutti i 500 giocatori, indipendentemente dalla difficoltà selezionata.</p><p><b>RUOLO:</b> verde se coincide (POR, DIF, CEN, ATT).</p><p><b>CLUB:</b> verde se almeno uno dei club nelle due liste coincide. Le liste editoriali possono essere incomplete.</p><p><b>NAZIONE:</b> verde se coincide la nazionalità sportiva.</p><p><b>EPOCA:</b> verde se i centri dei periodi d'oro distano al massimo 2 anni; giallo se distano più di 2 e fino a 6 anni; rosso oltre 6. La freccia ↑ indica che il misterioso è più recente, ↓ che è precedente.</p><p>I colori confrontano gli attributi: per vincere devi trovare esattamente il calciatore misterioso.</p><p>La difficoltà influenza soltanto la scelta del misterioso. Cambiare livello avvia una nuova partita; il livello già attivo non la riavvia. Il browser salva automaticamente la partita. Le ultime 20 risposte vengono escluse dal sorteggio quando il pool lo consente.</p></> : <><span className="kicker">IL TUO ALBO D'ORO</span><h2 id="dialog-title">STATISTICHE</h2>
        <div className="statsgrid">{[['COMPLETATE', stats.games], ['VITTORIE', stats.wins], ['SUCCESSO', stats.started ? Math.round(stats.wins / stats.started * 100) + '%' : '0%'], ['SERIE RECORD', stats.best]].map(([label, value]) => <div key={label}><strong>{value}</strong><small>{label}</small></div>)}</div>
        <p>Iniziate: <b>{stats.started}</b> · Abbandonate: <b>{stats.abandoned}</b>. Il successo considera tutte le partite iniziate con almeno un tentativo, inclusa quella in corso. Gli abbandoni interrompono la serie.</p><p>Le statistiche precedenti sono conservate; gli abbandoni passati non erano registrati.</p>
        <h3>VITTORIE PER TENTATIVO</h3>{stats.distribution.map((n, index) => <div className="statrow" key={index}><span>{index + 1}</span><div><i style={{width: `${100 * n / Math.max(1, ...stats.distribution)}%`}}/></div><b>{n}</b></div>)}
      </>}
    </div></div>}
  </div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
