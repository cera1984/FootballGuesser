# Modalità club — selezione C1

La prima versione comprende Milan (62 nomi), Inter (58), Juventus (60), Napoli (15). Sono selezioni editoriali dei giocatori già presenti nello snapshot L1, non albi completi dei club. Non aggiungere nomi né correggere attributi di L1/C1 dopo il rilascio: introdurre una nuova versione mantenendo la lettura della precedente.

## Criterio temporale

Almeno una presenza ufficiale nella prima squadra del club dal **1 gennaio 1995**, incluso. Non si usano data di nascita, anno d'esordio assoluto, anno di ritiro, centro dell'epoca editoriale, sola proprietà del cartellino o iscrizione in rosa senza presenze.

Esempi di confine: Maldini e Baresi restano nel Milan; Roberto Baggio resta nella Juventus; Fabio Cannavaro resta nel Napoli. Maradona e Careca escono dal Napoli; Van Basten, Rijkaard, Gullit, Ancelotti e Papin escono dal Milan. Van Basten si ritirò nel 1995 ma non giocava dal 1993; Gullit tornò nel 1994 ma lasciò di nuovo il Milan prima del 1995. La selezione non pretende di includere tutti i giocatori eleggibili.

Riferimenti consultati per i casi di confine e gli aggiornamenti recenti:

- [Archivio Milan 1993/94](https://www.acmilan.com/en/roster-archive/men-first-team-archive/acmilan-1993-roster): dissoluzione del trio olandese e infortunio di Van Basten.
- [Van Basten, profilo Milan](https://www.acmilan.com/en/club/legends/players/van-basten): carriera e ritiro nel 1995.
- [Archivio Milan 1994/95](https://www.acmilan.com/it/archivio-rosa/prima-squadra-maschile/rosa-milan-1994): stagione del ritorno di Gullit. La sola appartenenza alla stagione 1994/95 non prova presenze nell'anno solare 1995.
- [Archivio stampa, 10 novembre 1994](https://archivio.unita.news/assets/derived/1994/11/10/issue_full.pdf): ritorno di Gullit alla Sampdoria.
- [Baggio, Hall of Fame Juventus](https://halloffame.juventus.com/en/hall-of-fame/roberto-baggio): periodo 1990–1995.
- [Bergkamp, archivio Inter](https://www.inter.it/en/archivio_giocatore/G0056) e [ricordo ufficiale](https://www.inter.it/it/notizie/compleanno-dennis-bergkamp-2025): due stagioni dal 1993.
- [DFB, Napoli 1994/95](https://datencenter.dfb.de/en/competitions/europa-league/seasons/1994-1995/teams/ssc-napoli?datacenter_name=data-center): Cannavaro fino al giugno 1995.
- [De Bruyne, annuncio Napoli](https://sscnapoli.it/sscn-ufficiale-lingaggio-di-de-bruyne/) e [profilo della stagione](https://calcio.napoli.it/calciatori/kevin-de-bruyne.html): arrivo ed esordio nel 2025.

Questa è una revisione editoriale iniziale: i riferimenti sopra documentano i casi esaminati, non una verifica individuale completa di tutte le carriere. Le liste dei club e le epoche ereditano i limiti di L1. Il Napoli è prioritario per l'ampliamento: mancano nel catalogo nomi centrali come Hamšík e Insigne. Non attribuire ai test automatici la capacità di verificare fatti storici.

## Gioco e grafica

Il menu offre Tutto il calcio più le quattro squadre. Ogni club ha palette, testata, monogramma originale e motivo grafico propri; nessuno stemma ufficiale è incluso. Verde/giallo/rosso degli indizi mantengono lo stesso significato in tutte le modalità.

Si parte da **Tutti**, che usa l'intera selezione per favorire varietà. Facile/media/difficile sono filtri opzionali basati sulla difficoltà editoriale esistente, non ricalibrata per tifosi del singolo club. I conteggi sono esposti. Dopo esaurimento del gruppo ricomincia un ciclo; la cronologia è separata per modalità e sopravvive ai cambi di squadra.

La ricerca ammette tutti i nomi della selezione club, indipendentemente dalla difficoltà. **ALTRI CLUB** confronta le altre squadre della carriera, escludendo quella della modalità: evita un indizio sempre verde. EPOCA resta quella della carriera complessiva, non il periodo passato nel club. Anche il risultato condiviso segue questa regola.

Cambiare squadra mette in pausa la partita; tornando si riprendono risposta, tentativi e indizio. Una nuova partita nella stessa modalità conserva il consueto avviso di abbandono. La sfida del giorno resta generale e separata. Le statistiche sono aggregate, con un conteggio coerente delle partite in pausa.

## Compatibilità

I link club usano `fg2.C1.<club>.<livello>.<seed>`, con livelli `a` (tutti), `f`, `m`, `d`. C1 congela gli ID, l'ordinamento e la regola ALTRI CLUB; gli attributi sono presi da L1, anch'esso congelato. I vecchi `fg1.L1` conservano esattamente dati e regole precedenti.

Il salvataggio v3 accetta facoltativamente `parked`, con una partita e una cronologia per ciascuna modalità sospesa. I vecchi salvataggi v3 restano validi senza migrazione distruttiva. Il nuovo livello Tutti è ammesso esclusivamente nei link club.
