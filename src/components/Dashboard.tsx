import React, { useState } from 'react';
import { QURAN_WORDS_300, TOTAL_QURAN_WORDS } from '../data/wordsData';
import { WordProgress, UserStats, getLast7DaysLearnedData, getDeck12Number } from '../utils/storage';
import {
  Sparkles,
  Volume2,
  Flame,
  Play,
  HelpCircle,
  CheckCircle2,
  Sun,
  Moon,
  BellRing
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { audioPlayer } from '../utils/audioPlayer';

interface DashboardProps {
  progressMap: Record<number, WordProgress>;
  stats: UserStats;
  isDark: boolean;
  onToggleTheme: () => void;
  onSelectDeck: (deckId: number) => void;
  onNavigateToQuiz: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  progressMap,
  stats,
  isDark,
  onToggleTheme,
  onSelectDeck,
  onNavigateToQuiz
}) => {
  const [srsToast, setSrsToast] = useState<string | null>(null);

  // Strictly sorted by frequency DESC, id ASC (1..300)
  const sortedWords = React.useMemo(
    () => [...QURAN_WORDS_300].sort((a, b) => b.frequency - a.frequency || a.id - b.id),
    []
  );

  const learnedWords = sortedWords.filter((w) => progressMap[w.id]?.isLearned);
  const totalLearnedCount = learnedWords.length;
  const frequencyLearned = learnedWords.reduce((sum, w) => sum + w.frequency, 0);

  const coveragePercentage = Math.min(100, (frequencyLearned / TOTAL_QURAN_WORDS) * 100);

  const { currentMilestone, nextMilestoneRemaining } = React.useMemo(() => {
    if (totalLearnedCount < 50) {
      return { currentMilestone: 'Temel Aşina (%40)', nextMilestoneRemaining: 50 - totalLearnedCount };
    }
    if (totalLearnedCount < 100) {
      return { currentMilestone: 'Sayfa Okuyucu (%55)', nextMilestoneRemaining: 100 - totalLearnedCount };
    }
    if (totalLearnedCount < 200) {
      return { currentMilestone: 'Anlam Kaşifi (%68)', nextMilestoneRemaining: 200 - totalLearnedCount };
    }
    if (totalLearnedCount < 300) {
      return { currentMilestone: 'Ayet Kavrayıcı (%75)', nextMilestoneRemaining: 300 - totalLearnedCount };
    }
    return { currentMilestone: "Kur'an Kelime Üstadı! 🌟", nextMilestoneRemaining: 0 };
  }, [totalLearnedCount]);

  // Last 7 days daily learned words bar chart data
  const last7DaysData = React.useMemo(
    () => getLast7DaysLearnedData(progressMap),
    [progressMap]
  );
  const last7DaysTotal = React.useMemo(
    () => last7DaysData.reduce((sum, item) => sum + item.count, 0),
    [last7DaysData]
  );

  // Daily featured word (weakest unlearned or word of the day)
  const dailyWord = React.useMemo(() => {
    const unlearned = sortedWords.filter((w) => !progressMap[w.id]?.isLearned);
    if (unlearned.length > 0) {
      const dayOfYear = Math.floor(Date.now() / 86400000);
      return unlearned[dayOfYear % unlearned.length];
    }
    return sortedWords[0];
  }, [sortedWords, progressMap]);

  // 12 Decks (25 words each: 1-25, 26-50, ..., 276-300)
  const decks = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => {
      const deckNumber = idx + 1;
      const startId = (deckNumber - 1) * 25 + 1;
      const endId = Math.min(deckNumber * 25, 300);
      const deckWords = sortedWords.filter((w) => getDeck12Number(w.id) === deckNumber);
      const learnedInDeck = deckWords.filter((w) => progressMap[w.id]?.isLearned).length;
      return {
        deckNumber,
        title: `Deste ${deckNumber}`,
        rangeText: `${startId} - ${endId}. Kelimeler`,
        totalWords: deckWords.length || 25,
        learnedWords: learnedInDeck,
        isCompleted: deckWords.length > 0 && learnedInDeck >= deckWords.length
      };
    });
  }, [sortedWords, progressMap]);

  // Circular Progress Ring geometry
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (coveragePercentage / 100) * circumference;

  const handleTestSrsNotification = () => {
    if (!dailyWord) return;
    audioPlayer.playWord(dailyWord.arabic, dailyWord.audioUrl);
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`Günün Kur'an Kelimesi: ${dailyWord.arabic}`, {
        body: `${dailyWord.transliteration} — ${dailyWord.turkishMeaning} (Kur'an'da ${dailyWord.frequency} kez)`
      });
    }
    setSrsToast(
      `SRS Hatırlatma: ${dailyWord.arabic} (${dailyWord.transliteration}) — ${dailyWord.turkishMeaning}`
    );
    setTimeout(() => setSrsToast(null), 4000);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* 1. Top Bar / Header with Bismillah, Title, Theme Toggle & Streak Badge */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="min-w-0 flex-1">
          <p
            className="font-arabic text-lg font-bold text-[#B7282E] dark:text-[#E2474D] leading-snug"
            dir="rtl"
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1A1E] dark:text-[#F2F2F7]">
            Kur'an 300 Kelime
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Day / Night Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F0F4] dark:bg-[#262630] border border-[#E4E4EC] dark:border-[#32323E] transition active:scale-95"
            aria-label={isDark ? 'Gündüz Moduna Geç' : 'Gece Moduna Geç'}
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-[#C89D42]" />
            ) : (
              <Moon className="h-5 w-5 text-[#B7282E]" />
            )}
          </button>

          {/* Daily Streak Badge */}
          <div className="flex items-center gap-1.5 rounded-[20px] bg-[#DEC286] dark:bg-[#4F3E1E] px-3.5 py-2.5 text-[#2C2214] dark:text-[#F7E3B5] shadow-sm">
            <Flame className="h-5 w-5 text-[#B7282E] dark:text-[#E2474D] fill-current" />
            <span className="text-xs font-extrabold">{stats.streakDays} Gün</span>
          </div>
        </div>
      </div>

      {/* SRS Toast Alert if triggered */}
      {srsToast && (
        <div className="rounded-2xl bg-[#FDECEC] dark:bg-[#4E161A] border border-[#B7282E]/30 dark:border-[#E2474D]/40 px-4 py-3 text-xs font-bold text-[#8E1B20] dark:text-[#FFD9DA] flex items-center gap-2 shadow-sm">
          <BellRing className="h-4 w-4 shrink-0 text-[#B7282E] dark:text-[#E2474D]" />
          <span>{srsToast}</span>
        </div>
      )}

      {/* 2. Big Quran Coverage Card (Milestone Engine with Circular Progress Ring) */}
      <div className="relative overflow-hidden rounded-[24px] bg-white dark:bg-[#1B1B22] shadow-md border border-[#E4E4EC] dark:border-[#32323E]">
        <div className="bg-gradient-to-b from-[#B7282E]/[0.08] dark:from-[#E2474D]/[0.12] to-transparent p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="inline-block rounded-lg bg-[#FDECEC] dark:bg-[#4E161A] px-2.5 py-1 text-xs font-bold text-[#8E1B20] dark:text-[#FFD9DA]">
                {currentMilestone}
              </span>
              <h2 className="mt-2 text-lg font-extrabold text-[#1A1A1E] dark:text-[#F2F2F7]">
                Kur'an'ı Anlama Kapsamı
              </h2>
            </div>

            {/* Circular Progress Indicator */}
            <div className="relative flex h-20 w-20 items-center justify-center shrink-0">
              <svg className="h-20 w-20 -rotate-90 transform" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke={isDark ? '#262630' : '#F0F0F4'}
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke={isDark ? '#E2474D' : '#B7282E'}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute text-sm font-extrabold text-[#B7282E] dark:text-[#E2474D]">
                %{coveragePercentage.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Stats Summary Row */}
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#8A8A96] dark:text-[#7E7E8C]">Öğrenilen Kelime</p>
              <p className="text-base font-extrabold text-[#1A1A1E] dark:text-[#F2F2F7]">
                {totalLearnedCount} / 300
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#8A8A96] dark:text-[#7E7E8C]">Sonraki Aşamaya</p>
              <p className="text-base font-extrabold text-[#C89D42]">
                {nextMilestoneRemaining > 0 ? `${nextMilestoneRemaining} kelime kaldı` : 'Tamamlandı! 🏆'}
              </p>
            </div>
          </div>

          {/* Milestone Linear Progress Bar */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#F0F0F4] dark:bg-[#262630]">
            <div
              className="h-full rounded-full bg-[#B7282E] dark:bg-[#E2474D] transition-all duration-500"
              style={{ width: `${Math.min(100, (totalLearnedCount / 300) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Quick Action Buttons ("Kelime Kartları" & "Quiz Çöz") */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onSelectDeck(1)}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#B7282E] dark:bg-[#E2474D] text-white font-bold text-sm shadow-sm hover:opacity-95 transition active:scale-[0.99]"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>Kelime Kartları</span>
        </button>

        <button
          onClick={onNavigateToQuiz}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#DEC286] dark:bg-[#4F3E1E] text-[#2C2214] dark:text-[#F7E3B5] font-bold text-sm shadow-sm hover:opacity-95 transition active:scale-[0.99]"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Quiz Çöz</span>
        </button>
      </div>

      {/* 3.5. Son 7 Günlük Öğrenilen Kelimeler Bar Grafiği (Recharts) */}
      <div className="rounded-[20px] bg-white dark:bg-[#1B1B22] p-4 shadow-sm border border-[#E4E4EC] dark:border-[#32323E]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-extrabold text-[#1A1A1E] dark:text-[#F2F2F7]">
              Son 7 Günlük Öğrenilen Kelimeler
            </h3>
            <p className="text-xs text-[#8A8A96] dark:text-[#7E7E8C]">
              Günlük öğrenme performansı
            </p>
          </div>
          <span className="rounded-xl bg-[#FDECEC] dark:bg-[#4E161A] px-2.5 py-1 text-xs font-bold text-[#8E1B20] dark:text-[#FFD9DA]">
            Toplam: {last7DaysTotal}
          </span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={last7DaysData}
              margin={{ top: 10, right: 8, left: -24, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? '#262630' : '#F0F0F4'}
              />
              <XAxis
                dataKey="dayName"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: isDark ? '#B8B8C4' : '#5A5A64',
                  fontSize: 12,
                  fontWeight: 600
                }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: isDark ? '#7E7E8C' : '#8A8A96',
                  fontSize: 11
                }}
              />
              <Tooltip
                cursor={{
                  fill: isDark ? 'rgba(226, 71, 77, 0.08)' : 'rgba(183, 40, 46, 0.06)',
                  radius: 8
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const item = payload[0].payload;
                    return (
                      <div className="rounded-xl bg-[#1B1B22] text-[#F2F2F7] px-3 py-2 shadow-lg border border-[#C89D42]/40 text-xs">
                        <p className="font-bold text-[#DEC286]">
                          {item.fullDateLabel} ({item.dayName})
                        </p>
                        <p className="mt-0.5 font-semibold text-[#E2474D]">
                          {item.count} Kelime Öğrenildi
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 2, 2]} maxBarSize={32}>
                {last7DaysData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.isToday
                        ? '#C89D42'
                        : isDark
                        ? '#E2474D'
                        : '#B7282E'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Günün Kelimesi (Daily Featured Word Card) */}
      {dailyWord && (
        <div className="rounded-[20px] bg-[#F0F0F4]/70 dark:bg-[#262630]/70 p-4 border border-[#E4E4EC] dark:border-[#32323E]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-[#C89D42]" />
              <span className="text-xs font-extrabold text-[#1A1A1E] dark:text-[#F2F2F7]">
                Günün Kelimesi (#{dailyWord.id})
              </span>
            </div>

            <button
              onClick={() => audioPlayer.playWord(dailyWord.arabic, dailyWord.audioUrl)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#B7282E] dark:bg-[#E2474D] text-white shadow-sm hover:opacity-90 transition"
              aria-label="Kelimeyi Dinle"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-base font-extrabold text-[#1A1A1E] dark:text-[#F2F2F7]">
                {dailyWord.turkishMeaning}
              </p>
              <p className="text-xs text-[#8A8A96] dark:text-[#7E7E8C] mt-0.5">
                {dailyWord.transliteration} • {dailyWord.wordType}
              </p>
              <p className="text-xs font-semibold text-[#B7282E] dark:text-[#E2474D] mt-0.5">
                Kur'an'da {dailyWord.frequency} kez geçiyor
              </p>
            </div>

            <p
              className="font-arabic text-4xl font-bold text-[#B7282E] dark:text-[#E2474D] pl-3"
              dir="rtl"
            >
              {dailyWord.arabic}
            </p>
          </div>

          <button
            onClick={handleTestSrsNotification}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#8A8A96]/40 dark:border-[#7E7E8C]/40 py-2.5 text-xs font-bold text-[#B7282E] dark:text-[#E2474D] hover:bg-[#B7282E]/5 transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>Hatırlatma Bildirimini Test Et (SRS)</span>
          </button>
        </div>
      )}

      {/* 5. Öğrenme Desteleri Bölümü (12 Deste - 25'er Kelime) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[#1A1A1E] dark:text-[#F2F2F7]">
            Öğrenme Desteleri (12 Deste)
          </h3>
          <span className="text-xs font-semibold text-[#8A8A96] dark:text-[#7E7E8C]">
            25'er Kelime
          </span>
        </div>

        {/* Horizontal Quick Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {decks.map((d) => (
            <button
              key={`chip-${d.deckNumber}`}
              onClick={() => onSelectDeck(d.deckNumber)}
              className="shrink-0 rounded-xl border border-[#E4E4EC] dark:border-[#32323E] bg-white dark:bg-[#1B1B22] px-3 py-1.5 text-xs font-semibold text-[#1A1A1E] dark:text-[#F2F2F7] hover:border-[#B7282E] dark:hover:border-[#E2474D] transition"
            >
              Deste {d.deckNumber} ({d.learnedWords}/{d.totalWords})
            </button>
          ))}
        </div>

        {/* 12 Deck Item Cards */}
        <div className="space-y-2.5">
          {decks.map((deck) => {
            const pct = deck.totalWords > 0 ? Math.round((deck.learnedWords / deck.totalWords) * 100) : 0;
            return (
              <button
                key={deck.deckNumber}
                onClick={() => onSelectDeck(deck.deckNumber)}
                className={`w-full rounded-2xl p-4 text-left border transition ${
                  deck.isCompleted
                    ? 'bg-[#FDECEC]/40 dark:bg-[#4E161A]/30 border-[#2E7D32]/50'
                    : 'bg-white dark:bg-[#1B1B22] border-[#E4E4EC] dark:border-[#32323E] hover:border-[#B7282E] dark:hover:border-[#E2474D]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold ${
                        deck.isCompleted
                          ? 'bg-[#2E7D32] text-white'
                          : 'bg-[#FDECEC] dark:bg-[#4E161A] text-[#8E1B20] dark:text-[#FFD9DA]'
                      }`}
                    >
                      {deck.isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        deck.deckNumber
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[#1A1A1E] dark:text-[#F2F2F7]">
                        {deck.title}
                      </h4>
                      <p className="text-xs text-[#8A8A96] dark:text-[#7E7E8C]">
                        {deck.rangeText}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-extrabold ${
                      deck.isCompleted
                        ? 'text-[#2E7D32]'
                        : 'text-[#B7282E] dark:text-[#E2474D]'
                    }`}
                  >
                    {deck.learnedWords} / {deck.totalWords}
                  </span>
                </div>

                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#F0F0F4] dark:bg-[#262630]">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      deck.isCompleted
                        ? 'bg-[#2E7D32]'
                        : 'bg-[#B7282E] dark:bg-[#E2474D]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
