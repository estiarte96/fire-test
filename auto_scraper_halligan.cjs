const fs = require('fs');
const https = require('https');
const path = require('path');

let token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3ODk1Mzc0NTYsImV4cCI6MTc4OTUzODM1Niwic2Vzc2lvbl9pZCI6ImU1NWI4ODZiMjM4YTM1YTk1ZWI3YTMzZDhhZmNhZDQwIiwidXNlcl9pZCI6MTAzMn0.z8jQrUH_K-hFdlxt5rowsxwb45cd6pR4aWxwP2Tl2kw";
const cookies = "g_state={\"i_l\":0,\"i_ll\":1789189281094,\"i_e\":{\"enable_itp_optimization\":24},\"i_et\":1789189281094}; token=a16d9c5751450a646ae7de38b9963b5dcb40dcc14cdf3851e956b1f37524ecfd0f845ac43e7bf5324ef2ab4113be0195f7b18a3b83a97d277634ef7ee08ebe14; PHPSESSID=3d6b614a0e59f915c96027c5760e3472";

const jsonPath = path.join(__dirname, 'public', 'preguntes.json');
let existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const existingIds = new Set(existing.map(q => q.id));
const existingStmts = new Set(existing.map(q => q.statement.trim().toLowerCase()));

console.log(`📦 Base de dades inicial: ${existing.length} preguntes.`);

const categoryToTheme = {
  "Intervenció bàsica en estructures col·lapsades": "T30 - Estructures col·lapsades",
  "Legislació: Funció pública": "T02 - Funció pública",
  "Legislació: Organització Bombers": "T04 - Organització del cos de Bombers",
  "Física": "T09 - Física",
  "Instal·lacions": "T16 - Instal·lacions",
  "Cartografia i orientació": "T08 - Cartografia i orientació",
  "Química": "T10 - Química",
  "Vehicles d'intervenció en emergències": "T18 - Vehicles d'intervenció mecànica",
  "Intervenció bàsica en salvaments al medi natural terrestre": "T29 - Salvament medi natural",
  "Legislació: Bombers i protecció civil": "T03 - Llei bombers i protecció civil",
  "Intervenció bàsica en incendis diversos": "T26 - Intervenció bàsica en incendis varis",
  "Construcció": "T15 - Construcció",
  "Intervenció bàsica en assistència sanitària": "T33 - Suport vital i atenció sanitària",
  "Intervenció bàsica en incidents de múltiples víctimes": "T34 - Incidents de múltiples víctimes",
  "Electricitat": "T11 - Electricitat",
  "Teoria del foc i agents extintors": "T13 - Teoria del foc",
  "Introducció a la gestió d’emergències i al sistema de protecció civil": "T07 - Protecció civil",
  "Legislació: Igualtat": "T06 - Igualtat de tracte i de gènere",
  "Hidràulica i bombes": "T14 - Hidràulica i bombes",
  "Comunicacions per ràdio": "T17 - Ràdio",
  "Intervenció bàsica en inundacions": "T31 - Inundacions",
  "Intervenció bàsica en incendis forestals": "T25 - Intervenció bàsica en incendis forestals",
  "Intervenció bàsica en accidents de mobilitat viària": "T32 - Accidents de mobilitat viària",
  "Principis i característiques del sistema de comandament del Cos de Bombers": "T05 - Sistema de comandament",
  "Intervenció bàsica en rescat urbà": "T28 - Rescat urbà i alçades",
  "Intervenció bàsica en incendis estructurals": "T24 - Intervenció bàsica en incendis estructurals",
  "Intervenció bàsica en riscos NRBQ": "T27 - Intervenció bàsica en riscos NRBQ",
  "Legislació: Constitució i Estatut": "T01 - CE i EAC",
  "Prevenció bàsica d'incendis": "T23 - Prevenció bàsica d'incendis",
  "Intervenció en assistències tècniques": "T30 - Assistències tècniques",
  "Equips de protecció individual d’intervenció en emergències": "T20 - Equips de protecció individual (EPI)"
};

const diffMap = { 1: "Bàsic", 2: "Mitjà", 3: "Avançat" };

function request(action, payload) {
  return new Promise(resolve => {
    const postData = JSON.stringify(payload);
    const req = https.request(`https://app.halligan.cat/api/api.php?action=${action}`, {
      method: "POST",
      headers: {
        "accept": "application/json, text/plain, */*",
        "authorization": `Bearer ${token}`,
        "content-type": "application/json",
        "cookie": cookies,
        "origin": "https://app.halligan.cat",
        "referer": "https://app.halligan.cat/runTest",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36"
      }
    }, res => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => {
        try {
          const j = JSON.parse(d);
          if (j.accessToken) token = j.accessToken;
          resolve(j);
        } catch(e) {
          resolve(null);
        }
      });
    });
    req.on("error", () => resolve(null));
    req.write(postData);
    req.end();
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const TOTAL_TESTS = 100; // 100 tests x 25 preguntes = 2.500 preguntes consultades
  let totalNewAdded = 0;

  console.log(`🚀 Iniciant extracció de 100 tests (objectiu: 2.500 preguntes analitzades)...`);

  for (let t = 1; t <= TOTAL_TESTS; t++) {
    process.stdout.write(`\n[Test ${t}/${TOTAL_TESTS}] Generant test... `);
    
    const testRes = await request("runtest", {
      action: "NEW",
      categoryGroup: 0,
      category: 0,
      categories: [],
      topic: 0,
      topics: [],
      level: 0,
      questions: 25,
      type: "G",
      originId: 0,
      onlyOfficial: false,
      mode: "practice",
      timed: false,
      secondsPerQuestion: 60
    });

    if (!testRes || testRes.status !== "OK" || !testRes.data?.questions) {
      console.log(`❌ Error generant test: ${testRes?.message || 'Sense resposta'}`);
      await sleep(1000);
      continue;
    }

    const testId = testRes.data.test.id;
    const testHash = testRes.data.test.hash;
    const questions = testRes.data.questions;
    console.log(`Test #${testId} (${questions.length} preguntes). Resolent...`);

    let newInThisTest = 0;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const normStmt = (q.question_desc || "").trim().toLowerCase();

      // Si ja la tenim, no cal demanar la solució per estalviar crides
      if (existingIds.has(q.question_id) || existingStmts.has(normStmt)) {
        continue;
      }

      // Demanar solució oficial
      const ans = await request("question-test-select", {
        question: {
          question_id: q.question_id,
          selected_answer_id: q.answerList[0]?.answer_id
        },
        test: {
          id: String(testId),
          type: "G",
          hash: testHash,
          mode: "practice",
          is_timed: false,
          seconds_per_question: 60
        }
      });

      const correctAnsId = ans?.data?.correct_answer_id;
      const letterMap = ["A", "B", "C", "D"];
      let correctLetter = "A";

      if (correctAnsId) {
        const correctIdx = q.answerList.findIndex(a => a.answer_id === correctAnsId);
        if (correctIdx !== -1) correctLetter = letterMap[correctIdx];
      }

      const optionsObj = {};
      q.answerList.forEach((a, idx) => {
        if (idx < 4) optionsObj[letterMap[idx]] = a.answer_desc;
      });

      const formatted = {
        id: q.question_id,
        statement: q.question_desc,
        correct: correctLetter,
        explanation: ans?.data?.question_solution_desc || (ans?.data?.question_solution_source ? `Font: ${ans.data.question_solution_source}` : "Sense explicació."),
        difficulty: diffMap[q.difficulty] || "Mitjà",
        block: "Bloc B",
        theme: categoryToTheme[q.category_desc] || q.category_desc || "General",
        section: q.topic_desc || q.category_desc || "",
        isSaved: 0,
        isAnswered: 0,
        options: optionsObj
      };

      existing.push(formatted);
      existingIds.add(q.question_id);
      existingStmts.add(normStmt);
      newInThisTest++;
      totalNewAdded++;

      await sleep(60);
    }

    console.log(`   ➕ Noves afegides: +${newInThisTest} (Total acumulat noves: ${totalNewAdded}, Total dataset: ${existing.length})`);

    // Desa cada 5 tests per seguretat
    if (t % 5 === 0 || t === TOTAL_TESTS) {
      fs.writeFileSync(jsonPath, JSON.stringify(existing, null, 2), 'utf8');
      console.log(`   💾 Progresso desat a preguntes.json!`);
    }

    await sleep(200);
  }

  fs.writeFileSync(jsonPath, JSON.stringify(existing, null, 2), 'utf8');
  console.log(`\n🎉 COMPLETAT! S'han afegit ${totalNewAdded} preguntes noves a public/preguntes.json.`);
  console.log(`Total final a la teva app: ${existing.length} preguntes.`);
}

main();
