const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'Preguntes optim');
const globalDir = path.join(baseDir, 'global_combinat');
const perAcademyDir = path.join(baseDir, 'per_academia');

fs.mkdirSync(baseDir, { recursive: true });
fs.mkdirSync(globalDir, { recursive: true });
fs.mkdirSync(perAcademyDir, { recursive: true });

const questions = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'preguntes.json'), 'utf8'));

function cleanFilename(name) {
  if (!name) return 'sense_nom';
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

const htmlStyles = `
  :root {
    --bg: #f8fafc;
    --card: #ffffff;
    --card-border: #e2e8f0;
    --text: #1e293b;
    --text-muted: #64748b;
    --primary: #2c3e50;
    --primary-hover: #1a252f;
    --accent: #e74c3c;
    --success: #10b981;
    --error: #ef4444;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  body { background: var(--bg); color: var(--text); padding: 30px 20px; line-height: 1.5; font-size: 14px; }
  .container { max-width: 960px; margin: 0 auto; }
  header { margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid var(--card-border); }
  h1 { font-size: 24px; color: var(--primary); margin-bottom: 6px; }
  .subtitle { color: var(--text-muted); font-size: 14px; }
  .q-card { background: var(--card); border: 1px solid var(--card-border); border-radius: 8px; padding: 18px 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 12px; color: var(--text-muted); }
  .q-badge { background: #e2e8f0; color: #475569; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
  .q-statement { font-size: 15px; font-weight: 600; line-height: 1.45; margin-bottom: 14px; color: #0f172a; }
  .options-grid { display: grid; gap: 8px; }
  .option-item { display: flex; align-items: flex-start; gap: 10px; padding: 9px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
  .opt-letter { font-weight: bold; width: 20px; color: var(--primary); }
  .opt-text { flex: 1; font-size: 13.5px; }
  .sol-container { margin-top: 40px; padding: 30px; background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 8px; }
  .sol-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-top: 15px; }
  .sol-item { padding: 8px 12px; background: #f1f5f9; border-radius: 6px; display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; }
  .sol-ans { color: var(--success); }
  .explanation-box { margin-top: 8px; padding: 8px 10px; background: #f0fdf4; border-left: 3px solid #10b981; font-size: 12.5px; color: #166534; border-radius: 0 4px 4px 0; }
`;

function generateBundle(targetDir, qList, titlePrefix = '') {
  const ankiDir = path.join(targetDir, 'anki_csv');
  const htmlDir = path.join(targetDir, 'html_repas');
  fs.mkdirSync(ankiDir, { recursive: true });
  fs.mkdirSync(htmlDir, { recursive: true });

  const themes = [...new Set(qList.map(q => q.theme))].filter(Boolean).sort();
  const allAnkiRows = [['Front', 'Back', 'Tag', 'ID']];

  themes.forEach(theme => {
    const themeQuestions = qList.filter(q => q.theme === theme);
    const themeAnkiRows = [['Front', 'Back', 'Tag', 'ID']];
    const tag = cleanFilename(theme);

    themeQuestions.forEach((q, idx) => {
      let frontHtml = `<div style="text-align: left; font-family: -apple-system, sans-serif;">`;
      frontHtml += `<div style="font-size: 11px; color: #888; margin-bottom: 6px;">[${q.academyName || 'Bombers'} · ${q.theme}] Pregunta ${idx + 1}</div>`;
      frontHtml += `<div style="font-weight: bold; font-size: 16px; margin-bottom: 14px; line-height: 1.4;">${escapeHtml(q.statement)}</div>`;
      frontHtml += `<div style="font-size: 14px; line-height: 1.6;">`;
      ['A', 'B', 'C', 'D'].forEach(opt => {
        if (q.options && q.options[opt]) {
          frontHtml += `<div style="padding: 5px 0;"><b>${opt})</b> ${escapeHtml(q.options[opt])}</div>`;
        }
      });
      frontHtml += `</div></div>`;

      const correctLetter = q.correct || '';
      const correctText = (q.options && q.options[correctLetter]) ? q.options[correctLetter] : '';
      let backHtml = `<div style="text-align: left; font-family: -apple-system, sans-serif;">`;
      backHtml += `<div style="font-weight: bold; font-size: 16px; color: #10b981; margin-bottom: 8px;">✓ Resposta Correcta: ${correctLetter}</div>`;
      backHtml += `<div style="font-size: 14px; margin-bottom: 12px; padding: 10px; background: rgba(16,185,129,0.1); border-radius: 6px; border-left: 4px solid #10b981;">${correctLetter}) ${escapeHtml(correctText)}</div>`;
      if (q.explanation && q.explanation.trim()) {
        backHtml += `<hr style="border: 0; border-top: 1px solid #ddd; margin: 12px 0;">`;
        backHtml += `<div style="font-size: 13px; color: #444; line-height: 1.4;"><b style="color: #111;">Explicació / Referència:</b><br>${escapeHtml(q.explanation).replace(/\n/g, '<br>')}</div>`;
      }
      backHtml += `</div>`;

      const row = [frontHtml, backHtml, tag, String(q.id)];
      themeAnkiRows.push(row);
      allAnkiRows.push(row);
    });

    const csvContent = themeAnkiRows.map(r => r.map(escapeCsvField).join(',')).join('\n');
    fs.writeFileSync(path.join(ankiDir, `${cleanFilename(theme)}.csv`), '\ufeff' + csvContent, 'utf8');

    // Generate HTML review
    let html = `<!DOCTYPE html>\n<html lang="ca">\n<head><meta charset="UTF-8"><title>${escapeHtml(theme)} ${titlePrefix}</title><style>${htmlStyles}</style></head><body><div class="container">`;
    html += `<header><h1>${escapeHtml(theme)} ${titlePrefix}</h1><div class="subtitle">Total preguntes: ${themeQuestions.length}</div></header>`;

    themeQuestions.forEach((q, idx) => {
      html += `<div class="q-card"><div class="q-header"><span class="q-badge">#${idx + 1}</span><span>${escapeHtml(q.academyName || '')}</span></div>`;
      html += `<div class="q-statement">${escapeHtml(q.statement)}</div><div class="options-grid">`;
      ['A', 'B', 'C', 'D'].forEach(opt => {
        if (q.options && q.options[opt]) {
          html += `<div class="option-item"><span class="opt-letter">${opt})</span><span class="opt-text">${escapeHtml(q.options[opt])}</span></div>`;
        }
      });
      html += `</div></div>`;
    });

    html += `<div class="sol-container"><h2>Solucions i Explicacions</h2><div class="sol-grid">`;
    themeQuestions.forEach((q, idx) => {
      html += `<div><div class="sol-item"><span>#${idx + 1}</span><span class="sol-ans">Opció ${q.correct}</span></div>`;
      if (q.explanation && q.explanation.trim()) {
        html += `<div class="explanation-box">${escapeHtml(q.explanation).replace(/\n/g, '<br>')}</div>`;
      }
      html += `</div>`;
    });
    html += `</div></div></div></body></html>`;

    fs.writeFileSync(path.join(htmlDir, `${cleanFilename(theme)}.html`), html, 'utf8');
  });

  const masterCsvContent = allAnkiRows.map(r => r.map(escapeCsvField).join(',')).join('\n');
  fs.writeFileSync(path.join(ankiDir, `00_TOTES_LES_PREGUNTES_ANKI.csv`), '\ufeff' + masterCsvContent, 'utf8');
}

// 1. GLOBAL COMBINAT
console.log('Generant banc Global Combinat (27.641 preguntes)...');
generateBundle(globalDir, questions, '(Totes les acadèmies)');

// 2. PER ACADÈMIA (5 Acadèmies)
const academiesMap = {
  'Optim_Bombers': q => q.academy === 'optima',
  'Halligan': q => q.academy === 'halligan',
  'Racord_Girona': q => q.academy === 'racord',
  'Academia_Bombers': q => q.academy === 'academia',
  'Serebomber': q => q.academy === 'serebomber'
};

for (const [acadName, filterFn] of Object.entries(academiesMap)) {
  const acadQuestions = questions.filter(filterFn);
  console.log(`Generant exportació per a ${acadName} (${acadQuestions.length} preguntes)...`);
  const acadDir = path.join(perAcademyDir, acadName);
  generateBundle(acadDir, acadQuestions, `(${acadName.replace(/_/g, ' ')})`);
}

console.log('✅ TOT GENERAT CORRECTAMENT PER A LES 5 ACADÈMIES!');
