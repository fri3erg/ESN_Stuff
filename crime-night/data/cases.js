// The 4 cases. English texts come from the printed cards (ESN_Crime_Night_Cards_Color_400.pdf).
// `clears` = suspects this clue gives an alibi to. `code` = word players read to each other.
export const CASES = [
  {
    id: 1, culprits: 1,
    title: { en: 'The Great Alcohol Heist', it: "Il Grande Furto dell'Alcol", es: 'El Gran Robo del Alcohol' },
    short: { en: 'Alcohol Heist', it: "Furto dell'Alcol", es: 'Robo del Alcohol' },
    crime: {
      en: 'At 01:00, the entire alcohol supply for the next ESN trip mysteriously vanished. The fridge was completely empty. The only thing left behind was a receipt on the table. Whoever did this knew exactly where the alcohol was stored. Clearly, an inside job. And someone is about to have a VERY good weekend.',
      it: "All'01:00 l'intera scorta di alcol per il prossimo viaggio ESN è misteriosamente sparita. Il frigo era completamente vuoto. L'unica cosa rimasta era uno scontrino sul tavolo. Chiunque sia stato sapeva esattamente dove fosse l'alcol. Chiaramente un lavoro dall'interno. E qualcuno sta per passare un weekend MOLTO piacevole.",
      es: 'A la 01:00, toda la reserva de alcohol para el próximo viaje de ESN desapareció misteriosamente. La nevera estaba completamente vacía. Lo único que quedó fue un ticket sobre la mesa. Quien lo hizo sabía exactamente dónde estaba guardado el alcohol. Claramente, un trabajo desde dentro. Y alguien está a punto de tener un fin de semana MUY bueno.',
    },
    clues: [
      { letter: 'A', clears: ['Sissi', 'Roberta'], code: 'GOSSIP', text: {
        en: 'Sissi and Roberta were spotted at a table in the Irish Pub, sipping beers and exchanging some VERY juicy gossip. Apparently, the tea was hotter than the beer was cold.',
        it: "Sissi e Roberta sono state viste a un tavolo dell'Irish Pub, a sorseggiare birra e scambiarsi gossip MOLTO succosi. A quanto pare, i pettegolezzi scottavano più di quanto fosse fredda la birra.",
        es: 'Sissi y Roberta fueron vistas en una mesa del Irish Pub, bebiendo cerveza e intercambiando cotilleos MUY jugosos. Al parecer, el salseo estaba más caliente que fría la cerveza.' } },
      { letter: 'B', clears: ['Davide', 'Leo'], code: 'KARAOKE', text: {
        en: 'Security cameras at Le Mercanzie show Davide and Leo arguing over karaoke lyrics at 01:00.',
        it: "Le telecamere di Le Mercanzie mostrano Davide e Leo che litigano sul testo di una canzone al karaoke all'01:00.",
        es: 'Las cámaras de seguridad de Le Mercanzie muestran a Davide y Leo discutiendo por la letra de una canción de karaoke a la 01:00.' } },
      { letter: 'C', clears: ['Elia', 'Mary'], code: 'JENGA', text: {
        en: 'Elia and Mary were playing Jenga at Ostello Bello at 01:00. Someone knocked over the tower, and they spent the next 30 minutes blaming each other. Five witnesses confirm they never left the table.',
        it: "Elia e Mary stavano giocando a Jenga all'Ostello Bello all'01:00. Qualcuno ha fatto crollare la torre e hanno passato i 30 minuti successivi a darsi la colpa a vicenda. Cinque testimoni confermano che non si sono mai alzati dal tavolo.",
        es: 'Elia y Mary estaban jugando al Jenga en el Ostello Bello a la 01:00. Alguien tiró la torre y pasaron los siguientes 30 minutos echándose la culpa. Cinco testigos confirman que nunca se levantaron de la mesa.' } },
      { letter: 'D', clears: ['Francesco'], code: 'SLIPPERS', text: {
        en: 'Francesco was locked outside his apartment wearing slippers at 01:00. His doorbell camera recorded the whole tragedy.',
        it: "All'01:00 Francesco era chiuso fuori casa in ciabatte. La telecamera del citofono ha registrato tutta la tragedia.",
        es: 'A la 01:00, Francesco se había quedado encerrado fuera de su piso en zapatillas. La cámara del timbre grabó toda la tragedia.' } },
      { letter: 'E', clears: ['Andrea'], code: 'ZALANDO', text: {
        en: 'Andrea was spotted at Le Mercanzie, scrolling through Zalando all night in search of yet another elegant jacket. Meanwhile, “Sarà perché ti amo” was being sung for the 47th time that evening.',
        it: "Andrea è stato visto a Le Mercanzie, a scorrere Zalando tutta la notte alla ricerca dell'ennesima giacca elegante. Nel frattempo, “Sarà perché ti amo” veniva cantata per la 47ª volta quella sera.",
        es: 'Andrea fue visto en Le Mercanzie, mirando Zalando toda la noche en busca de otra chaqueta elegante más. Mientras tanto, “Sarà perché ti amo” sonaba por 47ª vez esa noche.' } },
    ],
  },
  {
    id: 2, culprits: 1,
    title: { en: 'The Freestyle Takeover', it: 'Il Colpo Freestyle', es: 'El Asalto Freestyle' },
    short: { en: 'Freestyle Takeover', it: 'Colpo Freestyle', es: 'Asalto Freestyle' },
    crime: {
      en: "At 23:00, in the middle of the party, someone secretly took control of the DJ's laptop and replaced the entire playlist with freestyle rap beats. Within minutes, the dance floor had turned into an unauthorized rap battle. Confused Erasmus students were desperately trying to rhyme in languages they barely spoke.",
      it: 'Alle 23:00, nel pieno della festa, qualcuno ha preso segretamente il controllo del laptop del DJ e ha sostituito l’intera playlist con basi rap freestyle. In pochi minuti la pista da ballo si è trasformata in una battaglia rap non autorizzata. Studenti Erasmus confusi cercavano disperatamente di fare rime in lingue che parlavano a malapena.',
      es: 'A las 23:00, en plena fiesta, alguien tomó en secreto el control del portátil del DJ y sustituyó toda la playlist por bases de rap freestyle. En pocos minutos, la pista de baile se convirtió en una batalla de rap no autorizada. Estudiantes Erasmus confundidos intentaban rimar desesperadamente en idiomas que apenas hablaban.',
    },
    clues: [
      { letter: 'A', clears: ['Sissi', 'Roberta'], code: 'LIVESTREAM', text: {
        en: 'Sissi and Roberta were in the office counting ESN welcome bags on a livestream at 23:00. They lost count at least seven times.',
        it: 'Alle 23:00 Sissi e Roberta erano in ufficio a contare le welcome bag ESN in diretta streaming. Hanno perso il conto almeno sette volte.',
        es: 'A las 23:00, Sissi y Roberta estaban en la oficina contando las welcome bags de ESN en un directo. Perdieron la cuenta al menos siete veces.' } },
      { letter: 'B', clears: ['Vincenzo', 'Andrea'], code: 'SUPPLIES', text: {
        en: 'Vincenzo and Andrea were unloading supplies for the next ESN trip at 23:00. Security cameras confirm it.',
        it: 'Alle 23:00 Vincenzo e Andrea stavano scaricando le provviste per il prossimo viaggio ESN. Le telecamere lo confermano.',
        es: 'A las 23:00, Vincenzo y Andrea estaban descargando provisiones para el próximo viaje de ESN. Las cámaras de seguridad lo confirman.' } },
      { letter: 'C', clears: ['Elia', 'Mary'], code: 'ROUTER', text: {
        en: 'Elia and Mary were at Ostello Bello trying to fix the Wi-Fi at 23:00. The receptionist watched them restart the router twelve times.',
        it: "Alle 23:00 Elia e Mary erano all'Ostello Bello a cercare di sistemare il Wi-Fi. Il receptionist li ha visti riavviare il router dodici volte.",
        es: 'A las 23:00, Elia y Mary estaban en el Ostello Bello intentando arreglar el Wi-Fi. El recepcionista los vio reiniciar el router doce veces.' } },
      { letter: 'D', clears: ['Francesco'], code: 'FANTACALCIO', text: {
        en: 'Francesco was on a recorded fantacalcio call at 23:00, desperately defending his terrible player choices.',
        it: 'Alle 23:00 Francesco era in una call registrata del fantacalcio, a difendere disperatamente le sue pessime scelte di formazione.',
        es: 'A las 23:00, Francesco estaba en una videollamada grabada de fantacalcio, defendiendo desesperadamente sus pésimas elecciones de jugadores.' } },
      { letter: 'E', clears: ['Leo'], code: 'HELLO KITTY', text: {
        en: 'At 11 PM, Leo was spotted at Le Mercanzie giving a very passionate performance of “Hello Kitty” at karaoke. Unfortunately for everyone, there is video evidence.',
        it: 'Alle 23:00 Leo è stato visto a Le Mercanzie mentre si esibiva con grande passione in “Hello Kitty” al karaoke. Purtroppo per tutti, esiste un video.',
        es: 'A las 23:00, Leo fue visto en Le Mercanzie haciendo una interpretación muy apasionada de “Hello Kitty” en el karaoke. Por desgracia para todos, hay pruebas en vídeo.' } },
    ],
  },
  {
    id: 3, culprits: 2,
    missing: { name: 'Aitor', photo: 'img/suspects/aitor.jpg' }, // the kidnapped VP, shown as a MISSING poster
    title: { en: 'The Vice President Is Missing', it: 'Il Vicepresidente È Scomparso', es: 'El Vicepresidente Ha Desaparecido' },
    short: { en: 'VP Is Missing', it: 'VP Scomparso', es: 'VP Desaparecido' },
    crime: {
      en: 'The ESN Vice President, Aitor, mysteriously vanished for 48 hours. He was last seen at the ESN office at around 20:30, shortly before his mysterious disappearance. TWO kidnappers. ONE hostage. ONE ransom demand. Unfortunately, nobody seems willing to pay. At this point, the kidnappers are starting to wonder if ESN even wants him back.',
      it: "Il Vicepresidente di ESN, Aitor, è misteriosamente sparito per 48 ore. È stato visto l'ultima volta nell'ufficio ESN verso le 20:30, poco prima della sua misteriosa scomparsa. DUE rapitori. UN ostaggio. UNA richiesta di riscatto. Purtroppo nessuno sembra disposto a pagare. A questo punto, i rapitori iniziano a chiedersi se ESN lo rivoglia davvero indietro.",
      es: 'El Vicepresidente de ESN, Aitor, desapareció misteriosamente durante 48 horas. Fue visto por última vez en la oficina de ESN hacia las 20:30, poco antes de su misteriosa desaparición. DOS secuestradores. UN rehén. UNA petición de rescate. Por desgracia, nadie parece dispuesto a pagar. A estas alturas, los secuestradores empiezan a preguntarse si ESN lo quiere de vuelta.',
    },
    clues: [
      { letter: 'A', clears: ['Davide', 'Vincenzo'], code: 'FOCACCIA', text: {
        en: 'At 20:30, Davide and Vincenzo were with Christian, planning the grocery list for the aperitivo on the next ESN trip. After two hours of intense negotiations, they had agreed on enough focaccia to feed the entire Erasmus population and approximately 300 liters of Spritz.',
        it: "Alle 20:30 Davide e Vincenzo erano con Christian a pianificare la lista della spesa per l'aperitivo del prossimo viaggio ESN. Dopo due ore di intense trattative, si erano accordati su abbastanza focaccia da sfamare l'intera popolazione Erasmus e circa 300 litri di Spritz.",
        es: 'A las 20:30, Davide y Vincenzo estaban con Christian planeando la lista de la compra para el aperitivo del próximo viaje de ESN. Tras dos horas de intensas negociaciones, acordaron suficiente focaccia para alimentar a toda la población Erasmus y unos 300 litros de Spritz.' } },
      { letter: 'B', clears: ['Elia', 'Mary'], code: 'SHOTS', text: {
        en: 'At 20:30, Elia and Mary were going from bar to bar, trying to convince local businesses to become ESN partners. After three hours of negotiations, they had secured zero partnerships, five free shots, and a promise from a bartender to “think about it.” Apparently, getting a discount for Erasmus students is harder than negotiating a hostage release.',
        it: 'Alle 20:30 Elia e Mary giravano di bar in bar per convincere i locali a diventare partner ESN. Dopo tre ore di trattative avevano ottenuto zero partnership, cinque shot gratis e la promessa di un barista di “pensarci”. A quanto pare, ottenere uno sconto per gli Erasmus è più difficile che negoziare il rilascio di un ostaggio.',
        es: 'A las 20:30, Elia y Mary iban de bar en bar intentando convencer a los locales de hacerse partners de ESN. Tras tres horas de negociaciones, habían conseguido cero acuerdos, cinco chupitos gratis y la promesa de un camarero de “pensárselo”. Al parecer, conseguir un descuento para Erasmus es más difícil que negociar la liberación de un rehén.' } },
      { letter: 'C', clears: ['Francesco'], code: 'RUNNING', text: {
        en: 'Francesco was testing the new route for the ESN Running Club at 20:30. His fitness tracker confirms he was running, and three exhausted Erasmus students who tried to keep up with him can confirm it.',
        it: "Alle 20:30 Francesco stava testando il nuovo percorso dell'ESN Running Club. Il suo fitness tracker conferma che stava correndo, e possono confermarlo anche tre Erasmus distrutti che hanno provato a stargli dietro.",
        es: 'A las 20:30, Francesco estaba probando la nueva ruta del ESN Running Club. Su pulsera de actividad confirma que estaba corriendo, y tres estudiantes Erasmus agotados que intentaron seguirle el ritmo pueden confirmarlo.' } },
      { letter: 'D', clears: ['Andrea'], code: 'TRAIN', text: {
        en: 'Andrea was picking up newly arrived Erasmus students at the train station at 20:30. Train station security cameras confirm it.',
        it: 'Alle 20:30 Andrea stava accogliendo in stazione gli Erasmus appena arrivati. Le telecamere della stazione lo confermano.',
        es: 'A las 20:30, Andrea estaba recogiendo en la estación de tren a estudiantes Erasmus recién llegados. Las cámaras de la estación lo confirman.' } },
      { letter: 'E', clears: ['Leo'], code: 'KEBAB', text: {
        en: "Leo was ordering eight kebabs at 20:30. The kebab shop's security cameras confirm he never left.",
        it: "Alle 20:30 Leo stava ordinando otto kebab. Le telecamere del kebabbaro confermano che non se n'è mai andato.",
        es: 'A las 20:30, Leo estaba pidiendo ocho kebabs. Las cámaras del local de kebab confirman que nunca se fue.' } },
    ],
  },
  {
    id: 4, culprits: 2,
    title: { en: 'The ESN Money Heist', it: 'La Casa di Carta ESN', es: 'La Casa de Papel de ESN' },
    short: { en: 'Money Heist', it: 'Casa di Carta', es: 'Casa de Papel' },
    crime: {
      en: "At exactly 00:13, someone broke into the ESN office and stole the association's money. But this was no ordinary robbery. The security cameras had been deliberately disabled, leaving absolutely no footage of the crime. One person knew how to hack the system. The other knew where the money was kept.",
      it: "Alle 00:13 in punto qualcuno si è introdotto nell'ufficio ESN e ha rubato i soldi dell'associazione. Ma non è stata una rapina qualunque. Le telecamere erano state disattivate di proposito, senza lasciare alcuna ripresa del crimine. Uno sapeva come hackerare il sistema. L'altro sapeva dove erano custoditi i soldi.",
      es: 'A las 00:13 en punto, alguien entró en la oficina de ESN y robó el dinero de la asociación. Pero no fue un robo cualquiera. Las cámaras de seguridad habían sido desactivadas a propósito, sin dejar ninguna grabación del crimen. Uno sabía cómo hackear el sistema. El otro sabía dónde se guardaba el dinero.',
    },
    clues: [
      { letter: 'A', clears: ['Sissi', 'Roberta'], code: 'DETECTIVE', text: {
        en: 'At 00:13, Sissi and Roberta were busy organizing the detective game for this Tandem Night. Witnesses confirm they spent hours inventing ridiculous crimes and suspicious alibis involving other ESN volunteers. Apparently, organizing a fake crime takes more effort than committing a real one.',
        it: 'Alle 00:13 Sissi e Roberta erano impegnate a organizzare il gioco investigativo di questa Tandem Night. I testimoni confermano che hanno passato ore a inventare crimini ridicoli e alibi sospetti per gli altri volontari ESN. A quanto pare, organizzare un crimine finto richiede più impegno che commetterne uno vero.',
        es: 'A las 00:13, Sissi y Roberta estaban ocupadas organizando el juego de detectives de esta Tandem Night. Los testigos confirman que pasaron horas inventando crímenes ridículos y coartadas sospechosas para otros voluntarios de ESN. Al parecer, organizar un crimen falso cuesta más que cometer uno de verdad.' } },
      { letter: 'B', clears: ['Davide', 'Vincenzo'], code: 'BARS', text: {
        en: 'Davide and Vincenzo were filming a freestyle rap video outside Ostello Bello at 00:13. They were still arguing about who had the better bars.',
        it: "Alle 00:13 Davide e Vincenzo stavano girando un video rap freestyle davanti all'Ostello Bello. Stavano ancora discutendo su chi avesse le barre migliori.",
        es: 'A las 00:13, Davide y Vincenzo estaban grabando un vídeo de rap freestyle frente al Ostello Bello. Seguían discutiendo sobre quién tenía las mejores barras.' } },
      { letter: 'C', clears: ['Francesco'], code: 'NIGHT BUS', text: {
        en: 'Francesco was travelling on a night bus at 00:13. The bus security cameras confirm it.',
        it: 'Alle 00:13 Francesco era su un autobus notturno. Le telecamere del bus lo confermano.',
        es: 'A las 00:13, Francesco viajaba en un autobús nocturno. Las cámaras del autobús lo confirman.' } },
      { letter: 'D', clears: ['Andrea'], code: 'TRANSFER', text: {
        en: 'Andrea was on a recorded fantacalcio call at 00:13, arguing over a transfer as if his life depended on it.',
        it: 'Alle 00:13 Andrea era in una call registrata del fantacalcio, a discutere di uno scambio come se ne dipendesse la sua vita.',
        es: 'A las 00:13, Andrea estaba en una videollamada grabada de fantacalcio, discutiendo un fichaje como si le fuera la vida en ello.' } },
      { letter: 'E', clears: ['Leo'], code: 'PIZZA', text: {
        en: "Leo was caught on the kebab shop's security cameras at 00:13, desperately asking if they could make him a pizza instead.",
        it: 'Alle 00:13 Leo è stato ripreso dalle telecamere del kebabbaro mentre chiedeva disperatamente se potessero fargli una pizza.',
        es: 'A las 00:13, las cámaras del local de kebab grabaron a Leo preguntando desesperadamente si podían hacerle una pizza.' } },
    ],
  },
];
