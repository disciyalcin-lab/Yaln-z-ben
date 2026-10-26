import React, { useState, useMemo } from 'react';
import { QURAN_WORDS_300 } from '../data/wordsData';
import { WordProgress } from '../utils/storage';
import { audioPlayer } from '../utils/audioPlayer';
import { Search, Volume2, CheckCircle2, Circle } from 'lucide-react';

interface DictionaryProps {
  progressMap: Record<number, WordProgress>;
  onToggleLearned: (wordId: number, learned: boolean) => void;
}

type StatusFilter = 'ALL' | 'LEARNED' | 'UNLEARNED';

export const Dictionary: React.FC<DictionaryProps> = ({ progressMap, onToggleLearned }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [deckFilter, setDeckFilter] = useState<number | null>(null);

  // Strictly sorted by frequency DESC, id ASC (1..300)
  const sortedBaseWords = useMemo(() => {
    return [...QURAN_WORDS_300].sort((a, b) => b.frequency - a.frequency || a.id - b.id);
  }, []);

  const contextWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedBaseWords.filter((w) => {
      if (deckFilter !== null && w.deckId !== deckFilter) return false;
      if (!q) return true;
      return (
        w.arabic.includes(q) ||
        w.turkishMeaning.toLowerCase().includes(q) ||
        w.transliteration.toLowerCase().includes(q) ||
        String(w.id) === q
      );
    });
  }, [sortedBaseWords, searchQuery, deckFilter]);

  const counts = useMemo(() => {
    const learned = contextWords.filter((w) => progressMap[w.id]?.isLearned).length;
    return {
      all: contextWords.length,
      learned,
      unlearned: contextWords.length - learned
    };
  }, [contextWords, progressMap]);

  const displayedWords = useMemo(() => {
    return contextWords
      .filter((w) => {
        const isLearned = !!progressMap[w.id]?.isLearned;
        if (statusFilter === 'LEARNED') return isLearned;
        if (statusFilter === 'UNLEARNED') return !isLearned;
        return true;
      })
      .sort((a, b) => b.frequency - a.frequency || a.id - b.id);
  }, [contextWords, progressMap, statusFilter]);

  return (
    <div className="space-y-4 pb-8">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Arapça, Türkçe anlam, okunuş veya sıra no (1-300) ara..."
          className="w-full rounded-2xl bg-white dark:bg-slate-900 pl-11 pr-4 py-3.5 text-sm border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-600 dark:text-white"
        />
      </div>

      {/* Status Filter Tabs with Live Counts */}
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-200/70 dark:bg-slate-900 p-1">
        {(
          [
            { key: 'ALL', label: `Tümü (${counts.all})` },
            { key: 'UNLEARNED', label: `Öğrenilecek (${counts.unlearned})` },
            { key: 'LEARNED', label: `Öğrenilen (${counts.learned})` }
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`rounded-xl py-2 text-xs font-bold transition ${
              statusFilter === tab.key
                ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Deck Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setDeckFilter(null)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
            deckFilter === null
              ? 'bg-emerald-800 text-white dark:bg-amber-400 dark:text-slate-950'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          Tüm Desteler (1-300)
        </button>
        {[1, 2, 3, 4, 5, 6].map((d) => (
          <button
            key={d}
            onClick={() => setDeckFilter(d)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
              deckFilter === d
                ? 'bg-emerald-800 text-white dark:bg-amber-400 dark:text-slate-950'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {d}. Deste ({(d - 1) * 50 + 1}-{d * 50})
          </button>
        ))}
      </div>

      {/* Word List (1 to 300 strictly descending frequency) */}
      <div className="space-y-2.5">
        {displayedWords.map((word) => {
          const isLearned = !!progressMap[word.id]?.isLearned;
          return (
            <div
              key={word.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-200/80 dark:border-slate-800"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  onClick={() => onToggleLearned(word.id, !isLearned)}
                  title={isLearned ? 'Öğrenildi olarak işaretli' : 'Öğrenildi olarak işaretle'}
                  className="shrink-0 text-emerald-600 dark:text-emerald-400"
                >
                  {isLearned ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="h-6 w-6 text-slate-300 dark:text-slate-700" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center rounded-md bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300">
                      #{word.id}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-amber-100 dark:bg-amber-950/70 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                      {word.frequency} Kez
                    </span>
                    <span className="text-[11px] text-slate-400">{word.wordType}</span>
                  </div>
                  <p className="mt-1 font-bold text-slate-900 dark:text-white truncate">
                    {word.turkishMeaning}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Okunuş: {word.transliteration} • {word.exampleAyahReference}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <p
                  className="font-arabic text-3xl font-bold text-emerald-900 dark:text-amber-400"
                  dir="rtl"
                >
                  {word.arabic}
                </p>
                <button
                  onClick={() => audioPlayer.playWord(word.arabic, word.audioUrl)}
                  className="rounded-xl bg-slate-100 dark:bg-slate-800 p-2.5 text-emerald-800 dark:text-amber-300 hover:bg-emerald-100 transition"
                  aria-label="Kelimeyi Dinle"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
