import React, { useState, useMemo } from 'react';
import { QURAN_WORDS_300, QuranWord } from '../data/wordsData';
import { audioPlayer } from '../utils/audioPlayer';
import { Volume2, CheckCircle2, XCircle, RefreshCw, Headphones, HelpCircle } from 'lucide-react';

interface QuizProps {
  onCompleteQuiz: (correct: number, total: number) => void;
  onMarkWord: (wordId: number, knewIt: boolean) => void;
}

type QuizMode = 'STANDARD' | 'AUDIO';

interface QuizQuestion {
  target: QuranWord;
  options: QuranWord[];
}

function generateQuestions(count = 10): QuizQuestion[] {
  const pool = [...QURAN_WORDS_300].sort(() => Math.random() - 0.5);
  const selected = pool.slice(0, count);

  return selected.map((target) => {
    const distractors = QURAN_WORDS_300.filter((w) => w.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [target, ...distractors].sort(() => Math.random() - 0.5);
    return { target, options };
  });
}

export const Quiz: React.FC<QuizProps> = ({ onCompleteQuiz, onMarkWord }) => {
  const [quizMode, setQuizMode] = useState<QuizMode>('STANDARD');
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => generateQuestions(10));
  const [qIndex, setQIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = questions[qIndex];

  const handleSelectOption = (option: QuranWord) => {
    if (selectedOptionId !== null || !currentQ) return;
    setSelectedOptionId(option.id);
    const isCorrect = option.id === currentQ.target.id;
    if (isCorrect) {
      setScore((s) => s + 1);
      onMarkWord(currentQ.target.id, true);
    } else {
      onMarkWord(currentQ.target.id, false);
    }
  };

  const handleNext = () => {
    if (qIndex + 1 < questions.length) {
      const nextIdx = qIndex + 1;
      setQIndex(nextIdx);
      setSelectedOptionId(null);
      if (quizMode === 'AUDIO') {
        const nextWord = questions[nextIdx].target;
        setTimeout(() => audioPlayer.playWord(nextWord.arabic, nextWord.audioUrl), 200);
      }
    } else {
      setIsFinished(true);
      onCompleteQuiz(score, questions.length);
    }
  };

  const restartQuiz = (newMode: QuizMode = quizMode) => {
    const fresh = generateQuestions(10);
    setQuizMode(newMode);
    setQuestions(fresh);
    setQIndex(0);
    setSelectedOptionId(null);
    setScore(0);
    setIsFinished(false);
    if (newMode === 'AUDIO' && fresh[0]) {
      setTimeout(() => audioPlayer.playWord(fresh[0].target.arabic, fresh[0].target.audioUrl), 250);
    }
  };

  const accuracyPct = useMemo(
    () => Math.round((score / Math.max(1, questions.length)) * 100),
    [score, questions.length]
  );

  if (isFinished) {
    return (
      <div className="rounded-3xl bg-white dark:bg-slate-900 p-8 text-center shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-3xl">
          🏆
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Quiz Tamamlandı!
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {questions.length} soruda <strong>{score}</strong> doğru yanıt (%{accuracyPct} Başarı)
        </p>
        <button
          onClick={() => restartQuiz(quizMode)}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white px-6 py-3 text-sm font-bold transition"
        >
          <RefreshCw className="h-4 w-4" />
          Yeni 10 Soruluk Quiz Başlat
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Mode Switcher: 4-Option Standard vs Audio Listening Quiz */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-200/70 dark:bg-slate-900 p-1">
        <button
          onClick={() => restartQuiz('STANDARD')}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
            quizMode === 'STANDARD'
              ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          4 Şıklı Kelime Testi
        </button>
        <button
          onClick={() => restartQuiz('AUDIO')}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
            quizMode === 'AUDIO'
              ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Headphones className="h-4 w-4" />
          Sesli Dinleme Quizi
        </button>
      </div>

      {/* Question Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Soru <strong>{qIndex + 1}</strong> / {questions.length}
          </span>
          <span>
            Sıra <strong>#{currentQ.target.id}</strong> • {currentQ.target.frequency} Kez Geçer
          </span>
        </div>

        {quizMode === 'AUDIO' ? (
          <div className="py-6 space-y-3">
            <button
              onClick={() => audioPlayer.playWord(currentQ.target.arabic, currentQ.target.audioUrl)}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-800 hover:bg-emerald-700 text-amber-300 shadow-lg transition active:scale-95"
            >
              <Volume2 className="h-9 w-9" />
            </button>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Sesi dinleyip doğru Türkçe anlamı seçin
            </p>
            {selectedOptionId !== null && (
              <p className="font-arabic text-4xl font-bold text-emerald-800 dark:text-amber-400" dir="rtl">
                {currentQ.target.arabic}
              </p>
            )}
          </div>
        ) : (
          <div className="py-4 space-y-2">
            <p className="font-arabic text-6xl font-bold text-emerald-900 dark:text-amber-400" dir="rtl">
              {currentQ.target.arabic}
            </p>
            <p className="text-xs text-slate-500">{currentQ.target.transliteration}</p>
            <button
              onClick={() => audioPlayer.playWord(currentQ.target.arabic, currentQ.target.audioUrl)}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300"
            >
              <Volume2 className="h-3.5 w-3.5" /> Telaffuzu Dinle
            </button>
          </div>
        )}

        {/* 4 Options */}
        <div className="grid grid-cols-1 gap-2.5 text-left pt-2">
          {currentQ.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const isCorrect = opt.id === currentQ.target.id;
            let btnStyle =
              'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-500';

            if (selectedOptionId !== null) {
              if (isCorrect) {
                btnStyle =
                  'bg-emerald-600/15 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-bold';
              } else if (isSelected) {
                btnStyle = 'bg-rose-600/15 border-rose-500 text-rose-900 dark:text-rose-300';
              }
            }

            return (
              <button
                key={opt.id}
                disabled={selectedOptionId !== null}
                onClick={() => handleSelectOption(opt)}
                className={`flex items-center justify-between rounded-2xl border p-4 text-sm transition ${btnStyle}`}
              >
                <span>{opt.turkishMeaning}</span>
                {selectedOptionId !== null && isCorrect && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                )}
                {selectedOptionId !== null && isSelected && !isCorrect && (
                  <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {selectedOptionId !== null && (
          <button
            onClick={handleNext}
            className="w-full rounded-2xl bg-emerald-800 hover:bg-emerald-700 dark:bg-amber-400 dark:text-slate-950 text-white py-3.5 text-sm font-bold transition"
          >
            {qIndex + 1 < questions.length ? 'Sonraki Soru →' : 'Sonucu Gör'}
          </button>
        )}
      </div>
    </div>
  );
};
