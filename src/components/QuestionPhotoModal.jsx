import React, { useRef, useState, useEffect } from 'react';
import { toPng, toBlob } from 'html-to-image';
import { Download, Copy, Check, X, Camera, Sparkles, CheckCircle2, BookOpen } from 'lucide-react';
import { getAcademyInfo } from '../App';

/**
 * QuestionPhotoModal
 * Renders an offscreen/preview question card specifically formatted with a white background,
 * clean typography, highlighted correct answer, and detailed explanation for pasting into study notes.
 */
export default function QuestionPhotoModal({ question, questionIndex, onClose }) {
  const cardRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const [copyError, setCopyError] = useState('');

  if (!question) return null;

  const acadInfo = getAcademyInfo(question.academy || 'oficial');
  const themeTitle = question.theme || 'Temari General';

  const cleanFilename = () => {
    const rawTheme = (question.theme || 'pregunta').replace(/[^a-zA-Z0-9]/g, '_');
    const qNum = questionIndex !== undefined ? `_p${questionIndex + 1}` : '';
    return `pregunta_${rawTheme}${qNum}.png`;
  };

  const handleDownload = async () => {
    if (!cardRef.current || isGenerating) return;
    try {
      setIsGenerating(true);
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = cleanFilename();
      link.href = dataUrl;
      link.click();
      
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error('Error generant imatge:', err);
      alert('Error en generar la imatge. Torna-ho a provar.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyClipboard = async () => {
    if (!cardRef.current || isGenerating) return;
    try {
      setIsGenerating(true);
      setCopyError('');
      
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      if (!blob) throw new Error('No s’ha pogut generar el blob de la imatge');

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } else {
        // Fallback for browsers that don't support image clipboard
        handleDownload();
      }
    } catch (err) {
      console.error('Error copiant al porta-retalls:', err);
      // If clipboard permission failed, try download fallback
      setCopyError('No s’ha pogut copiar directament. Prova el botó de descarregar.');
      handleDownload();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="glass" 
        style={{
          width: '100%',
          maxWidth: 680,
          background: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, background: 'rgba(59, 130, 246, 0.15)', borderRadius: 10, color: 'var(--primary)' }}>
              <Camera size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Foto de la Pregunta per a Apunts
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                Format fons blanc d'alta resolució, llest per enganxar a GoodNotes, Word o Notion
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Buttons at Top */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handleCopyClipboard}
            disabled={isGenerating}
            style={{
              flex: 1,
              minWidth: 160,
              padding: '12px 18px',
              borderRadius: 12,
              background: copied ? '#10b981' : '#3b82f6',
              color: 'white',
              fontWeight: 600,
              fontSize: 14,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copiat al Porta-retalls!' : 'Copiar Imatge (Porta-retalls)'}
          </button>

          <button
            onClick={handleDownload}
            disabled={isGenerating}
            style={{
              flex: 1,
              minWidth: 150,
              padding: '12px 18px',
              borderRadius: 12,
              background: downloaded ? '#10b981' : 'rgba(255,255,255,0.1)',
              color: 'white',
              fontWeight: 600,
              fontSize: 14,
              border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s ease'
            }}
          >
            {downloaded ? <Check size={18} /> : <Download size={18} />}
            {downloaded ? 'Descarregada!' : 'Descarregar PNG'}
          </button>
        </div>

        {copied && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '10px 14px', borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} />
            <span><b>Imatge copiada!</b> Ja pots anar als teus apunts i prémer <b>Ctrl+V / Cmd+V</b> per enganxar-la directament.</span>
          </div>
        )}

        {copyError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '10px 14px', borderRadius: 10, fontSize: 13 }}>
            {copyError}
          </div>
        )}

        {/* Live Preview / Render Container */}
        <div style={{ overflowX: 'auto', padding: '4px 0' }}>
          <div 
            style={{ 
              fontSize: 12, 
              color: 'var(--text-muted)', 
              marginBottom: 8, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}
          >
            <span>Previsualització del format final (Fons blanc d'estudi):</span>
            {question.explanation && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={showExplanation} 
                  onChange={(e) => setShowExplanation(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: '#3b82f6' }}
                />
                Incloure explicació
              </label>
            )}
          </div>

          {/* THE CARD TO BE EXPORTED (Clean white theme) */}
          <div 
            ref={cardRef}
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              borderRadius: 16,
              padding: '28px 32px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e2e8f0',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              width: '100%',
              maxWidth: 620,
              margin: '0 auto',
              boxSizing: 'border-box'
            }}
          >
            {/* Header / Badges */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'nowrap', gap: 10, borderBottom: '1.5px solid #f1f5f9', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    letterSpacing: '0.02em',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {themeTitle}
                </span>
                {questionIndex !== undefined && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>
                    #{questionIndex + 1}
                  </span>
                )}
              </div>

              <div 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 9px',
                  borderRadius: 6,
                  backgroundColor: acadInfo.badgeClass === 'badge-racord' ? '#ecfdf5' : acadInfo.badgeClass === 'badge-academia' ? '#eff6ff' : '#f8fafc',
                  color: acadInfo.badgeClass === 'badge-racord' ? '#047857' : acadInfo.badgeClass === 'badge-academia' ? '#1d4ed8' : '#334155',
                  border: '1px solid #cbd5e1',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: 13, lineHeight: 1 }}>{acadInfo.icon}</span>
                <span>{acadInfo.shortLabel}</span>
              </div>
            </div>

            {/* Question Statement */}
            <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.5, color: '#0f172a', marginBottom: 18 }}>
              {question.statement}
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: showExplanation && question.explanation ? 18 : 0 }}>
              {['A', 'B', 'C', 'D'].map((opt) => {
                if (!question.options || !question.options[opt]) return null;
                const isCorrect = opt === question.correct;

                return (
                  <div
                    key={opt}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 10,
                      backgroundColor: isCorrect ? '#ecfdf5' : '#f8fafc',
                      border: isCorrect ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Option Letter Badge */}
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: isCorrect ? '#10b981' : '#e2e8f0',
                        color: isCorrect ? '#ffffff' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        flexShrink: 0,
                        marginTop: 1
                      }}
                    >
                      {opt}
                    </div>

                    {/* Option Text */}
                    <div 
                      style={{ 
                        flex: 1, 
                        fontSize: 14, 
                        lineHeight: 1.45, 
                        color: isCorrect ? '#065f46' : '#334155',
                        fontWeight: isCorrect ? 700 : 500
                      }}
                    >
                      {question.options[opt]}
                    </div>

                    {/* Correct Checkmark Tag */}
                    {isCorrect && (
                      <span 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#059669',
                          backgroundColor: '#d1fae5',
                          padding: '3px 8px',
                          borderRadius: 4,
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                          lineHeight: 1.2
                        }}
                      >
                        ✓ Correcta
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation Section */}
            {showExplanation && question.explanation && (
              <div 
                style={{
                  marginTop: 16,
                  padding: '14px 18px',
                  backgroundColor: '#f0f9ff',
                  borderLeft: '4px solid #0284c7',
                  borderRadius: '0 10px 10px 0',
                  borderTop: '1px solid #e0f2fe',
                  borderRight: '1px solid #e0f2fe',
                  borderBottom: '1px solid #e0f2fe',
                  boxSizing: 'border-box'
                }}
              >
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    fontSize: 12, 
                    fontWeight: 700, 
                    color: '#0369a1', 
                    marginBottom: 8,
                    lineHeight: 1.3
                  }}
                >
                  <span style={{ fontSize: 14, lineHeight: 1 }}>💡</span>
                  <span style={{ letterSpacing: '0.02em' }}>Explicació i justificació:</span>
                </div>
                <div 
                  style={{ 
                    fontSize: 13, 
                    lineHeight: 1.6, 
                    color: '#1e293b', 
                    whiteSpace: 'pre-line', 
                    fontWeight: 500,
                    wordBreak: 'break-word'
                  }}
                >
                  {question.explanation}
                </div>
              </div>
            )}

            {/* Subtle Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 12, borderTop: '1px solid #f1f5f9', fontSize: 10, color: '#94a3b8', lineHeight: 1.3 }}>
              <span>🚒 Oposicions Bombers · Apunts d'Estudi</span>
              <span>{new Date().toLocaleDateString('ca-ES')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
