import React from 'react';
import { Users, Shuffle, History, Sparkles, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  activeTab: 'input' | 'results' | 'lucky' | 'history';
  setActiveTab: (tab: 'input' | 'results' | 'lucky' | 'history') => void;
  studentCount: number;
  historyCount: number;
  hasResults: boolean;
  onDownloadTemplate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  studentCount,
  historyCount,
  hasResults,
  onDownloadTemplate,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                Chia Nhóm Học Sinh
              </span>
              <span className="text-xs text-slate-500 hidden sm:block">
                Trộn danh sách ngẫu nhiên &amp; Xuất báo cáo
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('input')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'input'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>1. Danh sách</span>
              {studentCount > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-semibold tabular-nums">
                  {studentCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('results')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'results'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Shuffle className="w-4 h-4" />
              <span>2. Chia nhóm &amp; Kết quả</span>
              {hasResults && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('lucky')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'lucky'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>3. Bốc thăm</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Lịch sử</span>
              {historyCount > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-medium tabular-nums">
                  {historyCount}
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onDownloadTemplate}
              title="Tải file mẫu Excel"
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">File Excel mẫu</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
