import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Play, BookOpen, GraduationCap, ArrowRight, ArrowLeft, Check, X, Menu, Cloud, CloudOff, CloudLightning, Trash2, Printer, AlertTriangle, Star, RotateCcw, FileText, RefreshCw, ListOrdered, Search, CheckCircle2, XCircle, ArrowDown, Layers, HelpCircle, Zap, Shield, Camera } from 'lucide-react';
import FlashcardScreen from './components/FlashcardScreen';
import QuestionPhotoModal from './components/QuestionPhotoModal';
import './index.css';

// Academies metadata (5 Acadèmies Oficials)
export const ACADEMIES_CONFIG = [
  { id: 'optima', label: 'Òptim Bombers', shortLabel: 'Òptim', icon: '🎯', color: '#3b82f6', badgeClass: 'badge-academy-optima' },
  { id: 'halligan', label: 'Halligan', shortLabel: 'Halligan', icon: '🪓', color: '#8b5cf6', badgeClass: 'badge-academy-halligan' },
  { id: 'racord', label: 'Ràcord Girona', shortLabel: 'Ràcord', icon: '🚒', color: '#ef4444', badgeClass: 'badge-academy-racord' },
  { id: 'academia', label: 'Acadèmia Bombers', shortLabel: 'Acadèmia', icon: '📚', color: '#10b981', badgeClass: 'badge-academy-academia' },
  { id: 'serebomber', label: 'Serebomber', shortLabel: 'Serebomber', icon: '⚡', color: '#f59e0b', badgeClass: 'badge-academy-serebomber' }
];

export function getAcademyInfo(academyId) {
  if (academyId === 'oficial') academyId = 'optima';
  return ACADEMIES_CONFIG.find(a => a.id === academyId) || ACADEMIES_CONFIG[0];
}

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
  const [photoQuestionModal, setPhotoQuestionModal] = useState(null); // { question, index }

  // Active academies state
  const [selectedAcademies, setSelectedAcademies] = useState(() => {
    const saved = localStorage.getItem('fireTestAcademies');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(p => p === 'oficial' ? 'optima' : p);
        }
      } catch (e) {}
    }
    return ['optima', 'racord', 'academia'];
  });

  const toggleAcademy = (academyId) => {
    setSelectedAcademies(prev => {
      let next;
      if (prev.includes(academyId)) {
        if (prev.length === 1) return prev; // Mantén almenys una acadèmia activa
        next = prev.filter(a => a !== academyId);
      } else {
        next = [...prev, academyId];
      }
      localStorage.setItem('fireTestAcademies', JSON.stringify(next));
      return next;
    });
  };

  const setAllAcademies = (all = true) => {
    const next = all ? ['optima', 'racord', 'academia'] : ['optima'];
    setSelectedAcademies(next);
    localStorage.setItem('fireTestAcademies', JSON.stringify(next));
  };


  // Load questions
  useEffect(() => {
    fetch('/preguntes.json')
      .then(res => res.json())
      .then(data => setQuestions(data));
  }, []);

  // Filtered questions based on active academies
  const isAcademySelected = (qAcad) => {
    const norm = (qAcad === 'oficial' || !qAcad) ? 'optima' : qAcad;
    return selectedAcademies.includes(norm) || (norm === 'optima' && selectedAcademies.includes('oficial'));
  };
  const filteredQuestions = questions.filter(q => isAcademySelected(q.academy));

  // Load stats
  useEffect(() => {
    if (user) {
      setSyncStatus('syncing');
      fetch(`/api/getStats?user=${encodeURIComponent(user)}`)
        .then(res => {
          if (!res.ok) throw new Error('Error al connectar amb el núvol');
          return res.json();
        })
        .then(data => {
          if (data && !data.error) {
            if (Object.keys(data).length > 0) {
              if (!data._failedIds) data._failedIds = [];
              if (!data._favoriteIds) data._favoriteIds = [];
              if (!data._themeProgress) data._themeProgress = {};
              setStats(data);
              localStorage.setItem(`stats_${user}`, JSON.stringify(data));
            } else {
              const saved = localStorage.getItem(`stats_${user}`);
              if (saved) {
                try {
                  const parsed = JSON.parse(saved);
                  if (!parsed._failedIds) parsed._failedIds = [];
                  if (!parsed._favoriteIds) parsed._favoriteIds = [];
                  if (!parsed._themeProgress) parsed._themeProgress = {};
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
              if (!parsed._favoriteIds) parsed._favoriteIds = [];
              if (!parsed._themeProgress) parsed._themeProgress = {};
              setStats(parsed);
            } catch (e) {}
          }
          setSyncStatus('offline');
        });
    }
  }, [user]);

  const saveStats = (newStats) => {
    if (!newStats._failedIds) newStats._failedIds = [];
    if (!newStats._favoriteIds) newStats._favoriteIds = [];
    if (!newStats._themeProgress) newStats._themeProgress = {};
    setStats(newStats);
    localStorage.setItem(`stats_${user}`, JSON.stringify(newStats));
    
    setSyncStatus('syncing');
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

  const toggleFavorite = (questionId) => {
    const statsCopy = { ...stats };
    if (!statsCopy._favoriteIds) statsCopy._favoriteIds = [];
    if (statsCopy._favoriteIds.includes(questionId)) {
      statsCopy._favoriteIds = statsCopy._favoriteIds.filter(id => id !== questionId);
    } else {
      statsCopy._favoriteIds.push(questionId);
    }
    saveStats(statsCopy);
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
            filteredQuestions={filteredQuestions}
            selectedAcademies={selectedAcademies}
            onToggleAcademy={toggleAcademy}
            onSetAllAcademies={setAllAcademies}
            onLogout={logout} 
            onSaveStats={saveStats}
            onStart={(config) => setScreen({ name: 'quiz', config })} 
            onViewFailed={() => setScreen('failed')}
            onViewFavorites={() => setScreen('favorites')}
            onViewSimulacre={() => setScreen('simulacre')}
            onViewThemeSelector={() => setScreen('theme-selector')}
            onViewFlashcards={() => setScreen('flashcards')}
          />
        )}
        {screen === 'flashcards' && (
          <FlashcardScreen 
            key="flashcards"
            userStats={stats}
            onSaveStats={saveStats}
            onHome={() => setScreen('home')}
          />
        )}
        {screen === 'theme-selector' && (
          <ThemeSelectorScreen 
            key="theme-selector"
            questions={questions}
            filteredQuestions={filteredQuestions}
            selectedAcademies={selectedAcademies}
            onToggleAcademy={toggleAcademy}
            onSetAllAcademies={setAllAcademies}
            userStats={stats}
            onSaveStats={saveStats}
            onSelectTheme={(theme) => setScreen({ name: 'theme-list', theme })}
            onHome={() => setScreen('home')}
          />
        )}
        {screen?.name === 'theme-list' && (
          <ThemeListScreen 
            key={`theme-list-${screen.theme}`}
            theme={screen.theme}
            questions={questions}
            selectedAcademies={selectedAcademies}
            userStats={stats}
            onSaveStats={saveStats}
            onToggleFavorite={toggleFavorite}
            onExportPhoto={(q, idx) => setPhotoQuestionModal({ question: q, index: idx })}
            onBackToThemes={() => setScreen('theme-selector')}
            onHome={() => setScreen('home')}
          />
        )}
        {screen?.name === 'quiz' && (
          <QuizScreen 
            key="quiz"
            config={screen.config}
            questions={filteredQuestions}
            userStats={stats}
            onSaveStats={saveStats}
            onToggleFavorite={toggleFavorite}
            onExportPhoto={(q, idx) => setPhotoQuestionModal({ question: q, index: idx })}
            onFinish={(results) => setScreen({ name: 'results', results })}
            onExit={() => setScreen('home')}
          />
        )}
        {screen?.name === 'results' && (
          <ResultsScreen 
            key="results"
            results={screen.results}
            userStats={stats}
            onToggleFavorite={toggleFavorite}
            onExportPhoto={(q, idx) => setPhotoQuestionModal({ question: q, index: idx })}
            onStartQuiz={(config) => setScreen({ name: 'quiz', config })}
            onHome={() => setScreen('home')}
          />
        )}
        {screen === 'failed' && (
          <FailedScreen 
            key="failed"
            questions={questions}
            userStats={stats}
            onSaveStats={saveStats}
            onToggleFavorite={toggleFavorite}
            onExportPhoto={(q, idx) => setPhotoQuestionModal({ question: q, index: idx })}
            onHome={() => setScreen('home')}
          />
        )}
        {screen === 'favorites' && (
          <FavoritesScreen 
            key="favorites"
            questions={questions}
            userStats={stats}
            onSaveStats={saveStats}
            onToggleFavorite={toggleFavorite}
            onExportPhoto={(q, idx) => setPhotoQuestionModal({ question: q, index: idx })}
            onStartFavoritesQuiz={(config) => setScreen({ name: 'quiz', config })}
            onHome={() => setScreen('home')}
          />
        )}
        {screen === 'simulacre' && (
          <SimulacreScreen 
            key="simulacre"
            questions={filteredQuestions}
            allQuestions={questions}
            selectedAcademies={selectedAcademies}
            onToggleAcademy={toggleAcademy}
            onExportPhoto={(q, idx) => setPhotoQuestionModal({ question: q, index: idx })}
            onHome={() => setScreen('home')}
          />
        )}
      </AnimatePresence>

      {/* White background photo export modal */}
      {photoQuestionModal && (
        <QuestionPhotoModal 
          question={photoQuestionModal.question}
          questionIndex={photoQuestionModal.index}
          onClose={() => setPhotoQuestionModal(null)}
        />
      )}
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
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Preparació Oposicions Bombers</p>
        
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
function HomeScreen({ 
  user, 
  stats, 
  syncStatus, 
  questions, 
  filteredQuestions, 
  selectedAcademies, 
  onToggleAcademy, 
  onSetAllAcademies, 
  onLogout, 
  onSaveStats, 
  onStart, 
  onViewFailed, 
  onViewFavorites, 
  onViewSimulacre, 
  onViewThemeSelector, 
  onViewFlashcards 
}) {
  const themes = [...new Set(filteredQuestions.map(q => q.theme))].filter(Boolean).sort();
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [mode, setMode] = useState('study');
  const [examLength, setExamLength] = useState('15');

  // Stats calc
  let totalOk = 0, totalKo = 0;
  Object.keys(stats).forEach(k => {
    if (k !== '_failedIds' && k !== '_favoriteIds' && k !== '_themeProgress' && stats[k]) {
      totalOk += stats[k].correct || 0;
      totalKo += stats[k].wrong || 0;
    }
  });

  const activeThemes = selectedThemes.length ? selectedThemes : themes;
  const failedIds = stats._failedIds || [];
  const favoriteIds = stats._favoriteIds || [];

  const failedInActiveThemes = filteredQuestions.filter(q => failedIds.includes(q.id) && activeThemes.includes(q.theme)).length;
  const favoritesInActiveThemes = filteredQuestions.filter(q => favoriteIds.includes(q.id) && activeThemes.includes(q.theme)).length;

  const handleStart = () => {
    onStart({
      themes: activeThemes,
      mode,
      length: parseInt(examLength)
    });
  };

  const handleResetGlobalStats = () => {
    if (window.confirm("Estàs segur que vols reiniciar les estadístiques globals d'encerts i errors? Aquesta acció posarà a zero els teus marcadors globals.")) {
      const newStats = {
        _failedIds: stats._failedIds || [],
        _favoriteIds: stats._favoriteIds || [],
        _themeProgress: stats._themeProgress || {}
      };
      onSaveStats(newStats);
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>El meu perfil</p>
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
      <div className="glass" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>Estadístiques Globals</span>
          <button 
            onClick={handleResetGlobalStats}
            title="Reiniciar estadístiques globals"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: 'var(--error)',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.22)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
          >
            <RotateCcw size={13} />
            Reiniciar Estadístiques
          </button>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 16, textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: 28, fontWeight: 800, color: 'var(--success)' }}>{totalOk}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Encerts globals</span>
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 16, textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: 28, fontWeight: 800, color: 'var(--error)' }}>{totalKo}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Errors globals</span>
          </div>
        </div>
      </div>

      {/* Selector d'Acadèmies / Bancs de Preguntes */}
      <div className="glass" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Bancs de Preguntes</span>
              <span style={{ fontSize: 12, fontWeight: 800, background: 'rgba(59, 130, 246, 0.2)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 8 }}>
                {filteredQuestions.length.toLocaleString()} actives
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Activa o desactiva les preguntes de cada acadèmia per als teus tests</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button 
              onClick={() => onSetAllAcademies(true)} 
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--primary)', padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Totes
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {ACADEMIES_CONFIG.map(acad => {
            const count = questions.filter(q => (q.academy || 'oficial') === acad.id).length;
            const isSelected = selectedAcademies.includes(acad.id);
            return (
              <div 
                key={acad.id}
                onClick={() => onToggleAcademy(acad.id)}
                className={`academy-pill ${isSelected ? `active-${acad.id}` : ''}`}
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 4,
                  cursor: 'pointer',
                  border: isSelected ? `1px solid ${acad.color}` : '1px solid rgba(255,255,255,0.08)',
                  background: isSelected ? `${acad.color}22` : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontSize: 20 }}>{acad.icon}</span>
                  <span style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    background: isSelected ? acad.color : 'rgba(255,255,255,0.1)', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: 12, 
                    fontWeight: 800 
                  }}>
                    {isSelected ? '✓' : ''}
                  </span>
                </div>
                <span style={{ fontWeight: 700, fontSize: 13, color: isSelected ? 'white' : 'var(--text-muted)', marginTop: 4 }}>
                  {acad.label}
                </span>
                <span style={{ fontSize: 11, color: isSelected ? acad.color : 'var(--text-muted)', fontWeight: 600 }}>
                  {count.toLocaleString()} preguntes
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Featured Banner: Targetes de Memòria & Anki (Tema 20) */}
      <div 
        onClick={onViewFlashcards}
        className="glass" 
        style={{ 
          padding: 18, 
          marginBottom: 14, 
          cursor: 'pointer',
          border: '1px solid rgba(236, 72, 153, 0.45)', 
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.18) 0%, rgba(139, 92, 246, 0.25) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          transition: 'all 0.2s',
          boxShadow: '0 4px 20px rgba(236, 72, 153, 0.2)'
        }}
        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.8)'; }}
        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.45)'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', padding: 12, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(236, 72, 153, 0.35)' }}>
            <Zap size={26} color="white" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'white' }}>Targetes de Memòria & Anki</span>
              <span style={{ fontSize: 10, fontWeight: 800, background: '#ec4899', color: 'white', padding: '2px 7px', borderRadius: 6 }}>NOU • ANKI</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.3 }}>
              Estudi actiu per temes: comença el joc de memorització o consulta el catàleg de targetes.
            </p>
          </div>
        </div>
        <ArrowRight size={22} color="#f472b6" style={{ flexShrink: 0 }} />
      </div>

      {/* Featured Banner: Repàs en Llista per Temes */}
      <div 
        onClick={onViewThemeSelector}
        className="glass" 
        style={{ 
          padding: 18, 
          marginBottom: 20, 
          cursor: 'pointer',
          border: '1px solid rgba(139, 92, 246, 0.4)', 
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.22) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          transition: 'all 0.2s',
          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.15)'
        }}
        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.7)'; }}
        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.35)', padding: 12, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ListOrdered size={26} color="#c084fc" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'white' }}>Estudi en Llista per Temes</span>
              <span style={{ fontSize: 10, fontWeight: 800, background: 'var(--primary)', color: 'white', padding: '2px 7px', borderRadius: 6 }}>PROGRÉS DESAT</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.3 }}>
              Fes totes les preguntes d'un tema en llista contínua ({filteredQuestions.length.toLocaleString()} preguntes).
            </p>
          </div>
        </div>
        <ArrowRight size={22} color="#c084fc" style={{ flexShrink: 0 }} />
      </div>

      <div className="glass" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: 18 }}>Configuració de Test Ràpid</h3>
        
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
            {themes.map(t => {
              const countInTheme = filteredQuestions.filter(q => q.theme === t).length;
              return (
                <label key={t} className="checkbox-label" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input 
                      type="checkbox" 
                      checked={selectedThemes.includes(t)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedThemes([...selectedThemes, t]);
                        else setSelectedThemes(selectedThemes.filter(x => x !== t));
                      }}
                    />
                    <span style={{ fontSize: 14 }}>{t}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{countInTheme} preg.</span>
                </label>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <button 
            onClick={handleStart}
            style={{ width: '100%', padding: 18, borderRadius: 12, background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--primary-hover)'}
            onMouseOut={e => e.currentTarget.style.background = 'var(--primary)'}
          >
            <Play size={20} fill="currentColor" />
            COMENÇAR TEST
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <button 
            onClick={onViewFailed}
            style={{ flex: 1, padding: 14, borderRadius: 12, background: 'rgba(239, 68, 68, 0.15)', color: 'var(--error)', fontWeight: 600, fontSize: 14, border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
          >
            <AlertTriangle size={18} />
            Llista Errors ({failedIds.length})
          </button>

          <button 
            onClick={onViewFavorites}
            style={{ flex: 1, padding: 14, borderRadius: 12, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 600, fontSize: 14, border: '1px solid rgba(245, 158, 11, 0.2)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
          >
            <Star size={18} fill="#f59e0b" color="#f59e0b" />
            Preferits ({favoriteIds.length})
          </button>
        </div>

        <button 
          onClick={onViewSimulacre}
          style={{ width: '100%', padding: 14, borderRadius: 12, background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', fontWeight: 600, fontSize: 14, border: '1px solid rgba(59, 130, 246, 0.3)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'}
        >
          <FileText size={18} />
          Genera un Simulacre (PDF)
        </button>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// QUIZ SCREEN
// ----------------------------------------------------------------------
function QuizScreen({ config, questions, userStats, onSaveStats, onToggleFavorite, onExportPhoto, onFinish, onExit }) {
  const [queue, setQueue] = useState(() => {
    let pool = [];
    if (config.mode === 'review-failed') {
      const failedIds = userStats._failedIds || [];
      pool = questions.filter(q => failedIds.includes(q.id) && (config.themes || []).includes(q.theme));
    } else if (config.mode === 'favorites') {
      const favIds = userStats._favoriteIds || [];
      pool = questions.filter(q => favIds.includes(q.id) && (config.themes || []).includes(q.theme));
    } else {
      pool = questions.filter(q => (config.themes || []).includes(q.theme));
    }

    pool = [...pool].sort(() => Math.random() - 0.5); // shuffle
    
    if (config.mode === 'exam') {
      return pool.slice(0, config.length);
    } else if (config.mode === 'review-failed' || config.mode === 'favorites') {
      return pool;
    } else if (config.length && config.length > 0) {
      return pool.slice(0, config.length);
    } else {
      return pool;
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [studyState, setStudyState] = useState(null); // 'correct', 'wrong', null
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [maxIndexReached, setMaxIndexReached] = useState(0);

  useEffect(() => {
    setMaxIndexReached(prev => Math.max(prev, currentIndex));
  }, [currentIndex]);

  const isExam = config.mode === 'exam';

  if (!queue || !queue.length) {
    return (
      <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: 16, textAlign: 'center', padding: 20 }}>
        <p style={{ color: 'var(--text-muted)' }}>No s'han trobat preguntes per als temes i acadèmies seleccionats.</p>
        <button onClick={onExit} style={{ padding: '12px 24px', borderRadius: 12, background: 'var(--primary)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
          Tornar a l'inici
        </button>
      </div>
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

  const isFav = (userStats._favoriteIds || []).includes(q.id);
  const acadInfo = getAcademyInfo(q.academy || 'oficial');

  // Handling clicks
  const handleOptionClick = (opt) => {
    if (isExam) {
      setAnswers({ ...answers, [q.id]: opt });
    } else {
      if (studyState) return; // already answered
      
      setSelectedOpt(opt);
      setAnswers(prev => ({ ...prev, [q.id]: opt }));

      const theme = q.theme || 'Sense_Tema';
      const statsCopy = { ...userStats };
      if (!statsCopy[theme]) statsCopy[theme] = { correct: 0, wrong: 0 };
      if (!statsCopy._failedIds) statsCopy._failedIds = [];
      if (!statsCopy._favoriteIds) statsCopy._favoriteIds = [];

      if (opt === q.correct) {
        setStudyState('correct');
        statsCopy[theme].correct++;
        statsCopy._failedIds = statsCopy._failedIds.filter(id => id !== q.id);
      } else {
        setStudyState('wrong');
        statsCopy[theme].wrong++;
        if (!statsCopy._failedIds.includes(q.id)) {
          statsCopy._failedIds.push(q.id);
        }
      }
      onSaveStats(statsCopy);
    }
  };

  const handleFinishQuiz = () => {
    let maxIdx = Math.max(maxIndexReached, currentIndex);
    if (!isExam && studyState) {
      maxIdx = Math.max(maxIdx, currentIndex);
    }
    
    Object.keys(answers).forEach(id => {
      const idx = queue.findIndex(item => String(item.id) === String(id));
      if (idx !== -1) maxIdx = Math.max(maxIdx, idx);
    });

    const isInfiniteOrCustom = (config.length >= 9999) || (maxIdx + 1 < queue.length);
    const evaluatedQueue = isInfiniteOrCustom ? queue.slice(0, maxIdx + 1) : queue;

    let correct = 0, wrong = 0, blank = 0;
    const statsCopy = { ...userStats };
    if (!statsCopy._failedIds) statsCopy._failedIds = [];
    if (!statsCopy._favoriteIds) statsCopy._favoriteIds = [];

    evaluatedQueue.forEach(item => {
      const t = item.theme || 'Sense_Tema';
      if (!statsCopy[t]) statsCopy[t] = { correct: 0, wrong: 0 };
      
      const a = answers[item.id];
      if (!a) {
        blank++;
      } else if (a === item.correct) { 
        correct++; 
        if (isExam) statsCopy[t].correct++;
        statsCopy._failedIds = statsCopy._failedIds.filter(id => id !== item.id);
      } else { 
        wrong++; 
        if (isExam) statsCopy[t].wrong++;
        if (!statsCopy._failedIds.includes(item.id)) statsCopy._failedIds.push(item.id);
      }
    });

    if (isExam) {
      onSaveStats(statsCopy);
    }

    const totalCount = evaluatedQueue.length;
    const score = Math.max(0, correct - (wrong * 0.25));
    const grade = totalCount > 0 ? (score / totalCount) * 10 : 0;

    onFinish({ 
      correct, 
      wrong, 
      blank, 
      score: grade, 
      total: totalCount, 
      queue: evaluatedQueue, 
      answers,
      mode: config.mode,
      themes: config.themes
    });
  };

  const nextStudy = () => {
    if (currentIndex + 1 < queue.length) {
      setStudyState(null);
      setSelectedOpt(null);
      setCurrentIndex(prev => prev + 1);
    } else {
      handleFinishQuiz();
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={onExit} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Sortir">
          <X size={20} />
        </button>
        <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--primary)', width: config.length >= 9999 ? '100%' : `${((currentIndex + (studyState ? 1 : 0)) / queue.length) * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {currentIndex + 1} {config.length >= 9999 ? 'preguntes' : `/ ${queue.length}`}
        </span>
        {isExam && (
          <button 
            onClick={handleFinishQuiz} 
            style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(59, 130, 246, 0.2)', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Lliurar Examen
          </button>
        )}
      </header>

      <div className="glass" style={{ padding: 24, marginBottom: 16, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, opacity: 0.85 }}>
              {q.theme}
            </span>
            <span className={`badge-academy ${acadInfo.badgeClass}`} style={{ fontSize: 10, padding: '2px 7px' }}>
              {acadInfo.icon} {acadInfo.shortLabel}
            </span>
            {q.section && q.section !== q.theme && (
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>• {q.section}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              onClick={() => onExportPhoto && onExportPhoto(q, currentIndex)}
              className="btn-photo-export"
              title="Descarregar o copiar com a foto per als apunts"
            >
              <Camera size={14} />
              <span>Foto Apunts</span>
            </button>
            <button 
              onClick={() => onToggleFavorite(q.id)}
              style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              title={isFav ? "Treure de preferits" : "Afegir a preferits"}
            >
              <Star size={18} color={isFav ? "#f59e0b" : "var(--text-muted)"} fill={isFav ? "#f59e0b" : "transparent"} />
            </button>
          </div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: studyState === 'correct' ? 'var(--success)' : 'var(--error)' }}>
              {studyState === 'correct' ? <Check size={20} /> : <X size={20} />}
              <span style={{ fontWeight: 600 }}>{studyState === 'correct' ? 'Correcte!' : 'Incorrecte'}</span>
            </div>
            <button 
              onClick={() => onExportPhoto && onExportPhoto(q, currentIndex)}
              className="btn-photo-export"
              title="Descarregar o copiar com a foto per als apunts"
            >
              <Camera size={14} />
              <span>Foto per Apunts</span>
            </button>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{q.explanation || 'Sense explicació addicional.'}</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={nextStudy} style={{ flex: 2, padding: 16, borderRadius: 12, background: 'var(--primary)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              {currentIndex + 1 === queue.length ? 'Veure Resultats i Nota' : 'Següent Pregunta'}
            </button>
            {currentIndex + 1 < queue.length && (
              <button onClick={handleFinishQuiz} style={{ flex: 1, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                Finalitzar
              </button>
            )}
          </div>
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
          <button 
            onClick={() => {
              if (currentIndex + 1 < queue.length) setCurrentIndex(c => c + 1);
              else handleFinishQuiz();
            }}
            style={{ flex: 2, padding: 16, borderRadius: 12, background: 'var(--primary)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            {currentIndex + 1 === queue.length ? 'Finalitzar Examen' : 'Següent'}
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// RESULTS SCREEN
// ----------------------------------------------------------------------
function ResultsScreen({ results, userStats, onToggleFavorite, onExportPhoto, onStartQuiz, onHome }) {
  const handlePrint = () => window.print();

  const wrongQuestions = [];
  const blankQuestions = [];
  const correctQuestions = [];

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
    const isFav = (userStats._favoriteIds || []).includes(q.id);
    const acadInfo = getAcademyInfo(q.academy || 'oficial');
    
    let borderColor = 'rgba(255,255,255,0.1)';
    if (isCorrect) borderColor = 'var(--success)';
    else if (!isBlank) borderColor = 'var(--error)';

    return (
      <div key={q.id} className="glass review-item" style={{ padding: 20, marginBottom: 16, borderLeft: `6px solid ${borderColor}`, textAlign: 'left', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tema: {q.theme}</span>
            <span className={`badge-academy ${acadInfo.badgeClass}`}>
              {acadInfo.icon} {acadInfo.shortLabel}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="print-hide">
            <button 
              onClick={() => onExportPhoto && onExportPhoto(q, idx)}
              className="btn-photo-export"
              title="Descarregar o copiar la pregunta en format foto per als apunts"
            >
              <Camera size={14} />
              <span>Foto Apunts</span>
            </button>
            <button 
              onClick={() => onToggleFavorite(q.id)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
              title={isFav ? "Treure de preferits" : "Afegir a preferits"}
            >
              <Star size={18} color={isFav ? "#f59e0b" : "var(--text-muted)"} fill={isFav ? "#f59e0b" : "transparent"} />
            </button>
          </div>
        </div>

        <p style={{ fontWeight: 600, marginBottom: 16, lineHeight: 1.5 }}>❓ {q.statement}</p>
        
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
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>
          {results.mode === 'study' ? 'Resultats de la Sessió d\'Estudi' : 'Resultats de l\'Examen'}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          {results.score >= 5 ? 'Felicitats! Has superat la prova.' : 'Ànims! Continua practicant per consolidar els conceptes.'}
        </p>
        
        <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: `8px solid ${results.score >= 5 ? 'var(--success)' : 'var(--error)'}`, background: 'rgba(0,0,0,0.2)' }}>
          <div>
            <span style={{ fontSize: 48, fontWeight: 800 }}>{results.score.toFixed(2)}</span>
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

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={onHome} style={{ flex: 1, minWidth: 140, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            Tornar a l'Inici
          </button>
          
          {wrongQuestions.length > 0 && (
            <button 
              onClick={() => onStartQuiz({ themes: results.themes || [], mode: 'review-failed' })} 
              style={{ flex: 1, minWidth: 140, padding: 16, borderRadius: 12, background: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
            >
              <RotateCcw size={18} />
              Repassar Fallades ({wrongQuestions.length})
            </button>
          )}

          <button onClick={handlePrint} style={{ flex: 1, minWidth: 140, padding: 16, borderRadius: 12, background: 'var(--primary)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <Printer size={18} />
            Imprimir PDF
          </button>
        </div>
      </div>

      <div className="review-container" style={{ width: '100%' }}>
        {wrongQuestions.length > 0 && (
          <div className="page-break">
            <h3 style={{ color: 'var(--error)', marginBottom: 20, fontSize: 22, marginTop: 20, borderBottom: '2px solid var(--error)', paddingBottom: 10 }}>Preguntes Fallades ({wrongQuestions.length})</h3>
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

// ----------------------------------------------------------------------
// FAILED SCREEN
// ----------------------------------------------------------------------
function FailedScreen({ questions, userStats, onSaveStats, onToggleFavorite, onExportPhoto, onHome }) {
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
          failedQuestions.map((q, idx) => {
            const isFav = (userStats._favoriteIds || []).includes(q.id);
            const acadInfo = getAcademyInfo(q.academy || 'oficial');
            return (
              <div key={q.id} className="glass review-item" style={{ padding: 20, marginBottom: 16, borderLeft: `6px solid var(--error)`, textAlign: 'left', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tema: {q.theme}</span>
                    <span className={`badge-academy ${acadInfo.badgeClass}`}>
                      {acadInfo.icon} {acadInfo.shortLabel}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="print-hide">
                    <button 
                      onClick={() => onExportPhoto && onExportPhoto(q, idx)}
                      className="btn-photo-export"
                      title="Descarregar o copiar la pregunta en format foto per als apunts"
                    >
                      <Camera size={14} />
                      <span>Foto Apunts</span>
                    </button>
                    <button 
                      onClick={() => onToggleFavorite(q.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
                      title={isFav ? "Treure de preferits" : "Afegir a preferits"}
                    >
                      <Star size={18} color={isFav ? "#f59e0b" : "var(--text-muted)"} fill={isFav ? "#f59e0b" : "transparent"} />
                    </button>
                  </div>
                </div>

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
            );
          })
        )}
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// FAVORITES SCREEN
// ----------------------------------------------------------------------
function FavoritesScreen({ questions, userStats, onSaveStats, onToggleFavorite, onExportPhoto, onStartFavoritesQuiz, onHome }) {
  const [filterTheme, setFilterTheme] = useState('ALL');
  const handlePrint = () => window.print();

  const favIds = userStats._favoriteIds || [];
  const allFavQuestions = questions.filter(q => favIds.includes(q.id));
  const favThemes = [...new Set(allFavQuestions.map(q => q.theme))].sort();

  const favQuestions = filterTheme === 'ALL'
    ? allFavQuestions
    : allFavQuestions.filter(q => q.theme === filterTheme);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', paddingTop: 40, paddingBottom: 40 }}>
      <div className="glass text-center print-hide" style={{ padding: 40, width: '100%', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16 }}>Preguntes Preferides</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          Tens <b>{favQuestions.length}</b> preguntes guardades {filterTheme !== 'ALL' ? `del tema ${filterTheme}` : 'en total'}.
        </p>

        {favThemes.length > 1 && (
          <div style={{ marginBottom: 24, textAlign: 'left', maxWidth: 400, margin: '0 auto 24px' }}>
            <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)', fontSize: 13 }}>Filtrar per Tema:</label>
            <select value={filterTheme} onChange={e => setFilterTheme(e.target.value)}>
              <option value="ALL">Tots els temes ({allFavQuestions.length})</option>
              {favThemes.map(t => {
                const count = allFavQuestions.filter(q => q.theme === t).length;
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
          
          <button onClick={handlePrint} style={{ flex: 1, minWidth: 120, padding: 18, borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <Printer size={18} />
            Imprimir
          </button>

          <button 
            disabled={favQuestions.length === 0}
            onClick={() => onStartFavoritesQuiz({ mode: 'favorites', themes: filterTheme === 'ALL' ? favThemes : [filterTheme] })}
            style={{ flex: 2, minWidth: 180, padding: 18, borderRadius: 12, background: 'var(--primary)', color: 'white', fontWeight: 600, border: 'none', cursor: favQuestions.length === 0 ? 'not-allowed' : 'pointer', opacity: favQuestions.length === 0 ? 0.5 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
          >
            <Play size={18} />
            Practicar Guardades
          </button>
        </div>
      </div>

      <div className="review-container" style={{ width: '100%' }}>
        {favQuestions.length === 0 ? (
          <div className="glass" style={{ padding: 40, textAlign: 'center' }}>
            <Star size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>Sense Preferides</h3>
            <p style={{ color: 'var(--text-muted)' }}>Pots marcar preguntes amb l'estrella per tenir-les sempre a mà aquí.</p>
          </div>
        ) : (
          favQuestions.map((q, idx) => {
            const acadInfo = getAcademyInfo(q.academy || 'oficial');
            return (
              <div key={q.id} className="glass review-item" style={{ padding: 20, marginBottom: 16, borderLeft: `6px solid #f59e0b`, textAlign: 'left', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tema: {q.theme}</span>
                    <span className={`badge-academy ${acadInfo.badgeClass}`}>
                      {acadInfo.icon} {acadInfo.shortLabel}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="print-hide">
                    <button 
                      onClick={() => onExportPhoto && onExportPhoto(q, idx)}
                      className="btn-photo-export"
                      title="Descarregar o copiar la pregunta en format foto per als apunts"
                    >
                      <Camera size={14} />
                      <span>Foto Apunts</span>
                    </button>
                    <button 
                      onClick={() => onToggleFavorite(q.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
                      title="Treure de preferits"
                    >
                      <Star size={18} color="#f59e0b" fill="#f59e0b" />
                    </button>
                  </div>
                </div>

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
            );
          })
        )}
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// SIMULACRE SCREEN (GENERADOR DE TEST EN PAPER I PDF)
// ----------------------------------------------------------------------
function SimulacreScreen({ questions, allQuestions, selectedAcademies, onToggleAcademy, onExportPhoto, onHome }) {
  const [count, setCount] = useState(40);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [themeStats, setThemeStats] = useState({});

  const generateSimulacre = (targetCount) => {
    const allThemes = [...new Set(questions.map(q => q.theme))].filter(Boolean).sort();
    if (!allThemes.length || !questions.length) {
      setSelectedQuestions([]);
      return;
    }

    const pools = {};
    allThemes.forEach(t => {
      pools[t] = [...questions.filter(q => q.theme === t)].sort(() => Math.random() - 0.5);
    });

    const validThemes = allThemes.filter(t => (pools[t] || []).length > 0);
    const chosen = [];
    const shuffledThemes = [...validThemes].sort(() => Math.random() - 0.5);

    while (chosen.length < targetCount) {
      let addedInRound = false;
      for (let i = 0; i < shuffledThemes.length && chosen.length < targetCount; i++) {
        const theme = shuffledThemes[i];
        if (pools[theme] && pools[theme].length > 0) {
          chosen.push(pools[theme].pop());
          addedInRound = true;
        }
      }
      if (!addedInRound) break;
    }

    const finalized = [...chosen].sort(() => Math.random() - 0.5);
    setSelectedQuestions(finalized);

    const dist = {};
    finalized.forEach(q => {
      dist[q.theme] = (dist[q.theme] || 0) + 1;
    });
    setThemeStats(dist);
  };

  useEffect(() => {
    if (questions.length > 0) {
      generateSimulacre(count);
    }
  }, [count, questions]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div 
      variants={pageVariants} 
      initial="initial" 
      animate="in" 
      exit="out" 
      transition={pageTransition}
      style={{ paddingTop: 30, paddingBottom: 60 }}
    >
      {/* Control Bar (Hidden when printing) */}
      <div className="glass print-hide" style={{ padding: 24, marginBottom: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: 10, borderRadius: 12 }}>
              <FileText size={26} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Generador de Simulacre</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Repartiment equitatiu per temes amb solucionari al final</p>
            </div>
          </div>
          <button 
            onClick={onHome} 
            style={{ padding: '10px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <ArrowLeft size={16} />
            Tornar al menú
          </button>
        </div>

        {/* Count selector & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Número de preguntes:</span>
            {[20, 40, 60].map(n => (
              <button
                key={n}
                onClick={() => setCount(n)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  border: count === n ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                  background: count === n ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: 'white',
                  transition: 'all 0.2s'
                }}
              >
                {n} preguntes
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => generateSimulacre(count)}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <RefreshCw size={16} />
              Regenerar
            </button>
            <button
              onClick={handlePrint}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                background: 'var(--primary)',
                color: 'white',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
              }}
            >
              <Printer size={18} />
              Imprimir / Guardar PDF
            </button>
          </div>
        </div>

        {/* Distribution info */}
        <div style={{ marginTop: 16, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span>Total preguntes seleccionades: <b>{selectedQuestions.length}</b></span>
          <span>Temes representats: <b>{Object.keys(themeStats).length}</b> temes (~{(selectedQuestions.length / Math.max(Object.keys(themeStats).length, 1)).toFixed(1)} preg/tema)</span>
        </div>
      </div>

      {/* PRINTABLE EXAM PAPER */}
      <div className="simulacre-paper" style={{ width: '100%' }}>
        {/* Exam Header */}
        <div className="glass" style={{ padding: '24px 30px', marginBottom: 24, borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16, marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Simulacre d'Examen - Bombers
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Test oficial de preparació d'oposicions • Repartiment equitatiu de temari
              </p>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
              <div><b>Total:</b> {selectedQuestions.length} preguntes</div>
              <div><b>Temps recomanat:</b> {Math.round(selectedQuestions.length * 1.2)} minuts</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
            <div><b>Nom i Cognoms:</b> ________________________________________________</div>
            <div><b>Data de realització:</b> ________________________</div>
          </div>
        </div>

        {/* Questions List (No solutions shown) */}
        <div className="questions-section">
          {selectedQuestions.map((q, idx) => {
            const acadInfo = getAcademyInfo(q.academy || 'oficial');
            return (
              <div key={q.id || idx} className="glass simulacre-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>
                    {idx + 1}. {q.statement}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Tema: {q.theme}</span>
                  <span>• {acadInfo.label}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {['A', 'B', 'C', 'D'].map(opt => {
                    if (!q.options || !q.options[opt]) return null;
                    return (
                      <div key={opt} className="simulacre-option">
                        <span style={{ fontWeight: 600, minWidth: 28 }}>[ &nbsp; ] {opt})</span>
                        <span>{q.options[opt]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* SOLUTIONS SECTION (Starts strictly on a new page) */}
        <div className="page-break" style={{ marginTop: 40, paddingTop: 20 }}>
          <div className="glass" style={{ padding: '24px 30px', marginBottom: 24, borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
              Plantilla de Respostes i Solucionari
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Comprova i avalua el teu simulacre un cop hagis finalitzat totes les preguntes.
            </p>
          </div>

          {/* Quick Answers Grid Table */}
          <div className="glass" style={{ padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Resum Ràpid de Solucions</h3>
            <div className="solution-grid">
              {selectedQuestions.map((q, idx) => (
                <div key={idx} className="solution-cell">
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pregunta {idx + 1}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>{q.correct}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Solutions & Explanations */}
          <div className="glass" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Solucions Detallades i Justificació</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {selectedQuestions.map((q, idx) => {
                const acadInfo = getAcademyInfo(q.academy || 'oficial');
                return (
                  <div key={idx} style={{ padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 10, borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontWeight: 700 }}>Pregunta {idx + 1}</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Tema: {q.theme}</span>
                        <span className={`badge-academy ${acadInfo.badgeClass}`}>{acadInfo.shortLabel}</span>
                        <button 
                          onClick={() => onExportPhoto && onExportPhoto(q, idx)}
                          className="btn-photo-export print-hide"
                          style={{ padding: '3px 8px', fontSize: 11 }}
                          title="Descarregar o copiar com a foto per als apunts"
                        >
                          <Camera size={13} />
                          <span>Foto Apunts</span>
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, marginBottom: 10, fontWeight: 500 }}>{q.statement}</p>
                    
                    <div style={{ fontSize: 13, marginBottom: 8, color: 'var(--success)', fontWeight: 600 }}>
                      ✓ Resposta correcta: {q.correct}) {q.options ? q.options[q.correct] : ''}
                    </div>

                    {q.explanation && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 6, marginTop: 6, whiteSpace: 'pre-line' }}>
                        <b>Explicació:</b> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// THEME SELECTOR SCREEN (MODE LLISTA PER TEMES)
// ----------------------------------------------------------------------
function ThemeSelectorScreen({ 
  questions, 
  filteredQuestions, 
  selectedAcademies, 
  onToggleAcademy, 
  onSetAllAcademies, 
  userStats, 
  onSaveStats, 
  onSelectTheme, 
  onHome 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const allThemes = [...new Set(filteredQuestions.map(q => q.theme))].filter(Boolean).sort();
  const themeProgress = userStats._themeProgress || {};

  let totalQuestionsCount = filteredQuestions.length;
  let totalAnsweredCount = 0;
  let totalCorrectCount = 0;
  let totalWrongCount = 0;

  allThemes.forEach(t => {
    const prog = themeProgress[t] || {};
    const answeredKeys = Object.keys(prog);
    totalAnsweredCount += answeredKeys.length;
    answeredKeys.forEach(k => {
      if (prog[k]?.isCorrect) totalCorrectCount++;
      else totalWrongCount++;
    });
  });

  const totalPercent = totalQuestionsCount > 0 ? Math.round((totalAnsweredCount / totalQuestionsCount) * 100) : 0;

  const filteredThemes = allThemes.filter(t => 
    t.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleResetThemeProgress = (theme, e) => {
    e.stopPropagation();
    if (window.confirm(`Vols reiniciar el progrés desat del tema "${theme}"?`)) {
      const statsCopy = { ...userStats };
      const newThemeProg = { ...(statsCopy._themeProgress || {}) };
      delete newThemeProg[theme];
      statsCopy._themeProgress = newThemeProg;
      onSaveStats(statsCopy);
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} style={{ paddingTop: 20, paddingBottom: 50 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button 
          onClick={onHome} 
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', padding: '10px 16px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}
        >
          <ArrowLeft size={18} />
          Inici
        </button>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Estudi en Llista per Temes</h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Progrés desat automàticament</span>
        </div>
      </header>

      {/* Academy Filter Bar */}
      <div className="glass" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Filtrar Bancs de Preguntes:</span>
          <button onClick={() => onSetAllAcademies(true)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            Totes ({questions.length.toLocaleString()})
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {ACADEMIES_CONFIG.map(acad => {
            const isSelected = selectedAcademies.includes(acad.id);
            const count = questions.filter(q => (q.academy || 'oficial') === acad.id).length;
            return (
              <button
                key={acad.id}
                onClick={() => onToggleAcademy(acad.id)}
                className={`academy-pill ${isSelected ? `active-${acad.id}` : ''}`}
                style={{ padding: '7px 12px', fontSize: 12 }}
              >
                <span>{acad.icon} {acad.shortLabel}</span>
                <span style={{ opacity: 0.8, fontSize: 11 }}>({count.toLocaleString()})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Progress Overview */}
      <div className="glass" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Progrés Global del Temari</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>{totalPercent}%</span>
        </div>
        <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--success))', width: `${totalPercent}%`, transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
          <span><b>{totalAnsweredCount}</b> de <b>{totalQuestionsCount.toLocaleString()}</b> preguntes contestades</span>
          <span><b style={{ color: 'var(--success)' }}>{totalCorrectCount}</b> encerts • <b style={{ color: 'var(--error)' }}>{totalWrongCount}</b> errors</span>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 16, position: 'relative' }}>
        <input 
          type="text"
          placeholder="Cerca un tema (ex: T33, rescat, foc, física...)"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ paddingLeft: 42 }}
        />
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')} 
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Themes List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredThemes.map(theme => {
          const themeQuestions = filteredQuestions.filter(q => q.theme === theme);
          const totalQ = themeQuestions.length;
          const prog = themeProgress[theme] || {};
          const answeredKeys = Object.keys(prog);
          const answered = answeredKeys.length;
          const correct = answeredKeys.filter(k => prog[k]?.isCorrect).length;
          const wrong = answeredKeys.filter(k => !prog[k]?.isCorrect).length;
          const percent = totalQ > 0 ? Math.round((answered / totalQ) * 100) : 0;
          const isCompleted = answered > 0 && answered === totalQ;

          return (
            <div 
              key={theme}
              onClick={() => onSelectTheme(theme)}
              className="glass"
              style={{
                padding: 18,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: isCompleted ? '1px solid rgba(16, 185, 129, 0.4)' : (answered > 0 ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.05)')
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 10 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>{theme}</h3>
                {isCompleted ? (
                  <span style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', padding: '3px 8px', borderRadius: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    ✓ Completat
                  </span>
                ) : answered > 0 ? (
                  <span style={{ fontSize: 11, background: 'rgba(59, 130, 246, 0.2)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {percent}%
                  </span>
                ) : (
                  <span style={{ fontSize: 11, background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', padding: '3px 8px', borderRadius: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {totalQ} preg.
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ height: '100%', background: isCompleted ? 'var(--success)' : 'var(--primary)', width: `${percent}%`, transition: 'width 0.3s' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <div style={{ color: 'var(--text-muted)', display: 'flex', gap: 10 }}>
                  <span><b>{answered}</b>/{totalQ} respostes</span>
                  {answered > 0 && (
                    <>
                      <span style={{ color: 'var(--success)' }}>✓ {correct}</span>
                      <span style={{ color: 'var(--error)' }}>✗ {wrong}</span>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {answered > 0 && (
                    <button 
                      onClick={(e) => handleResetThemeProgress(theme, e)}
                      title="Reiniciar progrés del tema"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--error)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                    {answered === 0 ? 'Començar' : 'Continuar'} <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// THEME LIST SCREEN (CONTESTAR EN LLISTA CONTÍNUA AMB PROGRÉS DESAT)
// ----------------------------------------------------------------------
function ThemeListScreen({ theme, questions, selectedAcademies, userStats, onSaveStats, onToggleFavorite, onExportPhoto, onBackToThemes, onHome }) {
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'answered', 'wrong', 'favorites'
  const [academyFilter, setAcademyFilter] = useState('all'); // 'all', 'oficial', 'racord', 'academia'
  const [searchTerm, setSearchTerm] = useState('');

  // All questions of this theme
  const allThemeQuestions = questions.filter(q => q.theme === theme);
  const themeProgress = (userStats._themeProgress && userStats._themeProgress[theme]) || {};
  const favoriteIds = userStats._favoriteIds || [];

  // Theme questions filtered by active academy filter
  const themeQuestions = allThemeQuestions.filter(q => {
    if (academyFilter !== 'all') {
      return (q.academy || 'oficial') === academyFilter;
    }
    return true;
  });

  const totalCount = themeQuestions.length;
  const answeredKeys = Object.keys(themeProgress).filter(id => themeQuestions.some(q => String(q.id) === String(id)));
  const answeredCount = answeredKeys.length;
  const correctCount = answeredKeys.filter(k => themeProgress[k]?.isCorrect).length;
  const wrongCount = answeredKeys.filter(k => !themeProgress[k]?.isCorrect).length;
  const pendingCount = totalCount - answeredCount;
  const percent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  const handleAnswer = (q, opt) => {
    const isCorrect = (opt === q.correct);
    const newProgress = {
      ...(userStats._themeProgress || {}),
      [theme]: {
        ...((userStats._themeProgress || {})[theme] || {}),
        [q.id]: { answer: opt, isCorrect, answeredAt: Date.now() }
      }
    };

    const statsCopy = { ...userStats, _themeProgress: newProgress };
    if (!statsCopy._failedIds) statsCopy._failedIds = [];
    if (!statsCopy._favoriteIds) statsCopy._favoriteIds = [];

    // Sync failed IDs
    if (!isCorrect) {
      if (!statsCopy._failedIds.includes(q.id)) {
        statsCopy._failedIds.push(q.id);
      }
    } else {
      statsCopy._failedIds = statsCopy._failedIds.filter(id => id !== q.id);
    }

    onSaveStats(statsCopy);
  };

  const handleRetryQuestion = (qId) => {
    const currentThemeProg = { ...((userStats._themeProgress || {})[theme] || {}) };
    delete currentThemeProg[qId];
    const newProgress = {
      ...(userStats._themeProgress || {}),
      [theme]: currentThemeProg
    };
    const statsCopy = { ...userStats, _themeProgress: newProgress };
    onSaveStats(statsCopy);
  };

  const handleResetThisTheme = () => {
    if (window.confirm(`Estàs segur que vols reiniciar tot el progrés de les preguntes d'aquest tema?`)) {
      const newProgress = { ...(userStats._themeProgress || {}) };
      delete newProgress[theme];
      const statsCopy = { ...userStats, _themeProgress: newProgress };
      onSaveStats(statsCopy);
    }
  };

  const jumpToNextPending = () => {
    const nextPending = themeQuestions.find(q => !themeProgress[q.id]);
    if (nextPending) {
      const el = document.getElementById(`theme-q-${nextPending.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.boxShadow = '0 0 0 3px var(--primary)';
        setTimeout(() => { el.style.boxShadow = ''; }, 1600);
      }
    } else {
      alert("Felicitats! Ja has contestat totes les preguntes d'aquest tema.");
    }
  };

  // Filter questions
  const displayedQuestions = themeQuestions.filter(q => {
    const prog = themeProgress[q.id];
    const isFav = favoriteIds.includes(q.id);

    if (filter === 'pending' && prog) return false;
    if (filter === 'answered' && !prog) return false;
    if (filter === 'wrong' && (!prog || prog.isCorrect)) return false;
    if (filter === 'favorites' && !isFav) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchStatement = q.statement.toLowerCase().includes(term);
      const matchOptions = Object.values(q.options || {}).some(v => v.toLowerCase().includes(term));
      if (!matchStatement && !matchOptions) return false;
    }

    return true;
  });

  return (
    <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} style={{ paddingTop: 20, paddingBottom: 60 }}>
      {/* Top Header & Sticky Control Bar */}
      <div className="glass" style={{ padding: 20, marginBottom: 20, position: 'sticky', top: 10, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button 
              onClick={onBackToThemes}
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}
            >
              <ArrowLeft size={16} />
              Temari
            </button>
            <h2 style={{ fontSize: 16, fontWeight: 700, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {theme}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {answeredCount > 0 && (
              <button 
                onClick={handleResetThisTheme}
                title="Reiniciar aquest tema"
                style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: 'var(--error)', padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <RotateCcw size={13} />
                Reiniciar
              </button>
            )}
            <button 
              onClick={onHome}
              title="Tornar a l'inici"
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-muted)', padding: '6px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}
            >
              Inici
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span>Progrés: <b>{answeredCount}</b> / {totalCount} ({percent}%)</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ {correctCount}</span>
              <span style={{ color: 'var(--error)', fontWeight: 600 }}>✗ {wrongCount}</span>
              <span style={{ color: 'var(--text-muted)' }}>⏳ {pendingCount} pendents</span>
            </div>
          </div>
          <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: percent === 100 ? 'var(--success)' : 'linear-gradient(90deg, var(--primary), var(--success))', width: `${percent}%`, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Academy Filter Buttons */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 8 }}>
          <button 
            className={`filter-chip ${academyFilter === 'all' ? 'active' : ''}`} 
            onClick={() => setAcademyFilter('all')}
          >
            Tots els bancs ({allThemeQuestions.length})
          </button>
          {ACADEMIES_CONFIG.map(acad => {
            const count = allThemeQuestions.filter(q => (q.academy || 'oficial') === acad.id).length;
            if (count === 0) return null;
            return (
              <button
                key={acad.id}
                className={`filter-chip ${academyFilter === acad.id ? 'active' : ''}`}
                onClick={() => setAcademyFilter(acad.id)}
              >
                {acad.icon} {acad.shortLabel} ({count})
              </button>
            );
          })}
        </div>

        {/* Action Controls & Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, maxWidth: '100%' }}>
            <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
              Totes ({totalCount})
            </button>
            <button className={`filter-chip ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
              Pendents ({pendingCount})
            </button>
            <button className={`filter-chip ${filter === 'answered' ? 'active' : ''}`} onClick={() => setFilter('answered')}>
              Contestades ({answeredCount})
            </button>
            {wrongCount > 0 && (
              <button className={`filter-chip ${filter === 'wrong' ? 'active' : ''}`} onClick={() => setFilter('wrong')} style={{ color: filter === 'wrong' ? 'white' : 'var(--error)' }}>
                Errors ({wrongCount})
              </button>
            )}
            <button className={`filter-chip ${filter === 'favorites' ? 'active' : ''}`} onClick={() => setFilter('favorites')}>
              ⭐ Preferits ({themeQuestions.filter(q => favoriteIds.includes(q.id)).length})
            </button>
          </div>

          {pendingCount > 0 && (
            <button 
              onClick={jumpToNextPending}
              style={{
                padding: '7px 14px',
                borderRadius: 10,
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 10px rgba(59, 130, 246, 0.3)',
                whiteSpace: 'nowrap'
              }}
            >
              <ArrowDown size={14} />
              Següent Pendent
            </button>
          )}
        </div>
      </div>

      {/* Questions Scrollable List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {displayedQuestions.length === 0 ? (
          <div className="glass" style={{ padding: 40, textAlign: 'center' }}>
            <CheckCircle2 size={40} color="var(--success)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 18, marginBottom: 6 }}>No hi ha preguntes amb aquest filtre</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Canvia el filtre per veure altres preguntes del tema.</p>
          </div>
        ) : (
          displayedQuestions.map((q, idx) => {
            const prog = themeProgress[q.id];
            const isAnswered = !!prog;
            const isCorrect = prog?.isCorrect;
            const userAns = prog?.answer;
            const isFav = favoriteIds.includes(q.id);
            const originalIndex = themeQuestions.findIndex(item => item.id === q.id);
            const acadInfo = getAcademyInfo(q.academy || 'oficial');

            let cardBorder = '1px solid rgba(255, 255, 255, 0.06)';
            if (isAnswered) {
              cardBorder = isCorrect ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)';
            }

            return (
              <div 
                key={q.id}
                id={`theme-q-${q.id}`}
                className="glass theme-q-card"
                style={{
                  padding: 22,
                  border: cardBorder,
                  borderRadius: 16,
                  position: 'relative'
                }}
              >
                {/* Header of Question */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: 6, color: 'white' }}>
                      #{originalIndex + 1}
                    </span>
                    <span className={`badge-academy ${acadInfo.badgeClass}`}>
                      {acadInfo.icon} {acadInfo.label}
                    </span>
                    {q.section && q.section !== q.theme && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>• {q.section}</span>
                    )}
                    {isAnswered ? (
                      isCorrect ? (
                        <span style={{ fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                          <CheckCircle2 size={14} /> Correcta
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                          <XCircle size={14} /> Fallada (Correcta: {q.correct})
                        </span>
                      )
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        ⏳ Pendent
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isAnswered && (
                      <button
                        onClick={() => handleRetryQuestion(q.id)}
                        title="Tornar a respondre aquesta pregunta"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: 'none',
                          color: 'var(--text-muted)',
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <RotateCcw size={12} />
                        Reintentar
                      </button>
                    )}
                    <button 
                      onClick={() => onExportPhoto && onExportPhoto(q, idx)}
                      className="btn-photo-export"
                      style={{ padding: '4px 8px', fontSize: 11 }}
                      title="Descarregar o copiar la pregunta en format foto per als apunts"
                    >
                      <Camera size={13} />
                      <span>Foto Apunts</span>
                    </button>
                    <button 
                      onClick={() => onToggleFavorite(q.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
                      title={isFav ? "Treure de preferits" : "Afegir a preferits"}
                    >
                      <Star size={18} color={isFav ? "#f59e0b" : "var(--text-muted)"} fill={isFav ? "#f59e0b" : "transparent"} />
                    </button>
                  </div>
                </div>

                {/* Statement */}
                <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, marginBottom: 18, color: 'white' }}>
                  {q.statement}
                </p>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  {['A', 'B', 'C', 'D'].map(opt => {
                    if (!q.options || !q.options[opt]) return null;

                    let btnStyle = {
                      padding: 14,
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      color: 'var(--text)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      textAlign: 'left',
                      cursor: isAnswered ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      fontSize: 14,
                      lineHeight: 1.4
                    };

                    let letterBg = 'rgba(255,255,255,0.1)';
                    let letterColor = 'white';

                    if (isAnswered) {
                      if (opt === q.correct) {
                        btnStyle.background = 'rgba(16, 185, 129, 0.15)';
                        btnStyle.border = '1px solid var(--success)';
                        btnStyle.color = 'var(--success)';
                        letterBg = 'var(--success)';
                        letterColor = 'white';
                      } else if (opt === userAns && !isCorrect) {
                        btnStyle.background = 'rgba(239, 68, 68, 0.15)';
                        btnStyle.border = '1px solid var(--error)';
                        btnStyle.color = 'var(--error)';
                        letterBg = 'var(--error)';
                        letterColor = 'white';
                      }
                    }

                    return (
                      <button
                        key={opt}
                        disabled={isAnswered}
                        onClick={() => handleAnswer(q, opt)}
                        style={btnStyle}
                        onMouseOver={e => {
                          if (!isAnswered) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                          }
                        }}
                        onMouseOut={e => {
                          if (!isAnswered) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                          }
                        }}
                      >
                        <span style={{ 
                          width: 26, 
                          height: 26, 
                          borderRadius: '50%', 
                          background: letterBg, 
                          color: letterColor, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: 700, 
                          fontSize: 13, 
                          flexShrink: 0 
                        }}>
                          {opt}
                        </span>
                        <span style={{ flex: 1, marginTop: 2 }}>{q.options[opt]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation (shown when answered) */}
                {isAnswered && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    style={{ 
                      padding: 14, 
                      background: 'rgba(0,0,0,0.25)', 
                      borderRadius: 10, 
                      borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}`,
                      fontSize: 13,
                      lineHeight: 1.5
                    }}
                  >
                    <div style={{ fontWeight: 600, color: isCorrect ? 'var(--success)' : 'var(--error)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isCorrect ? <Check size={16} /> : <X size={16} />}
                      {isCorrect ? 'Correcte!' : `Incorrecte — La resposta correcta és la ${q.correct}`}
                    </div>
                    <div style={{ color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>
                      <b>Explicació:</b> {q.explanation || 'Sense explicació addicional.'}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
