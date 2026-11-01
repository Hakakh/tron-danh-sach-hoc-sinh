import React, { useState } from 'react';
import {
  History,
  Trash2,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Clock,
  Users,
  Edit2,
  Check,
  Calendar,
  Layers
} from 'lucide-react';
import { ShuffleHistoryItem } from '../types';
import { exportToExcel, exportToWord } from '../utils/exporter';

interface HistorySectionProps {
  history: ShuffleHistoryItem[];
  onRestore: (item: ShuffleHistoryItem) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onClearAll: () => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  history,
  onRestore,
  onDelete,
  onRename,
  onClearAll,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartRename = (item: ShuffleHistoryItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
  };

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-700">Chưa có lịch sử chia nhóm</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Mỗi khi bạn thực hiện trộn và chia nhóm học sinh, hệ thống sẽ tự động lưu lại lịch sử tại đây để bạn có thể xem lại hoặc xuất file bất kỳ lúc nào.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Lịch sử các lần chia nhóm</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Lưu trữ tự động trên trình duyệt của bạn ({history.length} phiên đã lưu).
          </p>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5 border border-rose-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Xóa toàn bộ lịch sử</span>
        </button>
      </div>

      {/* History Items List */}
      <div className="space-y-4">
        {history.map((item) => {
          const dateStr = new Date(item.timestamp).toLocaleString('vi-VN');
          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
            >
              {/* Info Column */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1.5 flex-1 max-w-md">
                      <input
                        type="text"
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleSaveRename(item.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(item.id)}
                        className="w-full text-base font-bold text-slate-900 border border-blue-400 rounded px-2 py-0.5"
                      />
                      <button
                        onClick={() => handleSaveRename(item.id)}
                        className="text-xs font-semibold text-blue-600 hover:underline shrink-0"
                      >
                        Lưu
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {item.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleStartRename(item)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded"
                        title="Đổi tên đợt này"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Metadata tags */}
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dateStr}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span><strong className="text-slate-700 tabular-nums">{item.totalStudents}</strong> học sinh</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span><strong className="text-slate-700 tabular-nums">{item.groupCount}</strong> nhóm</span>
                  </span>
                  {item.config.mode === 'by_size' && (
                    <>
                      <span>·</span>
                      <span className="text-blue-600 font-medium">
                        Quy mô ~{item.config.sizeOrCount} hs/nhóm
                      </span>
                    </>
                  )}
                </div>

                {/* Groups preview pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {item.groups.slice(0, 8).map((g, idx) => (
                    <span
                      key={g.id || idx}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                    >
                      {g.name} ({g.members.length})
                    </span>
                  ))}
                  {item.groups.length > 8 && (
                    <span className="text-[11px] text-slate-400">
                      +{item.groups.length - 8} nhóm khác
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-end lg:self-center shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => exportToExcel(item.title, item.groups)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 border border-emerald-200"
                  title="Tải nhanh file Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportToWord(item.title, item.groups)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 border border-blue-200"
                  title="Tải nhanh file Word"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Word</span>
                </button>

                <button
                  type="button"
                  onClick={() => onRestore(item)}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Xem &amp; Mở lại</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Xóa phiên này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
