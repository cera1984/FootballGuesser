import {useState} from 'react';
import type {Player} from '../game.ts';
import {copyText} from '../sharing.ts';

const fields = {clubs: 'Club', peak: 'Epoca', role: 'Ruolo', nationality: 'Nazionalità'} as const;
export function ReportPanel({players, version}: {players: Player[]; version: string}) {
  const [id, setId] = useState(players[0]?.id), [field, setField] = useState<keyof typeof fields>('clubs');
  const [message, setMessage] = useState(''), [status, setStatus] = useState('');
  const player = players.find(p => p.id === id);
  if (!player) return <p>Fai almeno un tentativo per segnalare un dato di quella scheda.</p>;
  const current = player[field];
  const title = `Dato da verificare: ${player.name} — ${fields[field]}`;
  const body = `Giocatore: ${player.name} (ID ${player.id})\nCatalogo: ${version}\nCampo: ${fields[field]}\nDato nel gioco: ${Array.isArray(current) ? current.join(', ') : current}\n\nCorrezione proposta e fonte:\n${message.trim()}`;
  const issue = `https://github.com/cera1984/FootballGuesser/issues/new?${new URLSearchParams({title, body})}`;
  return <div className="reportPanel"><p>Hai notato una carriera incompleta o un’epoca sbagliata? Indica il problema e, se puoi, una fonte.</p>
    <label htmlFor="report-player">CALCIATORE</label><select id="report-player" value={id} onChange={event => setId(Number(event.target.value))}>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
    <label htmlFor="report-field">DATO DA VERIFICARE</label><select id="report-field" value={field} onChange={event => setField(event.target.value as keyof typeof fields)}>{Object.entries(fields).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
    <p><strong>Nel gioco:</strong> {Array.isArray(current) ? current.join(', ') : current}</p>
    <label htmlFor="report-message">CORREZIONE E FONTE</label><textarea id="report-message" value={message} maxLength={1200} rows={4} onChange={event => setMessage(event.target.value)} placeholder="Descrivi la correzione e aggiungi un link…"/>
    <div className="shareActions"><a className={message.trim() ? 'primaryButton' : 'disabledLink'} href={message.trim() ? issue : undefined} aria-disabled={!message.trim()} target="_blank" rel="noopener noreferrer">APRI SEGNALAZIONE SU GITHUB</a>
      <button disabled={!message.trim()} onClick={async () => setStatus(await copyText(`${title}\n\n${body}`, navigator.clipboard ? text => navigator.clipboard.writeText(text) : undefined) ? 'Segnalazione copiata.' : 'Copia il testo dell’anteprima qui sotto.')}>COPIA SEGNALAZIONE</button></div>
    <p>Su GitHub troverai il messaggio già compilato e potrai inviarlo tu. Da questa pagina non parte nessuna segnalazione automatica.</p>
    {message.trim() && <details><summary>Anteprima della segnalazione</summary><textarea aria-label="Testo della segnalazione" readOnly value={`${title}\n\n${body}`} rows={8}/></details>}<p role="status">{status}</p>
  </div>;
}
