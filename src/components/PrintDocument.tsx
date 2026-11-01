import React from 'react';
import { Group } from '../types';

interface PrintDocumentProps {
  title: string;
  groups: Group[];
}

export const PrintDocument: React.FC<PrintDocumentProps> = ({ title, groups }) => {
  const totalStudents = groups.reduce((acc, g) => acc + g.members.length, 0);
  const dateStr = new Date().toLocaleDateString('vi-VN');

  return (
    <div className="print-only p-8 text-black bg-white">
      {/* Formal Vietnamese School Header */}
      <div className="flex justify-between items-start mb-6 text-sm">
        <div className="text-center font-serif">
          <div className="font-bold text-xs uppercase">SỞ GD&amp;ĐT / TRƯỜNG THPT</div>
          <div className="font-bold text-xs">TỔ CHUYÊN MÔN</div>
          <div className="text-[10px] tracking-widest mt-0.5">-------------------</div>
        </div>

        <div className="text-center font-serif">
          <div className="font-bold text-xs uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div className="font-semibold text-xs">Độc lập - Tự do - Hạnh phúc</div>
          <div className="text-[10px] tracking-widest mt-0.5">***************</div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center my-6">
        <h1 className="text-xl font-bold uppercase font-serif tracking-wide">
          {title || 'DANH SÁCH CHIA NHÓM HỌC SINH'}
        </h1>
        <p className="text-xs italic text-gray-700 mt-1">
          Tổng số: {groups.length} nhóm · Tổng số học sinh: {totalStudents} em · Ngày lập: {dateStr}
        </p>
      </div>

      {/* Groups Listing */}
      <div className="space-y-6">
        {groups.map((group, gIdx) => (
          <div key={group.id} className="page-break-inside-avoid border border-gray-400">
            <div className="bg-gray-100 font-bold px-3 py-1.5 text-xs border-b border-gray-400 flex justify-between">
              <span>{group.name.toUpperCase()}</span>
              <span>({group.members.length} học sinh)</span>
            </div>

            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-400">
                  <th className="py-1 px-2 border-r border-gray-300 w-12 text-center">STT</th>
                  <th className="py-1 px-3 border-r border-gray-300 text-left">Họ và tên</th>
                  <th className="py-1 px-2 border-r border-gray-300 w-20 text-center">Giới tính</th>
                  <th className="py-1 px-2 border-r border-gray-300 w-20 text-center">Lớp</th>
                  <th className="py-1 px-2 w-28 text-center">Vai trò</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {group.members.map((member, mIdx) => (
                  <tr key={member.id}>
                    <td className="py-1 px-2 border-r border-gray-300 text-center tabular-nums">
                      {mIdx + 1}
                    </td>
                    <td className="py-1 px-3 border-r border-gray-300 font-medium">
                      {member.name}
                    </td>
                    <td className="py-1 px-2 border-r border-gray-300 text-center">
                      {member.gender || '-'}
                    </td>
                    <td className="py-1 px-2 border-r border-gray-300 text-center">
                      {member.className || '-'}
                    </td>
                    <td className="py-1 px-2 text-center font-semibold">
                      {group.leaderId === member.id ? 'Nhóm trưởng ★' : 'Thành viên'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Signature Section */}
      <div className="page-break-inside-avoid mt-10 flex justify-end text-xs font-serif">
        <div className="text-center w-64">
          <div className="italic">Ngày ..... tháng ..... năm 202...</div>
          <div className="font-bold uppercase mt-1">Giáo viên phụ trách</div>
          <div className="text-[10px] italic text-gray-600">(Ký và ghi rõ họ tên)</div>
          <div className="h-20"></div>
        </div>
      </div>
    </div>
  );
};
