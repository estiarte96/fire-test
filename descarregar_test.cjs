const fs = require('fs');
const https = require('https');
const path = require('path');

// Mapeig de categories a temes oficials
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

async function descarregarIProcessar(inputFile, outputFile = 'noves_preguntes_resoltes.json') {
  console.log(`Llegint preguntes des de ${inputFile}...`);
  let content = fs.readFileSync(inputFile, 'utf8');
  let rawQuestions = [];

  try {
    const parsed = JSON.parse(content);
    rawQuestions = parsed.questions || (parsed.data && parsed.data.questions) || (Array.isArray(parsed) ? parsed : []);
  } catch (e) {
    // Si és text pla tipus mespreguntes.md
    const lines = content.split('\n');
    let currentQ = null;
    let currentAnswer = null;
    let inAnswerList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.match(/^\d+$/) && lines[i+1]?.trim() === ":" && lines[i+2]?.trim().startsWith("{question_id:")) {
        if (currentQ) rawQuestions.push(currentQ);
        currentQ = { index: parseInt(line), answerList: [] };
        inAnswerList = false;
        currentAnswer = null;
        continue;
      }
      if (!currentQ) continue;
      if (line === "answerList" && lines[i+1]?.trim() === ":") { inAnswerList = true; continue; }
      if (inAnswerList && line.match(/^\d+$/) && lines[i+1]?.trim() === ":" && lines[i+2]?.trim().startsWith("{answer_id:")) {
        currentAnswer = {};
        currentQ.answerList.push(currentAnswer);
        continue;
      }
      if (line === "answer_desc" && lines[i+1]?.trim() === ":") {
        let val = lines[i+2]?.trim() || "";
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (currentAnswer) currentAnswer.answer_desc = val;
        continue;
      }
      if (line === "answer_id" && lines[i+1]?.trim() === ":") {
        let val = lines[i+2]?.trim() || "";
        if (currentAnswer) currentAnswer.answer_id = parseInt(val);
        continue;
      }
      if (line === "category_desc" && lines[i+1]?.trim() === ":") {
        let val = lines[i+2]?.trim() || "";
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        currentQ.category_desc = val;
        inAnswerList = false;
        continue;
      }
      if (line === "topic_desc" && lines[i+1]?.trim() === ":") {
        let val = lines[i+2]?.trim() || "";
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        currentQ.topic_desc = val;
        continue;
      }
      if (line === "question_desc" && lines[i+1]?.trim() === ":") {
        let val = lines[i+2]?.trim() || "";
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        currentQ.question_desc = val;
        continue;
      }
      if (line === "question_id" && lines[i+1]?.trim() === ":") {
        let val = lines[i+2]?.trim() || "";
        currentQ.question_id = parseInt(val);
        continue;
      }
      if (line === "difficulty" && lines[i+1]?.trim() === ":") {
        let val = lines[i+2]?.trim() || "";
        currentQ.difficulty = parseInt(val);
        continue;
      }
    }
    if (currentQ) rawQuestions.push(currentQ);
  }

  console.log(`Trobades ${rawQuestions.length} preguntes.`);
  if (rawQuestions.length === 0) return;

  // Desa a un JSON net
  fs.writeFileSync(outputFile, JSON.stringify(rawQuestions, null, 2), 'utf8');
  console.log(`✅ Preguntes guardades correctament a ${outputFile}`);
}

module.exports = { descarregarIProcessar };
