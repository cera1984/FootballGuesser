import {useEffect, useMemo, useRef, useState} from 'react';
import type {KeyboardEvent} from 'react';
import {ArrowRight, Search} from 'lucide-react';
import {searchPlayers} from '../game.ts';
import type {Player} from '../game.ts';

export function PlayerSearch({players, guessedIds, onGuess}: {players: Player[]; guessedIds: number[]; onGuess: (player: Player) => void}) {
  const [query, setQuery] = useState(''), [open, setOpen] = useState(false), [selected, setSelected] = useState(-1);
  const results = useMemo(() => searchPlayers(players, query, guessedIds), [players, query, guessedIds]);
  const list = useRef<HTMLDivElement>(null);
  const expanded = open && query.trim().length > 0;
  useEffect(() => { if (expanded && selected >= 0) list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({block: 'nearest'}); }, [expanded, selected]);
  const submit = (player: Player) => { onGuess(player); setQuery(''); setOpen(false); setSelected(-1); };
  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Escape') { setOpen(false); setSelected(-1); }
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && results.length) {
      event.preventDefault(); setOpen(true);
      setSelected(index => !open || index < 0 ? event.key === 'ArrowDown' ? 0 : results.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length);
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (expanded && selected >= 0 && results[selected]) submit(results[selected]);
    }
  };
  return <div className="searchArea"><label htmlFor="player">IL TUO PROSSIMO TENTATIVO</label>
    <div className="searchControl"><div className="searchWrap"><Search size={20}/><input id="player" role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-controls="player-results" aria-activedescendant={expanded && results[selected] ? `player-option-${results[selected].id}` : undefined} aria-describedby="search-help" autoComplete="off" placeholder="Cerca un calciatore…" value={query}
      onChange={event => { setQuery(event.target.value); setOpen(true); setSelected(-1); }} onFocus={() => setOpen(true)} onBlur={() => { setOpen(false); setSelected(-1); }} onKeyDown={keyDown}/></div>
      <div className="srOnly" role="status">{expanded ? `${results.length} risultati. Usa le frecce per scegliere.` : ''}</div>
      {expanded && <div id="player-results" ref={list} className="suggestions" role="listbox" aria-label="Calciatori trovati">{results.length ? results.map((player, index) => <button type="button" role="option" id={`player-option-${player.id}`} aria-selected={selected === index} tabIndex={-1} key={player.id} onMouseDown={event => event.preventDefault()} onMouseMove={() => setSelected(index)} onClick={() => submit(player)}><span>{player.name}</span><small>{player.nationality} · {player.role}</small><ArrowRight size={15}/></button>) : <div className="noresult">Nessun calciatore trovato. Prova un altro nome.</div>}</div>}
    </div><p id="search-help" className="searchHelp">Scegli un nome oppure usa ↑ e ↓, poi Invio.</p>
  </div>;
}
