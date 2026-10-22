# FOOTBALL GUESSER — Legends Edition

Gioco gratuito di deduzione calcistica, modalità infinita, 8 tentativi, tre difficoltà e stile vintage anni '90. Pubblicato tramite GitHub e Vercel.

## Sviluppo

```bash
npm install
npm run build
npm run dev
```

Per i test serve Node.js 24. Il lockfile fissa le versioni delle dipendenze; usare `npm ci` per riprodurre l'installazione.

La cartella principale del repository contiene `main.tsx`, `players.json`, `style.css`, `index.html` e `tsconfig.json`. Non spostarli in `src/` senza aggiornare i percorsi.

## Dati e regole

`players.json` contiene 500 schede con nazionalità, ruolo (POR/DIF/CEN/ATT), periodo di massimo rendimento, difficoltà e liste di club.

**Importante:** tutti i 500 record hanno ora una lista di club compilata editorialmente, ma questo NON equivale a una verifica storica indipendente. Prestiti, trasferimenti recenti, nomi delle società ed epoche devono ancora essere controllati contro fonti attendibili. Il flag `clubsVerified` è un indicatore legacy di compilazione, **non** una certificazione della correttezza fattuale. I dati non sono un export ufficiale EA/FIFA.

- Club: verde se le liste hanno almeno una squadra in comune, dopo normalizzazione di alcune denominazioni; rosso altrimenti. Un dato mancante è grigio.
- Epoca: confronta il punto centrale degli intervalli editoriali. Verde entro 2 anni; giallo oltre 2 e fino a 6; rosso oltre 6. Freccia verso l'alto se il misterioso è più recente, verso il basso se è precedente.
- Difficoltà: determina il pool della risposta, non restringe i giocatori che si possono tentare.
- Le statistiche sono conservate nel browser.

## Ricerca e partite salvate

- Invio conferma soltanto un suggerimento selezionato con le frecce o con il puntatore; il campo vuoto e il menu chiuso non consumano tentativi. Sono riconosciuti anche alcuni alias, per esempio CR7 e Leo Messi.
- Cliccare sul livello già attivo non riavvia la partita. Nuova partita e cambio livello richiedono conferma se ci sono tentativi in corso.
- Risposta, tentativi, livello, statistiche e ultime 20 risposte vengono salvati insieme in `football-guesser-v2`. Ricaricare la pagina ripristina la partita, anche se conclusa, senza registrarla due volte.
- Le statistiche v1 vengono importate. I vecchi abbandoni non possono essere ricostruiti. Il successo è vittorie / partite iniziate con almeno un tentativo; gli abbandoni interrompono la serie e sono mostrati separatamente dalle sconfitte.
- Un cambiamento dei dati o delle regole invalida la vecchia griglia, conservando le statistiche; un'eventuale partita iniziata non ripristinabile diventa abbandonata. I dati corrotti vengono scartati e il gioco resta utilizzabile anche con salvataggio disabilitato dal browser.
- Il sorteggio evita le ultime 20 risposte finché il pool lo consente. Il campo legacy `clubsVerified` non viene più usato come filtro di affidabilità: sono eleggibili i profili del livello con una lista di club presente.
- Verde significa attributo compatibile, non identità. A fine partita vengono mostrati il profilo del misterioso e i club condivisi per ciascun tentativo.

Le statistiche e i salvataggi restano locali al browser, senza sincronizzazione tra dispositivi.

Per chi modifica il codice: quando cambiano le regole di confronto, incrementare il prefisso `rules-2` in `datasetVersion` per invalidare le griglie incompatibili. Le modifiche a `players.json` vengono rilevate automaticamente.

## Validazione

```bash
python scripts/validate_players.py
npm test
npm run build
```

Benchmark riproducibile di 50 partite (seed 20261022, 17 facili / 17 medie / 16 difficili):

```bash
node --experimental-strip-types scripts/simulate.mjs
# Per salvare anche tutte le sequenze in un file scelto:
node --experimental-strip-types scripts/simulate.mjs risultati.json
```

Il benchmark importa le regole effettive del gioco. Simula memoria perfetta del catalogo ed eliminazione logica: non misura il successo atteso di un giocatore umano.

GitHub Actions esegue questi controlli su push e pull request. I test coprono regole, alias, ricerca, conteggio, migrazione e ripristino delle partite. La validazione controlla integrità e struttura, **non** la veridicità storica delle carriere. Prima di dichiarare risolta un'issue calcistica serve una revisione delle fonti. Le correzioni documentate e i limiti della revisione sono in `DATA_SOURCES.md`.

**Attenzione ai generatori storici:** `build_data.py` e `review_data.py` sono script precedenti e possono sovrascrivere le correzioni manuali. Non eseguirli per rigenerare `players.json` senza prima allinearli al nuovo dataset.

## Distribuzione

Vercel importa questo repository con preset Vite, comando `npm run build` e cartella output `dist`. I commit su `main` possono attivare un nuovo deployment.

## Licenza e attribuzione

Progetto indipendente non affiliato a FIFA, EA SPORTS, club o federazioni. Nessun database proprietario FIFA è incluso.
