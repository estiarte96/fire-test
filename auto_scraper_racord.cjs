const fs = require('fs');
const https = require('https');
const path = require('path');

const host = 'api-main-4wnaifpjta-no.a.run.app';
const apiKey = 'JcnmApiTbon6uhfNjFzsvLQjUiXi';

const BASE_OUT = path.join(__dirname, 'preguntes racord girona');
const PER_TEMA_DIR = path.join(BASE_OUT, 'per_tema');

fs.mkdirSync(PER_TEMA_DIR, { recursive: true });

function graphqlReq(query, variables = {}, token = null) {
  const postData = JSON.stringify({ query, variables });
  return new Promise((resolve) => {
    const headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = https.request({
      hostname: host,
      path: '/graphql',
      method: 'POST',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: e.message, raw: data });
        }
      });
    });
    req.on('error', err => resolve({ error: err.message }));
    req.write(postData);
    req.end();
  });
}

// Mapeig exacte del temari de Ràcord Girona als 34 temes oficials de l'App (T01 - T34)
function mapRacordTitleToAppTheme(title) {
  const clean = title.trim();
  
  if (/Constituci[oó]|Estatut/i.test(clean)) return "T01 - CE i EAC";
  if (/personal al servei|Funci[oó] p[uú]blica/i.test(clean)) return "T02 - Funció pública";
  if (/Llei 5\/1994|Llei 4\/1997/i.test(clean)) return "T03 - Llei bombers i protecció civil";
  if (/Decret 276\/2016|Decret 12\/2023|Decret 16\/2026|SISCOM|organitzaci[oó]/i.test(clean)) return "T04 - Organització del cos de Bombers";
  if (/Llei 31\/1995|PRL|prevenci[oó] de riscos laborals/i.test(clean)) return "T05 - Prevenció de riscos laborals";
  if (/Llei 19\/2020|Llei 17\/2015|assetjament|igualtat/i.test(clean)) return "T06 - Igualtat de tracte i de gènere";
  if (/Llei 1\/1998|pol[ií]tica ling[uü][ií]stica/i.test(clean)) return "T07 - Política lingüística";
  if (/Teoria del foc/i.test(clean)) return "T08 - Teoria del foc i agents extintors";
  if (/F[ií]sica/i.test(clean)) return "T09 - Física";
  if (/Qu[ií]mica/i.test(clean)) return "T10 - Química";
  if (/Electricitat/i.test(clean)) return "T11 - Electricitat";
  if (/Instal·lacions|Instal.lacions/i.test(clean)) return "T12 - Instal·lacions";
  if (/Hidr[aà]ulica/i.test(clean)) return "T13 - Hidràulica";
  if (/Cartografia/i.test(clean)) return "T14 - Cartografia";
  if (/Construcci[oó]/i.test(clean)) return "T15 - Construcció";
  if (/Assist[eè]ncies t[eè]cniques/i.test(clean)) return "T16 - Assistències tècniques";
  if (/r[aà]dio|Comunicaciones per radio/i.test(clean)) return "T17 - Ràdio";
  if (/Vehicles d'intervenci[oó] en emerg[eè]ncies/i.test(clean)) return "T18 - Vehicles d'intervenció mecànica";
  if (/Conducci[oó] i mec[aà]nica|pesants/i.test(clean)) return "T19 - Mecànica i conducció de vehicles pesants";
  if (/EPI|Equips de protecci[oó] individual/i.test(clean)) return "T20 - Equips de protecció individual (EPI)";
  if (/gesti[oó] d’emerg[eè]ncies i el sistema de protecci[oó] civil/i.test(clean)) return "T21 - Gestió d'emergències i protecció civil";
  if (/Sistema de Comandament/i.test(clean)) return "T22 - Comandament operatiu i gestió de l'emergència";
  if (/Prevenci[oó] d'incendis b[aà]sica|Prevenci[oó] b[aà]sica d'incendis/i.test(clean)) return "T23 - Prevenció bàsica d'incendis";
  if (/incendis estructurals/i.test(clean)) return "T24 - Intervenció bàsica en incendis estructurals";
  if (/incendis forestals/i.test(clean)) return "T25 - Intervenció bàsica en incendis forestals";
  if (/incendis varis|incendis diversos/i.test(clean)) return "T26 - Intervenció bàsica en incendis varis";
  if (/NRBQ/i.test(clean)) return "T27 - Intervenció bàsica en riscos NRBQ";
  if (/assist[eè]ncia sanit[aà]ria|suport vital/i.test(clean)) return "T28 - Assistència sanitària";
  if (/m[uú]ltiples v[ií]ctimes/i.test(clean)) return "T29 - Incidents de múltiples víctimes";
  if (/estructures col·lapsades|col.lapsades/i.test(clean)) return "T30 - Estructures col·lapsades";
  if (/medi natural/i.test(clean)) return "T31 - Salvaments medi natural terrestre";
  if (/mobilitat vi[aà]ria|accidents/i.test(clean)) return "T32 - Accidents de mobilitat viària";
  if (/rescat urb[aà]|al[cç]ades/i.test(clean)) return "T33 - Intervenció bàsica en rescat urbà";
  if (/inundacions/i.test(clean)) return "T34 - Intervenció bàsica en inundacions";

  return clean;
}

async function scrape(email, password) {
  console.log('🚀 Connectant a Ràcord Girona API...');

  // 1. Registre Font
  const reg = await graphqlReq(`
    mutation {
      authRegisterSource(input: {
        client: "atleticoryctes.testgeneralitat.pro.rel",
        platform: ANDROID,
        language: CA,
        version: "3.1.0",
        pushToken: "push_token_device_firetest"
      }) {
        access_token
      }
    }
  `);
  const sourceToken = reg.data?.authRegisterSource?.access_token;
  console.log('✅ Font registrada.');

  // 2. Login
  console.log(`🔑 Autenticant usuari ${email}...`);
  const loginRes = await graphqlReq(`
    mutation Login($input: SignInInput!) {
      authSignIn(input: $input) {
        access_token
      }
    }
  `, {
    input: { email, password }
  }, sourceToken);

  const userToken = loginRes.data?.authSignIn?.access_token;
  if (!userToken) {
    console.error('❌ Error de login:', JSON.stringify(loginRes));
    return;
  }
  console.log('✅ Sessió iniciada amb èxit!');

  // 3. Llista de Temes (limit: 100 per obtenir els 34 temes complets)
  const subjectsRes = await graphqlReq(`
    query {
      subjectList(limit: 100) {
        id
        title
        children {
          id
          title
        }
      }
    }
  `, {}, userToken);

  const subjects = subjectsRes.data?.subjectList || [];
  console.log(`📚 S'han trobat ${subjects.length} temes a Ràcord Girona.`);

  const allQuestions = [];
  const seenStatements = new Set();
  const byTheme = {};
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  for (let i = 0; i < subjects.length; i++) {
    const subject = subjects[i];
    const themeName = mapRacordTitleToAppTheme(subject.title);
    console.log(`\n📂 [${i+1}/${subjects.length}] [${themeName}] Descarregant: ${subject.title}...`);

    try {
      await graphqlReq(`mutation { quizSessionFinish { id } }`, {}, userToken);

      const startRes = await graphqlReq(`
        mutation {
          quizSessionStart(input: {
            type: PRACTICE,
            subjectIds: ["${subject.id}"],
            allQuestions: true
          }) {
            id
            questionCount
          }
        }
      `, {}, userToken);

      const qCount = startRes.data?.quizSessionStart?.questionCount || 0;
      if (qCount === 0) {
        console.log(`   ⚠️ Sense preguntes disponibles.`);
        continue;
      }

      const finishRes = await graphqlReq(`
        mutation {
          quizSessionFinish {
            id
            questions {
              question {
                id
                title
                hint
                difficulty
              }
              answers {
                id
                title
              }
              correctAnswer {
                id
                title
              }
            }
          }
        }
      `, {}, userToken);

      const sessionQuestions = finishRes.data?.quizSessionFinish?.questions || [];
      console.log(`   ✅ Descarregades ${sessionQuestions.length} preguntes.`);

      let addedThemeCount = 0;
      for (const item of sessionQuestions) {
        const q = item.question;
        if (!q || !q.title) continue;

        const cleanStmt = q.title.trim().toLowerCase();
        if (seenStatements.has(cleanStmt)) continue;
        seenStatements.add(cleanStmt);

        const optionsObj = {};
        let correctLetter = 'A';
        const correctId = item.correctAnswer?.id;

        const answers = item.answers || [];
        answers.forEach((ans, idx) => {
          const letter = optionLetters[idx] || `Op_${idx + 1}`;
          optionsObj[letter] = ans.title ? ans.title.trim() : '';
          if (ans.id === correctId) {
            correctLetter = letter;
          }
        });

        let diff = 'Mitjà';
        if (q.difficulty === 'EASY') diff = 'Bàsic';
        if (q.difficulty === 'HARD') diff = 'Avançat';

        const qObj = {
          id: `racord_${q.id}`,
          statement: q.title.trim(),
          correct: correctLetter,
          explanation: q.hint ? q.hint.trim() : '',
          difficulty: diff,
          block: 'Bloc A',
          theme: themeName,
          section: subject.title,
          isSaved: 0,
          isAnswered: 0,
          options: optionsObj
        };

        allQuestions.push(qObj);
        if (!byTheme[themeName]) byTheme[themeName] = [];
        byTheme[themeName].push(qObj);
        addedThemeCount++;
      }
      console.log(`   ➕ ${addedThemeCount} preguntes úniques afegides.`);

    } catch (e) {
      console.error(`   ❌ Error al tema ${subject.title}:`, e.message);
    }

    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n============================================================`);
  console.log(`🎉 DESCÀRREGA DE RÀCORD GIRONA FINALITZADA!`);
  console.log(`📊 Total preguntes úniques descarregades: ${allQuestions.length}`);
  console.log(`============================================================\n`);

  // 1. Desar fitxer màster
  const masterPath = path.join(BASE_OUT, 'preguntes_racord_complet.json');
  fs.writeFileSync(masterPath, JSON.stringify(allQuestions, null, 2), 'utf8');
  console.log(`💾 Fitxer màster: ${masterPath}`);

  // 2. Desar per tema
  console.log('\n📂 Fitxers generats per tema:');
  for (const [theme, list] of Object.entries(byTheme)) {
    const safeName = theme.split(' - ')[0].replace(/[^a-zA-Z0-9_-]/g, '_') + '.json';
    const filePath = path.join(PER_TEMA_DIR, safeName);
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf8');
    console.log(`   • ${theme}: ${list.length} preguntes -> ${safeName}`);
  }
}

const email = process.argv[2] || "p.estiarte@gmail.com";
const password = process.argv[3] || "Dodita1996";

scrape(email, password);
