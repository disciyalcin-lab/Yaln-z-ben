import React, { useState, useMemo } from 'react';
import { QURAN_WORDS_300 } from '../data/wordsData';
import { WordProgress } from '../utils/storage';
import { audioPlayer } from '../utils/audioPlayer';
import { Volume2, RotateCcw, Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface FlashcardsProps {
  selectedDeckId: number | null;
  progressMap: Record<number, WordProgress>;
  onSelectDeck: (deckId: number | null) => void;
  onMarkWord: (wordId: number, knewIt: boolean) => void;
}

type FilterMode = 'ALL' | 'UNLEARNED' | 'LEARNED';

export const Flashcards: React.FC<FlashcardsProps> = ({
  selectedDeckId,
  progressMap,
  onSelectDeck,
  onMarkWord
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [playingType, setPlayingType] = useState<'word' | 'ayah' | null>(null);

  const activeDeck = selectedDeckId || 1;

  // Enforce strict descending frequency order (frequency DESC, id ASC)
  const deckWords = useMemo(() => {
    return QURAN_WORDS_300.filter((w) => w.deckId === activeDeck).sort(
      (a, b) => b.frequency - a.frequency || a.id - b.id
    );
  }, [activeDeck]);

  const filteredWords = useMemo(() => {
    return deckWords.filter((w) => {
      const isLearned = !!progressMap[w.id]?.isLearned;
      if (filterMode === 'LEARNED') return isLearned;
      if (filterMode === 'UNLEARNED') return !isLearned;
      return true;
    });
  }, [deckWords, progressMap, filterMode]);

  const safeIndex = filteredWords.length > 0 ? Math.min(currentIndex, filteredWords.length - 1) : 0;
  const currentWord = filteredWords[safeIndex];

  const handlePlayWord = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentWord) return;
    setPlayingType('word');
    audioPlayer.playWord(currentWord.arabic, currentWord.audioUrl, () => setPlayingType(null));
  };

  const handlePlayAyah = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentWord) return;
    setPlayingType('ayah');
    audioPlayer.playAyah(currentWord.exampleAudioUrl, currentWord.exampleAyahArabic, () =>
      setPlayingType(null)
    );
  };

  const handleAction = (knewIt: boolean) => {
    if (!currentWord) return;
    setIsFlipped(false);
    onMarkWord(currentWord.id, knewIt);
    if (safeIndex + 1 < filteredWords.length) {
      setCurrentIndex(safeIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Deck Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[1, 2, 3, 4, 5, 6].map((deckId) => (
          <button
            key={deckId}
            onClick={() => {
              onSelectDeck(deckId);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              activeDeck === deckId
                ? 'bg-emerald-800 text-white dark:bg-amber-400 dark:text-slate-950 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {deckId}. Deste ({(deckId - 1) * 50 + 1}-{deckId * 50})
          </button>
        ))}
      </div>

      {/* Filter Mode Tabs */}
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-200/70 dark:bg-slate-900 p-1">
        {(
          [
            { key: 'ALL', label: `Tümü (${deckWords.length})` },
            {
              key: 'UNLEARNED',
              label: `Öğrenilecek (${deckWords.filter((w) => !progressMap[w.id]?.isLearned).length})`
            },
            {
              key: 'LEARNED',
              label: `Öğrenilen (${deckWords.filter((w) => progressMap[w.id]?.isLearned).length})`
            }
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setFilterMode(tab.key);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`rounded-xl py-2 text-xs font-bold transition ${
              filterMode === tab.key
                ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!currentWord ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 p-10 text-center border border-slate-200 dark:border-slate-800">
          <Sparkles className="mx-auto h-10 w-10 text-amber-400" />
          <p className="mt-3 text-base font-bold text-slate-900 dark:text-white">
            Bu filtrede kelime kalmadı!
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Tüm kelimeleri görmek için "Tümü" sekmesine geçebilirsiniz.
          </p>
        </div>
      ) : (
        <>
          {/* Progress header */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Kart <strong>{safeIndex + 1}</strong> / {filteredWords.length}
            </span>
            <span>
              Sıra: <strong>#{currentWord.id}</strong> • Kur'an'da <strong>{currentWord.frequency}</strong> kez
            </span>
          </div>

          {/* 3D Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="perspective-1000 cursor-pointer select-none"
          >
            <div
              className={`relative min-h-[360px] w-full rounded-3xl transition-transform duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT FACE */}
              <div className="absolute inset-0 backface-hidden rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-lg border border-emerald-900/10 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/90 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    #{currentWord.id} • {currentWord.wordType}
                  </span>
                  <span className="rounded-full bg-amber-100 dark:bg-amber-950/70 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
                    {currentWord.frequency} Kez Geçer
                  </span>
                </div>

                <div className="my-auto text-center py-6">
                  <p
                    className="font-arabic text-6xl sm:text-7xl font-bold text-emerald-900 dark:text-amber-400 leading-relaxed"
                    dir="rtl"
                  >
                    {currentWord.arabic}
                  </p>
                  <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                    {currentWord.transliteration}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={handlePlayWord}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
                      playingType === 'word'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-emerald-800 text-white dark:bg-emerald-700 hover:bg-emerald-700'
                    }`}
                  >
                    <Volume2 className="h-4 w-4" />
                    Kelimeyi Dinle
                  </button>
                  <span className="text-xs font-semibold text-slate-400">
                    Çevirmek için karta dokun ↻
                  </span>
                </div>
              </div>

              {/* BACK FACE */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 text-white p-6 shadow-xl border border-emerald-700/40 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    #{currentWord.id} • Türkçe Anlamı
                  </span>
                  <button
                    type="button"
                    onClick={handlePlayWord}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-white/20"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    Kelime Sesi
                  </button>
                </div>

                <div className="my-auto space-y-4 py-2">
                  <div className="text-center">
                    <p className="font-arabic text-3xl text-amber-300" dir="rtl">
                      {currentWord.arabic}
                    </p>
                    <h3 className="mt-1 text-2xl font-extrabold text-white">
                      {currentWord.turkishMeaning}
                    </h3>
                  </div>

                  {/* Example Ayah Box */}
                  <div className="rounded-2xl bg-white/5 p-4 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-emerald-300">
                        Örnek Ayet ({currentWord.exampleAyahReference})
                      </span>
                      <button
                        type="button"
                        onClick={handlePlayAyah}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                          playingType === 'ayah'
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
                        }`}
                      >
                        <Volume2 className="h-3 w-3" />
                        Ayeti Dinle
                      </button>
                    </div>
                    <p className="font-arabic text-xl text-right text-amber-100 leading-relaxed" dir="rtl">
                      {currentWord.exampleAyahArabic}
                    </p>
                    <p className="text-xs text-emerald-100/90 leading-relaxed">
                      "{currentWord.exampleAyahTurkish}"
                    </p>
                  </div>
                </div>

                <div className="text-center text-[11px] text-emerald-300/70">
                  Ön yüze dönmek için dokunun ↻
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Tekrar Et & Öğrendim / Biliyorum */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleAction(false)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 py-3.5 px-4 font-bold text-sm shadow-sm transition active:scale-[0.99]"
            >
              <RotateCcw className="h-4 w-4" />
              Tekrar Et
            </button>
            <button
              type="button"
              onClick={() => handleAction(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 py-3.5 px-4 font-bold text-sm shadow-sm transition active:scale-[0.99]"
            >
              <Check className="h-4 w-4" />
              Öğrendim
            </button>
          </div>

          {/* Prev / Next Navigation */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              disabled={safeIndex === 0}
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex(Math.max(0, safeIndex - 1));
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Önceki Kart
            </button>
            <button
              type="button"
              disabled={safeIndex >= filteredWords.length - 1}
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex(Math.min(filteredWords.length - 1, safeIndex + 1));
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 disabled:opacity-40"
            >
              Sonraki Kart <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
