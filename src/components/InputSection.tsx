import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  ClipboardList,
  Edit3,
  Trash2,
  Plus,
  Sparkles,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  UserCheck
} from 'lucide-react';
import { Student } from '../types';
import { parseExcelFile, parseRawText, generateSampleExcelTemplate } from '../utils/parser';
import { SAMPLE_STUDENTS_CLASS_A, SAMPLE_TEXT_INPUT } from '../utils/sampleData';

interface InputSectionProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  sessionTitle: string;
  setSessionTitle: (title: string) => void;
  onGoToShuffle: () => void;
  onClearGroups: () => void;
  isUsingSample: boolean;
  setIsUsingSample: (val: boolean) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  students,
  setStudents,
  sessionTitle,
  setSessionTitle,
  onGoToShuffle,
  onClearGroups,
  isUsingSample,
  setIsUsingSample,
}) => {
  const [activeMode, setActiveMode] = useState<'excel' | 'paste' | 'manual'>('excel');
  const [pasteText, setPasteText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual input state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'Nam' | 'Nữ' | ''>('');
  const [newStudentClass, setNewStudentClass] = useState('');

  const maleCount = students.filter((s) => s.gender === 'Nam').length;
  const femaleCount = students.filter((s) => s.gender === 'Nữ').length;

  // Auto-parse pasteText whenever the user pastes or modifies the text
  const handlePasteChange = (text: string) => {
    setPasteText(text);
    if (!text.trim()) {
      return;
    }
    const parsed = parseRawText(text);
    if (parsed.length > 0) {
      setStudents(parsed);
      onClearGroups();
      setIsUsingSample(false);
      setErrorMessage(null);
      setSuccessMessage(`Đã nhận diện thành công ${parsed.length} học sinh từ danh sách bạn vừa dán!`);
      if (!sessionTitle || sessionTitle.includes('mẫu') || sessionTitle === '10A1') {
        setSessionTitle(`Danh sách ${parsed.length} học sinh (Dán vào)`);
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessing(true);
    try {
      const { students: parsed, detectedClass } = await parseExcelFile(file);
      setStudents(parsed);
      onClearGroups();
      setIsUsingSample(false);

      const fileNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      const newTitle = detectedClass ? `Lớp ${detectedClass} (${fileNameClean})` : fileNameClean;
      setSessionTitle(newTitle);

      setSuccessMessage(
        `✓ Đã tải lên thành công ${parsed.length} học sinh từ file "${file.name}"! Danh sách của bạn đã sẵn sàng để trộn.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi đọc file Excel. Vui lòng kiểm tra lại file của bạn!');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleLoadSampleA = () => {
    setErrorMessage(null);
    setStudents(SAMPLE_STUDENTS_CLASS_A);
    onClearGroups();
    setIsUsingSample(true);
    setSessionTitle('Lớp 10A1 - Danh sách mẫu');
    setSuccessMessage('Đang nạp danh sách mẫu (32 học sinh) để bạn làm quen.');
  };

  const handleAddManualStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const newStudent: Student = {
      id: `std_man_${Date.now()}_${students.length + 1}`,
      stt: students.length + 1,
      name: newStudentName.trim(),
      gender: newStudentGender || undefined,
      className: newStudentClass.trim() || undefined,
      originalIndex: students.length + 1,
    };

    setStudents([...students, newStudent]);
    setIsUsingSample(false);
    onClearGroups();
    setNewStudentName('');
    setSuccessMessage(`Đã thêm học sinh: ${newStudent.name}`);
  };

  const handleRemoveStudent = (id: string) => {
    setStudents(students.filter((s) => s.id !== id));
    onClearGroups();
  };

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách hiện tại để nhập lại từ đầu?')) {
      setStudents([]);
      setPasteText('');
      onClearGroups();
      setIsUsingSample(false);
      setErrorMessage(null);
      setSuccessMessage(null);
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
    <div className="space-y-6">
      {/* Top Banner and Status Indicator */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">1. Nhập danh sách của bạn</h2>
            {students.length > 0 && (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  isUsingSample
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {isUsingSample ? 'Danh sách mẫu thử nghiệm' : '✓ Danh sách của bạn'}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Tải tệp Excel lên hoặc dán danh sách học sinh của bạn để trộn theo nhóm mong muốn.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 border border-emerald-200 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tải file Excel mẫu</span>
          </button>

          <button
            type="button"
            onClick={handleLoadSampleA}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            title="Dùng tạm 32 học sinh mẫu để thử các tính năng"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Dùng thử mẫu</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-700 hover:underline font-semibold"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold text-rose-600 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Input Method Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setActiveMode('excel')}
          className={`p-4 rounded-xl text-left border transition-all flex items-start gap-3.5 ${
            activeMode === 'excel'
              ? 'bg-blue-50/70 border-blue-600 shadow-xs ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className={`p-2.5 rounded-lg ${activeMode === 'excel' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900">1. Tải tệp Excel / CSV</div>
            <div className="text-xs text-slate-500 mt-0.5">Hỗ trợ file từ máy tính (.xlsx, .xls, .csv)</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('paste')}
          className={`p-4 rounded-xl text-left border transition-all flex items-start gap-3.5 ${
            activeMode === 'paste'
              ? 'bg-blue-50/70 border-blue-600 shadow-xs ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className={`p-2.5 rounded-lg ${activeMode === 'paste' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900">2. Dán danh sách (Copy &amp; Paste)</div>
            <div className="text-xs text-slate-500 mt-0.5">Dán văn bản trực tiếp từ Word, Excel, Zalo</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('manual')}
          className={`p-4 rounded-xl text-left border transition-all flex items-start gap-3.5 ${
            activeMode === 'manual'
              ? 'bg-blue-50/70 border-blue-600 shadow-xs ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className={`p-2.5 rounded-lg ${activeMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900">3. Nhập thủ công từng em</div>
            <div className="text-xs text-slate-500 mt-0.5">Gõ trực tiếp tên học sinh vào bảng</div>
          </div>
        </button>
      </div>

      {/* Input Mode 1: Excel Upload */}
      {activeMode === 'excel' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/60'
                : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {isProcessing ? 'Đang đọc danh sách từ file...' : 'Nhấn vào đây để chọn file Excel từ máy tính của bạn'}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5">
              hoặc kéo thả file Excel (.xlsx, .xls, .csv) vào khung này
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Hỗ trợ mọi định dạng danh sách học sinh (VnEdu, SMAS, file điểm, danh sách lớp)</span>
            </div>
          </div>
        </div>
      )}

      {/* Input Mode 2: Paste */}
      {activeMode === 'paste' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <span>Dán danh sách học sinh của bạn vào đây:</span>
            </label>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
              Tự động nhận diện ngay khi dán
            </span>
          </div>

          <textarea
            rows={9}
            value={pasteText}
            onChange={(e) => handlePasteChange(e.target.value)}
            placeholder={`Bạn chỉ cần Copy (Ctrl+C) danh sách từ bất kỳ đâu và Dán (Ctrl+V) vào đây:

Ví dụ dạng danh sách tên:
1. Nguyễn Văn An
2. Trần Thị Bình
3. Lê Minh Cúc

Hoặc dán trực tiếp từ các cột trong file Excel của bạn:
1	Nguyễn Văn An	Nam	10A1
2	Trần Thị Bình	Nữ	10A1`}
            className="w-full p-4 border border-slate-300 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50 leading-relaxed"
          ></textarea>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
            <div className="text-xs text-slate-500">
              {pasteText.trim() ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã nhận diện: {students.length} học sinh</span>
                </span>
              ) : (
                <span>Mẹo: Sao chép cột Họ và tên trong file Excel hoặc Word rồi nhấn Ctrl+V vào ô trên.</span>
              )}
            </div>

            {pasteText.trim() && (
              <button
                type="button"
                onClick={() => handlePasteChange(pasteText)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                Cập nhật lại danh sách ({students.length} hs)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input Mode 3: Manual Direct Entry */}
      {activeMode === 'manual' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Thêm học sinh trực tiếp:</h3>
          <form onSubmit={handleAddManualStudent} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên *</label>
              <input
                type="text"
                required
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="VD: Nguyễn Văn Nam"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Giới tính</label>
              <select
                value={newStudentGender}
                onChange={(e) => setNewStudentGender(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Chọn giới tính --</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lớp</label>
              <input
                type="text"
                value={newStudentClass}
                onChange={(e) => setNewStudentClass(e.target.value)}
                placeholder="VD: 10A1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loaded Students Table & Stats */}
      {students.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          {/* Header of Table */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Danh sách sẽ được trộn:</span>
                <span className="font-extrabold text-blue-700 tabular-nums text-base">
                  {students.length} học sinh
                </span>
              </div>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <div className="text-xs text-slate-600 flex items-center gap-2">
                <span>Nam: <strong className="tabular-nums text-blue-700">{maleCount}</strong></span>
                <span>·</span>
                <span>Nữ: <strong className="tabular-nums text-rose-700">{femaleCount}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa hết để nhập lại</span>
              </button>

              <button
                type="button"
                onClick={onGoToShuffle}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span>Chuyển sang Chia nhóm &rarr;</span>
              </button>
            </div>
          </div>

          {/* Table of Students */}
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider sticky top-0 z-10 font-bold">
                <tr>
                  <th className="py-2.5 px-4 w-16 text-center">STT</th>
                  <th className="py-2.5 px-4">Họ và tên học sinh</th>
                  <th className="py-2.5 px-4 w-28 text-center">Giới tính</th>
                  <th className="py-2.5 px-4 w-28 text-center">Lớp</th>
                  <th className="py-2.5 px-4 w-16 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-4 text-center text-xs text-slate-500 font-mono tabular-nums">
                      {student.stt || idx + 1}
                    </td>
                    <td className="py-2 px-4 font-semibold text-slate-900">
                      {student.name}
                    </td>
                    <td className="py-2 px-4 text-center text-xs">
                      {student.gender === 'Nam' && (
                        <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">Nam</span>
                      )}
                      {student.gender === 'Nữ' && (
                        <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded">Nữ</span>
                      )}
                      {!student.gender && <span className="text-slate-400">-</span>}
                    </td>
                    <td className="py-2 px-4 text-center text-xs text-slate-600">
                      {student.className || '-'}
                    </td>
                    <td className="py-2 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveStudent(student.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded"
                        title="Xóa học sinh này khỏi danh sách"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center shadow-xs">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Chưa có danh sách học sinh</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Vui lòng chọn <strong>Tải file Excel</strong> hoặc <strong>Dán danh sách</strong> ở phía trên để nạp học sinh của bạn vào ứng dụng.
          </p>
        </div>
      )}
    </div>
  );
};
