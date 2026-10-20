import json,unicodedata,re
from pathlib import Path
rows='''
Argentina|ATT|1986-1994|Napoli,Barcellona|Diego Maradona,Claudio Caniggia,Gabriel Batistuta
Argentina|ATT|1995-2005|Fiorentina,Roma|Abel Balbo,Hernán Crespo,Juan Sebastián Verón
Argentina|ATT|2004-2014|Manchester City,Atlético Madrid|Sergio Agüero,Carlos Tévez,Ezequiel Lavezzi,Gonzalo Higuaín,Ángel Di María
Argentina|ATT|2007-2023|Barcellona,PSG,Inter Miami|Lionel Messi
Argentina|ATT|2014-2023|Juventus,Roma|Paulo Dybala,Mauro Icardi,Ángel Correa
Argentina|ATT|2020-2026|Inter,Racing Club|Lautaro Martínez,Julián Álvarez,Alejandro Garnacho,Nicolás González
Argentina|CEN|1995-2005|Valencia,Inter|Pablo Aimar,Esteban Cambiasso,Juan Román Riquelme,Maxi Rodríguez
Argentina|CEN|2005-2015|Liverpool,Real Madrid|Javier Mascherano,Éver Banega,Lucas Biglia,Fernando Gago
Argentina|CEN|2018-2026|Liverpool,Chelsea|Alexis Mac Allister,Enzo Fernández,Rodrigo De Paul,Leandro Paredes
Argentina|DIF|1990-2005|Inter,Manchester United|Javier Zanetti,Walter Samuel,Roberto Ayala,Gabriel Heinze
Argentina|DIF|2006-2016|Manchester City,Valencia|Nicolás Otamendi,Marcos Rojo,Pablo Zabaleta,Martín Demichelis
Argentina|DIF|2018-2026|Tottenham,Manchester United|Cristian Romero,Lisandro Martínez,Nahuel Molina
Argentina|POR|1995-2010|Manchester United,AZ Alkmaar|Sergio Romero,Roberto Abbondanzieri
Argentina|POR|2019-2026|Aston Villa|Emiliano Martínez
Brasile|ATT|1986-1995|Barcellona,Valencia|Romário,Bebeto,Careca
Brasile|ATT|1995-2006|Real Madrid,Inter,Barcellona|Ronaldo Nazário,Rivaldo,Adriano
Brasile|ATT|2003-2013|Barcellona,Milan|Ronaldinho,Kaká,Robinho,Alexandre Pato
Brasile|ATT|2010-2024|Barcellona,PSG|Neymar,Hulk,Oscar,Willian,Lucas Moura
Brasile|ATT|2018-2026|Real Madrid,Arsenal|Vinícius Júnior,Rodrygo,Gabriel Jesus,Raphinha,Richarlison,Antony,Endrick
Brasile|CEN|1986-1995|Fiorentina,Parma|Dunga,Zinho
Brasile|CEN|1995-2006|Milan,Arsenal|Juninho Paulista,Juninho Pernambucano,Émerson,Gilberto Silva,Zé Roberto
Brasile|CEN|2006-2016|Chelsea,Manchester City|Ramires,Fernandinho,Paulinho,Luiz Gustavo
Brasile|CEN|2015-2026|Real Madrid,Manchester United|Casemiro,Fabinho,Bruno Guimarães,Lucas Paquetá,Joelinton
Brasile|DIF|1988-2002|Milan,Real Madrid|Cafu,Roberto Carlos,Aldair,Lúcio
Brasile|DIF|2003-2014|Milan,PSG|Thiago Silva,David Luiz,Dani Alves,Marcelo,Maicon,Alex Sandro
Brasile|DIF|2015-2026|Arsenal,PSG|Marquinhos,Éder Militão,Gabriel Magalhães,Bremer,Danilo
Brasile|POR|1994-2006|Milan,Bayern Monaco|Dida,Júlio César
Brasile|POR|2016-2026|Liverpool,Manchester City|Alisson Becker,Ederson
Italia|ATT|1986-1995|Juventus,Milan|Roberto Baggio,Gianluca Vialli,Giuseppe Signori,Salvatore Schillaci,Roberto Mancini
Italia|ATT|1995-2007|Roma,Juventus|Francesco Totti,Alessandro Del Piero,Christian Vieri,Filippo Inzaghi,Alberto Gilardino,Luca Toni
Italia|ATT|2007-2017|Napoli,Milan|Antonio Cassano,Mario Balotelli,Giuseppe Rossi,Antonio Di Natale,Stephan El Shaarawy
Italia|ATT|2017-2026|Lazio,Juventus|Ciro Immobile,Federico Chiesa,Moise Kean,Giacomo Raspadori,Mattia Zaccagni
Italia|CEN|1986-1998|Milan,Juventus|Carlo Ancelotti,Demetrio Albertini,Roberto Donadoni,Dino Baggio
Italia|CEN|1998-2009|Milan,Roma|Andrea Pirlo,Gennaro Gattuso,Daniele De Rossi,Simone Perrotta,Mauro Camoranesi
Italia|CEN|2009-2019|Juventus,PSG|Claudio Marchisio,Marco Verratti,Riccardo Montolivo,Antonio Candreva
Italia|CEN|2018-2026|Inter,Newcastle|Nicolò Barella,Sandro Tonali,Lorenzo Pellegrini,Manuel Locatelli,Davide Frattesi
Italia|DIF|1986-1999|Milan,Inter|Paolo Maldini,Franco Baresi,Giuseppe Bergomi,Alessandro Costacurta
Italia|DIF|1998-2008|Juventus,Milan|Fabio Cannavaro,Alessandro Nesta,Gianluca Zambrotta,Marco Materazzi,Fabio Grosso
Italia|DIF|2008-2018|Juventus,Inter|Giorgio Chiellini,Leonardo Bonucci,Andrea Barzagli,Domenico Criscito
Italia|DIF|2018-2026|Inter,Arsenal|Alessandro Bastoni,Federico Dimarco,Giovanni Di Lorenzo,Riccardo Calafiori,Andrea Cambiaso
Italia|POR|1986-1998|Inter,Milan|Walter Zenga,Gianluca Pagliuca,Angelo Peruzzi
Italia|POR|1999-2018|Juventus|Gianluigi Buffon
Italia|POR|2017-2026|PSG,Milan|Gianluigi Donnarumma,Alex Meret,Guglielmo Vicario
Francia|ATT|1986-1997|Manchester United,Milan|Éric Cantona,Jean-Pierre Papin,David Ginola
Francia|ATT|1998-2008|Arsenal,Juventus|Thierry Henry,David Trezeguet,Nicolas Anelka,Sylvain Wiltord
Francia|ATT|2008-2017|Real Madrid,Arsenal|Karim Benzema,Olivier Giroud,Franck Ribéry
Francia|ATT|2016-2026|Real Madrid,PSG|Kylian Mbappé,Antoine Griezmann,Ousmane Dembélé,Kingsley Coman,Marcus Thuram,Randal Kolo Muani
Francia|CEN|1986-1996|Juventus,Marsiglia|Michel Platini,Didier Deschamps
Francia|CEN|1997-2007|Real Madrid,Arsenal|Zinédine Zidane,Patrick Vieira,Claude Makélélé,Robert Pirès,Florent Malouda
Francia|CEN|2007-2017|Manchester United,Juventus|Paul Pogba,Blaise Matuidi,Yohan Cabaye,Moussa Sissoko
Francia|CEN|2017-2026|Real Madrid,Chelsea|N'Golo Kanté,Aurélien Tchouaméni,Eduardo Camavinga,Adrien Rabiot,Warren Zaïre-Emery
Francia|DIF|1996-2007|Barcelona,Arsenal|Lilian Thuram,William Gallas,Éric Abidal,Patrice Evra
Francia|DIF|2008-2018|Arsenal,Manchester City|Laurent Koscielny,Bacary Sagna,Samuel Umtiti,Adil Rami
Francia|DIF|2018-2026|Arsenal,Liverpool|William Saliba,Ibrahima Konaté,Dayot Upamecano,Jules Koundé,Theo Hernández
Francia|POR|1996-2007|Marsiglia,Lione|Fabien Barthez,Grégory Coupet
Francia|POR|2012-2024|Tottenham,Milan|Hugo Lloris,Mike Maignan
Spagna|ATT|1986-1998|Real Madrid,Barcellona|Emilio Butragueño,Julio Salinas,Fernando Morientes
Spagna|ATT|1998-2010|Real Madrid,Liverpool|Raúl González,Fernando Torres,David Villa
Spagna|ATT|2010-2020|Chelsea,Atlético Madrid|Diego Costa,Pedro Rodríguez,Álvaro Morata,Iago Aspas
Spagna|ATT|2019-2026|Barcellona,Athletic Bilbao|Lamine Yamal,Nico Williams,Ferran Torres,Dani Olmo,Mikel Oyarzabal
Spagna|CEN|1986-1999|Barcellona,Real Madrid|Pep Guardiola,Luis Enrique,Fernando Hierro
Spagna|CEN|1999-2010|Barcellona,Arsenal|Xavi Hernández,Andrés Iniesta,Cesc Fàbregas,Xabi Alonso,Marcos Senna
Spagna|CEN|2010-2020|Manchester City,Manchester United|David Silva,Juan Mata,Santi Cazorla,Isco,Sergio Busquets
Spagna|CEN|2019-2026|Manchester City,Barcellona|Rodri,Pedri,Gavi,Fabián Ruiz,Martín Zubimendi
Spagna|DIF|1995-2007|Real Madrid,Barcellona|Carles Puyol,Joan Capdevila,Álvaro Arbeloa
Spagna|DIF|2007-2018|Real Madrid,Barcellona|Sergio Ramos,Gerard Piqué,Jordi Alba,César Azpilicueta,Nacho Fernández
Spagna|DIF|2017-2026|Arsenal,Manchester City|Aymeric Laporte,Pau Torres,Marc Cucurella,Álex Grimaldo,Pedro Porro
Spagna|POR|1997-2014|Real Madrid,Barcellona|Iker Casillas,Pepe Reina,Victor Valdés
Spagna|POR|2014-2026|Manchester United,Arsenal|David de Gea,Unai Simón,David Raya
Germania|ATT|1986-1999|Inter,Bayern Monaco|Jürgen Klinsmann,Rudi Völler,Oliver Bierhoff
Germania|ATT|1999-2010|Bayern Monaco,Colonia|Miroslav Klose,Lukas Podolski,Mario Gómez
Germania|ATT|2010-2020|Bayern Monaco,Chelsea|Thomas Müller,André Schürrle,Timo Werner,Marco Reus
Germania|ATT|2019-2026|Arsenal,Bayern Monaco|Kai Havertz,Serge Gnabry,Leroy Sané,Niclas Füllkrug
Germania|CEN|1986-1999|Inter,Bayern Monaco|Lothar Matthäus,Stefan Effenberg,Michael Ballack
Germania|CEN|2000-2011|Real Madrid,Stoccarda|Mesut Özil,Sami Khedira,Bastian Schweinsteiger
Germania|CEN|2010-2022|Real Madrid,Manchester City|Toni Kroos,İlkay Gündoğan,Julian Draxler,Leon Goretzka
Germania|CEN|2020-2026|Bayern Monaco,Leverkusen|Jamal Musiala,Florian Wirtz,Joshua Kimmich,Angelo Stiller
Germania|DIF|1986-1999|Bayern Monaco,Juventus|Andreas Brehme,Jürgen Kohler,Matthias Sammer
Germania|DIF|1999-2011|Bayern Monaco,Arsenal|Philipp Lahm,Per Mertesacker,Jérôme Boateng
Germania|DIF|2011-2023|Real Madrid,Chelsea|Antonio Rüdiger,Mats Hummels,Niklas Süle
Germania|DIF|2020-2026|Borussia Dortmund,Leverkusen|Nico Schlotterbeck,Jonathan Tah,David Raum
Germania|POR|1986-2000|Bayern Monaco|Oliver Kahn
Germania|POR|2005-2026|Bayern Monaco,Barcellona|Manuel Neuer,Marc-André ter Stegen,Bernd Leno
Portogallo|ATT|1986-2000|Fiorentina,Benfica|Rui Costa,João Pinto
Portogallo|ATT|2000-2014|Manchester United,Real Madrid|Cristiano Ronaldo,Nani,Ricardo Quaresma,Hélder Postiga
Portogallo|ATT|2015-2026|Milan,Atlético Madrid|Rafael Leão,João Félix,Diogo Jota,Gonçalo Ramos,Pedro Neto
Portogallo|CEN|1995-2007|Barcellona,Real Madrid|Luís Figo,Deco,Maniche
Portogallo|CEN|2008-2018|Monaco,Manchester City|João Moutinho,André Gomes,Renato Sanches
Portogallo|CEN|2017-2026|Manchester United,Manchester City|Bruno Fernandes,Bernardo Silva,Rúben Neves,Vitinha,João Palhinha
Portogallo|DIF|1995-2007|Real Madrid,Chelsea|Pepe,Ricardo Carvalho,Paulo Ferreira
Portogallo|DIF|2008-2019|Real Madrid,Valencia|Fábio Coentrão,José Fonte,Cédric Soares
Portogallo|DIF|2018-2026|Manchester City,PSG|Rúben Dias,Nuno Mendes,João Cancelo,Diogo Dalot
Portogallo|POR|2000-2016|Sporting CP,Wolverhampton|Rui Patrício,José Sá
Portogallo|POR|2018-2026|Porto|Diogo Costa
Inghilterra|ATT|1986-1998|Newcastle,Manchester United|Gary Lineker,Alan Shearer,Andy Cole,Teddy Sheringham
Inghilterra|ATT|1998-2010|Manchester United,Liverpool|Wayne Rooney,Michael Owen,Peter Crouch,Jermain Defoe
Inghilterra|ATT|2010-2020|Tottenham,Manchester City|Harry Kane,Raheem Sterling,Marcus Rashford,Jamie Vardy
Inghilterra|ATT|2019-2026|Arsenal,Manchester City|Bukayo Saka,Phil Foden,Cole Palmer,Anthony Gordon,Ollie Watkins
Inghilterra|CEN|1986-1999|Manchester United,Tottenham|Paul Gascoigne,David Platt,Paul Ince
Inghilterra|CEN|1998-2010|Manchester United,Liverpool|David Beckham,Steven Gerrard,Frank Lampard,Paul Scholes,Michael Carrick
Inghilterra|CEN|2010-2020|Liverpool,Tottenham|Jordan Henderson,Dele Alli,James Milner
Inghilterra|CEN|2019-2026|Real Madrid,Arsenal|Jude Bellingham,Declan Rice,Kobbie Mainoo,Conor Gallagher
Inghilterra|DIF|1986-1998|Arsenal,Manchester United|Tony Adams,Gary Neville,Sol Campbell
Inghilterra|DIF|1998-2010|Chelsea,Manchester United|John Terry,Rio Ferdinand,Ashley Cole,Jamie Carragher
Inghilterra|DIF|2010-2020|Manchester City,Tottenham|Kyle Walker,John Stones,Harry Maguire,Trent Alexander-Arnold
Inghilterra|DIF|2020-2026|Arsenal,Chelsea|Reece James,Ben White,Marc Guéhi,Levi Colwill
Inghilterra|POR|1986-2001|Arsenal|David Seaman
Inghilterra|POR|2005-2018|Manchester City|Joe Hart
Inghilterra|POR|2018-2026|Everton,Arsenal|Jordan Pickford,Aaron Ramsdale
Paesi Bassi|ATT|1986-1996|Milan,Arsenal|Marco van Basten,Dennis Bergkamp,Ruud van Nistelrooij
Paesi Bassi|ATT|1998-2010|Arsenal,Bayern Monaco|Robin van Persie,Arjen Robben,Dirk Kuyt
Paesi Bassi|ATT|2012-2024|Liverpool,Barcellona|Memphis Depay,Cody Gakpo,Donyell Malen
Paesi Bassi|CEN|1986-1997|Milan,Barcellona|Ruud Gullit,Frank Rijkaard,Clarence Seedorf,Edgar Davids
Paesi Bassi|CEN|1999-2010|Real Madrid,Inter|Wesley Sneijder,Rafael van der Vaart,Mark van Bommel
Paesi Bassi|CEN|2015-2026|Barcellona,Liverpool|Frenkie de Jong,Georginio Wijnaldum,Ryan Gravenberch,Tijjani Reijnders,Xavi Simons
Paesi Bassi|DIF|1986-2000|Barcellona,Ajax|Ronald Koeman,Jaap Stam,Giovanni van Bronckhorst
Paesi Bassi|DIF|2005-2017|Juventus,Inter|Stefan de Vrij,Daley Blind
Paesi Bassi|DIF|2017-2026|Liverpool,Manchester City|Virgil van Dijk,Nathan Aké,Matthijs de Ligt,Denzel Dumfries,Jurrien Timber
Paesi Bassi|POR|1995-2010|Manchester United,Ajax|Edwin van der Sar,Maarten Stekelenburg
Paesi Bassi|POR|2018-2026|Brighton,Brentford|Bart Verbruggen,Mark Flekken
Belgio|ATT|2008-2018|Chelsea,Everton|Eden Hazard,Romelu Lukaku,Dries Mertens,Christian Benteke
Belgio|ATT|2018-2026|Arsenal,Manchester City|Jérémy Doku,Leandro Trossard,Loïs Openda,Charles De Ketelaere
Belgio|CEN|2005-2017|Manchester United,Zenit|Marouane Fellaini,Axel Witsel,Mousa Dembélé
Belgio|CEN|2015-2026|Manchester City,Leicester|Kevin De Bruyne,Youri Tielemans,Amadou Onana
Belgio|DIF|2008-2018|Manchester City,Tottenham|Vincent Kompany,Jan Vertonghen,Toby Alderweireld,Thomas Vermaelen
Belgio|DIF|2019-2026|Leicester,Atlético Madrid|Wout Faes,Arthur Theate,Timothy Castagne
Belgio|POR|2013-2026|Real Madrid,Wolfsburg|Thibaut Courtois,Koen Casteels
Croazia|ATT|1995-2007|Real Madrid,Arsenal|Davor Šuker,Ivica Olić,Eduardo da Silva
Croazia|ATT|2015-2026|Milan,Juventus|Mario Mandžukić,Andrej Kramarić,Ante Rebić,Ivan Perišić
Croazia|CEN|1995-2007|Milan,Bayern Monaco|Zvonimir Boban,Niko Kranjčar
Croazia|CEN|2008-2022|Real Madrid,Barcellona|Luka Modrić,Ivan Rakitić,Marcelo Brozović,Mateo Kovačić
Croazia|CEN|2019-2026|Manchester City,Salzburg|Lovro Majer,Luka Sučić
Croazia|DIF|1998-2010|Bayern Monaco,Tottenham|Vedran Ćorluka,Josip Šimunić
Croazia|DIF|2017-2026|Manchester City,Leipzig|Joško Gvardiol,Josip Stanišić,Dejan Lovren
Croazia|POR|2017-2026|Fenerbahçe|Dominik Livaković
Uruguay|ATT|1995-2007|Manchester United,Inter|Diego Forlán,Álvaro Recoba
Uruguay|ATT|2007-2020|Barcellona,PSG|Luis Suárez,Edinson Cavani,Cristhian Stuani
Uruguay|ATT|2020-2026|Liverpool,Benfica|Darwin Núñez,Facundo Pellistri
Uruguay|CEN|1998-2010|Juventus,Inter|Cristian Rodríguez,Walter Gargano
Uruguay|CEN|2016-2026|Real Madrid,Tottenham|Federico Valverde,Rodrigo Bentancur,Manuel Ugarte,Giorgian de Arrascaeta
Uruguay|DIF|2005-2017|Atlético Madrid,Inter|Diego Godín,José María Giménez,Martín Cáceres,Maximiliano Pereira
Uruguay|DIF|2018-2026|Barcellona,PSG|Ronald Araújo,Mathías Olivera
Uruguay|POR|2009-2022|Galatasaray|Fernando Muslera
Colombia|ATT|1990-2002|Parma,Newcastle|Faustino Asprilla,Radamel Falcao
Colombia|ATT|2012-2026|Liverpool,Porto|Luis Díaz,Juan Cuadrado,Duván Zapata,Luis Muriel
Colombia|CEN|1990-2002|Real Madrid,Monaco|Carlos Valderrama,Freddy Guarín
Colombia|CEN|2013-2024|Real Madrid,Bayern Monaco|James Rodríguez,Juan Fernando Quintero,Jefferson Lerma
Colombia|DIF|2014-2026|Tottenham,Inter|Davinson Sánchez,Yerry Mina,Daniel Muñoz
Colombia|POR|2014-2024|Arsenal,Napoli|David Ospina
Cile|ATT|1998-2008|Lazio,Udinese|Alexis Sánchez,Marcelo Salas
Cile|ATT|2012-2023|Arsenal,Inter|Eduardo Vargas
Cile|CEN|2005-2020|Juventus,Barcellona|Arturo Vidal,Charles Aránguiz,Jorge Valdivia
Cile|DIF|2010-2022|Inter,Monaco|Gary Medel,Mauricio Isla
Cile|POR|2013-2022|Manchester City,Barcellona|Claudio Bravo
Messico|ATT|1998-2010|Barcellona,Manchester United|Javier Hernández,Carlos Vela,Giovani dos Santos
Messico|ATT|2015-2026|Wolverhampton,Napoli|Raúl Jiménez,Hirving Lozano,Santiago Giménez
Messico|CEN|1998-2010|Barcellona,PSV|Andrés Guardado,Héctor Herrera
Messico|DIF|1999-2015|Barcellona,Monaco|Rafael Márquez,Héctor Moreno
Messico|POR|2004-2024|Salernitana,Ajaccio|Guillermo Ochoa
USA|ATT|2005-2015|Everton,LA Galaxy|Landon Donovan,Clint Dempsey
USA|ATT|2018-2026|Milan,Juventus|Christian Pulisic,Timothy Weah,Folarin Balogun
USA|CEN|2018-2026|Juventus,Valencia|Weston McKennie,Tyler Adams,Yunus Musah
USA|DIF|2018-2026|Fulham,Crystal Palace|Antonee Robinson,Sergiño Dest,Chris Richards
USA|POR|2005-2015|Everton,Manchester United|Tim Howard,Brad Friedel
Danimarca|ATT|1986-1997|Barcellona,Ajax|Michael Laudrup,Brian Laudrup
Danimarca|ATT|2008-2018|Arsenal,Ajax|Nicklas Bendtner,Kasper Dolberg
Danimarca|ATT|2019-2026|Manchester United,Atalanta|Rasmus Højlund,Yussuf Poulsen
Danimarca|CEN|1998-2010|Juventus,Liverpool|Christian Poulsen,Daniel Agger
Danimarca|CEN|2013-2026|Tottenham,Manchester United|Christian Eriksen,Pierre-Emile Højbjerg,Mikkel Damsgaard
Danimarca|DIF|2005-2016|Liverpool,Chelsea|Simon Kjær,Andreas Christensen
Danimarca|DIF|2018-2026|Crystal Palace,Leicester|Joachim Andersen,Jannik Vestergaard
Danimarca|POR|2013-2024|Leicester,Celtic|Kasper Schmeichel
Svezia|ATT|1994-2006|Celtic,Arsenal|Henrik Larsson,Freddie Ljungberg
Svezia|ATT|2004-2018|PSG,Milan|Zlatan Ibrahimović,Marcus Berg,John Guidetti
Svezia|ATT|2019-2026|Newcastle,Arsenal|Alexander Isak,Viktor Gyökeres,Dejan Kulusevski,Anthony Elanga
Svezia|CEN|1995-2010|Arsenal,Lione|Kim Källström,Sebastian Larsson
Svezia|DIF|2007-2022|Manchester United,Benfica|Victor Lindelöf,Emil Krafth
Svezia|POR|2008-2018|PSV,Cagliari|Robin Olsen
Norvegia|ATT|1996-2007|Manchester United|Ole Gunnar Solskjær,John Carew
Norvegia|ATT|2019-2026|Manchester City|Erling Haaland,Alexander Sørloth
Norvegia|CEN|2019-2026|Arsenal|Martin Ødegaard,Sander Berge
Norvegia|DIF|2019-2026|Napoli,Brentford|Leo Østigård,Kristoffer Ajer
Norvegia|POR|2018-2026|Sevilla|Ørjan Nyland
Polonia|ATT|2008-2024|Bayern Monaco,Barcellona|Robert Lewandowski,Arkadiusz Milik,Krzysztof Piątek
Polonia|CEN|2010-2023|Napoli,PSG|Piotr Zieliński,Grzegorz Krychowiak
Polonia|DIF|2012-2024|Arsenal,Southampton|Jan Bednarek,Jakub Kiwior
Polonia|POR|2007-2024|Juventus,Arsenal|Wojciech Szczęsny,Łukasz Fabiański
Serbia|ATT|2005-2017|Ajax,Fulham|Dušan Tadić,Aleksandar Mitrović
Serbia|ATT|2018-2026|Juventus,Milan|Dušan Vlahović,Luka Jović
Serbia|CEN|2008-2018|Chelsea,Manchester United|Nemanja Matić,Sergej Milinković-Savić
Serbia|DIF|1999-2012|Manchester United,Inter|Nemanja Vidić,Branislav Ivanović,Aleksandar Kolarov
Serbia|POR|2015-2026|Torino|Vanja Milinković-Savić
Bosnia-Erzegovina|ATT|2008-2020|Manchester City,Roma|Edin Džeko,Vedad Ibišević
Bosnia-Erzegovina|CEN|2010-2022|Juventus,Barcellona|Miralem Pjanić
Bosnia-Erzegovina|DIF|2018-2026|Atalanta|Sead Kolašinac
Bosnia-Erzegovina|POR|2011-2022|Chelsea,Bournemouth|Asmir Begović
Slovenia|ATT|2019-2026|Leipzig|Benjamin Šeško
Slovenia|CEN|2009-2020|Atalanta|Josip Iličić
Slovenia|POR|2013-2026|Atlético Madrid,Inter|Jan Oblak,Samir Handanović
Slovacchia|CEN|2008-2020|Napoli|Marek Hamšík,Stanislav Lobotka
Slovacchia|DIF|2008-2020|Liverpool,Inter|Martin Škrtel,Milan Škriniar
Slovacchia|POR|2018-2026|Newcastle|Martin Dúbravka
Repubblica Ceca|ATT|1996-2007|Liverpool,Borussia Dortmund|Milan Baroš,Jan Koller,Patrik Schick
Repubblica Ceca|CEN|1997-2010|Juventus,Arsenal|Pavel Nedvěd,Tomáš Rosický,Vladimír Šmicer
Repubblica Ceca|DIF|2006-2017|Arsenal,West Ham|Tomáš Souček,Vladimír Coufal
Repubblica Ceca|POR|2004-2016|Chelsea,Arsenal|Petr Čech
Austria|ATT|1986-1997|Torino|Andreas Herzog
Austria|ATT|2019-2026|Inter,Bologna|Marko Arnautović,Christoph Baumgartner
Austria|CEN|2018-2026|Bayern Monaco,Leipzig|Marcel Sabitzer,Konrad Laimer
Austria|DIF|2011-2024|Real Madrid,Bayern Monaco|David Alaba,Kevin Danso
Austria|POR|2018-2026|Wolfsburg|Patrick Pentz
Svizzera|ATT|2010-2022|Liverpool,Stoke City|Xherdan Shaqiri,Breel Embolo
Svizzera|CEN|2010-2026|Arsenal,Leverkusen|Granit Xhaka,Denis Zakaria,Remo Freuler
Svizzera|DIF|2005-2018|Juventus,Arsenal|Stephan Lichtsteiner,Ricardo Rodríguez,Manuel Akanji
Svizzera|POR|2012-2026|Inter,Gladbach|Yann Sommer,Gregor Kobel
Turchia|ATT|1996-2007|Inter,Galatasaray|Hakan Şükür,Arda Turan
Turchia|ATT|2018-2026|Real Madrid,Juventus|Arda Güler,Kenan Yıldız,Cengiz Ünder
Turchia|CEN|2005-2016|Atlético Madrid,Inter|Hakan Çalhanoğlu,Nuri Şahin
Turchia|DIF|2005-2016|Leicester,Roma|Çağlar Söyüncü,Merih Demiral
Turchia|POR|2018-2026|Manchester United|Altay Bayındır
Grecia|ATT|2000-2012|Celtic,Benfica|Georgios Samaras,Konstantinos Mitroglou
Grecia|CEN|2004-2015|Fulham,Olympiacos|Giorgos Karagounis,Kostas Fortounis
Grecia|DIF|2004-2015|Roma,Arsenal|Kostas Manolas,Sokratis Papastathopoulos
Grecia|POR|2004-2014|Benfica|Orestis Karnezis
Ucraina|ATT|1996-2009|Milan,Chelsea|Andriy Shevchenko,Andriy Yarmolenko
Ucraina|ATT|2018-2026|Chelsea,Girona|Mykhailo Mudryk,Artem Dovbyk
Ucraina|CEN|2008-2018|Manchester City,Atalanta|Oleksandr Zinchenko,Ruslan Malinovskyi
Ucraina|DIF|2018-2026|Bournemouth|Illia Zabarnyi,Vitaliy Mykolenko
Ucraina|POR|2018-2026|Real Madrid,Benfica|Andriy Lunin,Anatoliy Trubin
Russia|ATT|1996-2009|Tottenham,Arsenal|Roman Pavlyuchenko,Andrey Arshavin
Russia|CEN|1998-2010|Zenit,Monaco|Aleksandr Golovin,Yuri Zhirkov
Russia|DIF|1998-2010|Chelsea,CSKA Mosca|Branislav Ivanović
Russia|POR|2005-2018|CSKA Mosca|Igor Akinfeev
Georgia|ATT|2022-2026|Napoli,PSG|Khvicha Kvaratskhelia,Georges Mikautadze
Georgia|POR|2022-2026|Liverpool,Valencia|Giorgi Mamardashvili
Armenia|CEN|2012-2021|Arsenal,Roma|Henrikh Mkhitaryan
Egitto|ATT|2014-2026|Liverpool,Roma|Mohamed Salah,Omar Marmoush,Mostafa Mohamed
Egitto|CEN|2005-2015|Arsenal|Mohamed Elneny
Marocco|ATT|2016-2026|Chelsea,Sevilla|Hakim Ziyech,Youssef En-Nesyri,Abde Ezzalzouli
Marocco|CEN|2017-2026|Manchester United,Fiorentina|Sofyan Amrabat,Azzedine Ounahi
Marocco|DIF|2018-2026|PSG,Bayern Monaco|Achraf Hakimi,Nayef Aguerd,Noussair Mazraoui
Marocco|POR|2018-2026|Al Hilal,Sevilla|Yassine Bounou
Algeria|ATT|2014-2024|Manchester City,Leicester|Riyad Mahrez,Saïd Benrahma,Islam Slimani
Algeria|CEN|2014-2022|Milan,Napoli|Ismaël Bennacer,Sofiane Feghouli
Algeria|DIF|2018-2026|Borussia Dortmund|Ramy Bensebaini
Tunisia|ATT|2018-2026|Saint-Étienne|Wahbi Khazri
Tunisia|CEN|2018-2026|Manchester United|Hannibal Mejbri
Senegal|ATT|2002-2012|Newcastle,Chelsea|Demba Ba,Papiss Cissé
Senegal|ATT|2015-2026|Liverpool,Bayern Monaco|Sadio Mané,Ismaïla Sarr,Nicolas Jackson
Senegal|CEN|2016-2026|PSG,Everton|Idrissa Gueye,Pape Matar Sarr
Senegal|DIF|2016-2026|Napoli,Chelsea|Kalidou Koulibaly,Édouard Mendy
Senegal|POR|2019-2026|Chelsea,Al Ahli|Édouard Mendy
Costa d'Avorio|ATT|2005-2015|Chelsea,Manchester City|Didier Drogba,Wilfried Bony,Gervinho
Costa d'Avorio|ATT|2018-2026|Borussia Dortmund,Atalanta|Sébastien Haller,Amad Diallo
Costa d'Avorio|CEN|2007-2017|Manchester City,Barcellona|Yaya Touré,Franck Kessié,Jean Michaël Seri
Costa d'Avorio|DIF|2018-2026|Manchester United,Nottingham Forest|Eric Bailly,Serge Aurier
Ghana|ATT|2006-2018|Sunderland,Marsiglia|Asamoah Gyan,André Ayew,Jordan Ayew
Ghana|ATT|2018-2026|Ajax,West Ham|Mohammed Kudus,Antoine Semenyo
Ghana|CEN|2005-2016|Chelsea,Milan|Michael Essien,Sulley Muntari,Kevin-Prince Boateng
Ghana|CEN|2018-2026|Arsenal,Atlético Madrid|Thomas Partey,Mohammed Salisu
Ghana|DIF|2006-2016|Leicester|Daniel Amartey
Nigeria|ATT|1994-2005|Arsenal,Inter|Nwankwo Kanu,Obafemi Martins,Yakubu Aiyegbeni
Nigeria|ATT|2017-2026|Napoli,Atalanta|Victor Osimhen,Ademola Lookman,Samuel Chukwueze,Victor Boniface
Nigeria|CEN|1995-2005|Bolton,PSG|Jay-Jay Okocha,John Obi Mikel,Wilfred Ndidi
Nigeria|DIF|2017-2026|Fulham,Nottingham Forest|Calvin Bassey,Ola Aina
Camerun|ATT|1995-2005|Barcellona,Inter|Samuel Eto'o,Patrick Mboma
Camerun|ATT|2018-2026|Bayern Monaco,Brentford|Eric Maxim Choupo-Moting,Bryan Mbeumo
Camerun|CEN|2005-2016|Arsenal,Barcellona|Alex Song,André-Frank Zambo Anguissa
Camerun|DIF|1999-2010|Liverpool,Tottenham|Joël Matip,Benoît Assou-Ekotto
Camerun|POR|2018-2026|Manchester United,Inter|André Onana
Sudafrica|ATT|1996-2007|Manchester United,Everton|Benni McCarthy,Steven Pienaar
Sudafrica|CEN|2007-2016|Everton|Steven Pienaar
Sudafrica|POR|2005-2015|Kaizer Chiefs|Itumeleng Khune
Giappone|ATT|2005-2016|Manchester United,Milan|Shinji Kagawa,Keisuke Honda,Shinji Okazaki
Giappone|ATT|2018-2026|Brighton,Real Sociedad|Kaoru Mitoma,Takefusa Kubo,Takumi Minamino
Giappone|CEN|2008-2018|Inter,Leicester|Yuto Nagatomo,Makoto Hasebe
Giappone|CEN|2018-2026|Liverpool,Crystal Palace|Wataru Endo,Daichi Kamada
Giappone|DIF|2015-2026|Arsenal,Stoccarda|Takehiro Tomiyasu,Hiroki Ito
Giappone|POR|2018-2026|Parma|Zion Suzuki
Corea del Sud|ATT|2005-2015|Manchester United|Park Ji-sung,Lee Chung-yong
Corea del Sud|ATT|2015-2026|Tottenham,Wolverhampton|Son Heung-min,Hwang Hee-chan,Lee Kang-in
Corea del Sud|DIF|2018-2026|Bayern Monaco,Napoli|Kim Min-jae
Australia|ATT|2005-2015|Everton,New York Red Bulls|Tim Cahill,Harry Kewell
Australia|CEN|2005-2015|Crystal Palace,Celtic|Mile Jedinak,Aaron Mooy
Australia|POR|2008-2020|Brighton,Arsenal|Mathew Ryan,Mark Schwarzer
Canada|ATT|2019-2026|Lille,Bayern Monaco|Jonathan David,Alphonso Davies,Cyle Larin
Canada|CEN|2019-2026|Porto,Marseille|Stephen Eustáquio,Ismaël Koné
Canada|DIF|2019-2026|Bayern Monaco|Alphonso Davies
Canada|POR|2019-2026|Portland Timbers|Maxime Crépeau
Scozia|ATT|1986-1999|Liverpool,Newcastle|Kenny Dalglish,Ally McCoist
Scozia|ATT|2018-2026|Manchester United,Southampton|Scott McTominay,Che Adams
Scozia|CEN|2018-2026|Aston Villa,Manchester United|John McGinn,Billy Gilmour
Scozia|DIF|2017-2026|Liverpool,Arsenal|Andrew Robertson,Kieran Tierney
Scozia|POR|2010-2020|Celtic|Craig Gordon
Galles|ATT|1995-2007|Manchester United,Liverpool|Ryan Giggs,Craig Bellamy
Galles|ATT|2012-2022|Real Madrid,Arsenal|Gareth Bale,Aaron Ramsey,Daniel James
Galles|DIF|2008-2020|Tottenham,Swansea|Ben Davies,Joe Rodon
Galles|POR|2015-2024|Leicester|Danny Ward
Irlanda|ATT|1995-2008|Tottenham,Manchester United|Robbie Keane,Damien Duff
Irlanda|CEN|1995-2008|Manchester United,Sunderland|Roy Keane,Stephen Ireland
Irlanda|DIF|2005-2018|Everton,Manchester City|Séamus Coleman,Richard Dunne
Irlanda|POR|1996-2010|Manchester City|Shay Given
Irlanda del Nord|ATT|1986-1999|Manchester United|George Best
Irlanda del Nord|DIF|2015-2026|Leicester,Manchester United|Jonny Evans
Islanda|ATT|2016-2024|Everton,Swansea|Gylfi Sigurðsson,Alfreð Finnbogason
Islanda|CEN|2016-2022|Burnley|Jóhann Berg Guðmundsson
Islanda|POR|2016-2022|Qarabağ|Hannes Þór Halldórsson
Finlandia|ATT|1995-2007|Liverpool,Ajax|Jari Litmanen,Teemu Pukki
Finlandia|POR|1998-2010|Bolton,Leverkusen|Jussi Jääskeläinen,Lukáš Hrádecký
Ungheria|ATT|2008-2017|PSV|Balázs Dzsudzsák
Ungheria|CEN|2020-2026|Liverpool|Dominik Szoboszlai
Ungheria|DIF|2019-2026|Bournemouth|Milos Kerkez
Ungheria|POR|2019-2026|Leipzig|Péter Gulácsi
Romania|ATT|1986-1999|Fiorentina,Chelsea|Adrian Mutu,Florin Răducioiu
Romania|CEN|1986-1999|Barcellona,Real Madrid|Gheorghe Hagi,Dan Petrescu
Romania|DIF|2018-2026|Tottenham,Genoa|Radu Drăgușin
Romania|POR|2018-2026|Atlético Madrid|Horațiu Moldovan
Bulgaria|ATT|1992-2004|Barcellona,Manchester United|Hristo Stoichkov,Dimitar Berbatov
Bulgaria|CEN|1995-2007|Sporting CP|Stiliyan Petrov
Bulgaria|POR|1996-2007|Twente|Nikolay Mihaylov
Montenegro|ATT|1990-2000|Milan,Fiorentina|Dejan Savićević,Stevan Jovetić
Montenegro|DIF|2010-2020|Atlético Madrid|Stefan Savić
Montenegro|POR|2018-2026|Atletico Madrid|Matija Šarkić
Albania|ATT|2018-2026|Chelsea,Bologna|Armando Broja,Rey Manaj
Albania|DIF|2018-2026|Atalanta,Lazio|Berat Djimsiti,Elseid Hysaj
Albania|POR|2018-2026|Brentford|Thomas Strakosha
Kosovo|ATT|2018-2026|Napoli,Lazio|Vedat Muriqi,Milot Rashica
Kosovo|CEN|2018-2026|Lille|Edon Zhegrova
Kosovo|DIF|2018-2026|Napoli|Amir Rrahmani
Israele|ATT|2007-2018|Chelsea,Liverpool|Yossi Benayoun,Manor Solomon
Israele|CEN|2018-2026|Salzburg|Oscar Gloukh
Israele|POR|2018-2026|Bayern Monaco|Daniel Peretz
Iran|ATT|1996-2007|Bayern Monaco,Hertha Berlino|Ali Daei,Mehdi Mahdavikia
Iran|ATT|2018-2026|Inter,Porto|Mehdi Taremi,Sardar Azmoun
Iran|CEN|2018-2026|Feyenoord|Alireza Jahanbakhsh
Arabia Saudita|ATT|1994-2006|Al Hilal|Sami Al-Jaber,Salem Al-Dawsari
Arabia Saudita|CEN|2018-2026|Al Hilal|Mohamed Kanno
Arabia Saudita|POR|2018-2026|Al Hilal|Mohammed Al-Owais
Ecuador|ATT|2006-2016|Manchester United,West Ham|Enner Valencia,Antonio Valencia
Ecuador|CEN|2018-2026|Chelsea,Brighton|Moisés Caicedo,Pervis Estupiñán
Ecuador|DIF|2018-2026|Leverkusen,Arsenal|Piero Hincapié,Willian Pacho
Ecuador|POR|2018-2026|Galatasaray|Hernán Galíndez
Paraguay|ATT|1996-2009|Manchester City,Bayern Monaco|Roque Santa Cruz,Óscar Cardozo
Paraguay|CEN|2008-2018|Newcastle|Miguel Almirón
Paraguay|DIF|1996-2007|Milan,West Ham|Paulo da Silva,Gustavo Gómez
Paraguay|POR|1996-2007|Vélez Sarsfield|José Luis Chilavert
Perù|ATT|2006-2018|Bayern Monaco,Schalke|Claudio Pizarro,Jefferson Farfán,Paolo Guerrero
Perù|CEN|2015-2024|Celta Vigo|Renato Tapia
Perù|DIF|2015-2024|Feyenoord|Marcos López
Venezuela|ATT|2010-2024|West Brom,Newcastle|Salomón Rondón,Josef Martínez
Venezuela|CEN|2017-2026|Girona|Yangel Herrera
Venezuela|DIF|2018-2026|Real Sociedad|Jon Aramburu
Venezuela|POR|2018-2026|Lens|Wuilker Faríñez
Giamaica|ATT|1998-2010|Leicester,West Ham|Michail Antonio,Leon Bailey
Giamaica|CEN|2018-2026|West Ham|Demarai Gray
Giamaica|DIF|2018-2026|Brentford|Ethan Pinnock
Nuova Zelanda|ATT|2008-2024|Nottingham Forest,Newcastle|Chris Wood,Winston Reid
Nuova Zelanda|CEN|2018-2026|Torino|Liberato Cacace
Nuova Zelanda|POR|2018-2026|Bournemouth|Mark Travers
'''
players={}
for line in rows.strip().splitlines():
 country,role,peak,clubs,names=line.split('|')
 for name in names.split(','):
  name=name.strip()
  if name not in players:
   players[name]={'id':len(players)+1,'name':name,'nationality':country,'role':role,'peak':peak,'clubs':clubs.split(','),'difficulty':'difficile'}
  else:
   for club in clubs.split(','):
    if club not in players[name]['clubs']:players[name]['clubs'].append(club)
# Curated recognizability priority. Every player remains available; the 500-player pool is fixed.
star='Lionel Messi,Cristiano Ronaldo,Diego Maradona,Ronaldo Nazário,Ronaldinho,Zinédine Zidane,Thierry Henry,Kylian Mbappé,Neymar,Erling Haaland,Robert Lewandowski,Zlatan Ibrahimović,Paolo Maldini,Francesco Totti,Alessandro Del Piero,Gianluigi Buffon,Andrea Pirlo,Kaká,David Beckham,Wayne Rooney,Karim Benzema,Luka Modrić,Sergio Ramos,Andrés Iniesta,Xavi Hernández,Mohamed Salah,Kevin De Bruyne,Harry Kane,Virgil van Dijk,Manuel Neuer,Ruud Gullit,Marco van Basten,Roberto Baggio,Gareth Bale,Didier Drogba,Samuel Eto\'o,Romário,Rivaldo,Luís Figo,Raúl González,Iker Casillas,Gerard Piqué,Carles Puyol,Antoine Griezmann,Eden Hazard,Arjen Robben,Franck Ribéry,Mesut Özil,Paul Pogba,Jude Bellingham,Vinícius Júnior,Lamine Yamal,Bukayo Saka,Phil Foden,Rodri,Pedri,Son Heung-min,Sadio Mané,Luis Suárez,Edinson Cavani,Sergio Agüero,Ángel Di María,David Villa,Fernando Torres,Christian Pulisic,Victor Osimhen,Marcus Rashford,Thomas Müller,Toni Kroos,Frank Lampard,Steven Gerrard,Paul Scholes,John Terry,Rio Ferdinand,Roberto Carlos,Cafu,Fabio Cannavaro,Alessandro Nesta,Giorgio Chiellini,Leonardo Bonucci,Clarence Seedorf,Patrick Vieira,Yaya Touré,Alexis Sánchez,Arturo Vidal,Christian Eriksen,Thibaut Courtois,Alisson Becker,Ederson,Jan Oblak,Emiliano Martínez,Gianluigi Donnarumma,Achraf Hakimi,Trent Alexander-Arnold,Alphonso Davies,Khvicha Kvaratskhelia'.split(',')
for n in star:
 if n in players:players[n]['difficulty']='facile'
# medium is a stable next tier from roster ordering, while difficult remains the more obscure selection.
medium_target=170
for p in players.values():
 if p['difficulty']=='difficile' and medium_target:
  p['difficulty']='media';medium_target-=1
# select 500, prioritizing easy then medium then difficult, stable input order
rank={'facile':0,'media':1,'difficile':2}
selection=sorted(players.values(),key=lambda p:(rank[p['difficulty']],p['id']))[:500]
for i,p in enumerate(selection):p['id']=i+1
out=Path(__file__).parent/'src'/'players.json'
out.write_text(json.dumps(selection,ensure_ascii=False,indent=2))
print('raw unique',len(players),'selected',len(selection),'tiers',{x:sum(p['difficulty']==x for p in selection) for x in rank})
