import urllib.request
import json
import os
import re
import sys
import pypdf
from collections import defaultdict

API_KEY = 'AIzaSyBEQQpfMvHRxdroohR3208MJX6G0gY01Ok'
BUCKET = 'testintor-boratrancho.appspot.com'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(BASE_DIR, 'preguntes academia bombers')
PDF_DIR = os.path.join(OUT_DIR, 'pdf_downloads')
TEMA_DIR = os.path.join(OUT_DIR, 'per_tema')

os.makedirs(PDF_DIR, exist_ok=True)
os.makedirs(TEMA_DIR, exist_ok=True)

# -------------------------------------------------------------
# Regles de classificació temàtica oficial (T01 - T34)
# -------------------------------------------------------------
THEME_RULES = [
    ("T01 - CE i EAC", [
        r"\bconstituci[oó]\b", r"\btribunal constitucional\b", r"\bcorts generals\b", r"\bdefensor del poble\b",
        r"\bestatut d'?autonomia\b", r"\bparlament de catalunya\b", r"\bpresident de la generalitat\b", r"\bconsell de garanties\b",
        r"\btítol preliminar\b", r"\bart(?:icle|\.)\s*(?:1[0-9]{2}|[1-9][0-9]?)\s*(?:de la\s*)?ce\b"
    ]),
    ("T02 - Funció pública", [
        r"\bebep\b", r"\breial decret legislatiu 5/2015\b", r"\bdecret legislatiu 1/1997\b", r"\bfunci[oó] p[uú]blica\b",
        r"\bfalta(?:s)? molt greu(?:s)?\b", r"\bfalta(?:s)? greu(?:s)?\b", r"\br[eè]gim disciplinari\b", r"\bincompatibilitat(?:s)?\b",
        r"\bdrets i deures dels funcionaris\b", r"\bsancions disciplinàries\b"
    ]),
    ("T03 - Llei bombers i protecció civil", [
        r"\bllei 5/1994\b", r"\bllei 4/1997\b", r"\bspeis\b", r"\bbombers voluntaris\b", r"\bbombers d'?empresa\b",
        r"\bescola de bombers\b", r"\bconsell de bombers\b", r"\bservei de prevenci[oó] i extinci[oó] d'?incendis\b"
    ]),
    ("T04 - Organització del cos de Bombers", [
        r"\bdecret 276/2016\b", r"\bdecret 12/2023\b", r"\bdecret 16/2026\b", r"\bsiscom\b", r"\bsubdirecci[oó] general operativa\b",
        r"\bsgo\b", r"\bsgt\b", r"\bregi[oó] d'?emerg[eè]ncies\b", r"\bparc de bombers\b", r"\bcap de gu[aà]rdia\b", r"\bdivisi[oó] d'?operacions\b"
    ]),
    ("T05 - Sistema de comandament", [
        r"\bsistema de comandament\b", r"\bcap d'?intervenci[oó]\b", r"\bsectoritzaci[oó]\b", r"\bpunt de comandament\b",
        r"\bpca\b", r"\bcontrol de recursos\b", r"\borganitzaci[oó] de l'?escenari\b"
    ]),
    ("T06 - Igualtat de tracte i de gènere", [
        r"\bllei 17/2015\b", r"\bllei 19/2020\b", r"\bprotocol 2023\b", r"\bassetjament sexual\b", r"\bigualtat efectiva\b",
        r"\bperspectiva de g[eè]nere\b", r"\bdiscriminaci[oó] per ra[oó] de g[eè]nere\b"
    ]),
    ("T07 - Protecció civil", [
        r"\bprotecci[oó] civil\b", r"\bprocicat\b", r"\binfocat\b", r"\bplaseqta\b", r"\bcecat\b", r"\bpla d'?autoprotecci[oó]\b",
        r"\bfase d'?alerta\b", r"\bfase d'?emerg[eè]ncia\b", r"\bprealerta\b", r"\bpla d'?emerg[eè]ncia exterior\b"
    ]),
    ("T08 - Cartografia i orientació", [
        r"\bcartografia\b", r"\bescala\s*1:\b", r"\bcorbes? de nivell\b", r"\bcoordenades utm\b", r"\bdeclinaci[oó] magn[eè]tica\b",
        r"\brumb\b", r"\bazimut\b", r"\bequidist[aà]ncia\b", r"\bprojecci[oó] utm\b", r"\bmapa topogr[aà]fic\b", r"\bdatum\b"
    ]),
    ("T09 - Física", [
        r"\bcinem[aà]tica\b", r"\bdin[aà]mica\b", r"\bfor[cç]a\b", r"\barqu[ií]medes\b", r"\bnewton\b", r"\bmassa\b",
        r"\bacceleraci[oó]\b", r"\bvelocitat\b", r"\benergia cin[eè]tica\b", r"\benergia potencial\b", r"\btreball\b",
        r"\bpot[eè]ncia\b", r"\bmoment d'?una for[cç]a\b", r"\bpalanca de (?:primer|segon|tercer) g[eè]nere\b",
        r"\bpolitja\b", r"\bp[eè]ndol de charpy\b", r"\bpressi[oó]\b", r"\bpascal(?:s)?\b", r"\bkilopond\b"
    ]),
    ("T10 - Química", [
        r"\btaula peri[oò]dica\b", r"\b[aà]tom(?:s)?\b", r"\benlla[cç] covalent\b", r"\benlla[cç] i[oò]nic\b", r"\breacci[oó] qu[ií]mica\b",
        r"\bestequiometria\b", r"\bavogadro\b", r"\b[aà]cid(?:s)?\b", r"\bbase(?:s)?\b", r"\bph\b", r"\balc[aà]ns?\b", r"\balquens?\b",
        r"\balquins?\b", r"\bhidrocarbur(?:s)?\b", r"\bapolar\b", r"\bpolar\b", r"\bmol[eè]cula\b", r"\bpes molecular\b"
    ]),
    ("T11 - Electricitat", [
        r"\bllei d'?ohm\b", r"\bohms?\b", r"\bresist[eè]ncia el[eè]ctrica\b", r"\bcorrent continu\b", r"\bcorrent altern\b",
        r"\bvoltatge\b", r"\bintensitat\b", r"\bamper(?:s)?\b", r"\bwatts?\b", r"\brebt\b", r"\bbaixa tensi[oó]\b", r"\balta tensi[oó]\b",
        r"\btransformador\b", r"\bcaixa general de protecci[oó]\b", r"\bcgp\b", r"\binterruptor diferencial\b"
    ]),
    ("T13 - Teoria del foc", [
        r"\bteoria del foc\b", r"\btriangle del foc\b", r"\btetraedre del foc\b", r"\bcombusti[oó]\b", r"\bpir[oò]lisi\b",
        r"\bclasse de foc [abcdfk]\b", r"\bflashover\b", r"\bbackdraft\b", r"\bagent extintor\b", r"\bextintor(?:s)?\b",
        r"\baigua d'?extinci[oó]\b", r"\bescuma\b", r"\bpols (?:bc|abc|qu[ií]mica)\b", r"\bco2\b", r"\bboil-over\b",
        r"\bslop-over\b", r"\bbleve\b", r"\brange d'?inflamabilitat\b", r"\blii\b", r"\blse\b"
    ]),
    ("T14 - Hidràulica i bombes", [
        r"\bhidr[aà]ulica\b", r"\bp[eè]rdua(?:s)? de c[aà]rrega\b", r"\bcabal(?:s)?\b", r"\bbomba centr[ií]fuga\b", r"\bcavitaci[oó]\b",
        r"\bbernoulli\b", r"\bpressi[oó] hidrost[aà]tica\b", r"\bl[ií]nia d'?aigua\b", r"\blan[cç]a\b", r"\bpressi[oó] en punta\b",
        r"\bventuri\b", r"\bmangueta\b", r"\br[aà]cord\b", r"\bbie-25\b", r"\bbie-45\b", r"\bhidrant\b"
    ]),
    ("T15 - Construcció", [
        r"\bforjat\b", r"\bplaca alveolar\b", r"\bpilar(?:s)?\b", r"\bbiga(?:es)?\b", r"\bma[oó]\b", r"\bformig[oó]\b",
        r"\barmat\b", r"\bencavallada\b", r"\bcoberta\b", r"\bmur de c[aà]rrega\b", r"\btracci[oó]\b", r"\bcompressi[oó]\b",
        r"\bcombustibilitat de materials\b", r"\bresist[eè]ncia al foc\b", r"\brei\b", r"\bsector d'?incendi\b"
    ]),
    ("T16 - Instal·lacions", [
        r"\binstal·laci[oó] de gas\b", r"\binstal·laci[oó] el[eè]ctrica\b", r"\bascensor(?:s)?\b", r"\bclimatitzaci[oó]\b",
        r"\bventilaci[oó]\b", r"\bcanonada\b", r"\bglp\b", r"\bgas natural\b", r"\bune 60670\b"
    ]),
    ("T17 - Ràdio", [
        r"\br[aà]dio\b", r"\bxarxa rescat\b", r"\bfreq[uü][eè]ncia\b", r"\bvhf\b", r"\buhf\b", r"\bwalkie\b", r"\brepetidor\b",
        r"\bcanal de r[aà]dio\b", r"\bemissores?\b"
    ]),
    ("T18 - Vehicles d'intervenció mecànica", [
        r"\bmotor (?:otto|di[eè]sel|h[ií]brid|el[eè]ctric)\b", r"\bbugia\b", r"\bcilindre\b", r"\bcigonyal\b", r"\barbre de lleves\b",
        r"\bdohc\b", r"\bohc\b", r"\bturbo\b", r"\bfrens d'?aire\b", r"\bbrp\b", r"\bbul\b", r"\bbfl\b", r"\bbnp\b", r"\baea\b",
        r"\bautobomba\b", r"\bvehicle d'?intervenci[oó]\b"
    ]),
    ("T20 - Equips de protecció individual (EPI)", [
        r"\bera\b", r"\bequip de respiraci[oó] aut[oò]nom\b", r"\bampolla a 300\b", r"\bespatllera\b", r"\bcasc f1\b",
        r"\bvestit d'?intervenci[oó]\b", r"\bpressi[oó] de reserva (?:60|55)\b", r"\bsenyal ac[uú]stic\b", r"\bguants d'?intervenci[oó]\b",
        r"\bcaputxa ign[ií]fuga\b", r"\bbotes d'?intervenci[oó]\b", r"\bepi\b"
    ]),
    ("T23 - Prevenció bàsica d'incendis", [
        r"\bripci\b", r"\bcte db-si\b", r"\bruixadors\b", r"\bsprinklers\b", r"\bdetecci[oó] d'?incendis\b",
        r"\bcolumna seca\b", r"\bhidrant exterior\b", r"\benllumenat d'?emerg[eè]ncia\b"
    ]),
    ("T24 - Intervenció bàsica en incendis estructurals", [
        r"\bincendi estructural\b", r"\bincendi d'?interior\b", r"\blectura de fum\b", r"\bventilaci[oó] t[aà]ctica\b",
        r"\brecerca i rescat\b", r"\batac ofensiu\b", r"\batac defensiu\b", r"\bpatr[oó] de polvoritzaci[oó]\b"
    ]),
    ("T25 - Intervenció bàsica en incendis forestals", [
        r"\bincendi forestal\b", r"\bcombustibles forestals\b", r"\brothermel\b", r"\bflanc (?:dret|esquerre)\b",
        r"\bcap de l'?incendi\b", r"\bl[ií]nia de defensa\b", r"\bpulaski\b", r"\bgorgui\b", r"\bfoc de cap[cç]ades\b"
    ]),
    ("T26 - Intervenció bàsica en incendis diversos", [
        r"\bincendi de vehicle\b", r"\bincendi el[eè]ctric\b", r"\bincendi en t[uú]nels\b", r"\bincendi de contenidor\b"
    ]),
    ("T27 - Intervenció bàsica en riscos NRBQ", [
        r"\bnrbq\b", r"\brisc qu[ií]mic\b", r"\bpanell taronja\b", r"\badr\b", r"\bvestit tipus 1[abc]\b", r"\bvestit tipus 2\b",
        r"\bdescontaminaci[oó]\b", r"\bzona calenta\b", r"\bzona t[eè]bia\b", r"\bzona freda\b", r"\bguia eric\b"
    ]),
    ("T28 - Rescat urbà i alçades", [
        r"\brescat en al[cç]ades\b", r"\bcorda est[aà]tica\b", r"\bcorda din[aà]mica\b", r"\bnus vuit\b", r"\bas de guia\b",
        r"\bancoratge\b", r"\bdescensor\b", r"\barn[eè]s\b", r"\btreballs verticals\b"
    ]),
    ("T29 - Salvament medi natural", [
        r"\bsalvament en medi natural\b", r"\ballaus\b", r"\barva\b", r"\bdva\b", r"\bsondeig\b", r"\brescat en coves\b",
        r"\bbarrancs\b", r"\bpiolet\b", r"\bgrampons\b"
    ]),
    ("T30 - Estructures col·lapsades", [
        r"\bestructures col·lapsades\b", r"\bapuntalament\b", r"\bestintolament\b", r"\bmarcs de fusta\b",
        r"\bapuntalament hidr[aà]ulic\b", r"\besquerdes estructurals\b", r"\busar\b"
    ]),
    ("T31 - Inundacions", [
        r"\binundacions\b", r"\baig[uü]es braves\b", r"\belectrobomba\b", r"\bmotobomba d'?esgotament\b",
        r"\bbarrera de contenci[oó]\b", r"\brescat aqu[aà]tic\b"
    ]),
    ("T32 - Accidents de mobilitat viària", [
        r"\baccident de tr[aà]nsit\b", r"\bmobilitat vi[aà]ria\b", r"\bestabilitzaci[oó] del vehicle\b", r"\bcisalla\b",
        r"\bseparador\b", r"\bcilindre separador\b", r"\bdesencarceraci[oó]\b", r"\batrapament f[ií]sic\b"
    ]),
    ("T33 - Suport vital i atenció sanitària", [
        r"\bsuport vital\b", r"\bsvb\b", r"\brcp\b", r"\bdea\b", r"\bdesa\b", r"\baturada cardiorespirat[oò]ria\b",
        r"\bhemorr[aà]gia\b", r"\btorniquet\b", r"\bferno-ked\b", r"\bmatal[aà]s de buit\b", r"\bcollar[ií] cervical\b",
        r"\besfigm[oò]metre\b", r"\bcremades\b", r"\bhipot[eè]rmia\b"
    ]),
    ("T34 - Incidents de múltiples víctimes", [
        r"\bm[uú]ltiples v[ií]ctimes\b", r"\bimv\b", r"\btriatge\b", r"\bstart\b", r"\btargeta vermella\b",
        r"\btargeta groga\b", r"\btargeta verda\b", r"\btargeta negra\b", r"\bpma\b"
    ])
]

def classify_question(statement, explanation=""):
    combined = f"{statement} {explanation}".lower()
    for theme_name, patterns in THEME_RULES:
        for p in patterns:
            if re.search(p, combined):
                return theme_name
    return "T00 - General / Sense assignar"


# -------------------------------------------------------------
# Parser de PDFs d'Acadèmia Bombers
# -------------------------------------------------------------
def parse_simulacre_pdf(pdf_path, sim_num):
    reader = pypdf.PdfReader(pdf_path)
    full_text_pages = [page.extract_text() for page in reader.pages]
    
    # 1. Trobar pàgina de solucions
    sol_page_idx = -1
    for i, t in enumerate(full_text_pages):
        if 'Solucions' in t or 'SOLUCIONS' in t:
            sol_page_idx = i
            break
            
    if sol_page_idx == -1:
        # Fallback a les últimes pàgines
        sol_page_idx = max(0, len(full_text_pages) - 10)

    # 2. Text de preguntes i text de solucions
    questions_raw = "\n".join(full_text_pages[:sol_page_idx])
    solutions_raw = "\n".join(full_text_pages[sol_page_idx:])

    # 3. Parsejar plantilla de respostes: "1.- B"
    answers_map = {}
    for match in re.finditer(r"(\d+)\s*\.?\s*-\s*([ABCD])\b", solutions_raw):
        q_num = int(match.group(1))
        ans_letter = match.group(2)
        answers_map[q_num] = ans_letter

    # 4. Parsejar explicacions: "4.-\nText..."
    explanations_map = {}
    exp_matches = list(re.finditer(r"(\d+)\s*\.?\s*-\s*\n", solutions_raw))
    for i in range(len(exp_matches)):
        q_num = int(exp_matches[i].group(1))
        start_pos = exp_matches[i].end()
        end_pos = exp_matches[i+1].start() if i + 1 < len(exp_matches) else len(solutions_raw)
        exp_text = solutions_raw[start_pos:end_pos].strip()
        # Netejar capçaleres
        exp_text = re.sub(r"www\.academiabombers\.com\s*AcadèmiaBombers\s*Simulacre\d+\s*\d*", "", exp_text).strip()
        explanations_map[q_num] = exp_text

    # 5. Parsejar preguntes
    # Format típic: "1.- Enunciat...\nA) Opció A\nB) Opció B\nC) Opció C\nD) Opció D"
    parsed_questions = []
    
    # Netejar capçaleres de les pàgines de preguntes
    cleaned_q_text = re.sub(r"www\.academiabombers\.com\s*AcadèmiaBombers\s*Simulacre\d+\s*\d*", "", questions_raw)
    
    # Trobar blocs de preguntes
    q_splits = re.split(r"\n\s*(\d+)\s*\.?\s*-\s*", "\n" + cleaned_q_text)
    
    if len(q_splits) > 1:
        for k in range(1, len(q_splits), 2):
            q_num_str = q_splits[k].strip()
            q_body = q_splits[k+1] if k+1 < len(q_splits) else ""
            
            if not q_num_str.isdigit():
                continue
            q_num = int(q_num_str)
            if q_num > 150: # Evitar falsos positius
                continue

            # Extreure opcions A), B), C), D)
            # Regex flexible per opcions
            opt_regex = r"(?:^|\n)\s*([ABCD])\)\s*([\s\S]*?)(?=(?:\n\s*[ABCD]\)|$))"
            opts_found = list(re.finditer(opt_regex, q_body))
            
            statement = ""
            options_dict = {}
            
            if len(opts_found) >= 2:
                # El text abans de la primera opció és l'enunciat
                statement = q_body[:opts_found[0].start()].strip()
                for opt in opts_found:
                    letter = opt.group(1).upper()
                    text = opt.group(2).strip()
                    options_dict[letter] = text
            else:
                # Fallback línia a línia
                lines = q_body.strip().split("\n")
                stmt_lines = []
                for line in lines:
                    m = re.match(r"^([ABCD])\)\s*(.*)", line.strip())
                    if m:
                        options_dict[m.group(1).upper()] = m.group(2).strip()
                    elif not options_dict:
                        stmt_lines.append(line.strip())
                    elif 'D' in options_dict:
                        pass # Fi
                statement = " ".join(stmt_lines).strip()

            if statement and len(options_dict) >= 3:
                correct = answers_map.get(q_num, "A")
                exp = explanations_map.get(q_num, "")
                theme = classify_question(statement, exp)
                
                parsed_questions.append({
                    "id": f"academia_sim{sim_num}_q{q_num}",
                    "simulacre": f"Simulacre {sim_num}",
                    "num_pregunta": q_num,
                    "statement": statement,
                    "correct": correct,
                    "explanation": exp,
                    "difficulty": "Mitjà",
                    "block": "Bloc A",
                    "theme": theme,
                    "section": f"Simulacre {sim_num}",
                    "isSaved": 0,
                    "isAnswered": 0,
                    "options": options_dict
                })

    return parsed_questions


# -------------------------------------------------------------
# Procés principal de descàrrega i processament
# -------------------------------------------------------------
def main():
    print("🚀 Connectant a Firebase Auth d'Acadèmia Bombers...")
    auth_req = urllib.request.Request(
        f'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}',
        data=json.dumps({'email': 'estiarte.testfire@gmail.com', 'password': 'Bombers2026!', 'returnSecureToken': True}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    auth = json.loads(urllib.request.urlopen(auth_req).read().decode('utf-8'))
    token = auth['idToken']
    print("✅ Autenticació correctament completada!")

    print("📂 Obtenint llista de simulacres al Cloud Storage...")
    list_req = urllib.request.Request(
        f'https://firebasestorage.googleapis.com/v0/b/{BUCKET}/o?key={API_KEY}&prefix=sims/premium/&maxResults=500',
        headers={'Authorization': 'Bearer ' + token}
    )
    items = json.loads(urllib.request.urlopen(list_req).read().decode('utf-8')).get('items', [])
    print(f"📦 Trobats {len(items)} simulacres de Bombers de la Generalitat.")

    all_questions = []
    seen_statements = set()
    questions_by_theme = defaultdict(list)

    # Ordenar simulacres numèricament (1..128)
    sim_items = []
    for item in items:
        name = item['name']
        m = re.search(r'Simulacre(\d+)\.pdf$', name)
        if m:
            sim_items.append((int(m.group(1)), name))
    sim_items.sort(key=lambda x: x[0])

    print(f"🔄 Començant la descàrrega i parseig de {len(sim_items)} simulacres...\n")

    for sim_num, file_name in sim_items:
        pdf_local_path = os.path.join(PDF_DIR, f"Simulacre_{sim_num}.pdf")
        
        # Descarregar si no existeix
        if not os.path.exists(pdf_local_path) or os.path.getsize(pdf_local_path) < 1000:
            print(f"   ⬇️ Descarregant Simulacre {sim_num}...")
            url = f"https://firebasestorage.googleapis.com/v0/b/{BUCKET}/o/{urllib.parse.quote(file_name, safe='')}?alt=media&key={API_KEY}"
            try:
                dl_req = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + token})
                with urllib.request.urlopen(dl_req) as response, open(pdf_local_path, 'wb') as out_f:
                    out_f.write(response.read())
            except Exception as e:
                print(f"   ❌ Error descarregant Simulacre {sim_num}: {e}")
                continue

        # Parsejar PDF
        try:
            qs = parse_simulacre_pdf(pdf_local_path, sim_num)
            added_count = 0
            for q in qs:
                clean_stmt = q['statement'].strip().lower()
                if clean_stmt not in seen_statements and len(clean_stmt) > 10:
                    seen_statements.add(clean_stmt)
                    all_questions.append(q)
                    questions_by_theme[q['theme']].append(q)
                    added_count += 1
            print(f"   📄 Simulacre {sim_num}: {len(qs)} preguntes trobades ({added_count} noves úniques).")
        except Exception as e:
            print(f"   ⚠️ Error parsejant Simulacre {sim_num}: {e}")

    print(f"\n============================================================")
    print(f"🎉 COMPLETAT AMB ÈXIT!")
    print(f"📊 Total de preguntes úniques extretes: {len(all_questions)}")
    print(f"============================================================\n")

    # Desar fitxer master a la carpeta nova
    master_path = os.path.join(OUT_DIR, 'preguntes_academia_bombers.json')
    with open(master_path, 'w', encoding='utf-8') as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)
    print(f"💾 Fitxer complet desat a: {master_path}")

    # Desar fitxers individuals per tema
    print("\n📂 Resum de preguntes per tema:")
    for theme, q_list in sorted(questions_by_theme.items()):
        safe_filename = re.sub(r'[^a-zA-Z0-9_-]', '_', theme.split(' - ')[0] if ' - ' in theme else theme) + ".json"
        theme_file_path = os.path.join(TEMA_DIR, safe_filename)
        with open(theme_file_path, 'w', encoding='utf-8') as f:
            json.dump(q_list, f, ensure_ascii=False, indent=2)
        print(f"   • {theme}: {len(q_list)} preguntes -> {safe_filename}")

if __name__ == '__main__':
    main()
