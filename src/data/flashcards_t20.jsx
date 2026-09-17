// Flashcards per al Tema 20 - Equips de Protecció Individual (EPI)
import React from 'react';

export const FLASHCARDS_T20 = [
  // ==========================================
  // BLOC 1: PICTOGRAMES DE MARCATGE D'EPI
  // ==========================================
  {
    id: 't20_pic_fred',
    category: 'pictogrames_marcatge',
    categoryName: '🏷️ Pictogrames de Marcatge',
    prompt: 'Quin risc o protecció identifica aquest pictograma de marcatge en un EPI?',
    imageSrc: '/images/flashcards/t20/pic_fred.png',
    titleFront: 'Pictograma de Marcatge',
    answer: 'Protecció davant del FRED',
    explanation: 'Mostra un escut amb una figura ramificada que representa un floc / cristall de gel hexagonal. S’aplica a guants, calçat i peces per a ambients freds.',
    keyPoints: [
      'Símbol: Cristall de gel / floc hexagonal ramificat.',
      'Funció: Aïllament i protecció tèrmica davant baixes temperatures o contacte amb fred.'
    ],
    hint: 'Té forma de cristall o floc de 6 puntes.'
  },
  {
    id: 't20_pic_quimic',
    category: 'pictogrames_marcatge',
    categoryName: '🏷️ Pictogrames de Marcatge',
    prompt: 'Quin risc o protecció identifica aquest pictograma de marcatge en un EPI?',
    imageSrc: '/images/flashcards/t20/pic_quimic.png',
    titleFront: 'Pictograma de Marcatge',
    answer: 'Protecció davant de PRODUCTES QUÍMICS',
    explanation: 'Mostra un escut amb un matràs Erlenmeyer de laboratori del qual emanen vapors/ones. Indica resistència química i impermeabilitat als agents indicats.',
    keyPoints: [
      'Símbol: Matràs de laboratori amb línies de vapor sortint.',
      'Funció: Barrera davant contacte, projeccions o immersió en químics.'
    ],
    hint: 'Recipient típic de laboratori químic.'
  },
  {
    id: 't20_pic_estatica',
    category: 'pictogrames_marcatge',
    categoryName: '🏷️ Pictogrames de Marcatge',
    prompt: 'Quin risc o protecció identifica aquest pictograma de marcatge en un EPI?',
    imageSrc: '/images/flashcards/t20/pic_estatica.png',
    titleFront: 'Pictograma de Marcatge',
    answer: "Protecció davant d'ELECTRICITAT ESTÀTICA (Antiestàtic)",
    explanation: 'Mostra un escut amb una línia en ziga-zaga (llamp) acabada en una esfera sobre una base horitzontal. Evita acumulació de càrregues electroestàtiques que puguin causar espurnes en atmosferes explosives (ATEX).',
    keyPoints: [
      'Símbol: Llamp en ziga-zaga amb una petita bola sobre una barra horitzontal.',
      'Funció: Propietats antiestàtiques per dissipar càrregues.'
    ],
    hint: 'Sembla un llamp que descarrega a terra.'
  },
  {
    id: 't20_pic_foc',
    category: 'pictogrames_marcatge',
    categoryName: '🏷️ Pictogrames de Marcatge',
    prompt: 'Quin risc o protecció identifica aquest pictograma de marcatge en un EPI?',
    imageSrc: '/images/flashcards/t20/pic_foc.png',
    titleFront: 'Pictograma de Marcatge',
    answer: 'Protecció davant de FOC I CALOR',
    explanation: 'Mostra un escut amb una flama viva sobre una base. Indica comportament ignífug, resistència a la propagació de flama, calor convectiva, calor radiant i contacte tèrmic.',
    keyPoints: [
      'Símbol: Flama viva dins l’escut.',
      'Funció: Resistent a flames i altes radiacions tèrmiques (EN 469, EN 15614, EN 659).'
    ],
    hint: 'Símbol universal del foc.'
  },
  {
    id: 't20_pic_radioactiu',
    category: 'pictogrames_marcatge',
    categoryName: '🏷️ Pictogrames de Marcatge',
    prompt: 'Quin risc o protecció identifica aquest pictograma de marcatge en un EPI?',
    imageSrc: '/images/flashcards/t20/pic_radioactiu.png',
    titleFront: 'Pictograma de Marcatge',
    answer: 'Protecció davant CONTAMINACIÓ PER PARTÍCULES RADIOACTIVES',
    explanation: 'Mostra un escut amb tres sectors circulars (trèvol radioactiu) al voltant d’un cercle central. Protegeix el cos evitant que la pols o líquids amb radioisòtops contactin amb la pell (no atura la radiació gamma directa).',
    keyPoints: [
      'Símbol: Trèvol de radiació (3 pales al voltant d’un cercle).',
      'Funció: Evitar la contaminació externa per partícules radioactives.'
    ],
    hint: 'El trèvol internacional de radioactivitat.'
  },
  {
    id: 't20_pic_biologic',
    category: 'pictogrames_marcatge',
    categoryName: '🏷️ Pictogrames de Marcatge',
    prompt: 'Quin risc o protecció identifica aquest pictograma de marcatge en un EPI?',
    imageSrc: '/images/flashcards/t20/pic_biologic.png',
    titleFront: 'Pictograma de Marcatge',
    answer: 'Protecció davant de MICROORGANISMES (Risc Biològic)',
    explanation: 'Mostra un escut amb tres formes corbades entrellaçades (símbol internacional de risc biològic). Protegeix davant bacteris, virus, fongs i fluids biològics.',
    keyPoints: [
      'Símbol: Tres anells/ganxos entrellaçats (Biohazard).',
      'Funció: Barrera biològica estanca a patògens transmesos per aire o fluids.'
    ],
    hint: 'Símbol de risc biològic / Biohazard.'
  },

  // ==========================================
  // BLOC 2: VESTITS QUÍMICS (TIPUS 1 AL 6)
  // ==========================================
  {
    id: 't20_suit_tipus1',
    category: 'vestits_quimics',
    categoryName: '☣️ Vestits Químics (Tipus 1-6)',
    prompt: 'A quin TIPUS de vestit químic correspon aquest pictograma i quines són les seves característiques clau?',
    imageSrc: '/images/flashcards/t20/tipus1_shield.png',
    suitImageSrc: '/images/flashcards/t20/tipus1_suit.png',
    titleFront: 'Vestit Químic: Pictograma i Tipus',
    answer: 'TIPUS 1: Hermètic a GASOS o VAPORS (Reutilitzable)',
    explanation: 'El pictograma mostra un núvol ondulat continu complet sense cap línia que el talli. És el nivell màxim d’estanquitat química.',
    keyPoints: [
      'Hermeticitat: Hermètic a GASOS o VAPORS.',
      'Reutilitzabilitat: REUTILITZABLE (després de descontaminació i prova de pressió).',
      'Aspecte: Granota completa tipus escafandre (verd/groc) amb ERA integrat a l’interior.'
    ],
    hint: 'Núvol complet sense cap línia que el talli.'
  },
  {
    id: 't20_suit_tipus2',
    category: 'vestits_quimics',
    categoryName: '☣️ Vestits Químics (Tipus 1-6)',
    prompt: 'A quin TIPUS de vestit químic correspon aquest pictograma i quina diferència té respecte al Tipus 1?',
    imageSrc: '/images/flashcards/t20/tipus2_shield.png',
    suitImageSrc: '/images/flashcards/t20/tipus2_suit.png',
    titleFront: 'Vestit Químic: Pictograma i Tipus',
    answer: 'TIPUS 2: No hermètic a gasos (Té punts penetrables) - Reutilitzable',
    explanation: 'El pictograma és com el de Tipus 1 però tallat per una línia transversal/horitzontal. Té un aspecte exterior igual al Tipus 1, però les seves costures no són completament estanques als gasos.',
    keyPoints: [
      'Hermeticitat: D’aspecte igual al Tipus 1, però NO és hermètic a gasos (té punts penetrables, costures no estanques).',
      'Reutilitzabilitat: REUTILITZABLE.',
      'Diferència visual pictograma: El núvol de vapor està travessat per una línia transversal.'
    ],
    hint: 'Núvol de vapor travessat per una línia transversal.'
  },
  {
    id: 't20_suit_tipus3',
    category: 'vestits_quimics',
    categoryName: '☣️ Vestits Químics (Tipus 1-6)',
    prompt: 'A quin TIPUS de vestit químic correspon aquest pictograma i quin tipus d’atac líquid suporta?',
    imageSrc: '/images/flashcards/t20/tipus3_shield.png',
    suitImageSrc: '/images/flashcards/t20/tipus3_suit.png',
    titleFront: 'Vestit Químic: Pictograma i Tipus',
    answer: 'TIPUS 3: Hermètic a LÍQUIDS APLICATS A PRESSIÓ (No reutilitzable)',
    explanation: 'El pictograma mostra un raig dirigit en diagonal amb gotes que impacten a pressió sobre una base horitzontal.',
    keyPoints: [
      'Hermeticitat: Hermètic a LÍQUIDS APLICATS A PRESSIÓ (raig continu a pressió).',
      'Reutilitzabilitat: NO REUTILITZABLE (D’un sol ús).',
      'Aspecte típic: Vestit groc amb costures vulcanitzades/estanques.'
    ],
    hint: 'Un raig en diagonal que impacta a pressió.'
  },
  {
    id: 't20_suit_tipus4',
    category: 'vestits_quimics',
    categoryName: '☣️ Vestits Químics (Tipus 1-6)',
    prompt: 'A quin TIPUS de vestit químic correspon aquest pictograma i quina és la seva aplicació?',
    imageSrc: '/images/flashcards/t20/tipus4_shield.png',
    suitImageSrc: '/images/flashcards/t20/tipus4_suit.png',
    titleFront: 'Vestit Químic: Pictograma i Tipus',
    answer: "TIPUS 4: Hermètic a líquids en forma d'ESPRAI / POLVORITZACIÓ (No reutilitzable)",
    explanation: 'El pictograma mostra un capçal ruixador superior que projecta una pluja fina en forma d’esprai cònic sobre la base.',
    keyPoints: [
      'Hermeticitat: Hermètic a líquids en forma d\'ESPRAI (ruixat, boira densa, pluja polvoritzada).',
      'Reutilitzabilitat: NO REUTILITZABLE (D’un sol ús).',
      'Aspecte típic: Granota blanca amb tires de segellat blaves a les costures.'
    ],
    hint: 'Una dutxa o ruixador dalt tirant esprai en ventall.'
  },
  {
    id: 't20_suit_tipus5',
    category: 'vestits_quimics',
    categoryName: '☣️ Vestits Químics (Tipus 1-6)',
    prompt: 'A quin TIPUS de vestit químic correspon aquest pictograma i davant de què protegeix?',
    imageSrc: '/images/flashcards/t20/tipus5_shield.png',
    suitImageSrc: '/images/flashcards/t20/tipus5_suit.png',
    titleFront: 'Vestit Químic: Pictograma i Tipus',
    answer: 'TIPUS 5: Hermètic a SÒLIDS PULVERULENTS / POLS (No reutilitzable)',
    explanation: 'El pictograma mostra nombroses partícules esfèriques (pols) que omplen la part superior de l’escut sobre una base horitzontal.',
    keyPoints: [
      'Hermeticitat: Hermètic a SÒLIDS PULVERULENTS (pols química, partícules fines en suspensió).',
      'Reutilitzabilitat: NO REUTILITZABLE (D’un sol ús).',
      'Aspecte típic: Granota blanca tipus Tyvek.'
    ],
    hint: 'Múltiples boletes/partícules de pols acumulades a dalt.'
  },
  {
    id: 't20_suit_tipus6',
    category: 'vestits_quimics',
    categoryName: '☣️ Vestits Químics (Tipus 1-6)',
    prompt: 'A quin TIPUS de vestit químic correspon aquest pictograma i quin nivell d’esquitxada suporta?',
    imageSrc: '/images/flashcards/t20/tipus6_shield.png',
    suitImageSrc: '/images/flashcards/t20/tipus6_suit.png',
    titleFront: 'Vestit Químic: Pictograma i Tipus',
    answer: "TIPUS 6: Hermètic a líquids en forma d'ESQUITXADES lleugeres (No reutilitzable)",
    explanation: 'El pictograma mostra un recipient/matràs abocant un líquid que genera esquitxades a la part inferior de l’escut.',
    keyPoints: [
      'Hermeticitat: Hermètic a líquids en forma d\'ESQUITXADES (esquitxades lleugeres sense pressió).',
      'Reutilitzabilitat: NO REUTILITZABLE (D’un sol ús).',
      'Nivell: És el nivell químic més bàsic (Tipus 6).'
    ],
    hint: 'Un matràs abocant líquid que fa esquitxades a baix.'
  },

  // ==========================================
  // BLOC 3: ERA & VALORS NUMÈRICS CRÍTICS
  // ==========================================
  {
    id: 't20_num_era_pressio_carrega',
    category: 'numeros_era',
    categoryName: '🔢 Valors Numèrics & ERA',
    prompt: "A quina PRESSIÓ NOMINAL de càrrega treballen habitualment les ampolles d'ERA de composite/acer a Bombers?",
    titleFront: 'Pressió de Càrrega ERA',
    answer: '300 BAR (o 30 MPa)',
    explanation: 'Les ampolles modernes de composite (fibra de carboni) es carreguen a 300 bar de pressió de servei, emmagatzemant un volum enorme d’aire comprimit.',
    keyPoints: [
      'Pressió de càrrega: 300 bar.',
      'Càlcul d’aire disponible: Volum geomètric (L) × Pressió (bar). Ex: 6.8 L × 300 bar ≈ 2.040 Litres d\'aire.'
    ],
    hint: 'El triple de 100 bar.'
  },
  {
    id: 't20_num_era_pressio_alarma',
    category: 'numeros_era',
    categoryName: '🔢 Valors Numèrics & ERA',
    prompt: "A quina PRESSIÓ salta l'alarma acústica / reserva de seguretat d'un ERA?",
    titleFront: 'Alarma de Reserva ERA',
    answer: "50 - 55 BAR (aprox. 20% d'aire restant)",
    explanation: 'El xiulet d’alarma acústica integrada al manòmetre o reductor s’activa automàticament quan la pressió descendeix a 50-55 bar.',
    keyPoints: [
      'Pressió d\'alarma: 50 a 55 bar.',
      'Significat: S’ha d’iniciar la retirada immediata (la reserva és NOMÉS per a l\'evacuació i emergència, mai per seguir treballant).'
    ],
    hint: 'Entre 50 i 60 bar.'
  },
  {
    id: 't20_num_era_mitja_pressio',
    category: 'numeros_era',
    categoryName: '🔢 Valors Numèrics & ERA',
    prompt: "A quina pressió intermèdia redueix l'aire el MANOREDUCTOR (reductor de 1a etapa) de l'ERA?",
    titleFront: 'Mitja Pressió (Manoreductor)',
    answer: '6 a 10 BAR (Mitja Pressió)',
    explanation: 'El reductor principal redueix l’alta pressió de l’ampolla (300 bar) a un circuit intermedi de mitja pressió de 6 a 10 bar (habitualment 7-9 bar) que arriba al pulmoautomàtic mitjançant el flexible.',
    keyPoints: [
      'Reductor 1a etapa: Redueix de 300 bar a 6-10 bar.',
      'Vàlvula de seguretat del reductor: Salta si la mitja pressió supera els 11-13 bar.'
    ],
    hint: 'Pressió semblant a la d’una línia d’aigua urbana o pneumàtica (6-10 bar).'
  },
  {
    id: 't20_num_era_sobrepressio_mascara',
    category: 'numeros_era',
    categoryName: '🔢 Valors Numèrics & ERA',
    prompt: "Quina sobrepressió positiva manté la vàlvula a demanda (pulmoautomàtic) dins la màscara facial de l'ERA?",
    titleFront: 'Sobrepressió a la Màscara',
    answer: '+2 a +4 mbar (aprox. +3,5 mbar / +300 Pa)',
    explanation: 'L’interior de la màscara manté una lleugera pressió positiva (+2 a +4 mil·libars superior a la pressió atmosfèrica exterior) perquè, en cas de desajust lleu o moviment facial, l’aire surti cap enfora i mai entri fum o gas tòxic.',
    keyPoints: [
      'Valor: +2 a +4 mbar (+200 a +400 Pa).',
      'Objectiu: Evitar qualsevol infiltració de fums o gasos tòxics a l’interior del visor.'
    ],
    hint: 'Un valor molt petit en mil·libars (mbar).'
  },
  {
    id: 't20_num_era_formula_autonomia',
    category: 'numeros_era',
    categoryName: '🔢 Valors Numèrics & ERA',
    prompt: "Quina és la FÓRMULA de càlcul de l'autonomia de treball amb ERA restant?",
    titleFront: "Fórmula d'Autonomia ERA",
    answer: 'Temps (min) = [(P_actual - 50 bar) × V_ampolla (L)] / Consum_mitjà (L/min)',
    explanation: 'Es resta la reserva de seguretat (50 bar) a la pressió llegida al manòmetre, es multiplica pel volum de l’ampolla i es divideix pel consum estimat del bomber (normalment 40 L/min en esforç moderat/alt).',
    keyPoints: [
      'Aire útil de treball: (Pressió actual - 50 bar) × Capacitat ampolla.',
      'Consum estàndard bomber en intervenció: ~40 L/min (en repòs ~10-15 L/min, en esforç màxim >60-80 L/min).'
    ],
    hint: 'Resta sempre els 50 bar de seguretat abans de dividir pel consum.'
  },
  {
    id: 't20_num_ampolles_capacitat',
    category: 'numeros_era',
    categoryName: '🔢 Valors Numèrics & ERA',
    prompt: "Una ampolla de composite de 6,8 L a 300 bar, quants LITRES D'AIRE total conté i quant d'aire útil té (descomptant 50 bar de reserva)?",
    titleFront: "Càlcul d'Aire Ampolla 6,8 L",
    answer: "Total: 2.040 L d'aire | Aire útil: 1.700 L d'aire",
    explanation: 'Total aire = 6,8 L × 300 bar = 2.040 Litres. Aire útil (treball abans de xiulet) = 6,8 L × (300 - 50) = 6,8 × 250 = 1.700 Litres (~42,5 minuts a 40 L/min).',
    keyPoints: [
      'Aire total: 6,8 × 300 = 2.040 L.',
      'Aire útil (sense reserva): 6,8 × 250 = 1.700 L.',
      'Autonomia de treball estimada: 1.700 / 40 = 42,5 minuts.'
    ],
    hint: 'Multiplica 6,8 per 300 i per 250.'
  },

  // ==========================================
  // BLOC 4: CATEGORIES D'EPI, BOTES I NORMES EN
  // ==========================================
  {
    id: 't20_cat_epis_classificacio',
    category: 'normes_categories',
    categoryName: '📜 Categories, Botes & Normes EN',
    prompt: "Quines són les 3 CATEGORIES d'EPI segons el Reglament UE i quins riscos cobreixen?",
    titleFront: 'Classificació Categories EPI (I, II, III)',
    answer: 'Cat I: Risc Mínim | Cat II: Risc Intermedi | Cat III: Risc Mortal / Irreversible',
    explanation: 'Categoria I són riscos lleus (autocertificació fabricant). Categoria II riscos generals no mortals (assaig tipus per organisme notificat). Categoria III protegeix davant la mort o danys irreversibles a la salut (control periòdic de fabricació).',
    keyPoints: [
      'Categoria I: Risc mínim (guants de jardineria, ulleres de sol).',
      'Categoria II: Risc intermedi (casc d\'obra, calçat de seguretat, protecció auditiva, guants mecànics).',
      'Categoria III: Risc greu/mortal (ERA, vestits químics Tipus 1-6, foc estructural EN 469, arnès anticaigudes).'
    ],
    hint: 'Va de menor a major gravetat (mínim, intermedi, mortal).'
  },
  {
    id: 't20_botes_marcatge_fpa',
    category: 'normes_categories',
    categoryName: '📜 Categories, Botes & Normes EN',
    prompt: 'En el calçat de bombers segons EN 15090, què signifiquen els codis de marcatge F, P i A?',
    titleFront: 'Marcatge Calçat: F, P, A',
    answer: 'F: Foc (Flama) | P: Plantilla antiperforació | A: Antiestàtica',
    explanation: 'Són els 3 requisits fonamentals del calçat de bombers d’intervenció.',
    keyPoints: [
      'F: Resistència al FOC i a la calor.',
      'P: Resistència a la PERFORACIÓ de la sola (làmina d’acer o composite antiperforant).',
      'A: Calçat ANTIESTÀTIC (dissipació de càrregues elèctriques).'
    ],
    hint: 'Inicials de Foc, Perforació i Antiestàtica.'
  },
  {
    id: 't20_botes_altres_codis',
    category: 'normes_categories',
    categoryName: '📜 Categories, Botes & Normes EN',
    prompt: 'En les botes de bombers, què signifiquen els codis complementaris CI, HI, WR i CR?',
    titleFront: 'Codis Calçat: CI, HI, WR, CR',
    answer: 'CI: Fred (Cold) | HI: Calor (Heat) | WR: Aigua (Water) | CR: Tall (Cut)',
    explanation: 'Són aïllaments i resistències específiques: CI = Cold Insulation (aïllament contra el fred), HI = Heat Insulation (aïllament contra la calor), WR = Water Resistant (resistència a la penetració d’aigua), CR = Cut Resistance (resistència al tall per serres).',
    keyPoints: [
      'CI: Cold Insulation (Aïllament fred).',
      'HI: Heat Insulation (Aïllament calor: HI1, HI2, HI3).',
      'WR: Water Resistant (Estanquitat a l’aigua).',
      'CR: Cut Resistance (Resistència al tall).'
    ],
    hint: 'Són les sigles en anglès (Cold, Heat, Water, Cut).'
  },
  {
    id: 't20_norma_en_469',
    category: 'normes_categories',
    categoryName: '📜 Categories, Botes & Normes EN',
    prompt: 'Quina NORMA EN regula la roba de protecció per a bombers en INCENDIS ESTRUCTURALS (EPI Pesant)?',
    titleFront: 'Norma Roba Incendis Estructurals',
    answer: 'UNE-EN 469',
    explanation: 'La norma EN 469 estableix els requisits d’assaig per a jaquetó i sobrepantaló d’intervenció en foc estructural (nivells Xf, Xr per a calor convectiva/radiant, Y per a impermeabilitat i Z per a resistència al vapor).',
    keyPoints: [
      'Norma: UNE-EN 469.',
      'Objecte: Roba de protecció per a la lluita contra el foc en estructures (EPI Pesant).'
    ],
    hint: 'Número de 3 xifres començat per 4 (4-6-9).'
  },
  {
    id: 't20_norma_en_15614',
    category: 'normes_categories',
    categoryName: '📜 Categories, Botes & Normes EN',
    prompt: "Quina NORMA EN regula la roba de protecció per a INCENDIS FORESTALS i rescats a l'exterior (EPI Lleuger)?",
    titleFront: 'Norma Roba Incendis Forestals',
    answer: 'UNE-EN 15614 (o EN ISO 15384)',
    explanation: 'La norma EN 15614 regula el vestit d’intervenció forestal (jaqueta i pantaló lleuger, monocapa o bicapa) per a foc a camp obert, assistències tècniques i rescats exteriors.',
    keyPoints: [
      'Norma: UNE-EN 15614.',
      'Objecte: Roba per a incendis forestals i tasques associades.'
    ],
    hint: '15-6-14.'
  },
  {
    id: 't20_norma_en_137_136',
    category: 'normes_categories',
    categoryName: '📜 Categories, Botes & Normes EN',
    prompt: "Quina norma regula els EQUIPS ERA de circuit obert i quina norma regula les MÀSCARES FACIALS?",
    titleFront: 'Normes ERA i Màscara Facial',
    answer: 'EN 137 (ERA) | EN 136 (Màscara Facial Completa)',
    explanation: 'La norma EN 137 regula els equips de protecció respiratòria autònoms de circuit obert d’aire comprimit (Tipus 2 per a bombers). La norma EN 136 regula les màscares facials completes (Classe 3 per a bombers).',
    keyPoints: [
      'EN 137: Aparells de respiració autònoms de circuit obert (ERA).',
      'EN 136: Màscares completes (Classe 3: ús intensiu per bombers).'
    ],
    hint: 'EN 137 per l’equip complet i EN 136 per la màscara.'
  },
  {
    id: 't20_norma_en_cascs_443_16471',
    category: 'normes_categories',
    categoryName: '📜 Categories, Botes & Normes EN',
    prompt: "Quines normes regulen el casc d'intervenció pesant F1 (estructural) i el casc lleuger F2 (forestal/tècnic)?",
    titleFront: 'Normes Cascs F1 i F2',
    answer: 'EN 443 (Casc F1 Estructural) | EN 16471 / EN 16473 (Casc F2 Forestal i Rescat)',
    explanation: 'El casc integral F1 d’edificis es regeix per la norma EN 443. El casc F2 per a foc forestal per l’EN 16471 i per a rescats tècnics per l’EN 16473.',
    keyPoints: [
      'EN 443: Cascs per a la lluita contra el foc en edificis i altres estructures (Casc F1).',
      'EN 16471: Cascs per a incendis forestals.',
      'EN 16473: Cascs per a rescats tècnics.'
    ],
    hint: 'EN 443 per a F1 i sèrie 1647x per a forestal/rescat.'
  }
];

export const PictogramIcons = {};
