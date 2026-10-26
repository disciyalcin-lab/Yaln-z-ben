import React from 'react';
import { QURAN_WORDS_300, TOTAL_QURAN_WORDS } from '../data/wordsData';
import { WordProgress, UserStats, getLast7DaysLearnedData } from '../utils/storage';
import { Award, BarChart3, BookOpen, CheckCircle2, Flame, Sparkles, Volume2, ArrowRight, RotateCcw } from 'lucide-react';
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
  onSelectDeck: (deckId: number) => void;
  onStartQuickReview: () => void;
}

const MILESTONES = [
  { count: 50, title: '50 Kelime Kurdu', subtitle: 'İlk Temel Eşik', icon: '🌱' },
  { count: 100, title: '100 Kelime Kaşifi', subtitle: '%50+ Kur\'an Kapsamı', icon: '🌿' },
  { count: 200, title: '200 Kelime Alimi', subtitle: 'Derin Kavrayış', icon: '🌟' },
  { count: 300, title: '300 Kelime Hafızı', subtitle: '%75+ Kur\'an Kapsamı', icon: '👑' }
];

export const Dashboard: React.FC<DashboardProps> = ({
  progressMap,
  stats,
  onSelectDeck,
  onStartQuickReview
}) => {
  // Always ensure sorted by frequency DESC
  const sortedWords = React.useMemo(
    () => [...QURAN_WORDS_300].sort((a, b) => b.frequency - a.frequency || a.id - b.id),
    []
  );

  const learnedWords = sortedWords.filter((w) => progressMap[w.id]?.isLearned);
  const learnedCount = learnedWords.length;
  const unlearnedCount = sortedWords.length - learnedCount;

  const learnedOccurrences = learnedWords.reduce((sum, w) => sum + w.frequency, 0);
  const total300Occurrences = sortedWords.reduce((sum, w) => sum + w.frequency, 0);

  const currentCoveragePct = ((learnedOccurrences / TOTAL_QURAN_WORDS) * 100).toFixed(1);
  const max300CoveragePct = ((total300Occurrences / TOTAL_QURAN_WORDS) * 100).toFixed(1);

  const now = Date.now();
  const srsDueCount = sortedWords.filter((w) => {
    const p = progressMap[w.id];
    return p && (!p.isLearned || (p.nextReviewTime > 0 && p.nextReviewTime <= now));
  }).length;

  // Last 7 days daily learned words bar chart data
  const last7DaysData = React.useMemo(
    () => getLast7DaysLearnedData(progressMap),
    [progressMap]
  );
  const last7DaysTotal = React.useMemo(
    () => last7DaysData.reduce((sum, item) => sum + item.count, 0),
    [last7DaysData]
  );

  // Word of the day based on date
  const dayOfYear = Math.floor(Date.now() / 86400000);
  const wordOfTheDay = sortedWords[dayOfYear % sortedWords.length];

  const decks = [1, 2, 3, 4, 5, 6].map((deckId) => {
    const deckWords = sortedWords.filter((w) => w.deckId === deckId);
    const deckLearned = deckWords.filter((w) => progressMap[w.id]?.isLearned).length;
    const deckFreqSum = deckWords.reduce((sum, w) => sum + w.frequency, 0);
    const deckCoverage = ((deckFreqSum / TOTAL_QURAN_WORDS) * 100).toFixed(1);
    return {
      deckId,
      title: `${deckId}. Deste (${(deckId - 1) * 50 + 1} - ${deckId * 50})`,
      total: deckWords.length,
      learned: deckLearned,
      coveragePct: deckCoverage
    };
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Cumulative Quran Coverage Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-6 text-white shadow-xl border border-emerald-700/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-400/30">
              <Sparkles className="h-3.5 w-3.5" />
              77.800 Kelime Referanslı Analiz
            </span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
              Kur'an Kelime Kapsamı
            </h2>
            <p className="mt-1 text-xs text-emerald-100/80">
              İlk 300 kelime Kur'an'daki toplam geçişlerin <strong>%{max300CoveragePct}</strong>'ini oluşturur.
            </p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              <Flame className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-bold">{stats.streakDays} Gün</span>
            </div>
          </div>
        </div>

        {/* Big Coverage Meter */}
        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-4xl font-extrabold text-amber-400">%{currentCoveragePct}</span>
              <span className="ml-2 text-xs text-emerald-200">
                ({learnedOccurrences.toLocaleString('tr-TR')} / {TOTAL_QURAN_WORDS.toLocaleString('tr-TR')} kelime geçişi)
              </span>
            </div>
            <span className="text-xs font-semibold text-emerald-200">
              {learnedCount} / 300 Kelime
            </span>
          </div>

          <div className="mt-2.5 h-3.5 w-full overflow-hidden rounded-full bg-emerald-950/80 p-0.5 border border-emerald-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(2, (learnedCount / 300) * 100))}%` }}
            />
          </div>
        </div>

        {/* Counters Grid */}
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-xs text-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
              Öğrenilen
            </div>
            <p className="mt-1 text-xl font-bold">{learnedCount}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-xs text-emerald-200">
              <BookOpen className="h-3.5 w-3.5 text-amber-300" />
              Kalan
            </div>
            <p className="mt-1 text-xl font-bold">{unlearnedCount}</p>
          </div>
          <button
            onClick={onStartQuickReview}
            className="rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 p-3 text-left transition"
          >
            <div className="flex items-center gap-1 text-xs text-amber-200 font-semibold">
              <RotateCcw className="h-3.5 w-3.5" />
              SRS Tekrar
            </div>
            <p className="mt-1 text-xl font-bold text-amber-300">{srsDueCount}</p>
          </button>
        </div>
      </div>

      {/* Last 7 Days Daily Learned Words Bar Chart (Recharts) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-emerald-900/10 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-amber-400" />
              Son 7 Günlük Öğrenilen Kelimeler
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Günlük "Öğrendim" olarak işaretlenen kelime performansı
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950/90 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-amber-300 border border-emerald-500/20">
            Son 7 Gün: {last7DaysTotal} Kelime
          </span>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={last7DaysData}
              margin={{ top: 10, right: 8, left: -24, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={stats.darkMode ? '#1e293b' : '#e2e8f0'}
              />
              <XAxis
                dataKey="dayName"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: stats.darkMode ? '#94a3b8' : '#64748b',
                  fontSize: 12,
                  fontWeight: 600
                }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: stats.darkMode ? '#94a3b8' : '#64748b',
                  fontSize: 11
                }}
              />
              <Tooltip
                cursor={{
                  fill: stats.darkMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.06)',
                  radius: 8
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const item = payload[0].payload;
                    return (
                      <div className="rounded-xl bg-slate-900/95 text-white px-3 py-2 shadow-lg border border-emerald-500/30 text-xs">
                        <p className="font-bold text-amber-300">
                          {item.fullDateLabel} ({item.dayName})
                        </p>
                        <p className="mt-0.5 font-semibold text-emerald-300">
                          {item.count} Kelime Öğrenildi
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 2, 2]} maxBarSize={36}>
                {last7DaysData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.isToday
                        ? '#f59e0b' // Amber highlight for today
                        : stats.darkMode
                        ? '#10b981' // Emerald 500 in dark mode
                        : '#047857' // Emerald 700 in light mode
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex items-center justify-end gap-4 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
            Önceki Günler
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
            Bugün
          </span>
        </div>
      </div>

      {/* Word of the Day Card */}
      {wordOfTheDay && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-emerald-900/10 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Günün Kelimesi • #{wordOfTheDay.id} ({wordOfTheDay.frequency} Kez Geçer)
            </span>
            <button
              onClick={() => audioPlayer.playWord(wordOfTheDay.arabic, wordOfTheDay.audioUrl)}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 transition"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Dinle
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {wordOfTheDay.turkishMeaning}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Okunuşu: <span className="font-semibold">{wordOfTheDay.transliteration}</span> • {wordOfTheDay.wordType}
              </p>
            </div>
            <p className="font-arabic text-4xl font-bold text-emerald-800 dark:text-amber-400" dir="rtl">
              {wordOfTheDay.arabic}
            </p>
          </div>
        </div>
      )}

      {/* 50 - 100 - 200 - 300 Milestone Badges */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Kilometre Taşı Rozetleri
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Hedef: 300 Kelime
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MILESTONES.map((m) => {
            const unlocked = learnedCount >= m.count;
            return (
              <div
                key={m.count}
                className={`rounded-2xl p-3.5 border transition ${
                  unlocked
                    ? 'bg-gradient-to-br from-amber-500/15 to-emerald-500/10 border-amber-400/50 dark:border-amber-500/40'
                    : 'bg-white/60 dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800 opacity-65'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{m.icon}</span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      unlocked
                        ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {unlocked ? 'Açıldı' : `${learnedCount}/${m.count}`}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{m.title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{m.subtitle}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6 Decks (50 words each, strictly frequency ordered) */}
      <div>
        <h3 className="mb-3 text-base font-bold text-slate-900 dark:text-white">
          Frekans Sıralı Kelime Desteleri (1 - 300)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {decks.map((d) => {
            const pct = Math.round((d.learned / d.total) * 100);
            return (
              <button
                key={d.deckId}
                onClick={() => onSelectDeck(d.deckId)}
                className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 p-4 text-left shadow-sm border border-slate-200/80 dark:border-slate-800 hover:border-emerald-600 dark:hover:border-emerald-500 transition"
              >
                <div className="flex items-start justify-between w-full">
                  <div>
                    <span className="inline-block rounded-lg bg-emerald-100 dark:bg-emerald-950/90 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                      Kur'an'ın %{d.coveragePct}'i
                    </span>
                    <h4 className="mt-1.5 font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
                      {d.title}
                    </h4>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition" />
                </div>

                <div className="mt-4 w-full">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>{d.learned} / {d.total} Öğrenildi</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">%{pct}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
