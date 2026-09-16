const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'Preguntes optim');
const ankiDir = path.join(baseDir, 'anki_csv');
const htmlDir = path.join(baseDir, 'html_repas');

fs.mkdirSync(baseDir, { recursive: true });
fs.mkdirSync(ankiDir, { recursive: true });
fs.mkdirSync(htmlDir, { recursive: true });

const questions = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'preguntes.json'), 'utf8'));
const themes = [...new Set(questions.map(q => q.theme))].filter(Boolean).sort();

function cleanFilename(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/·/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeCsvField(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  return `"${str.replace(/"/g, '""')}"`;
}

// 1. GENERATE ANKI CSVs
const allAnkiRows = [['Front', 'Back', 'Tag', 'ID']];

themes.forEach(theme => {
  const themeQuestions = questions.filter(q => q.theme === theme);
  const themeAnkiRows = [['Front', 'Back', 'Tag', 'ID']];
  const tag = cleanFilename(theme);

  themeQuestions.forEach((q, idx) => {
    let frontHtml = `<div style="text-align: left; font-family: -apple-system, sans-serif;">`;
    frontHtml += `<div style="font-size: 11px; color: #888; margin-bottom: 6px;">[${q.theme}] Pregunta ${idx + 1}</div>`;
    frontHtml += `<div style="font-weight: bold; font-size: 16px; margin-bottom: 14px; line-height: 1.4;">${q.statement}</div>`;
    frontHtml += `<div style="font-size: 14px; line-height: 1.6;">`;
    ['A', 'B', 'C', 'D'].forEach(opt => {
      if (q.options && q.options[opt]) {
        frontHtml += `<div style="padding: 5px 0;"><b>${opt})</b> ${q.options[opt]}</div>`;
      }
    });
    frontHtml += `</div></div>`;

    const correctLetter = q.correct || '';
    const correctText = (q.options && q.options[correctLetter]) ? q.options[correctLetter] : '';
    let backHtml = `<div style="text-align: left; font-family: -apple-system, sans-serif;">`;
    backHtml += `<div style="font-weight: bold; font-size: 16px; color: #10b981; margin-bottom: 8px;">✓ Resposta Correcta: ${correctLetter}</div>`;
    backHtml += `<div style="font-size: 14px; margin-bottom: 12px; padding: 10px; background: rgba(16,185,129,0.1); border-radius: 6px; border-left: 4px solid #10b981;">${correctLetter}) ${correctText}</div>`;
    if (q.explanation && q.explanation !== 'Sense explicació.') {
      backHtml += `<hr style="border: 0; border-top: 1px solid #ddd; margin: 12px 0;">`;
      backHtml += `<div style="font-size: 13px; color: #444; line-height: 1.4;"><b style="color: #111;">Explicació:</b> ${q.explanation}</div>`;
    }
    backHtml += `</div>`;

    const row = [frontHtml, backHtml, tag, String(q.id)];
    themeAnkiRows.push(row);
    allAnkiRows.push(row);
  });

  const csvContent = themeAnkiRows.map(r => r.map(escapeCsvField).join(',')).join('\n');
  fs.writeFileSync(path.join(ankiDir, `${cleanFilename(theme)}.csv`), '\ufeff' + csvContent, 'utf8');
});

// Master Anki CSV
const masterCsvContent = allAnkiRows.map(r => r.map(escapeCsvField).join(',')).join('\n');
fs.writeFileSync(path.join(ankiDir, `00_TOTES_LES_PREGUNTES_ANKI.csv`), '\ufeff' + masterCsvContent, 'utf8');

// Common CSS
const htmlStyles = `
  :root {
    --bg: #0f172a;
    --card: #1e293b;
    --card-border: rgba(255, 255, 255, 0.08);
    --text: #f8fafc;
    --text-muted: #94a3b8;
    --primary: #3b82f6;
    --primary-hover: #2563eb;
    --success: #10b981;
    --error: #ef4444;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body { background: var(--bg); color: var(--text); padding: 30px 20px; line-height: 1.5; }
  .container { max-width: 960px; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 24px; padding: 26px; background: var(--card); border-radius: 16px; border: 1px solid var(--card-border); }
  .header h1 { font-size: 24px; margin-bottom: 8px; color: #fff; }
  .header p { color: var(--text-muted); font-size: 14px; }
  .controls { display: flex; gap: 10px; justify-content: center; margin-top: 18px; flex-wrap: wrap; }
  .btn { padding: 10px 18px; border-radius: 10px; border: none; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 13px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
  .btn-primary { background: var(--primary); color: white; }
  .btn-primary:hover { background: var(--primary-hover); }
  .btn-secondary { background: rgba(255,255,255,0.08); color: white; border: 1px solid var(--card-border); }
  .btn-secondary:hover { background: rgba(255,255,255,0.15); }
  .q-card { background: var(--card); border-radius: 14px; padding: 20px; margin-bottom: 18px; border: 1px solid var(--card-border); transition: border 0.2s ease; }
  .q-meta { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted); margin-bottom: 10px; }
  .q-statement { font-size: 15px; font-weight: 600; margin-bottom: 14px; line-height: 1.4; }
  .options-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
  .option { padding: 10px 14px; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); font-size: 14px; display: flex; gap: 10px; align-items: flex-start; cursor: pointer; user-select: none; transition: all 0.15s; }
  .option:hover { background: rgba(255,255,255,0.07); }
  .option.correct { background: rgba(16, 185, 129, 0.18) !important; border-color: var(--success) !important; color: #34d399 !important; font-weight: 600; }
  .option.wrong { background: rgba(239, 68, 68, 0.18) !important; border-color: var(--error) !important; color: #f87171 !important; }
  .solution-box { margin-top: 12px; padding: 14px; border-radius: 10px; background: rgba(0,0,0,0.25); border-left: 4px solid var(--primary); font-size: 13px; display: none; }
  .solution-box.visible { display: block; }
  .explanation-text { color: var(--text-muted); margin-top: 6px; line-height: 1.4; }
  .toggle-sol-btn { padding: 5px 12px; border-radius: 6px; background: rgba(59, 130, 246, 0.15); color: var(--primary); border: 1px solid rgba(59, 130, 246, 0.3); font-size: 12px; font-weight: 600; cursor: pointer; }
  
  @media print {
    body { background: white !important; color: black !important; padding: 0 !important; font-size: 12px !important; }
    .header, .controls, .print-hide { display: none !important; }
    .q-card { border: none !important; background: transparent !important; page-break-inside: avoid; margin-bottom: 16px !important; padding: 0 !important; color: black !important; }
    .option { border: none !important; background: transparent !important; padding: 2px 0 !important; color: black !important; }
    .option.correct { color: #047857 !important; font-weight: bold !important; }
    .option.wrong { color: #b91c1c !important; }
    .solution-box { display: block !important; background: #f8fafc !important; border-left: 3px solid #047857 !important; color: black !important; }
    .explanation-text { color: #334155 !important; }
  }
`;

// 2. GENERATE INDIVIDUAL HTML FOR EACH THEME
themes.forEach(theme => {
  const themeQuestions = questions.filter(q => q.theme === theme);
  const themeTitle = escapeHtml(theme);
  
  let cardsHtml = '';
  themeQuestions.forEach((q, idx) => {
    const qNum = idx + 1;
    let optsHtml = '';
    ['A', 'B', 'C', 'D'].forEach(opt => {
      if (q.options && q.options[opt]) {
        optsHtml += `
          <div class="option" data-opt="${opt}" onclick="selectOption(this)">
            <b>${opt})</b>
            <span>${escapeHtml(q.options[opt])}</span>
          </div>
        `;
      }
    });

    cardsHtml += `
      <div class="q-card" id="q-${qNum}" data-correct="${q.correct}">
        <div class="q-meta">
          <span>Pregunta ${qNum} de ${themeQuestions.length}</span>
          <button class="toggle-sol-btn print-hide" onclick="toggleSolution(${qNum})">Solució</button>
        </div>
        <div class="q-statement">${qNum}. ${escapeHtml(q.statement)}</div>
        <div class="options-list">
          ${optsHtml}
        </div>
        <div class="solution-box" id="sol-${qNum}">
          <div style="font-weight: 700; color: #10b981; margin-bottom: 4px;">✓ Resposta Correcta: ${q.correct}) ${escapeHtml(q.options ? q.options[q.correct] : '')}</div>
          ${q.explanation ? `<div class="explanation-text"><b>Explicació:</b> ${escapeHtml(q.explanation)}</div>` : ''}
        </div>
      </div>
    `;
  });

  const pageHtml = `<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${themeTitle} - Repàs de Preguntes</title>
  <style>${htmlStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${themeTitle}</h1>
      <p>Total de preguntes: <b>${themeQuestions.length}</b> • Clica a qualsevol opció per comprovar-la directament</p>
      <div class="controls print-hide">
        <a class="btn btn-secondary" href="../index.html">← Menú Principal</a>
        <a class="btn btn-secondary" href="../anki_csv/${cleanFilename(theme)}.csv" download>📦 Descarregar Anki CSV</a>
        <button class="btn btn-secondary" onclick="toggleAllSolutions()">Mostra/Amaga Solucions</button>
        <button class="btn btn-primary" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
      </div>
    </div>
    <div id="questions-container">
      ${cardsHtml}
    </div>
  </div>
  <script>
    let allVisible = false;

    function selectOption(el) {
      const card = el.closest('.q-card');
      const correct = card.getAttribute('data-correct');
      const chosen = el.getAttribute('data-opt');
      
      // Clear previous states
      card.querySelectorAll('.option').forEach(o => o.classList.remove('wrong'));
      
      if (chosen === correct) {
        el.classList.add('correct');
      } else {
        el.classList.add('wrong');
        const correctEl = card.querySelector('.option[data-opt="' + correct + '"]');
        if (correctEl) correctEl.classList.add('correct');
      }

      // Show solution box
      const box = card.querySelector('.solution-box');
      box.classList.add('visible');
    }

    function toggleSolution(id) {
      const card = document.getElementById('q-' + id);
      const box = document.getElementById('sol-' + id);
      const isVis = box.classList.toggle('visible');
      const correct = card.getAttribute('data-correct');
      const correctOpt = card.querySelector('.option[data-opt="' + correct + '"]');
      if (correctOpt) {
        if (isVis) correctOpt.classList.add('correct');
        else if (!allVisible) correctOpt.classList.remove('correct');
      }
    }

    function toggleAllSolutions() {
      allVisible = !allVisible;
      document.querySelectorAll('.solution-box').forEach(b => {
        if (allVisible) b.classList.add('visible');
        else b.classList.remove('visible');
      });
      document.querySelectorAll('.q-card').forEach(c => {
        const correct = c.getAttribute('data-correct');
        const opt = c.querySelector('.option[data-opt="' + correct + '"]');
        if (opt) {
          if (allVisible) opt.classList.add('correct');
          else opt.classList.remove('correct');
        }
      });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(htmlDir, `${cleanFilename(theme)}.html`), pageHtml, 'utf8');
});

// 3. GENERATE MASTER INTERACTIVE INDEX (index.html & Repas_Global.html)
let themeCardsNavHtml = '';
themes.forEach(theme => {
  const count = questions.filter(q => q.theme === theme).length;
  const fileName = `${cleanFilename(theme)}.html`;
  const csvName = `${cleanFilename(theme)}.csv`;
  themeCardsNavHtml += `
    <div class="theme-nav-card" style="background: var(--card); border: 1px solid var(--card-border); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px;">
      <div>
        <div style="font-size: 11px; color: var(--primary); font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Tema Oficial</div>
        <h3 style="font-size: 16px; margin-bottom: 6px; line-height: 1.3;">${escapeHtml(theme)}</h3>
        <p style="font-size: 13px; color: var(--text-muted);">${count} preguntes</p>
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <a href="html_repas/${fileName}" class="btn btn-primary" style="flex: 1; justify-content: center; font-size: 12px; padding: 8px 12px;">Repassar HTML</a>
        <a href="anki_csv/${csvName}" download class="btn btn-secondary" style="font-size: 12px; padding: 8px 12px;" title="Descarregar CSV per a Anki">📦 Anki</a>
      </div>
    </div>
  `;
});

const masterIndexHtml = `<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preguntes Òptim - Oposicions Bombers</title>
  <style>
    ${htmlStyles}
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container" style="max-width: 1100px;">
    <div class="header">
      <h1 style="font-size: 28px;">🔥 Preguntes Òptim - Oposicions Bombers</h1>
      <p style="font-size: 15px; margin-top: 6px;">Total de <b>${questions.length}</b> preguntes distribuïdes en <b>${themes.length}</b> temes oficials.</p>
      
      <div class="controls" style="margin-top: 20px;">
        <a href="anki_csv/00_TOTES_LES_PREGUNTES_ANKI.csv" download class="btn btn-primary" style="font-size: 14px; padding: 12px 20px;">
          📥 Descarregar TOTES per a Anki (Master CSV - ${questions.length} preguntes)
        </a>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
      <h2 style="font-size: 20px;">Temari Oficial (${themes.length} Temes)</h2>
      <input type="text" id="filterInput" placeholder="Cercar tema..." onkeyup="filterThemes()" style="padding: 10px 16px; border-radius: 10px; background: var(--card); border: 1px solid var(--card-border); color: white; font-size: 14px; width: 260px; outline: none;">
    </div>

    <div class="grid" id="themesGrid">
      ${themeCardsNavHtml}
    </div>
  </div>

  <script>
    function filterThemes() {
      const q = document.getElementById('filterInput').value.toLowerCase();
      document.querySelectorAll('.theme-nav-card').forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(q) ? 'flex' : 'none';
      });
    }
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(baseDir, 'index.html'), masterIndexHtml, 'utf8');
fs.writeFileSync(path.join(baseDir, 'Repas_Global.html'), masterIndexHtml, 'utf8');

console.log('Successfully generated all clean Anki CSVs and interactive HTML review pages in "Preguntes optim"!');
