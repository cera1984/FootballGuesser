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

`players.json` contiene 500 schede con nazionalità, ruolo (POR/DIF/CEN/ATT), periodo di massimo rendimento, difficoltà e liste di club. La versione giocabile e condivisibile usa lo snapshot immutabile `catalogs/L1.json`, inizialmente identico a questo dataset.

**Importante:** tutti i 500 record hanno ora una lista di club compilata editorialmente, ma questo NON equivale a una verifica storica indipendente. Prestiti, trasferimenti recenti, nomi delle società ed epoche devono ancora essere controllati contro fonti attendibili. Il flag `clubsVerified` è un indicatore legacy di compilazione, **non** una certificazione della correttezza fattuale. I dati non sono un export ufficiale EA/FIFA.

- Club: verde se le liste hanno almeno una squadra in comune, con il numero di club condivisi; rosso altrimenti. Un dato mancante è grigio. Non viene dedotto un campionato da carriere incomplete.
- Epoca: confronta il punto centrale degli intervalli editoriali. Verde entro 2 anni; giallo oltre 2 e fino a 6; rosso oltre 6. Freccia verso l'alto se il misterioso è più recente, verso il basso se è precedente.
- Difficoltà: determina il pool della risposta, non restringe i giocatori che si possono tentare.
- Le statistiche sono conservate nel browser.

## Ricerca e partite salvate

- Invio conferma soltanto un suggerimento selezionato con le frecce o con il puntatore; il campo vuoto e il menu chiuso non consumano tentativi. Sono riconosciuti anche alcuni alias, per esempio CR7 e Leo Messi.
- Cliccare sul livello già attivo non riavvia la partita. Nuova partita e cambio livello richiedono conferma se ci sono tentativi in corso.
- Risposta, tentativi, filtri, cronologia, aiuti e statistiche vengono salvati in `football-guesser-v3`. Ogni sfida ha un salvataggio distinto dalla partita libera: passare da una modalità all'altra mette in pausa la partita, senza abbandonarla.
- Salvataggi v2 e statistiche v1 vengono importati. La migrazione v2 conserva anche risposta e tentativi. I vecchi abbandoni non possono essere ricostruiti. Il successo è vittorie / partite iniziate con almeno un tentativo; gli abbandoni interrompono la serie e sono mostrati separatamente dalle sconfitte.
- Ricaricare o riaprire un link conserva i progressi e non registra di nuovo una partita conclusa. I dati corrotti vengono scartati mantenendo, quando validi, i totali storici. Una partita iniziata non ripristinabile diventa abbandonata.
- Nella modalità libera nessun nome si ripete finché il gruppo della difficoltà e dell'epoca non è esaurito; a inizio ciclo viene evitata anche la ripetizione immediata, quando possibile. I filtri usano il centro dell'epoca editoriale: prima del 2000, dal 2000 al 2009, dal 2010.
- Il flag legacy `clubsVerified` non viene usato come certificazione: sono eleggibili i profili del livello con una lista di club presente.
- Verde significa attributo compatibile, non identità. A fine partita vengono mostrati il profilo del misterioso e i club condivisi per ciascun tentativo.
- Dopo tre tentativi è disponibile un aiuto facoltativo sulla nazionalità. L'uso viene salvato e dichiarato nel risultato condiviso; le statistiche generali includono le partite con aiuto.

Le statistiche e i salvataggi restano locali al browser, senza sincronizzazione tra dispositivi.

## Condivisione, amici e sfida del giorno

- `?challenge=fg1.L1.f.a.<seed>` identifica un catalogo, una difficoltà, un filtro e un seme a 32 bit. La risposta viene ricostruita in modo deterministico sullo stesso snapshot. Il nome non compare nel link o nel testo condiviso. Il token non è una protezione contro chi ispeziona il codice: il gioco è interamente client-side e non ha classifiche certificate.
- La griglia condivisa contiene esito, numero di tentativi, condizioni, eventuale aiuto e collegamento alla stessa sfida. Sono disponibili condivisione nativa, copia di testo o link, composizione WhatsApp e anteprima selezionabile se le API sono bloccate. L'app non invia messaggi autonomamente.
- Del giorno usa una rotazione deterministica del pool facile, uguale per tutti. La data è quella di `Europe/Rome`, anche per chi gioca da un altro fuso. Le risposte non si ripetono per un intero ciclo del pool. Una partita in corso non cambia automaticamente a mezzanotte.
- `?daily=YYYY-MM-DD` apre la sfida di quella data. I link condivisi includono anche il token, verificato contro la data. L'archivio parte dal 22 ottobre 2026 e non permette di aprire date future. Riaprire una sfida completata mostra lo stesso risultato.
- Un link non valido o di versione non supportata mostra un avviso e conserva la partita libera. Le statistiche sono locali al browser e ogni scheda del giorno o link amico salvato viene conteggiato una volta.
- La segnalazione dati prepara un'issue GitHub con giocatore, attributo, catalogo e correzione proposta. L'utente la invia personalmente; può anche copiarne il testo.

### Compatibilità dei link

**Non modificare `catalogs/L1.json` dopo la pubblicazione.** È lo snapshot usato da `fg1.L1` per risposte e indizi, incluse le partite libere che diventano sfide tra amici. `challenges.ts` stabilisce anche l'ordinamento del pool. Aggiornare `players.json` da solo non cambia lo snapshot giocabile.

Per nuove correzioni va creato un nuovo catalogo/versione, mantenendo il caricamento e le regole del precedente per i link già inviati. Una variazione delle regole richiede una nuova versione del protocollo; non reinterpretare un vecchio token con dati o regole diversi. Il test dell'impronta L1 impedisce modifiche accidentali al catalogo storico. `datasetVersion` resta usato per la compatibilità dei salvataggi.

## Validazione

Le modalità Milan, Inter, Juventus e Napoli includono una selezione dal 1995, palette dedicate, livello Tutti e progressi separati. Criteri, limiti del database e protocollo dei nuovi link sono documentati in [CLUB_MODES.md](CLUB_MODES.md). Non modificare la selezione C1 dopo la pubblicazione.

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

GitHub Actions esegue questi controlli su push e pull request. I test coprono anche token, replay su un altro giocatore, filtri, rotazione senza ripetizioni, confine di mezzanotte a Roma, archivio, migrazioni, partite in pausa, aiuti e fallback della condivisione. Il benchmark originario importa le regole di base: non usa gli aiuti né il conteggio aggiuntivo dei club. La validazione controlla integrità e struttura, **non** la veridicità storica delle carriere. Prima di dichiarare risolta un'issue calcistica serve una revisione delle fonti. Le correzioni documentate e i limiti della revisione sono in `DATA_SOURCES.md`.

**Attenzione ai generatori storici:** `build_data.py` e `review_data.py` sono script precedenti e possono sovrascrivere le correzioni manuali. Non eseguirli per rigenerare `players.json` senza prima allinearli al nuovo dataset.

## Distribuzione

Vercel importa questo repository con preset Vite, comando `npm run build` e cartella output `dist`. I commit su `main` possono attivare un nuovo deployment.

## Licenza e attribuzione

Progetto indipendente non affiliato a FIFA, EA SPORTS, club o federazioni. Nessun database proprietario FIFA è incluso.
