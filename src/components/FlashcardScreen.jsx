import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, RotateCcw, CheckCircle2, XCircle, AlertTriangle, 
  HelpCircle, Layers, Eye, Trophy, RefreshCw, Zap,
  Check, ArrowRight, Shield, Flame, BookOpen, Plus, Edit2, Trash2,
  Settings2, Search, X, Play, BookMarked, List, Sparkles, ChevronRight
} from 'lucide-react';
import { FLASHCARDS_T20, PictogramIcons } from '../data/flashcards_t20';

export default function FlashcardScreen({ userStats, onSaveStats, onHome }) {
  // Navigation states: 'theme_select' | 'theme_hub' | 'study_game' | 'browse_cards'
  const [viewState, setViewState] = useState('theme_select');
  const [selectedThemeId, setSelectedThemeId] = useState('T20');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');

  // Custom cards state
  const [customCards, setCustomCards] = useState(() => {
    if (userStats?._customFlashcards) return userStats._customFlashcards;
    const saved = localStorage.getItem('firetest_custom_flashcards_t20');
    return saved ? JSON.parse(saved) : [];
  });

  // Card editor modal
  const [editingCard, setEditingCard] = useState(null); // null or { isNew: true } or card object
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCardId, setExpandedCardId] = useState(null);

  // Form state
  const [formCategory, setFormCategory] = useState('pictogrames_marcatge');
  const [formCategoryName, setFormCategoryName] = useState('🏷️ Pictogrames de Marcatge');
  const [formPrompt, setFormPrompt] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formExplanation, setFormExplanation] = useState('');
  const [formKeyPoints, setFormKeyPoints] = useState('');
  const [formHint, setFormHint] = useState('');
  const [formIconKey, setFormIconKey] = useState('none');

  // Active game queue state
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userGuess, setUserGuess] = useState('');
  const [showHint, setShowHint] = useState(false);
  
  // Game session stats
  const [masteredIds, setMasteredIds] = useState(new Set());
  const [failedSessionIds, setFailedSessionIds] = useState(new Set());
  const [initialCount, setInitialCount] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [firstTryCorrectCount, setFirstTryCorrectCount] = useState(0);

  const textInputRef = useRef(null);

  // Save custom cards
  const saveCustomCardsList = (updatedList) => {
    setCustomCards(updatedList);
    localStorage.setItem('firetest_custom_flashcards_t20', JSON.stringify(updatedList));
    if (userStats && onSaveStats) {
      onSaveStats({
        ...userStats,
        _customFlashcards: updatedList
      });
    }
  };

  // Combine default and custom cards
  const allCards = [...FLASHCARDS_T20, ...customCards];

  // List of themes
  const themesList = [
    {
      id: 'T20',
      num: '20',
      title: 'Equips de Protecció Individual (EPI)',
      desc: 'Pictogrames de marcatge, vestits químics 1-6, valors de seguretat ERA i normes EN',
      cardCount: allCards.length,
      available: true,
      color: '#ec4899',
      icon: Shield
    },
    {
      id: 'T27',
      num: '27',
      title: 'Intervenció bàsica en riscos NRBQ',
      desc: 'Pictogrames CLP/GHS, codis ADR de perill, distàncies i zones calenta/tèbia/freda',
      cardCount: 0,
      available: false,
      color: '#f59e0b',
      icon: Flame
    },
    {
      id: 'T13',
      num: '13',
      title: 'Hidràulica',
      desc: 'Cabals de mànegues 25/45/70mm, pèrdues de càrrega, pressions de bomba i reaccions',
      cardCount: 0,
      available: false,
      color: '#3b82f6',
      icon: Zap
    },
    {
      id: 'T01',
      num: '01',
      title: 'Constitució Espanyola i EAC',
      desc: 'Articles clau de drets fonamentals, competències i estructura institucional',
      cardCount: 0,
      available: false,
      color: '#8b5cf6',
      icon: BookOpen
    }
  ];

  // Sub-blocks for Tema 20
  const subCategoriesT20 = [
    { id: 'all', name: '🌟 Tot el Tema 20 (Barreja Completa)', desc: 'Totes les targetes combinades', color: '#3b82f6', icon: Layers },
    { id: 'pictogrames_marcatge', name: '🏷️ Pictogrames de Marcatge', desc: 'Fred, Químic, Estàtica, Foc, Radioactivitat, Biològic', color: '#8b5cf6', icon: Shield },
    { id: 'vestits_quimics', name: '☣️ Vestits Químics (Tipus 1 al 6)', desc: 'Hermeticitat, reutilització i pictogrames específics', color: '#ec4899', icon: Zap },
    { id: 'numeros_era', name: '🔢 Valors Numèrics & ERA', desc: 'Pressions 300/50 bar, mitja pressió, sobrepressió i autonomia', color: '#f59e0b', icon: Flame },
    { id: 'normes_categories', name: '📜 Categories & Normes EN', desc: 'Cat I/II/III, botes F/P/A/CI/HI, UNE-EN 469, 15614, 137, 443', color: '#10b981', icon: BookOpen }
  ];

  // Start study game
  const startGame = (subCatId = 'all') => {
    setSelectedSubCategory(subCatId);
    let pool = allCards;
    if (subCatId !== 'all') {
      pool = allCards.filter(c => c.category === subCatId);
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setUserGuess('');
    setShowHint(false);
    setMasteredIds(new Set());
    setFailedSessionIds(new Set());
    setInitialCount(shuffled.length);
    setFirstTryCorrectCount(0);
    setGameCompleted(false);
    setViewState('study_game');
  };

  // Keyboard controls for game
  useEffect(() => {
    if (viewState !== 'study_game' || gameCompleted) return;

    const handleKeyDown = (e) => {
      const isInputActive = document.activeElement === textInputRef.current;

      if (e.key === 'Enter') {
        if (!isFlipped) setIsFlipped(true);
      } else if (e.key === ' ' && !isInputActive) {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (isFlipped && !isInputActive) {
        if (e.key === '1') handleRate('fail');
        if (e.key === '2') handleRate('hard');
        if (e.key === '3') handleRate('good');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewState, isFlipped, currentIndex, queue, gameCompleted]);

  const currentCard = queue[currentIndex];

  const handleRate = (rating) => {
    if (!currentCard) return;
    const cardId = currentCard.id;
    const isFirstTimeSeeing = !failedSessionIds.has(cardId) && !masteredIds.has(cardId);

    if (rating === 'good') {
      const newMastered = new Set(masteredIds).add(cardId);
      setMasteredIds(newMastered);

      if (isFirstTimeSeeing) {
        setFirstTryCorrectCount(prev => prev + 1);
      }

      if (userStats) {
        const fcStats = userStats._flashcards || {};
        const cardRecord = fcStats[cardId] || { correct: 0, wrong: 0, repetitions: 0 };
        cardRecord.correct += 1;
        cardRecord.repetitions += 1;
        cardRecord.lastReviewed = new Date().toISOString();
        
        onSaveStats({
          ...userStats,
          _flashcards: { ...fcStats, [cardId]: cardRecord }
        });
      }

      advanceQueue();
    } else {
      const newFailed = new Set(failedSessionIds).add(cardId);
      setFailedSessionIds(newFailed);

      if (userStats) {
        const fcStats = userStats._flashcards || {};
        const cardRecord = fcStats[cardId] || { correct: 0, wrong: 0, repetitions: 0 };
        cardRecord.wrong += 1;
        cardRecord.repetitions += 1;
        cardRecord.lastReviewed = new Date().toISOString();
        
        onSaveStats({
          ...userStats,
          _flashcards: { ...fcStats, [cardId]: cardRecord }
        });
      }

      const newQueue = [...queue];
      const reinsertDistance = rating === 'fail' ? 2 : 4;
      const targetIndex = Math.min(newQueue.length, currentIndex + reinsertDistance + 1);
      
      newQueue.splice(targetIndex, 0, currentCard);
      setQueue(newQueue);
      advanceQueue();
    }
  };

  const advanceQueue = () => {
    setIsFlipped(false);
    setUserGuess('');
    setShowHint(false);

    if (currentIndex + 1 >= queue.length) {
      setGameCompleted(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleOpenAddNew = () => {
    setEditingCard({ isNew: true });
    setFormCategory('pictogrames_marcatge');
    setFormCategoryName('🏷️ Pictogrames de Marcatge');
    setFormPrompt('');
    setFormAnswer('');
    setFormExplanation('');
    setFormKeyPoints('');
    setFormHint('');
    setFormIconKey('none');
  };

  const handleOpenEdit = (card) => {
    setEditingCard(card);
    setFormCategory(card.category || 'pictogrames_marcatge');
    setFormCategoryName(card.categoryName || 'Personalitzada');
    setFormPrompt(card.prompt || '');
    setFormAnswer(card.answer || '');
    setFormExplanation(card.explanation || '');
    setFormKeyPoints(card.keyPoints ? card.keyPoints.join('\n') : '');
    setFormHint(card.hint || '');
    setFormIconKey(card.iconKey || 'none');
  };

  const handleSaveCard = (e) => {
    e.preventDefault();
    if (!formPrompt.trim() || !formAnswer.trim()) {
      alert('Has d\'omplir almenys la pregunta i la resposta.');
      return;
    }

    const keyPointsArray = formKeyPoints
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const categoryNamesMap = {
      'pictogrames_marcatge': '🏷️ Pictogrames de Marcatge',
      'vestits_quimics': '☣️ Vestits Químics (Tipus 1-6)',
      'numeros_era': '🔢 Valors Numèrics & ERA',
      'normes_categories': '📜 Categories & Normes EN',
      'personalitzat': '⭐ Targetes Pròpies'
    };

    const finalCategoryName = categoryNamesMap[formCategory] || formCategoryName || '⭐ Targetes Pròpies';

    if (editingCard?.isNew) {
      const newCard = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        category: formCategory,
        categoryName: finalCategoryName,
        prompt: formPrompt.trim(),
        answer: formAnswer.trim(),
        explanation: formExplanation.trim(),
        keyPoints: keyPointsArray.length > 0 ? keyPointsArray : null,
        hint: formHint.trim() || null,
        iconKey: formIconKey !== 'none' ? formIconKey : null,
        isCustom: true
      };
      saveCustomCardsList([...customCards, newCard]);
    } else if (editingCard) {
      const updated = customCards.map(c => {
        if (c.id === editingCard.id) {
          return {
            ...c,
            category: formCategory,
            categoryName: finalCategoryName,
            prompt: formPrompt.trim(),
            answer: formAnswer.trim(),
            explanation: formExplanation.trim(),
            keyPoints: keyPointsArray.length > 0 ? keyPointsArray : null,
            hint: formHint.trim() || null,
            iconKey: formIconKey !== 'none' ? formIconKey : null
          };
        }
        return c;
      });
      saveCustomCardsList(updated);
    }

    setEditingCard(null);
  };

  const handleDeleteCustomCard = (cardId) => {
    if (window.confirm('Segur que vols eliminar aquesta targeta personalitzada?')) {
      const updated = customCards.filter(c => c.id !== cardId);
      saveCustomCardsList(updated);
      if (editingCard?.id === cardId) setEditingCard(null);
    }
  };

  // =========================================================================
  // VIEW 1: SELECCIÓ DE TEMES
  // =========================================================================
  if (viewState === 'theme_select') {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 880, margin: '0 auto' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button 
            onClick={onHome}
            style={{ 
              background: 'rgba(255,255,255,0.08)', 
              border: '1px solid rgba(255,255,255,0.15)', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: 10, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            <ArrowLeft size={18} />
            Tornar a l'Inici
          </button>

          <span style={{ fontSize: 13, fontWeight: 700, color: '#ec4899', background: 'rgba(236, 72, 153, 0.15)', padding: '4px 12px', borderRadius: 8, border: '1px solid rgba(236, 72, 153, 0.3)' }}>
            🧠 Mètode Anki & Flashcards
          </span>
        </div>

        {/* Hero banner */}
        <div 
          className="glass" 
          style={{ 
            padding: 26, 
            borderRadius: 20, 
            marginBottom: 26, 
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(139, 92, 246, 0.3) 100%)',
            border: '1px solid rgba(236, 72, 153, 0.45)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', padding: 14, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(236, 72, 153, 0.4)' }}>
              <Zap size={32} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px 0' }}>
                Targetes de Memòria (Anki) per Temes
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0, lineHeight: 1.4 }}>
                Selecciona un tema per accedir al seu espai de memorització. Podràs <b>jugar a recordar sense opcions</b> o <b>veure i consultar totes les targetes</b>.
              </p>
            </div>
          </div>
        </div>

        {/* Themes List */}
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={18} color="var(--primary)" />
          Tria el Tema a Estudiar:
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {themesList.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.id}
                onClick={() => {
                  if (t.available) {
                    setSelectedThemeId(t.id);
                    setViewState('theme_hub');
                  }
                }}
                className="glass"
                style={{
                  padding: 20,
                  borderRadius: 16,
                  cursor: t.available ? 'pointer' : 'default',
                  border: t.available ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.05)',
                  background: t.available ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.2)',
                  opacity: t.available ? 1 : 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => {
                  if (t.available) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = t.color;
                    e.currentTarget.style.boxShadow = `0 6px 20px ${t.color}25`;
                  }
                }}
                onMouseOut={e => {
                  if (t.available) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ background: `${t.color}25`, border: `1px solid ${t.color}50`, padding: 14, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={26} color={t.color} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, background: t.color, color: 'white', padding: '2px 8px', borderRadius: 6 }}>
                        TEMA {t.num}
                      </span>
                      <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'white' }}>{t.title}</h3>
                      {t.available ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: 6 }}>
                          {t.cardCount} Targetes disponibles
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 6 }}>
                          Properament
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                      {t.desc}
                    </p>
                  </div>
                </div>

                {t.available && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.color, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    Entrar <ChevronRight size={18} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // =========================================================================
  // VIEW 2: THEME HUB (TEMA 20) - OPCIÓ JOC O VEURE TARGETES
  // =========================================================================
  if (viewState === 'theme_hub') {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 880, margin: '0 auto' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button 
            onClick={() => setViewState('theme_select')}
            style={{ 
              background: 'rgba(255,255,255,0.08)', 
              border: '1px solid rgba(255,255,255,0.15)', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: 10, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            <ArrowLeft size={18} />
            Canviar de Tema
          </button>

          <span style={{ fontSize: 13, fontWeight: 800, background: 'rgba(236, 72, 153, 0.2)', color: '#ec4899', padding: '4px 12px', borderRadius: 8, border: '1px solid rgba(236, 72, 153, 0.4)' }}>
            TEMA 20 • {allCards.length} TARGETES
          </span>
        </div>

        {/* Theme Title Card */}
        <div className="glass" style={{ padding: 24, borderRadius: 20, marginBottom: 24, background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.35) 0%, rgba(88, 28, 135, 0.35) 100%)', border: '1px solid rgba(99, 102, 241, 0.35)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px 0' }}>
            Tema 20: Equips de Protecció Individual (EPI)
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            Tria si vols iniciar el **joc de repetició espaiada (Anki)** per memoritzar activament o **veure el catàleg de totes les targetes** amb els seus pictogrames i respostes.
          </p>
        </div>

        {/* TWO PRIMARY ACTIONS: JOC vs CONSULTA */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 28 }}>
          {/* Action 1: Començar el joc */}
          <div 
            onClick={() => startGame('all')}
            className="glass" 
            style={{ 
              padding: 24, 
              borderRadius: 18, 
              cursor: 'pointer', 
              border: '1px solid rgba(16, 185, 129, 0.4)', 
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.2) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 16,
              transition: 'all 0.2s',
              boxShadow: '0 6px 24px rgba(16, 185, 129, 0.15)'
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.8)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)'; }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ background: '#10b981', padding: 12, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={26} color="white" fill="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'white' }}>Començar el Joc (Anki)</h3>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>Active Recall & Repetició</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Es mostren els pictogrames i preguntes sense opcions. Pensa o escriu la resposta, comprova-la i el sistema tornarà a preguntar les que fallis!
              </p>
            </div>

            <button style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#10b981', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Jugar a Tot el Tema <ArrowRight size={16} />
            </button>
          </div>

          {/* Action 2: Veure totes les targetes */}
          <div 
            onClick={() => setViewState('browse_cards')}
            className="glass" 
            style={{ 
              padding: 24, 
              borderRadius: 18, 
              cursor: 'pointer', 
              border: '1px solid rgba(139, 92, 246, 0.4)', 
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.2) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 16,
              transition: 'all 0.2s',
              boxShadow: '0 6px 24px rgba(139, 92, 246, 0.15)'
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.8)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)'; }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ background: '#8b5cf6', padding: 12, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookMarked size={26} color="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'white' }}>Veure Totes les Targetes</h3>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#c084fc' }}>Catàleg i Consulta Ràpida</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Consulta el llistat complet de targetes amb els dibuixos, respostes correctes, explicacions i punts clau per llegir i estudiar com un resum.
              </p>
            </div>

            <button style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(139, 92, 246, 0.3)', border: '1px solid #8b5cf6', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Consultar Targetes ({allCards.length}) <List size={16} />
            </button>
          </div>
        </div>

        {/* Sub-blocks for Game Mode */}
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} color="#ec4899" />
          O Jugar a un Bloc Específic del Tema 20:
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 28 }}>
          {subCategoriesT20.filter(sc => sc.id !== 'all').map((sc) => {
            const count = allCards.filter(c => c.category === sc.id).length;
            const Icon = sc.icon;
            return (
              <div
                key={sc.id}
                onClick={() => startGame(sc.id)}
                className="glass"
                style={{
                  padding: 16,
                  borderRadius: 14,
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = sc.color;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ background: `${sc.color}20`, padding: 8, borderRadius: 10 }}>
                    <Icon size={18} color={sc.color} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{sc.name}</h4>
                    <span style={{ fontSize: 11, color: sc.color, fontWeight: 600 }}>{count} targetes</span>
                  </div>
                </div>
                <Play size={14} color={sc.color} fill={sc.color} />
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // =========================================================================
  // VIEW 3: BROWSE ALL CARDS (CATÀLEG I CONSULTA)
  // =========================================================================
  if (viewState === 'browse_cards') {
    const filteredCards = allCards.filter(c => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.prompt.toLowerCase().includes(q) ||
        c.answer.toLowerCase().includes(q) ||
        (c.explanation && c.explanation.toLowerCase().includes(q)) ||
        (c.categoryName && c.categoryName.toLowerCase().includes(q))
      );
    });

    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 880, margin: '0 auto' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <button 
            onClick={() => setViewState('theme_hub')}
            style={{ 
              background: 'rgba(255,255,255,0.08)', 
              border: '1px solid rgba(255,255,255,0.15)', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: 10, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            <ArrowLeft size={18} />
            Tornar al Tema 20
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleOpenAddNew}
              style={{
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Plus size={16} /> Nova Targeta
            </button>

            <button
              onClick={() => startGame('all')}
              style={{
                background: '#10b981',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Play size={14} fill="white" /> Jugar a Aquest Tema
            </button>
          </div>
        </div>

        {/* Header & Search */}
        <div className="glass" style={{ padding: 20, borderRadius: 18, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                📖 Catàleg de Targetes (Tema 20)
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '2px 0 0 0' }}>
                Mostrant {filteredCards.length} de {allCards.length} targetes
              </p>
            </div>
            
            <div style={{ position: 'relative', width: 280 }}>
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
              <input
                type="text"
                placeholder="Cerca per text, resposta, risc..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: 13 }}
              />
            </div>
          </div>
        </div>

        {/* Modal / Form for editing or creating */}
        {editingCard && (
          <motion.form
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleSaveCard}
            className="glass"
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(236, 72, 153, 0.6)',
              borderRadius: 18,
              padding: 22,
              marginBottom: 24
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#f472b6' }}>
                {editingCard.isNew ? '➕ Nova Targeta Personalitzada' : '✏️ Editar Targeta Personalitzada'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Bloc / Categoria:
                </label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                >
                  <option value="pictogrames_marcatge">🏷️ Pictogrames de Marcatge</option>
                  <option value="vestits_quimics">☣️ Vestits Químics (Tipus 1-6)</option>
                  <option value="numeros_era">🔢 Valors Numèrics & ERA</option>
                  <option value="normes_categories">📜 Categories & Normes EN</option>
                  <option value="personalitzat">⭐ Altres dades personalitzades</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Pictograma / Icona SVG (opcional):
                </label>
                <select
                  value={formIconKey}
                  onChange={e => setFormIconKey(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                >
                  <option value="none">Cap (Només text)</option>
                  <option value="Fred">Escut Fred (Cristall de gel)</option>
                  <option value="Quimic">Escut Químic (Matràs i vapors)</option>
                  <option value="Estatica">Escut Electricitat Estàtica</option>
                  <option value="Foc">Escut Foc i Calor (Flama)</option>
                  <option value="Radioactiu">Escut Partícules Radioactives</option>
                  <option value="Biologic">Escut Microorganismes (Biohazard)</option>
                  <option value="Tipus1">Vestit Químic Tipus 1 (Vapors continus)</option>
                  <option value="Tipus2">Vestit Químic Tipus 2 (Vapors tallats)</option>
                  <option value="Tipus3">Vestit Químic Tipus 3 (Raig a pressió)</option>
                  <option value="Tipus4">Vestit Químic Tipus 4 (Esprai / Ruixat)</option>
                  <option value="Tipus5">Vestit Químic Tipus 5 (Pols / Partícules)</option>
                  <option value="Tipus6">Vestit Químic Tipus 6 (Esquitxades)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Pregunta / Repte (Anvers)*:
              </label>
              <textarea
                rows={2}
                required
                placeholder="Ex: Quina pressió d'activació té l'alarma de reserva de l'ERA?"
                value={formPrompt}
                onChange={e => setFormPrompt(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#10b981', marginBottom: 6 }}>
                Resposta Correcta (Revers)*:
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 50 - 55 bar"
                value={formAnswer}
                onChange={e => setFormAnswer(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(16, 185, 129, 0.4)', color: 'white' }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Explicació o Context (opcional):
              </label>
              <textarea
                rows={2}
                placeholder="Explicació complementària..."
                value={formExplanation}
                onChange={e => setFormExplanation(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                Cancel·lar
              </button>
              <button
                type="submit"
                style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer' }}
              >
                Desar Targeta
              </button>
            </div>
          </motion.form>
        )}

        {/* Cards Grid / List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 40 }}>
          {filteredCards.map((card, idx) => {
            const IconComp = card.iconKey && PictogramIcons[card.iconKey] ? PictogramIcons[card.iconKey] : null;

            return (
              <div 
                key={card.id || idx}
                className="glass"
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: card.isCustom ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                  background: card.isCustom ? 'rgba(236, 72, 153, 0.05)' : 'rgba(15, 23, 42, 0.7)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  {/* Left: Real Cropped Image or Icon if present */}
                  {(card.imageSrc || IconComp) && (
                    <div 
                      style={{ 
                        width: 100, 
                        minHeight: 115, 
                        background: '#ffffff', 
                        borderRadius: 14, 
                        padding: 6, 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                        border: '2px solid #0f172a'
                      }}
                    >
                      {card.imageSrc ? (
                        <img src={card.imageSrc} alt="Pictograma" style={{ maxWidth: '100%', maxHeight: 95, objectFit: 'contain' }} />
                      ) : (
                        <IconComp />
                      )}
                    </div>
                  )}

                  {/* Center: Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'rgba(59, 130, 246, 0.15)', padding: '2px 8px', borderRadius: 6 }}>
                        {card.categoryName}
                      </span>
                      {card.isCustom && (
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#ec4899', background: 'rgba(236, 72, 153, 0.15)', padding: '2px 6px', borderRadius: 6 }}>
                          PERSONALITZADA
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                      {card.prompt}
                    </h3>

                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981', display: 'block', textTransform: 'uppercase', marginBottom: 2 }}>
                        ✓ Resposta Correcta:
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>
                        {card.answer}
                      </span>
                    </div>

                    {card.explanation && (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                        {card.explanation}
                      </p>
                    )}

                    {card.keyPoints && (
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 8 }}>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                          {card.keyPoints.map((kp, kpi) => (
                            <li key={kpi}>{kp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions for custom card */}
                  {card.isCustom && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => handleOpenEdit(card)}
                        title="Editar"
                        style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', padding: 8, borderRadius: 8, cursor: 'pointer' }}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomCard(card.id)}
                        title="Eliminar"
                        style={{ background: 'rgba(239, 68, 68, 0.15)', border: 'none', color: 'var(--error)', padding: 8, borderRadius: 8, cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // =========================================================================
  // VIEW 4: ACTIVE ANKI STUDY GAME
  // =========================================================================
  if (gameCompleted) {
    const accuracyPercent = initialCount > 0 ? Math.round((firstTryCorrectCount / initialCount) * 100) : 100;

    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <div className="glass p-8" style={{ borderRadius: 24, padding: 36, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: 22, borderRadius: '50%', boxShadow: '0 8px 30px rgba(16, 185, 129, 0.4)' }}>
              <Trophy size={48} color="white" />
            </div>
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: 'white' }}>
            Sessió de Memorització Superada!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 28 }}>
            Has memoritzat totes les targetes d'aquest bloc. Totes les fallades han quedat consolidades!
          </p>

          <div style={{ display: 'flex', gap: 14, marginBottom: 32 }}>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.25)', padding: 18, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#10b981', display: 'block' }}>{initialCount}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Targetes dominades</span>
            </div>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.25)', padding: 18, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#3b82f6', display: 'block' }}>{accuracyPercent}%</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Encert a la 1a ronda</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => startGame(selectedSubCategory)}
              style={{ width: '100%', padding: 16, borderRadius: 14, background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <RotateCcw size={18} /> Tornar a Jugar Aquest Bloc
            </button>
            <button
              onClick={() => setViewState('theme_hub')}
              style={{ width: '100%', padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.08)', color: 'white', fontWeight: 600, fontSize: 14, border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}
            >
              Tornar al Menú del Tema 20
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const IconComponent = currentCard?.iconKey && PictogramIcons[currentCard.iconKey] ? PictogramIcons[currentCard.iconKey] : null;
  const progressPercent = initialCount > 0 ? Math.round((masteredIds.size / initialCount) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 700, margin: '0 auto', paddingBottom: 40 }}>
      {/* Top Session Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button 
          onClick={() => setViewState('theme_hub')}
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-muted)', padding: '8px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Sortir del Joc
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#10b981' }}>
            <CheckCircle2 size={14} /> {masteredIds.size} Dominades
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: 'var(--error)' }}>
            <RefreshCw size={14} /> {queue.length - currentIndex} Pendents
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ background: 'rgba(255,255,255,0.08)', height: 6, borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(90deg, var(--primary), #10b981)', height: '100%', width: `${progressPercent}%`, transition: 'width 0.3s ease' }} />
      </div>

      {/* Main Flashcard Container */}
      <div style={{ perspective: 1200 }}>
        <motion.div
          key={`${currentCard.id}-${currentIndex}-${isFlipped}`}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="glass"
          style={{
            borderRadius: 24,
            padding: 28,
            minHeight: 460,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: isFlipped ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.15)',
            boxShadow: isFlipped ? '0 12px 36px rgba(16, 185, 129, 0.15)' : '0 12px 36px rgba(0,0,0,0.3)',
            background: isFlipped ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(6, 78, 59, 0.2) 100%)' : 'rgba(15, 23, 42, 0.85)'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--primary)', background: 'rgba(59, 130, 246, 0.15)', padding: '4px 10px', borderRadius: 8 }}>
                {currentCard.categoryName}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Targeta {currentIndex + 1} de {queue.length}
              </span>
            </div>

            {/* ANVERS */}
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              {(currentCard.imageSrc || IconComponent) && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <div 
                    style={{ 
                      width: 140, 
                      minHeight: 140, 
                      background: '#ffffff', 
                      borderRadius: 18, 
                      padding: 10, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)', 
                      border: '3px solid #0f172a' 
                    }}
                  >
                    {currentCard.imageSrc ? (
                      <img 
                        src={currentCard.imageSrc} 
                        alt="Imatge de la targeta" 
                        style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain' }} 
                      />
                    ) : (
                      <IconComponent />
                    )}
                  </div>
                </div>
              )}

              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'white', lineHeight: 1.4, marginBottom: 14 }}>
                {currentCard.prompt}
              </h3>

              {currentCard.hint && (
                <div style={{ marginBottom: 16 }}>
                  {!showHint ? (
                    <button 
                      onClick={() => setShowHint(true)}
                      style={{ background: 'transparent', border: 'none', color: '#f59e0b', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <HelpCircle size={15} /> Veure pista
                    </button>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#fbbf24', padding: '8px 14px', borderRadius: 10, fontSize: 13, display: 'inline-block' }}>
                      💡 <b>Pista:</b> {currentCard.hint}
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {!isFlipped && (
              <div style={{ marginTop: 10, maxWidth: 440, margin: '10px auto 0 auto' }}>
                <input
                  ref={textInputRef}
                  type="text"
                  placeholder="Escriu la resposta mentalment o aquí..."
                  value={userGuess}
                  onChange={e => setUserGuess(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: 14, textAlign: 'center' }}
                />
              </div>
            )}

            {/* REVERS */}
            {isFlipped && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} style={{ marginTop: 18, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 18 }}>
                {/* Optional visual support in reverse */}
                {currentCard.suitImageSrc && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                    <div style={{ background: '#ffffff', padding: 8, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f172a', boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}>
                      <img src={currentCard.suitImageSrc} alt="Foto del vestit" style={{ maxHeight: 110, objectFit: 'contain' }} />
                    </div>
                  </div>
                )}

                <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 800, fontSize: 13, marginBottom: 4, textTransform: 'uppercase' }}>
                    <CheckCircle2 size={16} /> Resposta Correcta:
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>
                    {currentCard.answer}
                  </div>
                </div>

                <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
                  {currentCard.explanation}
                </div>

                {currentCard.keyPoints && (
                  <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'white', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Punts clau a recordar:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
                      {currentCard.keyPoints.map((pt, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Bottom Action Area */}
          <div style={{ marginTop: 24, paddingTop: 16 }}>
            {!isFlipped ? (
              <button
                onClick={() => setIsFlipped(true)}
                style={{ width: '100%', padding: 16, borderRadius: 14, background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)' }}
              >
                <Eye size={20} />
                Mostrar Resposta (Espai / Enter)
              </button>
            ) : (
              <div>
                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Com ha anat el recordatori?
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => handleRate('fail')}
                    style={{ flex: 1, padding: 14, borderRadius: 12, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: 'var(--error)', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <XCircle size={18} /> Ho he fallat
                    </div>
                    <span style={{ fontSize: 11, opacity: 0.8, fontWeight: 500 }}>(Repetir en 2-3 targetes) [1]</span>
                  </button>

                  <button
                    onClick={() => handleRate('hard')}
                    style={{ flex: 1, padding: 14, borderRadius: 12, background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#f59e0b', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={18} /> M'ha costat
                    </div>
                    <span style={{ fontSize: 11, opacity: 0.8, fontWeight: 500 }}>(Repassar aviat) [2]</span>
                  </button>

                  <button
                    onClick={() => handleRate('good')}
                    style={{ flex: 1, padding: 14, borderRadius: 12, background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={18} /> Ho sabia bé!
                    </div>
                    <span style={{ fontSize: 11, opacity: 0.8, fontWeight: 500 }}>("Esfonsada") [3]</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
