# FOOTBALL GUESSER — Legends Edition

Gioco gratuito di deduzione calcistica, modalità infinita, 8 tentativi, tre difficoltà e stile vintage anni '90. Pubblicato tramite GitHub e Vercel.

## Sviluppo

```bash
npm install
npm run build
npm run dev
```

La cartella principale del repository contiene `main.tsx`, `players.json`, `style.css`, `index.html` e `tsconfig.json`. Non spostarli in `src/` senza aggiornare i percorsi.

## Dati e regole

`players.json` contiene 500 schede con nazionalità, ruolo (POR/DIF/CEN/ATT), periodo di massimo rendimento, difficoltà e liste di club.

**Importante:** tutti i 500 record hanno ora una lista di club compilata editorialmente, ma questo NON equivale a una verifica storica indipendente. Prestiti, trasferimenti recenti, nomi delle società ed epoche devono ancora essere controllati contro fonti attendibili. Il flag `clubsVerified` è un indicatore legacy di compilazione, **non** una certificazione della correttezza fattuale. I dati non sono un export ufficiale EA/FIFA.

- Club: verde se le liste hanno almeno una squadra in comune, dopo normalizzazione di alcune denominazioni; rosso altrimenti. Un dato mancante è grigio.
- Epoca: confronta il punto centrale degli intervalli editoriali. Verde entro 2 anni; giallo oltre 2 e fino a 6; rosso oltre 6. Freccia verso l'alto se il misterioso è più recente, verso il basso se è precedente.
- Difficoltà: determina il pool della risposta, non restringe i giocatori che si possono tentare.
- Le statistiche sono conservate nel browser.

## Validazione

```bash
python scripts/validate_players.py
npm run build
```

GitHub Actions esegue questi controlli su push e pull request. La validazione controlla integrità e struttura, **non** la veridicità storica delle carriere. Prima di dichiarare risolta un'issue calcistica serve una revisione delle fonti.

**Attenzione ai generatori storici:** `build_data.py` e `review_data.py` sono script precedenti e possono sovrascrivere le correzioni manuali. Non eseguirli per rigenerare `players.json` senza prima allinearli al nuovo dataset.

## Distribuzione

Vercel importa questo repository con preset Vite, comando `npm run build` e cartella output `dist`. I commit su `main` possono attivare un nuovo deployment.

## Licenza e attribuzione

Progetto indipendente non affiliato a FIFA, EA SPORTS, club o federazioni. Nessun database proprietario FIFA è incluso.
