import React, { useState, useMemo } from 'react';
import { QURAN_WORDS_300, QuranWord } from '../data/wordsData';
import { getDeck12Number } from '../utils/storage';
import { audioPlayer } from '../utils/audioPlayer';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Headphones,
  ArrowRight,
  Trophy
} from 'lucide-react';

interface QuizProps {
  onCompleteQuiz: (correct: number, total: number) => void;
  onMarkWord: (wordId: number, knewIt: boolean) => void;
}

type QuizMode = 'AR_TO_TR' | 'TR_TO_AR' | 'AUDIO_QUIZ' | 'AYAH_GAP';

const QUIZ_MODES: { key: QuizMode; title: string }[] = [
  { key: 'AR_TO_TR', title: 'Arapça → Türkçe' },
  { key: 'TR_TO_AR', title: 'Türkçe → Arapça' },
  { key: 'AUDIO_QUIZ', title: 'Sesli Quiz' },
  { key: 'AYAH_GAP', title: 'Ayet Boşluk Doldurma' }
];

interface QuizQuestion {
  target: QuranWord;
  options: QuranWord[];
  correctIndex: number;
  maskedAyah?: string;
}

function buildQuestions(count: number, deckFilter: number | null): QuizQuestion[] {
  const sourcePool =
    deckFilter !== null
      ? QURAN_WORDS_300.filter((w) => getDeck12Number(w.id) === deckFilter)
      : QURAN_WORDS_300;

  const shuffled = [...sourcePool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((target) => {
    const distractors = QURAN_WORDS_300.filter((w) => w.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [target, ...distractors].sort(() => Math.random() - 0.5);
    const correctIndex = options.findIndex((o) => o.id === target.id);
    const maskedAyah = target.exampleAyahArabic.includes(target.arabic)
      ? target.exampleAyahArabic.replace(target.arabic, ' [ ... ] ')
      : `${target.exampleAyahArabic}  [ ... ]`;
    return { target, options, correctIndex, maskedAyah };
  });
}

export const Quiz: React.FC<QuizProps> = ({ onCompleteQuiz, onMarkWord }) => {
  const [currentMode, setCurrentMode] = useState<QuizMode>('AR_TO_TR');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [selectedDeckFilter, setSelectedDeckFilter] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => buildQuestions(10, null));
  const [qIndex, setQIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = questions[qIndex];
  const isAnswerChecked = selectedOptionIndex !== null;

  const startNewQuiz = (
    mode: QuizMode = currentMode,
    count: number = questionCount,
    deck: number | null = selectedDeckFilter
  ) => {
    const fresh = buildQuestions(count, deck);
    setCurrentMode(mode);
    setQuestionCount(count);
    setSelectedDeckFilter(deck);
    setQuestions(fresh);
    setQIndex(0);
    setSelectedOptionIndex(null);
    setScore(0);
    setIsFinished(false);
    if (mode === 'AUDIO_QUIZ' && fresh[0]) {
      setTimeout(() => audioPlayer.playWord(fresh[0].target.arabic, fresh[0].target.audioUrl), 250);
    }
  };

  const handleSelectOption = (index: number) => {
    if (isAnswerChecked || !currentQ) return;
    setSelectedOptionIndex(index);
    const isCorrect = index === currentQ.correctIndex;
    if (isCorrect) {
      setScore((s) => s + 1);
      onMarkWord(currentQ.target.id, true);
    } else {
      onMarkWord(currentQ.target.id, false);
    }
  };

  const handleNextQuestion = () => {
    if (qIndex + 1 < questions.length) {
      const nextIdx = qIndex + 1;
      setQIndex(nextIdx);
      setSelectedOptionIndex(null);
      if (currentMode === 'AUDIO_QUIZ' && questions[nextIdx]) {
        const nextWord = questions[nextIdx].target;
        setTimeout(() => audioPlayer.playWord(nextWord.arabic, nextWord.audioUrl), 200);
      }
    } else {
      setIsFinished(true);
      onCompleteQuiz(score, questions.length);
    }
  };

  const percentage = useMemo(
    () => Math.round((score / Math.max(1, questions.length)) * 100),
    [score, questions.length]
  );

  if (isFinished) {
    const modeTitle = QUIZ_MODES.find((m) => m.key === currentMode)?.title || 'Quiz';
    const resultInfo =
      percentage >= 90
        ? {
            msg: "Mükemmel! Kur'an kelimelerine çok iyi hâkimsiniz! 🌟",
            color: '#2E7D32'
          }
        : percentage >= 70
        ? {
            msg: 'Çok İyi! Biraz daha pratikle üstat olacaksınız! 👏',
            color: '#B7282E'
          }
        : percentage >= 50
        ? {
            msg: 'İyi deneme! Kelime kartlarıyla tekrar yapmanızı öneririz. 📖',
            color: '#C89D42'
          }
        : {
            msg: 'Yılmak yok! Günlük kart tekrarlarıyla başaracaksınız! 💪',
            color: '#E65100'
          };

    return (
      <div className="space-y-4 pb-8">
        <div className="rounded-[28px] bg-white dark:bg-[#1B1B22] p-7 text-center shadow-md border border-[#E4E4EC] dark:border-[#32323E] my-6">
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: `${resultInfo.color}26` }}
          >
            <Trophy className="h-11 w-11" style={{ color: resultInfo.color }} />
          </div>

          <p className="mt-4 text-sm font-semibold text-[#8A8A96] dark:text-[#7E7E8C]">
            {modeTitle}
          </p>
          <h2
            className="mt-1 text-3xl font-extrabold"
            style={{ color: resultInfo.color }}
          >
            %{percentage} Başarı
          </h2>
          <p className="mt-1 text-base font-bold text-[#1A1A1E] dark:text-[#F2F2F7]">
            {score} / {questions.length} Doğru
          </p>
          <p className="mt-3 text-sm text-[#5A5A64] dark:text-[#B8B8C4]">
            {resultInfo.msg}
          </p>

          <button
            onClick={() => startNewQuiz(currentMode, questionCount, selectedDeckFilter)}
            className="mt-6 flex w-full h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#B7282E] dark:bg-[#E2474D] text-white font-bold text-sm shadow-sm transition"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Yeni Quiz Başlat</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-8">
      {/* 1. Quiz Mode Tabs */}
      <div className="-mx-4 flex items-center overflow-x-auto border-b border-[#E4E4EC] dark:border-[#32323E] bg-white dark:bg-[#1B1B22] px-4 no-scrollbar">
        {QUIZ_MODES.map((m) => {
          const active = currentMode === m.key;
          return (
            <button
              key={m.key}
              onClick={() => startNewQuiz(m.key, questionCount, selectedDeckFilter)}
              className={`shrink-0 border-b-2 px-3.5 py-3 text-xs transition ${
                active
                  ? 'border-[#B7282E] dark:border-[#E2474D] font-extrabold text-[#B7282E] dark:text-[#E2474D]'
                  : 'border-transparent font-medium text-[#5A5A64] dark:text-[#B8B8C4]'
              }`}
            >
              {m.title}
            </button>
          );
        })}
      </div>

      {/* 2. Question Count & Deck Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
        <span className="text-xs font-semibold text-[#8A8A96] dark:text-[#7E7E8C] shrink-0">
          Soru:
        </span>
        {[5, 10, 15].map((cnt) => {
          const active = questionCount === cnt;
          return (
            <button
              key={cnt}
              onClick={() => startNewQuiz(currentMode, cnt, selectedDeckFilter)}
              className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold border transition ${
                active
                  ? 'bg-[#FDECEC] dark:bg-[#4E161A] border-[#B7282E]/40 text-[#8E1B20] dark:text-[#FFD9DA]'
                  : 'bg-white dark:bg-[#1B1B22] border-[#E4E4EC] dark:border-[#32323E] text-[#5A5A64] dark:text-[#B8B8C4]'
              }`}
            >
              {cnt} Soru
            </button>
          );
        })}

        <button
          onClick={() => startNewQuiz(currentMode, questionCount, null)}
          className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold border transition ml-1 ${
            selectedDeckFilter === null
              ? 'bg-[#FDECEC] dark:bg-[#4E161A] border-[#B7282E]/40 text-[#8E1B20] dark:text-[#FFD9DA]'
              : 'bg-white dark:bg-[#1B1B22] border-[#E4E4EC] dark:border-[#32323E] text-[#5A5A64] dark:text-[#B8B8C4]'
          }`}
        >
          Tüm Kur'an (300)
        </button>

        {Array.from({ length: 12 }, (_, i) => i + 1).map((deckNum) => {
          const active = selectedDeckFilter === deckNum;
          return (
            <button
              key={deckNum}
              onClick={() => startNewQuiz(currentMode, questionCount, deckNum)}
              className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold border transition ${
                active
                  ? 'bg-[#FDECEC] dark:bg-[#4E161A] border-[#B7282E]/40 text-[#8E1B20] dark:text-[#FFD9DA]'
                  : 'bg-white dark:bg-[#1B1B22] border-[#E4E4EC] dark:border-[#32323E] text-[#5A5A64] dark:text-[#B8B8C4]'
              }`}
            >
              Deste {deckNum}
            </button>
          );
        })}
      </div>

      {/* Progress Bar & Score */}
      {currentQ && (
        <>
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-[#B7282E] dark:text-[#E2474D]">
                Soru {qIndex + 1} / {questions.length}
              </span>
              <span className="rounded-xl bg-[#FDECEC] dark:bg-[#4E161A] px-2.5 py-1 text-xs font-bold text-[#8E1B20] dark:text-[#FFD9DA]">
                Doğru: {score}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F0F0F4] dark:bg-[#262630]">
              <div
                className="h-full rounded-full bg-[#B7282E] dark:bg-[#E2474D] transition-all duration-300"
                style={{ width: `${((qIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="rounded-[24px] bg-white dark:bg-[#1B1B22] p-5 text-center shadow-sm border border-[#C89D42]/35 space-y-2">
            {currentMode === 'AR_TO_TR' && (
              <>
                <p
                  className="font-arabic text-5xl font-bold text-[#B7282E] dark:text-[#E2474D]"
                  dir="rtl"
                >
                  {currentQ.target.arabic}
                </p>
                <p className="text-sm font-medium text-[#5A5A64] dark:text-[#B8B8C4]">
                  {currentQ.target.transliteration}
                </p>
                <button
                  onClick={() =>
                    audioPlayer.playWord(currentQ.target.arabic, currentQ.target.audioUrl)
                  }
                  className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-[#B7282E] dark:text-[#E2474D] hover:bg-[#B7282E]/10 transition"
                  aria-label="Dinle"
                >
                  <Volume2 className="h-5 w-5" />
                </button>
              </>
            )}

            {currentMode === 'TR_TO_AR' && (
              <>
                <p className="text-xs text-[#8A8A96] dark:text-[#7E7E8C]">
                  Bu Türkçe anlamın Arapça karşılığı nedir?
                </p>
                <p className="text-2xl font-extrabold text-[#B7282E] dark:text-[#E2474D] pt-1">
                  {currentQ.target.turkishMeaning}
                </p>
              </>
            )}

            {currentMode === 'AUDIO_QUIZ' && (
              <div className="py-2 space-y-2">
                <button
                  onClick={() =>
                    audioPlayer.playWord(currentQ.target.arabic, currentQ.target.audioUrl)
                  }
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FDECEC] dark:bg-[#4E161A] text-[#8E1B20] dark:text-[#FFD9DA] shadow-sm transition active:scale-95"
                >
                  <Headphones className="h-8 w-8" />
                </button>
                <p className="text-sm font-bold text-[#B7282E] dark:text-[#E2474D]">
                  Sesi Dinlemek İçin Dokunun
                </p>
                <p className="text-xs text-[#8A8A96] dark:text-[#7E7E8C]">
                  Doğru Türkçe anlamı aşağıdan seçin
                </p>
              </div>
            )}

            {currentMode === 'AYAH_GAP' && (
              <div className="space-y-2">
                <p
                  className="font-arabic text-2xl text-[#1A1A1E] dark:text-[#F2F2F7] leading-relaxed"
                  dir="rtl"
                >
                  {currentQ.maskedAyah}
                </p>
                <p className="text-xs text-[#5A5A64] dark:text-[#B8B8C4]">
                  "{currentQ.target.exampleAyahTurkish}"
                </p>
                <button
                  onClick={() =>
                    audioPlayer.playAyah(
                      currentQ.target.exampleAudioUrl,
                      currentQ.target.exampleAyahArabic
                    )
                  }
                  className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-[#B7282E] dark:text-[#E2474D] hover:bg-[#B7282E]/10 transition"
                >
                  <Volume2 className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {/* 4 Options (A, B, C, D) */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, index) => {
              const isSelected = selectedOptionIndex === index;
              const isCorrect = index === currentQ.correctIndex;
              const optionLetter = String.fromCharCode(65 + index);
              const optionLabel =
                currentMode === 'TR_TO_AR' || currentMode === 'AYAH_GAP'
                  ? `${opt.arabic} (${opt.transliteration})`
                  : opt.turkishMeaning;

              let borderColor = 'border-[#E4E4EC] dark:border-[#32323E]';
              let bgColor = 'bg-white dark:bg-[#1B1B22]';
              let textColor = 'text-[#1A1A1E] dark:text-[#F2F2F7]';
              let badgeColor = 'bg-[#F0F0F4] dark:bg-[#262630] text-[#5A5A64] dark:text-[#B8B8C4]';

              if (isAnswerChecked) {
                if (isCorrect) {
                  borderColor = 'border-[#2E7D32]';
                  bgColor = 'bg-[#2E7D32]/15';
                  textColor = 'text-[#2E7D32] font-bold';
                  badgeColor = 'bg-[#2E7D32]/20 text-[#2E7D32]';
                } else if (isSelected) {
                  borderColor = 'border-[#E65100]';
                  bgColor = 'bg-[#E65100]/15';
                  textColor = 'text-[#E65100]';
                  badgeColor = 'bg-[#E65100]/20 text-[#E65100]';
                }
              }

              return (
                <button
                  key={opt.id}
                  disabled={isAnswerChecked}
                  onClick={() => handleSelectOption(index)}
                  className={`flex w-full items-center justify-between rounded-2xl border-[1.5px] p-3.5 text-left transition ${borderColor} ${bgColor}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${badgeColor}`}
                    >
                      {optionLetter}
                    </span>
                    <span
                      className={`text-sm ${
                        currentMode === 'TR_TO_AR' || currentMode === 'AYAH_GAP'
                          ? 'font-arabic text-xl'
                          : ''
                      } ${textColor}`}
                    >
                      {optionLabel}
                    </span>
                  </div>

                  {isAnswerChecked && isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-[#2E7D32] shrink-0" />
                  )}
                  {isAnswerChecked && isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 text-[#E65100] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation & Next Question Button */}
          {isAnswerChecked && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between rounded-2xl border border-[#E4E4EC] dark:border-[#32323E] bg-white dark:bg-[#1B1B22] p-3.5">
                <div>
                  <p className="font-arabic text-xl font-bold text-[#B7282E] dark:text-[#E2474D]">
                    {currentQ.target.arabic} • {currentQ.target.transliteration}
                  </p>
                  <p className="text-xs text-[#5A5A64] dark:text-[#B8B8C4]">
                    Anlamı: {currentQ.target.turkishMeaning} ({currentQ.target.frequency} kez)
                  </p>
                </div>
                <button
                  onClick={() =>
                    audioPlayer.playWord(currentQ.target.arabic, currentQ.target.audioUrl)
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[#B7282E] dark:text-[#E2474D] hover:bg-[#B7282E]/10"
                >
                  <Volume2 className="h-5 w-5" />
                </button>
              </div>

              <button
                onClick={handleNextQuestion}
                className="flex w-full h-[54px] items-center justify-center gap-2 rounded-2xl bg-[#B7282E] dark:bg-[#E2474D] text-white font-bold text-sm shadow-sm transition"
              >
                <span>
                  {qIndex + 1 >= questions.length ? 'Sonuçları Gör' : 'Sonraki Soru'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
