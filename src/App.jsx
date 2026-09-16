import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Play, BookOpen, GraduationCap, ArrowRight, ArrowLeft, Check, X, Menu, Cloud, CloudOff, CloudLightning, Trash2, Printer, AlertTriangle } from 'lucide-react';
import './index.css';

// Anim variants
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 }
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.4 };

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [user, setUser] = useState(localStorage.getItem('fireTestUser'));
  const [stats, setStats] = useState({});
  const [syncStatus, setSyncStatus] = useState('offline'); // 'synced', 'syncing', 'error', 'offline'
  const [screen, setScreen] = useState(user ? 'home' : 'login');

  // Load questions
  useEffect(() => {
    fetch('/preguntes.json')
      .then(res => res.json())
      .then(data => setQuestions(data));
  }, []);

  // Load stats
  useEffect(() => {
    if (user) {
      setSyncStatus('syncing');
      // Intentar carregar des del núvol primer
      fetch(`/api/getStats?user=${encodeURIComponent(user)}`)
        .then(res => {
          if (!res.ok) throw new Error('Error al connectar amb el núvol');
          return res.json();
        })
        .then(data => {
          if (data && !data.error) {
            if (Object.keys(data).length > 0) {
              if (!data._failedIds) data._failedIds = [];
              setStats(data);
              localStorage.setItem(`stats_${user}`, JSON.stringify(data));
            } else {
              // Connexió al núvol correcta, però sense dades prèvies
              const saved = localStorage.getItem(`stats_${user}`);
              if (saved) {
                try {
                  const parsed = JSON.parse(saved);
                  if (!parsed._failedIds) parsed._failedIds = [];
                  setStats(parsed);
                  fetch('/api/saveStats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user, stats: parsed })
                  }).catch(() => {});
                } catch (e) {}
              }
            }
            setSyncStatus('synced');
          } else {
            throw new Error(data?.error || 'Error desconegut');
          }
        })
        .catch(err => {
          console.warn('Fallback local per error de connexió:', err);
          const saved = localStorage.getItem(`stats_${user}`);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (!parsed._failedIds) parsed._failedIds = [];
              setStats(parsed);
            } catch (e) {}
          }
          setSyncStatus('offline');
        });
    }
  }, [user]);

  const saveStats = (newStats) => {
    if (!newStats._failedIds) newStats._failedIds = [];
    setStats(newStats);
    localStorage.setItem(`stats_${user}`, JSON.stringify(newStats));
    
    setSyncStatus('syncing');
    // Intentar desar al núvol de fons
    fetch('/api/saveStats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, stats: newStats })
    })
      .then(res => res.json())
      .then(res => {
        if(res.success) setSyncStatus('synced');
        else setSyncStatus('error');
      })
      .catch(e => {
        console.log('Sincronització al núvol fallida o inactiva en local', e);
        setSyncStatus('error');
      });
  };

  const login = (username) => {
    if (username) {
      localStorage.setItem('fireTestUser', username);
      setUser(username);
      setScreen('home');
    }
  };

  const logout = () => {
    localStorage.removeItem('fireTestUser');
    setUser(null);
    setStats({});
    setScreen('login');
  };

  return (
    <div className="container relative">
      <AnimatePresence mode="wait">
        {screen === 'login' && <LoginScreen key="login" onLogin={login} />}
        {screen === 'home' && (
          <HomeScreen 
            key="home" 
            user={user} 
            stats={stats}
            syncStatus={syncStatus}
            questions={questions}
            onLogout={logout} 
            onStart={(config) => setScreen({ name: 'quiz', config })} 
            onViewFailed={() => setScreen('failed')}
          />
        )}
        {screen?.name === 'quiz' && (
          <QuizScreen 
            key="quiz"
            config={screen.config}
            questions={questions}
            userStats={stats}
            onSaveStats={saveStats}
            onFinish={(results) => setScreen({ name: 'results', results })}
            onExit={() => setScreen('home')}
          />
        )}
        {screen?.name === 'results' && (
          <ResultsScreen 
            key="results"
            results={screen.results}
            onHome={() => setScreen('home')}
          />
        )}
        {screen === 'failed' && (
          <FailedScreen 
            key="failed"
            questions={questions}
            userStats={stats}
            onSaveStats={saveStats}
            onHome={() => setScreen('home')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------------------------
// LOGIN SCREEN
// ----------------------------------------------------------------------
function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    const cleanName = name.trim().toLowerCase();
    const allowedUsers = ['pepe', 'marta'];

    if (allowedUsers.includes(cleanName)) {
      // Pass the correctly capitalized version based on what they matched, or just the original they typed
      // Let's pass the cleanName or a capitalized version for consistency
      const finalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      onLogin(finalName);
    } else {
      setError('Usuari no autoritzat. Consulta amb l\'administrador.');
    }
  };

  return (
    <motion.div 
      variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}
      className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column' }}
    >
      <div className="glass p-8 w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <div style={{ background: 'var(--primary)', padding: 16, borderRadius: 20 }}>
            <GraduationCap size={48} color="white" />
          </div>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>FireTest</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Preparació Oposicions</p>
        
        <input 
          type="text" 
          placeholder="Introdueix el teu nom" 
          value={name} 
          onChange={e => { setName(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ marginBottom: 16, border: error ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.1)' }}
        />
        
        {error && <p style={{ color: 'var(--error)', fontSize: 13, marginBottom: 16, fontWeight: 500 }}>{error}</p>}

        <button 
          onClick={handleLogin}
          style={{ width: '100%', padding: 16, borderRadius: 12, background: 'var(--primary)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--primary-hover)'}
          onMouseOut={e => e.currentTarget.style.background = 'var(--primary)'}
        >
          Accedir
        </button>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// HOME SCREEN
// ----------------------------------------------------------------------
function HomeScreen({ user, stats, syncStatus, questions, onLogout, onStart, onViewFailed }) {
  const themes = [...new Set(questions.map(q => q.theme))].filter(Boolean).sort();
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [mode, setMode] = useState('exam');
  const [examLength, setExamLength] = useState('15');

  // Stats calc
  let totalOk = 0, totalKo = 0;
  Object.keys(stats).forEach(k => {
    if (k !== '_failedIds' && stats[k]) {
      totalOk += stats[k].correct || 0;
      totalKo += stats[k].wrong || 0;
    }
  });

  const activeThemes = selectedThemes.length ? selectedThemes : themes;
  const failedIds = stats._failedIds || [];
  const failedInActiveThemes = questions.filter(q => failedIds.includes(q.id) && activeThemes.includes(q.theme)).length;

  const handleStart = () => {
    onStart({
      themes: activeThemes,
      mode,
      length: parseInt(examLength)
    });
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Benvingut de nou,</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>{user}</h2>
            {syncStatus === 'synced' && <Cloud size={18} color="var(--success)" title="Sincronitzat amb el núvol" />}
            {syncStatus === 'syncing' && <Cloud size={18} color="var(--primary)" style={{ opacity: 0.5 }} title="Sincronitzant..." />}
            {(syncStatus === 'error' || syncStatus === 'offline') && <CloudOff size={18} color="var(--error)" title="Guardat només en local" />}
          </div>
        </div>
        <button onClick={onLogout} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <LogOut size={24} />
        </button>
      </header>

      {/* Stats Widget */}
      <div className="glass" style={{ padding: 20, marginBottom: 24, display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 16, textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: 28, fontWeight: 800, color: 'var(--success)' }}>{totalOk}</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Encerts globals</span>
        </div>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 16, textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: 28, fontWeight: 800, color: 'var(--error)' }}>{totalKo}</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Errors globals</span>
        </div>
      </div>

      <div className="glass" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: 18 }}>Configuració</h3>
        
        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button 
            onClick={() => setMode('exam')}
            style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: mode === 'exam' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: mode === 'exam' ? 'var(--primary)' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
          >
            <GraduationCap size={24} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Examen</span>
          </button>
          <button 
            onClick={() => setMode('study')}
            style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: mode === 'study' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: mode === 'study' ? 'var(--primary)' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
          >
            <BookOpen size={24} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Estudi</span>
          </button>
          <button 
            onClick={() => setMode('review-failed')}
            style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: mode === 'review-failed' ? 'rgba(239, 68, 68, 0.2)' : 'transparent', color: mode === 'review-failed' ? 'var(--error)' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.2s', opacity: failedInActiveThemes === 0 ? 0.5 : 1 }}
            disabled={failedInActiveThemes === 0}
          >
            <AlertTriangle size={24} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Repàs ({failedInActiveThemes})</span>
          </button>
        </div>

        {mode !== 'review-failed' && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)', fontSize: 14 }}>
              {mode === 'exam' ? 'Nombre de preguntes de l\'examen:' : 'Nombre de preguntes a estudiar:'}
            </label>
            <select value={examLength} onChange={e => setExamLength(e.target.value)}>
              <option value="15">15 Preguntes (Sessió curta)</option>
              <option value="25">25 Preguntes (Sessió mitjana)</option>
              <option value="50">50 Preguntes (Sessió llarga)</option>
              <option value="9999">Totes les preguntes</option>
            </select>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ color: 'var(--text-muted)', fontSize: 14 }}>Temes (deixa buit per examinar-los tots):</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSelectedThemes(themes)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Tots</button>
              <button onClick={() => setSelectedThemes([])} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>Cap</button>
            </div>
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 8 }}>
            {themes.map(t => (
              <label key={t} className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={selectedThemes.includes(t)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedThemes([...selectedThemes, t]);
                    else setSelectedThemes(selectedThemes.filter(x => x !== t));
                  }}
                />
                <span style={{ fontSize: 14 }}>{t}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={handleStart}
            style={{ flex: 3, padding: 18, borderRadius: 12, background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
          >
            <Play size={20} fill="currentColor" />
            COMENÇAR TEST
          </button>
          
          <button 
            onClick={onViewFailed}
            style={{ flex: 1, padding: 18, borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
          >
            Llista Errors
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// QUIZ SCREEN
// ----------------------------------------------------------------------
function QuizScreen({ config, questions, userStats, onSaveStats, onFinish, onExit }) {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // For exam mode
  const [studyState, setStudyState] = useState(null); // 'correct', 'wrong', null
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [studySummary, setStudySummary] = useState({ correct: 0, wrong: 0, isFinished: false });

  const isExam = config.mode === 'exam';

  // Init
  useEffect(() => {
    let pool = [];
    if (config.mode === 'review-failed') {
      const failedIds = userStats._failedIds || [];
      pool = questions.filter(q => failedIds.includes(q.id) && config.themes.includes(q.theme));
    } else {
      pool = questions.filter(q => config.themes.includes(q.theme));
    }

    pool = pool.sort(() => Math.random() - 0.5); // shuffle
    
    if (config.mode === 'exam') {
      setQueue(pool.slice(0, config.length));
    } else if (config.mode === 'review-failed') {
      setQueue(pool);
    } else if (config.length && config.length > 0) {
      setQueue(pool.slice(0, config.length));
    } else {
      setQueue(pool);
    }
  }, []);

  if (!queue.length) {
    return (
      <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: 'var(--text-muted)' }}>Carregant preguntes...</p>
        <button onClick={onExit} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer' }}>
          Tornar a l'inici
        </button>
      </div>
    );
  }

  // Study session completed screen
  if (!isExam && studySummary.isFinished) {
    return (
      <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div className="glass" style={{ padding: 32, maxWidth: 500, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Sessió d'Estudi Completada! 🎉</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Has repassat totes les preguntes d'aquesta sessió.</p>
          
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12 }}>
              <span style={{ display: 'block', fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>{studySummary.correct}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Encerts</span>
            </div>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12 }}>
              <span style={{ display: 'block', fontSize: 24, fontWeight: 700, color: 'var(--error)' }}>{studySummary.wrong}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Errors</span>
            </div>
          </div>

          <button 
            onClick={onExit}
            style={{ width: '100%', padding: 16, borderRadius: 12, background: 'var(--primary)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            Tornar a l'Inici
          </button>
        </div>
      </motion.div>
    );
  }

  const q = queue[currentIndex];
  if (!q) {
    return (
      <div className="flex-center" style={{ height: '70vh' }}>
        <button onClick={onExit} style={{ padding: '12px 24px', borderRadius: 12, background: 'var(--primary)', border: 'none', color: 'white', cursor: 'pointer' }}>
          Tornar a l'inici
        </button>
      </div>
    );
  }

  // Handling clicks
  const handleOptionClick = (opt) => {
    if (isExam) {
      setAnswers({ ...answers, [q.id]: opt });
    } else {
      if (studyState) return; // already answered
      
      setSelectedOpt(opt);
      const theme = q.theme || 'Sense_Tema';
      const statsCopy = { ...userStats };
      if (!statsCopy[theme]) statsCopy[theme] = { correct: 0, wrong: 0 };
      if (!statsCopy._failedIds) statsCopy._failedIds = [];

      if (opt === q.correct) {
        setStudyState('correct');
        setStudySummary(prev => ({ ...prev, correct: prev.correct + 1 }));
        statsCopy[theme].correct++;
        // Remove from failed list if correct
        statsCopy._failedIds = statsCopy._failedIds.filter(id => id !== q.id);
      } else {
        setStudyState('wrong');
        setStudySummary(prev => ({ ...prev, wrong: prev.wrong + 1 }));
        statsCopy[theme].wrong++;
        // Add to failed list if wrong
        if (!statsCopy._failedIds.includes(q.id)) {
          statsCopy._failedIds.push(q.id);
        }
      }
      onSaveStats(statsCopy);
    }
  };

  const nextStudy = () => {
    if (currentIndex + 1 < queue.length) {
      setStudyState(null);
      setSelectedOpt(null);
      setCurrentIndex(prev => prev + 1);
    } else {
      setStudySummary(prev => ({ ...prev, isFinished: true }));
    }
  };

  const finishExam = () => {
    let correct = 0, wrong = 0, blank = 0;
    const statsCopy = { ...userStats };
    if (!statsCopy._failedIds) statsCopy._failedIds = [];

    queue.forEach(item => {
      const t = item.theme || 'Sense_Tema';
      if (!statsCopy[t]) statsCopy[t] = { correct: 0, wrong: 0 };
      
      const a = answers[item.id];
      if (!a) blank++;
      else if (a === item.correct) { 
        correct++; 
        statsCopy[t].correct++;
        statsCopy._failedIds = statsCopy._failedIds.filter(id => id !== item.id);
      }
      else { 
        wrong++; 
        statsCopy[t].wrong++;
        if (!statsCopy._failedIds.includes(item.id)) statsCopy._failedIds.push(item.id);
      }
    });

    onSaveStats(statsCopy);
    const score = Math.max(0, correct - (wrong * 0.25));
    const grade = (score / queue.length) * 10;

    onFinish({ correct, wrong, blank, score: grade, total: queue.length, queue, answers });
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={onExit} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={20} />
        </button>
        <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--primary)', width: `${((currentIndex + (studyState ? 1 : 0)) / queue.length) * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>
          {currentIndex + 1} / {queue.length}
        </span>
      </header>

      <div className="glass" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {q.theme}
        </div>
        <h3 style={{ fontSize: 18, lineHeight: 1.5, marginBottom: 24, fontWeight: 500 }}>
          {q.statement}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {['A', 'B', 'C', 'D'].map(opt => {
            if (!q.options || !q.options[opt]) return null;
            
            let btnClass = "option-btn";
            if (isExam) {
              if (answers[q.id] === opt) btnClass += " selected";
            } else if (studyState) {
              if (opt === q.correct) btnClass += " correct";
              else if (opt === selectedOpt) btnClass += " incorrect";
            }

            return (
              <button key={opt} className={btnClass} onClick={() => handleOptionClick(opt)}>
                <span className="option-letter">{opt}</span>
                <span style={{ flex: 1 }}>{q.options[opt]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation for Study Mode */}
      {!isExam && studyState && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: 20, borderLeft: `4px solid ${studyState === 'correct' ? 'var(--success)' : 'var(--error)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: studyState === 'correct' ? 'var(--success)' : 'var(--error)' }}>
            {studyState === 'correct' ? <Check size={20} /> : <X size={20} />}
            <span style={{ fontWeight: 600 }}>{studyState === 'correct' ? 'Correcte!' : 'Incorrecte'}</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>{q.explanation || 'Sense explicació addicional.'}</p>
          <button onClick={nextStudy} style={{ width: '100%', padding: 16, borderRadius: 12, background: 'var(--primary)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            {currentIndex + 1 === queue.length ? 'Finalitzar Sessió' : 'Següent Pregunta'}
          </button>
        </motion.div>
      )}

      {/* Controls for Exam Mode */}
      {isExam && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(c => c - 1)}
            style={{ flex: 1, padding: 16, borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', opacity: currentIndex === 0 ? 0.5 : 1 }}
          >
            Anterior
          </button>
          
          {currentIndex === queue.length - 1 ? (
            <button onClick={finishExam} style={{ flex: 1, padding: 16, borderRadius: 12, background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              Finalitzar
            </button>
          ) : (
            <button onClick={() => setCurrentIndex(c => c + 1)} style={{ flex: 1, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
              Següent
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// RESULTS SCREEN
// ----------------------------------------------------------------------
function ResultsScreen({ results, onHome }) {
  const handlePrint = () => {
    window.print();
  };

  const correctQuestions = [];
  const wrongQuestions = [];
  const blankQuestions = [];

  if (results.queue) {
    results.queue.forEach(q => {
      const uAns = results.answers[q.id];
      if (!uAns) blankQuestions.push(q);
      else if (uAns === q.correct) correctQuestions.push(q);
      else wrongQuestions.push(q);
    });
  }

  const renderQuestion = (q, idx) => {
    const uAns = results.answers[q.id];
    const isCorrect = uAns === q.correct;
    const isBlank = !uAns;
    
    let borderColor = 'rgba(255,255,255,0.1)';
    if (isCorrect) borderColor = 'var(--success)';
    else if (!isBlank) borderColor = 'var(--error)';

    return (
      <div key={q.id} className="glass review-item" style={{ padding: 20, marginBottom: 16, borderLeft: `6px solid ${borderColor}`, textAlign: 'left' }}>
        <p style={{ fontWeight: 600, marginBottom: 16, lineHeight: 1.5 }}>{q.statement}</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['A', 'B', 'C', 'D'].map(opt => {
            if (!q.options[opt]) return null;
            
            let bg = 'rgba(255,255,255,0.03)';
            let color = 'var(--text)';
            let border = '1px solid rgba(255,255,255,0.05)';
            let printClass = '';
            
            if (opt === q.correct) {
              bg = 'rgba(16, 185, 129, 0.15)';
              border = '1px solid var(--success)';
              color = 'var(--success)';
              printClass = 'print-correct';
            } else if (opt === uAns && !isCorrect) {
              bg = 'rgba(239, 68, 68, 0.15)';
              border = '1px solid var(--error)';
              color = 'var(--error)';
              printClass = 'print-error';
            }

            return (
              <div key={opt} className={`review-option ${printClass}`} style={{ padding: 12, borderRadius: 8, background: bg, border, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 'bold', color }}>{opt})</span>
                <span style={{ color }}>{q.options[opt]}</span>
              </div>
            );
          })}
        </div>
        
        <div style={{ marginTop: 16, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: 14 }}>
          <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Explicació:</span>
          {q.explanation || 'Sense explicació.'}
        </div>
      </div>
    );
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', paddingTop: 40, paddingBottom: 40 }}>
      <div className="glass text-center print-hide" style={{ padding: 40, width: '100%', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, marginBottom: 32 }}>Resultats</h2>
        
        <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: `8px solid ${results.score >= 5 ? 'var(--success)' : 'var(--error)'}`, background: 'rgba(0,0,0,0.2)' }}>
          <div>
            <span style={{ fontSize: 48, fontWeight: 800 }}>{results.score.toFixed(1)}</span>
            <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>/10</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          <div style={{ flex: 1, background: 'rgba(16, 185, 129, 0.1)', padding: 16, borderRadius: 12 }}>
            <span style={{ display: 'block', fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>{results.correct}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Encerts</span>
          </div>
          <div style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', padding: 16, borderRadius: 12 }}>
            <span style={{ display: 'block', fontSize: 24, fontWeight: 700, color: 'var(--error)' }}>{results.wrong}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Errors</span>
          </div>
          <div style={{ flex: 1, background: 'rgba(245, 158, 11, 0.1)', padding: 16, borderRadius: 12 }}>
            <span style={{ display: 'block', fontSize: 24, fontWeight: 700, color: 'var(--warning)' }}>{results.blank}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>En Blanc</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onHome} style={{ flex: 1, padding: 18, borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            Tornar a l'Inici
          </button>
          <button onClick={handlePrint} style={{ flex: 1, padding: 18, borderRadius: 12, background: 'var(--primary)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            Imprimir PDF
          </button>
        </div>
      </div>

      <div className="review-container" style={{ width: '100%' }}>
        {wrongQuestions.length > 0 && (
          <div className="page-break">
            <h3 style={{ color: 'var(--error)', marginBottom: 20, fontSize: 22, marginTop: 40, borderBottom: '2px solid var(--error)', paddingBottom: 10 }}>Preguntes Fallades ({wrongQuestions.length})</h3>
            {wrongQuestions.map(renderQuestion)}
          </div>
        )}

        {blankQuestions.length > 0 && (
          <div className="page-break">
            <h3 style={{ color: 'var(--warning)', marginBottom: 20, fontSize: 22, marginTop: 40, borderBottom: '2px solid var(--warning)', paddingBottom: 10 }}>Preguntes En Blanc ({blankQuestions.length})</h3>
            {blankQuestions.map(renderQuestion)}
          </div>
        )}

        {correctQuestions.length > 0 && (
          <div className="page-break">
            <h3 style={{ color: 'var(--success)', marginBottom: 20, fontSize: 22, marginTop: 40, borderBottom: '2px solid var(--success)', paddingBottom: 10 }}>Preguntes Encertades ({correctQuestions.length})</h3>
            {correctQuestions.map(renderQuestion)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function FailedScreen({ questions, userStats, onSaveStats, onHome }) {
  const [filterTheme, setFilterTheme] = useState('ALL');
  const handlePrint = () => window.print();
  
  const failedIds = userStats._failedIds || [];
  const allFailedQuestions = questions.filter(q => failedIds.includes(q.id));
  const errorThemes = [...new Set(allFailedQuestions.map(q => q.theme))].sort();

  const failedQuestions = filterTheme === 'ALL'
    ? allFailedQuestions
    : allFailedQuestions.filter(q => q.theme === filterTheme);

  const clearFailed = () => {
    if (confirm('Estàs segur que vols esborrar tot el registre de preguntes fallades?')) {
      const newStats = { ...userStats, _failedIds: [] };
      onSaveStats(newStats);
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', paddingTop: 40, paddingBottom: 40 }}>
      <div className="glass text-center print-hide" style={{ padding: 40, width: '100%', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16 }}>Llista d'Errors</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          Tens <b>{failedQuestions.length}</b> preguntes pendents {filterTheme !== 'ALL' ? `del tema ${filterTheme}` : 'en total'}.
        </p>

        {errorThemes.length > 1 && (
          <div style={{ marginBottom: 24, textAlign: 'left', maxWidth: 400, margin: '0 auto 24px' }}>
            <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)', fontSize: 13 }}>Filtrar per Tema:</label>
            <select value={filterTheme} onChange={e => setFilterTheme(e.target.value)}>
              <option value="ALL">Tots els temes ({allFailedQuestions.length})</option>
              {errorThemes.map(t => {
                const count = allFailedQuestions.filter(q => q.theme === t).length;
                return <option key={t} value={t}>{t} ({count})</option>;
              })}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={onHome} style={{ flex: 1, minWidth: 120, padding: 18, borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <ArrowLeft size={18} />
            Tornar
          </button>
          
          <button onClick={handlePrint} style={{ flex: 1, minWidth: 120, padding: 18, borderRadius: 12, background: 'var(--primary)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <Printer size={18} />
            Imprimir PDF
          </button>

          <button onClick={clearFailed} style={{ flex: 1, minWidth: 120, padding: 18, borderRadius: 12, background: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <Trash2 size={18} />
            Esborrar
          </button>
        </div>
      </div>

      <div className="review-container" style={{ width: '100%' }}>
        {failedQuestions.length === 0 ? (
          <div className="glass" style={{ padding: 40, textAlign: 'center' }}>
            <Check size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>Tot Perfecte!</h3>
            <p style={{ color: 'var(--text-muted)' }}>No tens cap pregunta fallada pendent. Segueix així!</p>
          </div>
        ) : (
          failedQuestions.map((q, idx) => (
            <div key={q.id} className="glass review-item" style={{ padding: 20, marginBottom: 16, borderLeft: `6px solid var(--error)`, textAlign: 'left' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Tema: {q.theme}</span>
              <p style={{ fontWeight: 600, marginBottom: 16, lineHeight: 1.5 }}>{idx + 1}. {q.statement}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['A', 'B', 'C', 'D'].map(opt => {
                  if (!q.options[opt]) return null;
                  
                  let bg = 'rgba(255,255,255,0.03)';
                  let color = 'var(--text)';
                  let border = '1px solid rgba(255,255,255,0.05)';
                  let printClass = '';
                  
                  if (opt === q.correct) {
                    bg = 'rgba(16, 185, 129, 0.15)';
                    border = '1px solid var(--success)';
                    color = 'var(--success)';
                    printClass = 'print-correct';
                  }
      
                  return (
                    <div key={opt} className={`review-option ${printClass}`} style={{ padding: 12, borderRadius: 8, background: bg, border, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 'bold', color }}>{opt})</span>
                      <span style={{ color }}>{q.options[opt]}</span>
                    </div>
                  );
                })}
              </div>
              
              <div style={{ marginTop: 16, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: 14 }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Explicació:</span>
                {q.explanation || 'Sense explicació.'}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
