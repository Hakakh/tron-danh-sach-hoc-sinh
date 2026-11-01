import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, Users, RotateCcw, Volume2, UserCheck } from 'lucide-react';
import { Group, Student } from '../types';

interface LuckyDrawProps {
  students: Student[];
  groups: Group[];
}

export const LuckyDraw: React.FC<LuckyDrawProps> = ({ students, groups }) => {
  const [targetType, setTargetType] = useState<'student' | 'group'>('student');
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayItem, setDisplayItem] = useState<string>('???');
  const [winnerDetails, setWinnerDetails] = useState<{
    name: string;
    subtext?: string;
  } | null>(null);
  const [pickedHistory, setPickedHistory] = useState<string[]>([]);
  const [excludePicked, setExcludePicked] = useState(true);

  const availableStudents = excludePicked
    ? students.filter((s) => !pickedHistory.includes(s.id))
    : students;

  const availableGroups = excludePicked
    ? groups.filter((g) => !pickedHistory.includes(g.id))
    : groups;

  const handleStartDraw = () => {
    if (isSpinning) return;

    if (targetType === 'student') {
      if (availableStudents.length === 0) {
        alert('Tất cả học sinh trong danh sách đã được gọi!');
        return;
      }
    } else {
      if (availableGroups.length === 0) {
        alert('Tất cả các nhóm đã được bốc thăm!');
        return;
      }
    }

    setIsSpinning(true);
    setWinnerDetails(null);

    const pool = targetType === 'student' ? availableStudents : availableGroups;
    let counter = 0;
    const totalFlips = 30; // 3 seconds spinning
    const intervalTime = 80;

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * pool.length);
      const randomItem = pool[randomIndex];
      setDisplayItem(randomItem.name);
      counter++;

      if (counter >= totalFlips) {
        clearInterval(interval);
        // Final pick
        const finalWinner = pool[Math.floor(Math.random() * pool.length)];
        setDisplayItem(finalWinner.name);

        let subtext = '';
        if (targetType === 'student') {
          const s = finalWinner as Student;
          subtext = [s.gender, s.className ? `Lớp ${s.className}` : ''].filter(Boolean).join(' · ');
        } else {
          const g = finalWinner as Group;
          subtext = `Gồm ${g.members.length} học sinh`;
        }

        setWinnerDetails({
          name: finalWinner.name,
          subtext,
        });
        setPickedHistory((prev) => [...prev, finalWinner.id]);
        setIsSpinning(false);

        // Confetti burst!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }, intervalTime);
  };

  const handleResetHistory = () => {
    setPickedHistory([]);
    setWinnerDetails(null);
    setDisplayItem('???');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Vòng quay may mắn / Bốc thăm lớp học</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Bốc thăm ngẫu nhiên</h2>
        <p className="text-xs text-slate-500 mt-1">
          Gọi ngẫu nhiên 1 học sinh lên bảng hoặc bốc thăm nhóm thuyết trình công bằng, tạo hứng khởi cho tiết học!
        </p>
      </div>

      {/* Target selector: Student vs Group */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => {
            setTargetType('student');
            setWinnerDetails(null);
            setDisplayItem('???');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            targetType === 'student'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Gọi học sinh ({availableStudents.length} em còn lại)</span>
        </button>

        <button
          type="button"
          disabled={groups.length === 0}
          onClick={() => {
            setTargetType('group');
            setWinnerDetails(null);
            setDisplayItem('???');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            groups.length === 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : targetType === 'group'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Chọn nhóm ({groups.length > 0 ? `${availableGroups.length} nhóm` : 'chưa chia nhóm'})</span>
        </button>
      </div>

      {/* Main Display Stage */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 p-10 text-center shadow-lg border border-slate-700">
        <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">
          {isSpinning ? 'Đang quay ngẫu nhiên...' : winnerDetails ? 'Xin chúc mừng!' : 'Sẵn sàng bốc thăm'}
        </div>

        <div className="min-h-[100px] flex flex-col items-center justify-center">
          <div
            className={`text-3xl sm:text-4xl font-black transition-all ${
              winnerDetails
                ? 'text-amber-400 scale-105'
                : isSpinning
                ? 'text-white blur-xs'
                : 'text-slate-200'
            }`}
          >
            {displayItem}
          </div>

          {winnerDetails?.subtext && (
            <div className="mt-2 text-xs font-medium text-slate-300 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-600">
              {winnerDetails.subtext}
            </div>
          )}
        </div>

        {/* Action button inside stage */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={isSpinning || (targetType === 'student' ? students.length === 0 : groups.length === 0)}
            onClick={handleStartDraw}
            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 ${
              isSpinning
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-extrabold shadow-amber-500/20'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>{isSpinning ? 'Đang chọn...' : 'BẮT ĐẦU BỐC THĂM'}</span>
          </button>
        </div>
      </div>

      {/* Options: Exclude picked & reset */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={excludePicked}
            onChange={(e) => setExcludePicked(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <span>Không gọi lại người/nhóm đã được chọn trong lượt này</span>
        </label>

        {pickedHistory.length > 0 && (
          <div className="flex items-center gap-2">
            <span>Đã gọi {pickedHistory.length} lượt</span>
            <button
              type="button"
              onClick={handleResetHistory}
              className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Làm mới danh sách gọi</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
