import * as XLSX from 'xlsx';
import { Group } from '../types';

/**
 * Format group results into clean text for clipboard
 */
export function formatGroupsAsText(title: string, groups: Group[]): string {
  let text = `==============================\n`;
  text += `${title.toUpperCase() || 'DANH SÁCH CHIA NHÓM HỌC SINH'}\n`;
  text += `Tổng số nhóm: ${groups.length} | Tổng học sinh: ${groups.reduce((acc, g) => acc + g.members.length, 0)}\n`;
  text += `Thời gian tạo: ${new Date().toLocaleString('vi-VN')}\n`;
  text += `==============================\n\n`;

  groups.forEach((group, idx) => {
    text += `【 ${group.name.toUpperCase()} 】 (${group.members.length} học sinh)\n`;
    group.members.forEach((m, mIdx) => {
      const isLeader = group.leaderId === m.id ? ' [Nhóm trưởng]' : '';
      const gender = m.gender ? ` (${m.gender})` : '';
      const cls = m.className ? ` - Lớp ${m.className}` : '';
      text += `  ${mIdx + 1}. ${m.name}${gender}${cls}${isLeader}\n`;
    });
    text += `\n`;
  });

  return text;
}

/**
 * Format group results as Tab-Separated Values (TSV) for direct paste into Excel/Sheets
 */
export function formatGroupsAsTSV(groups: Group[]): string {
  let tsv = 'Nhóm\tSTT trong nhóm\tHọ và tên\tGiới tính\tLớp\tVai trò\n';
  groups.forEach((group) => {
    group.members.forEach((m, idx) => {
      const role = group.leaderId === m.id ? 'Nhóm trưởng' : 'Thành viên';
      tsv += `${group.name}\t${idx + 1}\t${m.name}\t${m.gender || ''}\t${m.className || ''}\t${role}\n`;
    });
  });
  return tsv;
}

/**
 * Export results to Excel (.xlsx)
 */
export function exportToExcel(title: string, groups: Group[]): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Detailed list
  const listData: any[][] = [
    [title || 'DANH SÁCH PHÂN NHÓM HỌC SINH'],
    [`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`],
    [],
    ['Tên Nhóm', 'STT trong nhóm', 'Họ và tên', 'Giới tính', 'Lớp', 'Vai trò', 'Ghi chú'],
  ];

  groups.forEach((g) => {
    g.members.forEach((m, idx) => {
      listData.push([
        g.name,
        idx + 1,
        m.name,
        m.gender || '',
        m.className || '',
        g.leaderId === m.id ? 'Nhóm trưởng' : 'Thành viên',
        m.note || '',
      ]);
    });
  });

  const wsList = XLSX.utils.aoa_to_sheet(listData);
  wsList['!cols'] = [
    { wch: 18 }, // Tên Nhóm
    { wch: 16 }, // STT
    { wch: 28 }, // Họ và tên
    { wch: 12 }, // Giới tính
    { wch: 12 }, // Lớp
    { wch: 16 }, // Vai trò
    { wch: 20 }, // Ghi chú
  ];

  XLSX.utils.book_append_sheet(wb, wsList, 'Danh_Sach_Chi_Tiet');

  // Sheet 2: Matrix/Column view (Group 1, Group 2, Group 3 side by side)
  const maxMembers = Math.max(...groups.map((g) => g.members.length), 0);
  const matrixData: any[][] = [];

  // Header row: Group names
  const headerRow: string[] = [];
  groups.forEach((g) => {
    headerRow.push(`${g.name} (${g.members.length})`);
  });
  matrixData.push(headerRow);

  // Rows for members
  for (let r = 0; r < maxMembers; r++) {
    const row: string[] = [];
    groups.forEach((g) => {
      const student = g.members[r];
      if (student) {
        const leaderBadge = g.leaderId === student.id ? ' ★' : '';
        row.push(`${r + 1}. ${student.name}${leaderBadge}`);
      } else {
        row.push('');
      }
    });
    matrixData.push(row);
  }

  const wsMatrix = XLSX.utils.aoa_to_sheet(matrixData);
  wsMatrix['!cols'] = groups.map(() => ({ wch: 26 }));
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Bang_Theo_Cot');

  const fileName = `${(title || 'Danh_Sach_Chia_Nhom').replace(/[\s\/\\]+/g, '_')}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export results to Word (.doc) with Vietnamese standard classroom layout
 */
export function exportToWord(title: string, groups: Group[]): void {
  const totalStudents = groups.reduce((acc, g) => acc + g.members.length, 0);
  const dateStr = new Date().toLocaleDateString('vi-VN');

  let html = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>${title || 'Danh sách chia nhóm học sinh'}</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 13pt;
        line-height: 1.4;
        color: #111827;
        margin: 20mm;
      }
      .header-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      .header-table td {
        border: none;
        vertical-align: top;
        font-size: 11pt;
      }
      .doc-title {
        text-align: center;
        font-size: 16pt;
        font-weight: bold;
        text-transform: uppercase;
        margin-top: 15px;
        margin-bottom: 5px;
      }
      .doc-subtitle {
        text-align: center;
        font-style: italic;
        font-size: 11pt;
        margin-bottom: 25px;
        color: #4b5563;
      }
      .group-card {
        margin-bottom: 24px;
        page-break-inside: avoid;
      }
      .group-header {
        font-size: 13pt;
        font-weight: bold;
        color: #1e3a8a;
        background-color: #f1f5f9;
        padding: 6px 12px;
        border: 1px solid #cbd5e1;
        border-bottom: none;
      }
      table.data-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 12px;
      }
      table.data-table th, table.data-table td {
        border: 1px solid #94a3b8;
        padding: 6px 10px;
        font-size: 11pt;
      }
      table.data-table th {
        background-color: #f8fafc;
        font-weight: bold;
        text-align: center;
      }
      .text-center { text-align: center; }
      .text-left { text-align: left; }
      .leader-tag {
        color: #b45309;
        font-weight: bold;
      }
      .signature-table {
        width: 100%;
        margin-top: 40px;
        border-collapse: collapse;
        page-break-inside: avoid;
      }
      .signature-table td {
        border: none;
        text-align: center;
        vertical-align: top;
        font-size: 12pt;
      }
    </style>
  </head>
  <body>
    <table class="header-table">
      <tr>
        <td style="width: 50%; text-align: center;">
          <strong>SỞ GD&ĐT / PHÒNG GD&ĐT</strong><br>
          <strong>TRƯỜNG THPT / THCS</strong><br>
          -------------------
        </td>
        <td style="width: 50%; text-align: center;">
          <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>
          <strong>Độc lập - Tự do - Hạnh phúc</strong><br>
          *****************
        </td>
      </tr>
    </table>

    <div class="doc-title">${title || 'DANH SÁCH CHIA NHÓM HỌC SINH HOẠT ĐỘNG'}</div>
    <div class="doc-subtitle">Tổng số: ${groups.length} nhóm &nbsp;|&nbsp; Tổng số học sinh: ${totalStudents} em &nbsp;|&nbsp; Ngày lập: ${dateStr}</div>

    ${groups
      .map(
        (g, gIdx) => `
      <div class="group-card">
        <div class="group-header">
          ${g.name.toUpperCase()} (Gồm ${g.members.length} học sinh)
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 10%;">STT</th>
              <th style="width: 45%;">Họ và tên</th>
              <th style="width: 15%;">Giới tính</th>
              <th style="width: 15%;">Lớp</th>
              <th style="width: 15%;">Vai trò</th>
            </tr>
          </thead>
          <tbody>
            ${g.members
              .map(
                (m, mIdx) => `
              <tr>
                <td class="text-center">${mIdx + 1}</td>
                <td><strong>${m.name}</strong></td>
                <td class="text-center">${m.gender || '-'}</td>
                <td class="text-center">${m.className || '-'}</td>
                <td class="text-center ${g.leaderId === m.id ? 'leader-tag' : ''}">
                  ${g.leaderId === m.id ? 'Nhóm trưởng ★' : 'Thành viên'}
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `
      )
      .join('')}

    <table class="signature-table">
      <tr>
        <td style="width: 50%;"></td>
        <td style="width: 50%;">
          <em>Ngày ..... tháng ..... năm 202...</em><br>
          <strong>GIÁO VIÊN PHỤ TRÁCH</strong><br>
          <em style="font-size: 10pt;">(Ký và ghi rõ họ tên)</em>
          <br><br><br><br>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(title || 'Danh_Sach_Chia_Nhom').replace(/[\s\/\\]+/g, '_')}_${Date.now()}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Triggers clean browser print dialog with print-ready stylesheet for PDF generation
 */
export function triggerPrintToPDF(title: string): void {
  try {
    const originalTitle = document.title;
    document.title = (title || 'Danh_Sach_Chia_Nhom_Hoc_Sinh').replace(/[\s\/\\]+/g, '_');
    window.print();
    // Restore document title after short timeout
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  } catch (err) {
    console.warn('Print action interrupted or blocked:', err);
  }
}
