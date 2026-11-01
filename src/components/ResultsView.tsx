import React, { useState } from 'react';
import {
  Copy,
  FileSpreadsheet,
  FileText,
  Printer,
  Check,
  Search,
  Award,
  ArrowRightLeft,
  ChevronDown,
  Edit2,
  Users
} from 'lucide-react';
import { Group, Student } from '../types';
import {
  exportToExcel,
  exportToWord,
  formatGroupsAsText,
  formatGroupsAsTSV,
  triggerPrintToPDF
} from '../utils/exporter';

interface ResultsViewProps {
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  sessionTitle: string;
  onReshuffle: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  groups,
  setGroups,
  sessionTitle,
  onReshuffle,
}) => {
  const [copiedType, setCopiedType] = useState<'text' | 'tsv' | string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [transferStudent, setTransferStudent] = useState<{
    student: Student;
    fromGroupId: string;
  } | null>(null);

  const totalStudents = groups.reduce((acc, g) => acc + g.members.length, 0);

  const copyToClipboard = async (text: string, type: 'text' | 'tsv' | string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch (err) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedType(type);
        setTimeout(() => setCopiedType(null), 2500);
      } catch (fallbackErr) {
        console.error('Failed to copy', fallbackErr);
      }
    }
  };

  const handleCopyFormattedText = () => {
    const text = formatGroupsAsText(sessionTitle, groups);
    copyToClipboard(text, 'text');
  };

  const handleCopyTSV = () => {
    const tsv = formatGroupsAsTSV(groups);
    copyToClipboard(tsv, 'tsv');
  };

  const handleCopySingleGroup = (group: Group) => {
    let text = `【 ${group.name.toUpperCase()} 】 (${group.members.length} học sinh)\n`;
    group.members.forEach((m, idx) => {
      const leader = group.leaderId === m.id ? ' [Nhóm trưởng]' : '';
      text += `${idx + 1}. ${m.name}${m.gender ? ` (${m.gender})` : ''}${leader}\n`;
    });
    copyToClipboard(text, group.id);
  };

  const handleSetLeader = (groupId: string, studentId: string) => {
    setGroups(
      groups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            leaderId: g.leaderId === studentId ? undefined : studentId,
          };
        }
        return g;
      })
    );
  };

  const startRenameGroup = (group: Group) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const saveRenameGroup = () => {
    if (editingGroupId && editingGroupName.trim()) {
      setGroups(
        groups.map((g) =>
          g.id === editingGroupId ? { ...g, name: editingGroupName.trim() } : g
        )
      );
    }
    setEditingGroupId(null);
  };

  const handleMoveStudent = (targetGroupId: string) => {
    if (!transferStudent || transferStudent.fromGroupId === targetGroupId) {
      setTransferStudent(null);
      return;
    }

    setGroups((prev) => {
      const { student, fromGroupId } = transferStudent;
      return prev.map((grp) => {
        if (grp.id === fromGroupId) {
          return {
            ...grp,
            members: grp.members.filter((m) => m.id !== student.id),
            leaderId: grp.leaderId === student.id ? undefined : grp.leaderId,
          };
        }
        if (grp.id === targetGroupId) {
          return {
            ...grp,
            members: [...grp.members, student],
          };
        }
        return grp;
      });
    });

    setTransferStudent(null);
  };

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-700">Chưa có kết quả chia nhóm</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Vui lòng nhập danh sách học sinh và nhấn nút "TRỘN &amp; CHIA NHÓM NGAY" ở trên.
        </p>
      </div>
    );
  }

  // Filter groups for search term
  const filteredGroups = groups.map((g) => {
    if (!searchTerm.trim()) return g;
    const term = searchTerm.toLowerCase();
    const matchesGroup = g.name.toLowerCase().includes(term);
    const matchedMembers = g.members.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        (m.gender && m.gender.toLowerCase().includes(term)) ||
        (m.className && m.className.toLowerCase().includes(term))
    );
    return matchesGroup ? g : { ...g, members: matchedMembers };
  }).filter((g) => g.members.length > 0 || !searchTerm.trim());

  return (
    <div className="space-y-6">
      {/* Top Action & Export Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Stats and Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-bold text-slate-900 text-sm">{groups.length} nhóm</span>
            <span>·</span>
            <span>Tổng cộng: <strong className="tabular-nums text-blue-600">{totalStudents}</strong> học sinh</span>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm học sinh hoặc nhóm..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Copy Dropdown / Grouped buttons */}
          <button
            type="button"
            onClick={handleCopyFormattedText}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs ${
              copiedType === 'text'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
            title="Sao chép văn bản có định dạng rõ ràng để dán vào Word/Zalo"
          >
            {copiedType === 'text' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedType === 'text' ? 'Đã sao chép!' : 'Copy danh sách'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyTSV}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs ${
              copiedType === 'tsv'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
            title="Sao chép dạng bảng để dán trực tiếp vào Excel hoặc Google Sheets"
          >
            {copiedType === 'tsv' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy dạng bảng Excel</span>
          </button>

          {/* Download Word */}
          <button
            type="button"
            onClick={() => exportToWord(sessionTitle, groups)}
            className="px-3 py-2 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            title="Tải về file Microsoft Word (.doc) có sẵn quốc hiệu và bảng biểu"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Tải file Word</span>
          </button>

          {/* Download Excel */}
          <button
            type="button"
            onClick={() => exportToExcel(sessionTitle, groups)}
            className="px-3 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            title="Tải về file Excel (.xlsx) với 2 trang tính chi tiết"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tải file Excel</span>
          </button>

          {/* Print / PDF */}
          <button
            type="button"
            onClick={() => triggerPrintToPDF(sessionTitle)}
            className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            title="Mở hộp thoại in hoặc Lưu thành file PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In / Xuất PDF</span>
          </button>
        </div>
      </div>

      {/* Transfer Student Modal / Dialog if active */}
      {transferStudent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Chuyển học sinh sang nhóm khác</h3>
            <p className="text-xs text-slate-600 mb-4">
              Chuyển em <strong>{transferStudent.student.name}</strong> sang nhóm:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto mb-5">
              {groups.map((grp) => (
                <button
                  key={grp.id}
                  disabled={grp.id === transferStudent.fromGroupId}
                  onClick={() => handleMoveStudent(grp.id)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-colors ${
                    grp.id === transferStudent.fromGroupId
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-800'
                  }`}
                >
                  <span className="font-semibold">{grp.name}</span>
                  <span className="text-slate-500 tabular-nums">{grp.members.length} học sinh</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setTransferStudent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Group Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGroups.map((group, groupIdx) => {
          const leader = group.members.find((m) => m.id === group.leaderId);
          const maleInGroup = group.members.filter((m) => m.gender === 'Nam').length;
          const femaleInGroup = group.members.filter((m) => m.gender === 'Nữ').length;

          return (
            <div
              key={group.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card Header with group color */}
              <div
                className="p-3.5 border-b border-slate-100 flex items-center justify-between"
                style={{ borderTop: `4px solid ${group.color || '#0284c7'}` }}
              >
                <div className="flex items-center gap-2 flex-1 mr-2">
                  {editingGroupId === group.id ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        autoFocus
                        value={editingGroupName}
                        onChange={(e) => setEditingGroupName(e.target.value)}
                        onBlur={saveRenameGroup}
                        onKeyDown={(e) => e.key === 'Enter' && saveRenameGroup()}
                        className="w-full text-sm font-bold text-slate-900 border border-blue-400 rounded px-1.5 py-0.5"
                      />
                      <button
                        onClick={saveRenameGroup}
                        className="text-xs font-medium text-blue-600 hover:underline shrink-0"
                      >
                        Lưu
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => startRenameGroup(group)}
                      className="group/title cursor-pointer flex items-center gap-1.5"
                      title="Nhấn để đổi tên nhóm"
                    >
                      <h4 className="text-sm font-bold text-slate-900">
                        {group.name}
                      </h4>
                      <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold tabular-nums">
                    {group.members.length} hs
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopySingleGroup(group)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                    title="Sao chép riêng nhóm này"
                  >
                    {copiedType === group.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sub-header with gender breakdown & leader info */}
              <div className="px-3.5 py-1.5 bg-slate-50/70 border-b border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>
                  Nam: <strong className="tabular-nums text-slate-700">{maleInGroup}</strong> · Nữ: <strong className="tabular-nums text-slate-700">{femaleInGroup}</strong>
                </span>
                {leader ? (
                  <span className="font-semibold text-amber-700 flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-600" />
                    <span className="truncate max-w-[120px]">{leader.name}</span>
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Chưa chọn nhóm trưởng</span>
                )}
              </div>

              {/* Member List */}
              <div className="p-3 divide-y divide-slate-100 flex-1 overflow-y-auto max-h-72">
                {group.members.map((member, mIdx) => {
                  const isLeader = group.leaderId === member.id;
                  return (
                    <div
                      key={member.id}
                      className={`py-2 px-1 text-xs flex items-center justify-between gap-2 group/member hover:bg-slate-50 rounded transition-colors ${
                        isLeader ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums w-5 shrink-0 text-right">
                          {mIdx + 1}.
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-slate-900 truncate flex items-center gap-1">
                            <span>{member.name}</span>
                            {isLeader && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded shrink-0">
                                Trưởng
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            {member.gender && (
                              <span className={member.gender === 'Nam' ? 'text-blue-600' : 'text-rose-600'}>
                                {member.gender}
                              </span>
                            )}
                            {member.className && <span>· Lớp {member.className}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Row actions: Set leader or Move student */}
                      <div className="flex items-center gap-1 opacity-0 group-hover/member:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleSetLeader(group.id, member.id)}
                          title={isLeader ? 'Bỏ làm nhóm trưởng' : 'Chọn làm nhóm trưởng'}
                          className={`p-1 rounded ${
                            isLeader
                              ? 'text-amber-600 hover:bg-amber-100'
                              : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setTransferStudent({ student: member, fromGroupId: group.id })
                          }
                          title="Chuyển sang nhóm khác"
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
