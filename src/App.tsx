/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { ShuffleConfigBar } from './components/ShuffleConfigBar';
import { ResultsView } from './components/ResultsView';
import { LuckyDraw } from './components/LuckyDrawModal';
import { HistorySection } from './components/HistorySection';
import { PrintDocument } from './components/PrintDocument';
import { Group, ShuffleConfig, ShuffleHistoryItem, Student } from './types';
import { assignRandomLeaders, createShuffledGroups } from './utils/shuffler';
import { generateSampleExcelTemplate } from './utils/parser';
import {
  clearAllHistory,
  deleteHistoryItem,
  loadHistory,
  renameHistoryItem,
  saveHistoryItem,
} from './utils/storage';

export default function App() {
  // Start with an empty list so it NEVER shuffles a default sample list without the user's consent!
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState<'input' | 'results' | 'lucky' | 'history'>('input');
  const [sessionTitle, setSessionTitle] = useState('');
  const [isUsingSample, setIsUsingSample] = useState(false);

  const [config, setConfig] = useState<ShuffleConfig>({
    mode: 'by_size',
    sizeOrCount: 5, // Default to 5 students per group as requested
    balanceGender: true,
    remainderStrategy: 'new_group',
    namingTheme: 'numeric',
  });

  const [history, setHistory] = useState<ShuffleHistoryItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Load history on initial mount
  useEffect(() => {
    const saved = loadHistory();
    setHistory(saved);
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const handleShuffle = () => {
    if (students.length === 0) {
      alert('Chưa có học sinh nào trong danh sách! Vui lòng tải file Excel hoặc dán danh sách của bạn trước.');
      setActiveTab('input');
      return;
    }

    const newGroups = createShuffledGroups(students, config);
    setGroups(newGroups);

    // Save to history automatically
    const finalTitle = sessionTitle.trim() || `Đợt chia nhóm (${students.length} học sinh) - ${new Date().toLocaleDateString('vi-VN')}`;
    const historyItem: ShuffleHistoryItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      title: finalTitle,
      totalStudents: students.length,
      groupCount: newGroups.length,
      config,
      groups: newGroups,
      originalStudents: students,
    };

    saveHistoryItem(historyItem);
    setHistory(loadHistory());

    // Switch to results view and celebrate
    setActiveTab('results');
    showNotification(`✓ Đã trộn thành công ${students.length} học sinh của bạn vào ${newGroups.length} nhóm!`);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
      });
    } catch (e) {
      // Ignored if confetti fails
    }
  };

  const handleAssignLeaders = () => {
    if (groups.length === 0) return;
    const updated = assignRandomLeaders(groups);
    setGroups(updated);
    showNotification('Đã chỉ định ngẫu nhiên nhóm trưởng cho tất cả các nhóm!');
  };

  const handleRestoreHistory = (item: ShuffleHistoryItem) => {
    setGroups(item.groups);
    if (item.originalStudents && item.originalStudents.length > 0) {
      setStudents(item.originalStudents);
    }
    setSessionTitle(item.title);
    setConfig(item.config);
    setIsUsingSample(false);
    setActiveTab('results');
    showNotification(`Đã khôi phục: ${item.title}`);
  };

  const handleDeleteHistory = (id: string) => {
    const updated = deleteHistoryItem(id);
    setHistory(updated);
    showNotification('Đã xóa phiên lịch sử.');
  };

  const handleRenameHistory = (id: string, newTitle: string) => {
    const updated = renameHistoryItem(id, newTitle);
    setHistory(updated);
    showNotification('Đã cập nhật tên phiên.');
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử các lần chia nhóm?')) {
      clearAllHistory();
      setHistory([]);
      showNotification('Đã xóa sạch lịch sử.');
    }
  };

  const handleDownloadTemplate = () => {
    const blob = generateSampleExcelTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mau_Danh_Sach_Hoc_Sinh.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-fade-in no-print border border-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
          <span>{notification}</span>
        </div>
      )}

      {/* Screen View */}
      <div className="no-print flex-1 flex flex-col">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          studentCount={students.length}
          historyCount={history.length}
          hasResults={groups.length > 0}
          onDownloadTemplate={handleDownloadTemplate}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Tab 1: Input list */}
          {activeTab === 'input' && (
            <div className="space-y-6">
              <InputSection
                students={students}
                setStudents={setStudents}
                sessionTitle={sessionTitle}
                setSessionTitle={setSessionTitle}
                onGoToShuffle={() => setActiveTab('results')}
                onClearGroups={() => setGroups([])}
                isUsingSample={isUsingSample}
                setIsUsingSample={setIsUsingSample}
              />

              {students.length > 0 && (
                <ShuffleConfigBar
                  students={students}
                  config={config}
                  setConfig={setConfig}
                  sessionTitle={sessionTitle}
                  setSessionTitle={setSessionTitle}
                  onShuffle={handleShuffle}
                  onAssignLeaders={handleAssignLeaders}
                  hasGroups={groups.length > 0}
                />
              )}
            </div>
          )}

          {/* Tab 2: Results & Grouping */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              {students.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-xs">
                  <h3 className="text-base font-bold text-slate-800">Chưa có danh sách học sinh để chia nhóm</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto mb-4">
                    Vui lòng tải file Excel hoặc dán danh sách học sinh của bạn vào trước.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('input')}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs"
                  >
                    &larr; Đi đến trang nhập danh sách học sinh
                  </button>
                </div>
              ) : (
                <>
                  <ShuffleConfigBar
                    students={students}
                    config={config}
                    setConfig={setConfig}
                    sessionTitle={sessionTitle}
                    setSessionTitle={setSessionTitle}
                    onShuffle={handleShuffle}
                    onAssignLeaders={handleAssignLeaders}
                    hasGroups={groups.length > 0}
                  />

                  <ResultsView
                    groups={groups}
                    setGroups={setGroups}
                    sessionTitle={sessionTitle || `Danh sách chia nhóm (${students.length} học sinh)`}
                    onReshuffle={handleShuffle}
                  />
                </>
              )}
            </div>
          )}

          {/* Tab 3: Lucky Draw / Classroom wheel */}
          {activeTab === 'lucky' && (
            <LuckyDraw students={students} groups={groups} />
          )}

          {/* Tab 4: History */}
          {activeTab === 'history' && (
            <HistorySection
              history={history}
              onRestore={handleRestoreHistory}
              onDelete={handleDeleteHistory}
              onRename={handleRenameHistory}
              onClearAll={handleClearAllHistory}
            />
          )}
        </main>

        {/* Quiet Footer */}
        <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>Ứng dụng Hỗ Trợ Giáo Viên · Trộn ngẫu nhiên &amp; Chia nhóm học sinh</div>
            <div className="text-slate-400">
              Xuất dữ liệu: Word (.doc), Excel (.xlsx), PDF &amp; Bảng tính
            </div>
          </div>
        </footer>
      </div>

      {/* Print-Only Document */}
      <PrintDocument title={sessionTitle || 'DANH SÁCH CHIA NHÓM HỌC SINH'} groups={groups} />
    </div>
  );
}
