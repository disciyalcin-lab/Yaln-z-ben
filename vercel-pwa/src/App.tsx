import React, { useState, useEffect } from 'react';
import {
  loadWordProgressMap,
  markWordResult,
  loadUserStats,
  saveUserStats,
  WordProgress,
  UserStats
} from './utils/storage';
import { Dashboard } from './components/Dashboard';
import { Flashcards } from './components/Flashcards';
import { Quiz } from './components/Quiz';
import { Dictionary } from './components/Dictionary';
import { Home, Layers, HelpCircle, BookOpen, Moon, Sun, Download } from 'lucide-react';

type TabKey = 'DASHBOARD' | 'FLASHCARDS' | 'QUIZ' | 'DICTIONARY';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('DASHBOARD');
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(1);
  const [progressMap, setProgressMap] = useState<Record<number, WordProgress>>(() =>
    loadWordProgressMap()
  );
  const [stats, setStats] = useState<UserStats>(() => loadUserStats());
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (stats.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [stats.darkMode]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleToggleDark = () => {
    const updated: UserStats = { ...stats, darkMode: !stats.darkMode };
    setStats(updated);
    saveUserStats(updated);
  };

  const handleMarkWord = (wordId: number, knewIt: boolean) => {
    const nextMap = markWordResult(progressMap, wordId, knewIt);
    setProgressMap(nextMap);
    setStats(loadUserStats());
  };

  const handleCompleteQuiz = (correct: number, total: number) => {
    const updated: UserStats = {
      ...stats,
      totalQuizzesTaken: stats.totalQuizzesTaken + 1,
      totalQuizCorrect: stats.totalQuizCorrect + correct,
      totalQuizQuestions: stats.totalQuizQuestions + total
    };
    setStats(updated);
    saveUserStats(updated);
  };

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F4] dark:bg-[#071712] text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#FBF9F4]/90 dark:bg-[#071712]/90 border-b border-emerald-900/10 dark:border-emerald-800/30">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-800 text-amber-300 font-arabic text-xl font-bold shadow-sm">
              ق
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-emerald-950 dark:text-white">
                Kur'an 300 Kelime
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-emerald-300/70">
                Frekans Sıralı (%75+ Kur'an Kapsamı)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {deferredPrompt && (
              <button
                onClick={handleInstallPwa}
                className="inline-flex items-center gap-1 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                Uygulamayı Kur
              </button>
            )}
            <button
              onClick={handleToggleDark}
              className="rounded-xl bg-white dark:bg-slate-900 p-2.5 text-slate-700 dark:text-amber-300 border border-slate-200 dark:border-slate-800 shadow-sm"
              aria-label="Gece / Gündüz Modu"
            >
              {stats.darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Mobile-First Container */}
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-4 pb-24">
        {activeTab === 'DASHBOARD' && (
          <Dashboard
            progressMap={progressMap}
            stats={stats}
            onSelectDeck={(deckId) => {
              setSelectedDeckId(deckId);
              setActiveTab('FLASHCARDS');
            }}
            onStartQuickReview={() => {
              setSelectedDeckId(1);
              setActiveTab('FLASHCARDS');
            }}
          />
        )}

        {activeTab === 'FLASHCARDS' && (
          <Flashcards
            selectedDeckId={selectedDeckId}
            progressMap={progressMap}
            onSelectDeck={setSelectedDeckId}
            onMarkWord={handleMarkWord}
          />
        )}

        {activeTab === 'QUIZ' && (
          <Quiz onCompleteQuiz={handleCompleteQuiz} onMarkWord={handleMarkWord} />
        )}

        {activeTab === 'DICTIONARY' && (
          <Dictionary progressMap={progressMap} onToggleLearned={handleMarkWord} />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto grid max-w-xl grid-cols-4 px-2 py-1.5">
          {(
            [
              { key: 'DASHBOARD', label: 'Ana Sayfa', icon: Home },
              { key: 'FLASHCARDS', label: 'Kartlar', icon: Layers },
              { key: 'QUIZ', label: 'Quiz', icon: HelpCircle },
              { key: 'DICTIONARY', label: 'Sözlük (300)', icon: BookOpen }
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition ${
                  active
                    ? 'text-emerald-800 dark:text-amber-400 font-bold'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-1 text-[11px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default App;
