# FOOTBALL GUESSER — Legends Edition

Gioco gratuito, solo modalità infinita, grafica calcio vintage anni '90, tre difficoltà, 8 tentativi, statistiche locali e PWA.

## Avvio locale

Richiede Node.js 20 o superiore.

```bash
npm install
npm run dev
```

Apri l'indirizzo mostrato dal terminale (di solito http://localhost:5173).

## Pubblicazione su GitHub + Vercel

1. Crea un repository GitHub chiamato `football-guesser`.
2. Carica **il contenuto** di questa cartella nella radice del repository (non caricare `node_modules`).
3. Su https://vercel.com/new importa il repository GitHub.
4. Seleziona framework **Vite** (di norma rilevato automaticamente), build `npm run build`, output `dist`.
5. Premi **Deploy**. Ogni push successivo aggiorna il sito.
6. Su iPhone apri il sito con Safari → Condividi → Aggiungi alla schermata Home.

## Dati

`src/players.json` contiene esattamente 500 record. `build_data.py` genera i record a partire da una lista redazionale più ampia. **Attenzione:** questa prima versione è un dataset editoriale di prototipazione, non un export EA/FIFA né un archivio storico verificato: club, periodo d'oro, ruolo e livello richiedono revisione manuale prima della pubblicazione definitiva. Il periodo d'oro è una stima editoriale, non una metrica ufficiale. Non presentare questi campi come statistiche ufficiali FIFA.

Schema record:

```json
{"id":1,"name":"Lionel Messi","nationality":"Argentina","role":"ATT","peak":"2007-2023","clubs":["Barcellona","PSG","Inter Miami"],"difficulty":"facile"}
```

- Club: il verde indica almeno un club identico in entrambe le liste.
- Epoca: verde quando gli intervalli si sovrappongono, giallo quando distano al massimo 5 anni.
- Difficoltà: modifica solo il pool da cui viene estratta la risposta; la ricerca comprende tutti i 500 nomi.
- Dati di gioco e statistiche rimangono sul dispositivo (localStorage).

## Licenze e crediti

Progetto indipendente, non affiliato a Electronic Arts, EA SPORTS FC, FIFA o ai club. Niente asset proprietari o database commerciali incorporati. I nomi dei giocatori e le informazioni fattuali sono usati come dati redazionali.

## Revisione dati (20 ottobre 2026)

Il precedente generatore assegnava erroneamente gli stessi club a interi gruppi di calciatori. La revisione conservativa `review_data.py` ha sostituito tali assegnazioni: **119 schede** hanno club compilati individualmente su base redazionale, mentre **381 schede** sono segnate come non verificate (lista club vuota). Per evitare risposte scorrette, il bersaglio viene estratto soltanto dalle schede con club compilati; tutti i 500 nomi rimangono disponibili come tentativi. Il giallo `N/D` significa dato mancante, non club diverso. **Non è una verifica completa da fonti EA/FIFA**: per la pubblicazione definitiva occorre controllare individualmente tutti i 500 giocatori, i ruoli e gli intervalli di picco. `build_data.py` è uno script storico di prototipazione e NON deve essere eseguito per rigenerare i dati revisionati.
