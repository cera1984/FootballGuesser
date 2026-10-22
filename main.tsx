import {StrictMode, useEffect, useReducer, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BarChart3, CalendarDays, Flag, Info, Lightbulb, RotateCcw, Share2, Trophy, X} from 'lucide-react';
import catalog from './catalogs/L1.json';
import {clubHint, commonClubs, peakDirection, peakHint} from './game.ts';
import type {Difficulty, Player} from './game.ts';
import {CATALOG_ID, LAUNCH_DATE, THEMES, challengePool, challengeUrl, dailyChallenge, encodeChallenge, readEntry, resultText, romeDate} from './challenges.ts';
import type {Entry, Theme} from './challenges.ts';
import {boardFinished, currentBoard, guessInSession, hintAvailable, loadSession, nextFree, openEntry, saveSession, useHint} from './session.ts';
import type {Session} from './session.ts';
import {HelpExample} from './components/HelpExample';
import {Modal} from './components/Modal';
import {PlayerSearch} from './components/PlayerSearch';
import {ReportPanel} from './components/ReportPanel';
import {SharePanel} from './components/SharePanel';
import './style.css';

const players = catalog as Player[];
const storage = {getItem: (key: string) => window.localStorage.getItem(key), setItem: (key: string, value: string) => window.localStorage.setItem(key, value)};
const random = () => crypto.getRandomValues(new Uint32Array(1))[0];
const baseUrl = () => `${window.location.origin}${window.location.pathname}`;
const initialRoute = readEntry(window.location.href, romeDate());
type Action = {type: 'guess'; id: number} | {type: 'open'; entry: Entry | null}
  | {type: 'new'; level: Difficulty; theme: Theme; entropy: number[]} | {type: 'hint'} | {type: 'learned'};
function reducer(session: Session, action: Action): Session {
  if (action.type === 'guess') return guessInSession(session, action.id, players);
  if (action.type === 'open') return openEntry(session, players, action.entry);
  if (action.type === 'hint') return useHint(session);
  if (action.type === 'learned') return {...session, onboardingDone: true};
  let index = 0;
  return nextFree(session, players, action.level, action.theme, () => action.entropy[index++]);
}

function App() {
  const [session, dispatch] = useReducer(reducer, undefined, () => openEntry(loadSession(storage, players, random), players, initialRoute.entry));
  const board = currentBoard(session), {stats} = session;
  const target = players.find(player => player.id === board.targetId)!;
  const guesses = board.guessIds.map(id => players.find(player => player.id === id)!);
  const finished = boardFinished(board), won = board.guessIds.includes(board.targetId);
  const [modal, setModal] = useState<'help' | 'stats' | 'restart' | 'share' | 'report' | 'archive' | null>(null);
  const [pending, setPending] = useState({level: board.spec.level, theme: board.spec.theme});
  const [saved, setSaved] = useState(true), [routeError, setRouteError] = useState(initialRoute.error);
  const [today, setToday] = useState(romeDate), [archiveDate, setArchiveDate] = useState(romeDate);
  useEffect(() => { setSaved(saveSession(storage, session)); }, [session]);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(romeDate()), 60000);
    const onBack = () => { const route = readEntry(window.location.href, romeDate()); dispatch({type: 'open', entry: route.entry}); setRouteError(route.error); setModal(null); };
    window.addEventListener('popstate', onBack);
    return () => { window.clearInterval(timer); window.removeEventListener('popstate', onBack); };
  }, []);

  const navigate = (entry: Entry | null) => {
    const url = entry ? challengeUrl(baseUrl(), entry.spec, entry.kind === 'daily' ? entry.date : undefined) : baseUrl();
    if (url !== window.location.href) window.history.pushState(null, '', url);
    dispatch({type: 'open', entry}); setRouteError(null); setModal(null);
  };
  const performNew = (level: Difficulty, theme: Theme) => {
    dispatch({type: 'new', level, theme, entropy: [random(), random()]});
    if (window.location.search) window.history.pushState(null, '', baseUrl());
    setModal(null); setRouteError(null);
  };
  const requestNew = (level = board.spec.level, theme = board.spec.theme) => {
    if (board.kind !== 'free') { navigate(null); return; }
    if (guesses.length > 0 && !finished) { setPending({level, theme}); setModal('restart'); }
    else performNew(level, theme);
  };
  const openDay = (date: string) => {
    const currentDay = romeDate();
    setToday(currentDay);
    const route = readEntry(challengeUrl(baseUrl(), dailyChallenge(date), date), currentDay);
    if (route.error) { setRouteError(route.error); return; }
    navigate(route.entry);
  };
  const link = challengeUrl(baseUrl(), board.spec, board.date);
  const shareBody = finished ? resultText(board, players, baseUrl())
    : `FOOTBALL GUESSER ⚽\n${board.date ? 'Del giorno · ' + board.date : 'Sfida tra amici'} · ${board.spec.level.toUpperCase()} · ${THEMES[board.spec.theme]}\nHai 8 tentativi. Proviamo la stessa leggenda?\n${link}`;
  const reportPlayers = [...new Map([...guesses, ...(finished ? [target] : [])].map(player => [player.id, player])).values()];
  const last = guesses.at(-1);
  const compatible = !won && last && last.role === target.role && last.nationality === target.nationality
    && clubHint(last, target) === 'match' && peakHint(last.peak, target.peak) === 'match';
  const modeLabel = board.kind === 'free' ? 'Partite libere, senza limiti' : board.kind === 'daily' ? `Del giorno · ${board.date}` : 'Sfida ricevuta da un amico';

  return <div className="app"><div className="noise"/>
    <header className="compactHeader"><div className="brand"><span className="ball" aria-hidden="true">⚽</span><div><div className="eyebrow">LEGENDS EDITION</div><h1>FOOTBALL <em>GUESSER</em></h1></div></div>
      <nav className="headerActions" aria-label="Informazioni"><button aria-label="Come si gioca" onClick={() => setModal('help')}><Info size={19}/><span>REGOLE</span></button><button aria-label="Statistiche" onClick={() => setModal('stats')}><BarChart3 size={19}/><span>STATS</span></button></nav>
    </header>
    <main>
      <section className="intro"><span className="kicker">500 LEGGENDE · UNA PARTITA TIRA L’ALTRA</span><h2>INDOVINA. <i>RIGIOCA. SFIDA.</i></h2><p>8 tentativi, quattro indizi. Trova la leggenda e manda la stessa sfida ai tuoi amici.</p></section>
      <div className="modeTabs" aria-label="Modalità"><button aria-pressed={board.kind === 'free'} onClick={() => navigate(null)}>PARTITE LIBERE <small>senza limiti</small></button><button aria-pressed={board.kind === 'daily'} onClick={() => openDay(romeDate())}><CalendarDays size={17}/>DEL GIORNO</button></div>
      <div className="modeDescription"><span>{modeLabel}</span>{board.kind === 'daily' ? <button onClick={() => setModal('archive')}>ARCHIVIO</button> : board.kind === 'friend' ? <span className="challengeBadge">STESSA SFIDA, IL TUO RISULTATO</span> : <span>NESSUNA RIPETIZIONE FINO A FINE GRUPPO</span>}</div>
      {routeError && <div className="notice" role="status">{routeError}<button aria-label="Chiudi avviso" onClick={() => setRouteError(null)}><X size={15}/></button></div>}
      {!session.onboardingDone && <section className="welcomeStrip" aria-label="Benvenuto"><p><strong>Il primo tentativo ti dà la direzione.</strong> Verde: compatibile. Giallo: epoca vicina. Le frecce ti guidano nel tempo.</p><div><button onClick={() => setModal('help')}>VEDI UN ESEMPIO</button><button onClick={() => dispatch({type: 'learned'})}>HO CAPITO</button></div></section>}
      {board.kind === 'free' ? <div className="gameFilters"><div className="levels" aria-label="Difficoltà">{(['facile', 'media', 'difficile'] as const).map(level => <button key={level} aria-pressed={level === board.spec.level} className={level === board.spec.level ? 'active' : ''} onClick={() => { if (level !== board.spec.level) requestNew(level); }}>{level.toUpperCase()}</button>)}</div><label htmlFor="theme" className="srOnly">Epoca della partita</label><select id="theme" value={board.spec.theme} onChange={event => requestNew(board.spec.level, event.target.value as Theme)}>{Object.entries(THEMES).map(([theme, label]) => <option key={theme} value={theme} disabled={!challengePool(players, board.spec.level, theme as Theme).length}>{label}</option>)}</select></div>
        : <div className="lockedFilters"><strong>{board.spec.level.toUpperCase()}</strong><span>{THEMES[board.spec.theme]}</span><span>Condizioni uguali per tutti</span></div>}
      <div className="status"><div><span className="smalllabel">TENTATIVI</span><strong>{String(guesses.length).padStart(2, '0')} <small>/ 08</small></strong></div><div className="ticks">{Array.from({length: 8}, (_, index) => <span key={index} className={index < guesses.length ? 'used' : ''}/>)}</div>{board.kind === 'free' && <button className="new" onClick={() => requestNew()} aria-label="Nuova partita libera"><RotateCcw size={18}/><span>NUOVA</span></button>}</div>
      {!saved && <p className="notice" role="status">Salvataggio non disponibile in questo browser. La partita resterà in questa pagina; il link della sfida funziona comunque.</p>}
      {!finished ? <><PlayerSearch key={board.key + encodeChallenge(board.spec)} players={players} guessedIds={board.guessIds} onGuess={player => dispatch({type: 'guess', id: player.id})}/><div className="gameTools"><button onClick={() => setModal('share')}><Share2 size={15}/>SFIDA UN AMICO</button><button disabled={!hintAvailable(session) || board.hintUsed} onClick={() => dispatch({type: 'hint'})}><Lightbulb size={15}/>{board.hintUsed ? 'INDIZIO USATO' : guesses.length < 3 ? 'INDIZIO DAL 3° TENTATIVO' : 'SVELA NAZIONALITÀ'}</button></div></>
        : <section className={'outcome ' + (won ? 'victory' : 'defeat')} aria-label="Risultato"><Trophy size={28}/><div><strong>{won ? 'LEGGENDA INDOVINATA!' : 'FISCHIO FINALE!'}</strong><p>{won ? `${target.name}, in ${guesses.length} tentativi.` : `Il misterioso era ${target.name}.`} {board.hintUsed ? 'Con indizio.' : 'Senza aiuti.'}</p></div><div className="outcomeButtons"><button onClick={() => setModal('share')}><Share2 size={16}/>CONDIVIDI E SFIDA</button><button onClick={() => board.kind === 'free' ? requestNew() : navigate(null)}><RotateCcw size={16}/>{board.kind === 'free' ? 'ALTRA PARTITA' : 'CONTINUA IN LIBERA'}</button></div></section>}
      {board.hintUsed && <p className="notice" role="status"><Lightbulb size={16}/> Indizio: la nazionalità del misterioso è <strong>{target.nationality}</strong>. Il risultato condiviso indicherà l’aiuto usato.</p>}
      {compatible && <p className="notice" role="status">Tutti gli indizi sono compatibili, ma il giocatore è diverso. Prova un altro nome.</p>}
      <div className="board"><div className="boardhead"><span>CALCIATORE</span><span>RUOLO</span><span>CLUB</span><span>NAZIONE</span><span>EPOCA</span></div>{!guesses.length ? <div className="empty"><strong>IL CAMPO TI ASPETTA</strong><span>Parti da un nome che conosci. Ogni tentativo restringe la ricerca.</span></div> : guesses.map((player, index) => {
        const clubs = commonClubs(player, target), club = clubHint(player, target);
        return <div className="guess" key={player.id}><div className="playername"><small>#{String(index + 1).padStart(2, '0')}</small><strong>{player.name}</strong></div>
          <div className={'tile ' + (player.role === target.role ? 'match' : 'miss')}><span>{player.role}</span></div>
          <div className={'tile ' + club} title={club === 'unknown' ? 'Lista dei club mancante' : `${clubs.length} club in comune nelle liste`}><span>{club === 'unknown' ? 'N/D' : clubs.length ? `${clubs.length} CLUB` : 'NO'}</span></div>
          <div className={'tile ' + (player.nationality === target.nationality ? 'match' : 'miss')}><span>{player.nationality}</span></div>
          <div className={'tile ' + peakHint(player.peak, target.peak)}><span>{player.peak}{peakDirection(player.peak, target.peak)}</span></div></div>;
      })}</div>
      <div className="legend"><span><b className="green"/>COMPATIBILE</span><span><b className="gold"/>EPOCA VICINA</span><span><b className="red"/>DIVERSO</span></div>
      {finished && <section className="reveal" aria-label="Scheda del misterioso"><h3>{target.name}</h3><p>{target.nationality} · {target.role} · Epoca: {target.peak}</p><p><strong>Club nelle liste:</strong> {target.clubs.join(', ')}</p><details><summary>Perché gli indizi erano questi?</summary><ul>{guesses.map(player => <li key={player.id}><strong>{player.name}:</strong> {commonClubs(player, target).join(', ') || 'nessun club in comune nelle liste'}</li>)}</ul></details></section>}
      <div className="boardFooter"><button disabled={!reportPlayers.length} onClick={() => setModal('report')}><Flag size={14}/>SEGNALA UN DATO DA CORREGGERE</button><button onClick={() => setModal('help')}>COME LEGGERE GLI INDIZI</button></div>
      <aside>Le liste dei club e le epoche sono editoriali, ancora in revisione. Il numero nella casella CLUB indica quanti club sono condivisi nelle liste, anche in anni diversi. Le partite per epoca usano il centro del periodo indicato.</aside>
      {board.kind === 'daily' && <p className="dailyNote">Una nuova leggenda ogni giorno a mezzanotte, ora di Roma. Nel frattempo, le partite libere continuano senza limiti.</p>}
    </main>
    <footer><div>FOOTBALL GUESSER © 2026</div><div>FATTO PER CHI AMA IL CALCIO ⚽</div></footer>
    {modal && <Modal title={{help: 'COME SI GIOCA', stats: 'LE TUE PARTITE', restart: 'ABBANDONARE LA PARTITA?', share: finished ? 'IL RISULTATO DIVENTA UNA SFIDA' : 'GIOCATE LA STESSA LEGGENDA', report: 'SEGNALA UN DATO', archive: 'ARCHIVIO DEL GIORNO'}[modal]} onClose={() => setModal(null)} alert={modal === 'restart'}>
      {modal === 'share' && <SharePanel text={shareBody} link={link} result={finished}/>}
      {modal === 'help' && <><p>Hai 8 tentativi. Puoi cercare tutti i 500 nomi, anche di difficoltà diverse.</p><HelpExample/><p><strong>Epoca:</strong> si confrontano i centri dei periodi: verde entro 2 anni; giallo oltre 2 e fino a 6; rosso oltre 6. ↑ significa più recente, ↓ precedente.</p><p><strong>Libera:</strong> scegli difficoltà ed epoca e continua a giocare. Le risposte si ripetono solo dopo aver esaurito il gruppo. <strong>Del giorno:</strong> una sfida comune, salvata separatamente. Le partite degli amici hanno un link che fissa risposta e condizioni.</p><p>Dopo tre tentativi puoi svelare la nazionalità. Il risultato condiviso indica se hai usato l’indizio.</p><button className="primaryButton" onClick={() => { dispatch({type: 'learned'}); setModal(null); }}>ENTRA IN CAMPO</button></>}
      {modal === 'restart' && <><p>I tentativi di questa partita libera verranno cancellati e sarà registrato un abbandono. Le altre sfide salvate resteranno disponibili.</p><div className="confirmButtons"><button onClick={() => setModal(null)}>ANNULLA</button><button onClick={() => performNew(pending.level, pending.theme)}>ABBANDONA E CONTINUA</button></div></>}
      {modal === 'archive' && <><p>Riprendi una leggenda del giorno dalla data di lancio. Riaprire la stessa sfida conserva il risultato e non aggiunge una nuova partita alle statistiche.</p><label className="fieldLabel" htmlFor="archive-date">DATA</label><input id="archive-date" type="date" min={LAUNCH_DATE} max={today} value={archiveDate} onChange={event => setArchiveDate(event.target.value)}/><button className="primaryButton" disabled={!archiveDate || archiveDate < LAUNCH_DATE || archiveDate > today} onClick={() => openDay(archiveDate)}>APRI LA SFIDA</button></>}
      {modal === 'report' && <ReportPanel players={reportPlayers} version={`${CATALOG_ID} · ${session.version}`}/>}
      {modal === 'stats' && <><div className="statsgrid">{[['COMPLETATE', stats.games], ['VITTORIE', stats.wins], ['SUCCESSO', stats.started ? Math.round(stats.wins / stats.started * 100) + '%' : '0%'], ['SERIE RECORD', stats.best]].map(([label, value]) => <div key={label}><strong>{value}</strong><small>{label}</small></div>)}</div><p>Iniziate: <b>{stats.started}</b> · Abbandonate: <b>{stats.abandoned}</b> · In corso o in pausa: <b>{stats.started - stats.games - stats.abandoned}</b>.</p><p>Il successo considera tutte le partite iniziate con un tentativo, inclusi gli abbandoni e quelle in pausa. Puoi passare tra libera, del giorno e amici senza perdere i progressi. Ogni sfida condivisa viene conteggiata una volta per questo browser. Le vittorie includono quelle con indizio.</p><h3>VITTORIE PER TENTATIVO</h3>{stats.distribution.map((count, index) => <div className="statrow" key={index}><span>{index + 1}</span><div><i style={{width: `${100 * count / Math.max(1, ...stats.distribution)}%`}}/></div><b>{count}</b></div>)}<p>Le statistiche precedenti sono conservate; gli abbandoni passati non erano registrati.</p></>}
    </Modal>}
  </div>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
