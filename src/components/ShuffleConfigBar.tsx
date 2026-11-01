import React, { useState } from 'react';
import { Shuffle, Sliders, Settings2, Users, Layers, Award } from 'lucide-react';
import { NamingTheme, RemainderStrategy, ShuffleConfig, Student } from '../types';

interface ShuffleConfigBarProps {
  students: Student[];
  config: ShuffleConfig;
  setConfig: React.Dispatch<React.SetStateAction<ShuffleConfig>>;
  sessionTitle: string;
  setSessionTitle: (title: string) => void;
  onShuffle: () => void;
  onAssignLeaders: () => void;
  hasGroups: boolean;
}

export const ShuffleConfigBar: React.FC<ShuffleConfigBarProps> = ({
  students,
  config,
  setConfig,
  sessionTitle,
  setSessionTitle,
  onShuffle,
  onAssignLeaders,
  hasGroups,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const total = students.length;

  // Calculate projected group counts
  let projectedGroups = 0;
  let projectedSizeInfo = '';

  if (total > 0) {
    if (config.mode === 'by_size') {
      const size = Math.max(1, config.sizeOrCount);
      if (config.remainderStrategy === 'new_group') {
        projectedGroups = Math.ceil(total / size);
        const remainder = total % size;
        if (remainder === 0) {
          projectedSizeInfo = `${projectedGroups} nhóm x ${size} học sinh`;
        } else {
          projectedSizeInfo = `${projectedGroups - 1} nhóm x ${size} hs + 1 nhóm ${remainder} hs`;
        }
      } else {
        projectedGroups = Math.max(1, Math.round(total / size));
        projectedSizeInfo = `~${projectedGroups} nhóm (${Math.floor(total / projectedGroups)}-${Math.ceil(total / projectedGroups)} hs/nhóm)`;
      }
    } else {
      projectedGroups = Math.max(1, Math.min(total, config.sizeOrCount));
      projectedSizeInfo = `${projectedGroups} nhóm (~${Math.round(total / projectedGroups)} hs/nhóm)`;
    }
  }

  const handleSelectPreset = (size: number) => {
    setConfig({
      ...config,
      mode: 'by_size',
      sizeOrCount: size,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
      {/* Session Title Input */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Tên đợt chia nhóm / Lớp học:
          </label>
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder="VD: Lớp 10A1 - Hoạt động thảo luận nhóm môn Văn"
            className="w-full text-base font-semibold text-slate-900 border-0 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-0 px-0 py-1 bg-transparent transition-colors"
          />
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1.5 self-start sm:self-center">
          <Users className="w-4 h-4 text-slate-400" />
          <span>Tổng số: <strong className="text-slate-800 tabular-nums">{total}</strong> học sinh</span>
        </div>
      </div>

      {/* Main Requirement: Presets 5, 10, 15 or Custom */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Chọn số lượng học sinh mỗi nhóm:</span>
          </label>
          <div className="text-xs text-blue-600 font-medium">
            {projectedSizeInfo && `Dự kiến: ${projectedSizeInfo}`}
          </div>
        </div>

        {/* Preset Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => handleSelectPreset(5)}
            className={`py-3 px-3 rounded-xl border text-center transition-all ${
              config.mode === 'by_size' && config.sizeOrCount === 5
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <div className="text-base font-bold">5 học sinh</div>
            <div className={`text-xs ${config.mode === 'by_size' && config.sizeOrCount === 5 ? 'text-blue-100' : 'text-slate-500'}`}>
              Chuẩn nhóm nhỏ
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset(10)}
            className={`py-3 px-3 rounded-xl border text-center transition-all ${
              config.mode === 'by_size' && config.sizeOrCount === 10
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <div className="text-base font-bold">10 học sinh</div>
            <div className={`text-xs ${config.mode === 'by_size' && config.sizeOrCount === 10 ? 'text-blue-100' : 'text-slate-500'}`}>
              Nhóm trung bình
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset(15)}
            className={`py-3 px-3 rounded-xl border text-center transition-all ${
              config.mode === 'by_size' && config.sizeOrCount === 15
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <div className="text-base font-bold">15 học sinh</div>
            <div className={`text-xs ${config.mode === 'by_size' && config.sizeOrCount === 15 ? 'text-blue-100' : 'text-slate-500'}`}>
              Nhóm lớn / Phân ban
            </div>
          </button>

          {/* Custom input */}
          <div
            className={`p-2 rounded-xl border flex flex-col justify-center transition-all ${
              config.mode === 'by_size' && ![5, 10, 15].includes(config.sizeOrCount)
                ? 'bg-blue-50/60 border-blue-500 ring-1 ring-blue-500'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <label className="text-xs text-slate-600 block mb-1 font-medium">
              Tùy chỉnh số lượng:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="2"
                max={Math.max(2, total)}
                value={config.mode === 'by_size' ? config.sizeOrCount : ''}
                placeholder="Nhập số..."
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) {
                    setConfig({
                      ...config,
                      mode: 'by_size',
                      sizeOrCount: val,
                    });
                  }
                }}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-500 shrink-0">hs/nhóm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Settings Toggle & Content */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>{showAdvanced ? 'Thu gọn cài đặt nâng cao ▲' : 'Tùy chọn nâng cao (Cân bằng giới tính, Tên nhóm, Cách xử lý số lẻ) ▼'}</span>
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Mode: Divide by group size OR divide into N total groups */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Kiểu phân chia:
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="groupMode"
                    checked={config.mode === 'by_size'}
                    onChange={() => setConfig({ ...config, mode: 'by_size' })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Theo số học sinh mỗi nhóm</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="groupMode"
                    checked={config.mode === 'by_count'}
                    onChange={() => setConfig({ ...config, mode: 'by_count', sizeOrCount: 4 })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Cố định tổng số nhóm (VD: 4 nhóm)</span>
                </label>
              </div>
            </div>

            {/* Gender balance & Remainder strategy */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Quy tắc chia thông minh:
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.balanceGender}
                    onChange={(e) => setConfig({ ...config, balanceGender: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Cân bằng tỷ lệ Nam / Nữ</span>
                </label>

                <div className="mt-2">
                  <span className="text-slate-500 block mb-1">Xử lý học sinh lẻ:</span>
                  <select
                    value={config.remainderStrategy}
                    onChange={(e) => setConfig({ ...config, remainderStrategy: e.target.value as RemainderStrategy })}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="new_group">Tạo thêm 1 nhóm riêng cho số dư</option>
                    <option value="distribute">Phân bổ đều số dư vào các nhóm khác</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Naming Theme */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Chủ đề đặt tên nhóm:
              </label>
              <select
                value={config.namingTheme}
                onChange={(e) => setConfig({ ...config, namingTheme: e.target.value as NamingTheme })}
                className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="numeric">Số thứ tự (Nhóm 1, Nhóm 2, ...)</option>
                <option value="colors">Màu sắc (Xanh Lam, Đỏ Nhiệt Huyết...)</option>
                <option value="animals">Linh vật dũng mãnh (Rồng Vàng, Hổ, Đại Bàng...)</option>
                <option value="planets">Vũ trụ &amp; Hành tinh (Mặt Trời, Sao Kim, Sao Hỏa...)</option>
                <option value="vietnam_landmarks">Địa danh Việt Nam (Fansipan, Hạ Long...)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Giáo viên cũng có thể tự do bấm vào tên từng nhóm để sửa sau khi trộn.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Shuffle Button & Leader Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="text-xs text-slate-500">
          Thuật toán trộn ngẫu nhiên công bằng, không lặp lại thiên vị.
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {hasGroups && (
            <button
              type="button"
              onClick={onAssignLeaders}
              className="flex-1 sm:flex-none px-3.5 py-2.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              title="Chọn ngẫu nhiên 1 nhóm trưởng cho mỗi nhóm"
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span>Chỉ định Nhóm Trưởng</span>
            </button>
          )}

          <button
            type="button"
            disabled={total === 0}
            onClick={onShuffle}
            className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${
              total === 0
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-98 shadow-blue-500/25'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span>{hasGroups ? 'Trộn lại ngẫu nhiên' : 'TRỘN & CHIA NHÓM NGAY'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
