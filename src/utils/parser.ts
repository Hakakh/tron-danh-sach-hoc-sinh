import * as XLSX from 'xlsx';
import { Student } from '../types';

/**
 * Normalizes Vietnamese text for case-insensitive matching
 */
export function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Normalize gender input into 'Nam', 'Nữ', or empty
 */
export function normalizeGender(val?: string | null): 'Nam' | 'Nữ' | string {
  if (!val) return '';
  const clean = val.toString().trim().toLowerCase();
  if (['nam', 'm', 'male', 'trai', 'boy', '1'].includes(clean)) return 'Nam';
  if (['nu', 'nữ', 'f', 'female', 'gai', 'gái', 'girl', 'x', '2'].includes(clean)) return 'Nữ';
  return val.toString().trim();
}

/**
 * Parse an Excel (.xlsx, .xls) or CSV file buffer
 */
export async function parseExcelFile(file: File): Promise<{ students: Student[]; detectedClass?: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Tệp Excel không chứa trang tính (sheet) nào!');
  }

  // Find the sheet with the most data
  let bestSheetName = workbook.SheetNames[0];
  let maxRows = 0;
  for (const name of workbook.SheetNames) {
    const ws = workbook.Sheets[name];
    if (ws && ws['!ref']) {
      const range = XLSX.utils.decode_range(ws['!ref']);
      const rowCount = range.e.r - range.s.r + 1;
      if (rowCount > maxRows) {
        maxRows = rowCount;
        bestSheetName = name;
      }
    }
  }

  const worksheet = workbook.Sheets[bestSheetName];
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!rawData || rawData.length === 0) {
    throw new Error('Trang tính trống, không tìm thấy dữ liệu.');
  }

  // Try to detect class name from title rows (e.g. "LỚP: 10A1" or "LỚP 12A")
  let detectedClass = '';
  for (let r = 0; r < Math.min(6, rawData.length); r++) {
    const rowStr = (rawData[r] || []).join(' ');
    const classMatch = rowStr.match(/l[oớ]p[:\s]+([0-9]{1,2}[a-zA-Z0-9_\-\.\/]+)/i);
    if (classMatch && classMatch[1]) {
      detectedClass = classMatch[1].trim();
      break;
    }
  }

  // Scan for the REAL column header row
  let headerRowIndex = -1;
  let fullNameColIdx = -1;
  let lastNameColIdx = -1; // "Họ và đệm", "Họ và tên đệm", "Họ lót"
  let firstNameColIdx = -1; // "Tên"
  let sttColIdx = -1;
  let genderColIdx = -1;
  let isFemaleOnlyCol = false; // VnEdu style: Column "Nữ" with 'x' for female
  let classColIdx = -1;
  let noteColIdx = -1;

  for (let r = 0; r < Math.min(25, rawData.length); r++) {
    const row = rawData[r];
    if (!Array.isArray(row)) continue;

    let foundNameHeader = false;
    let foundSttOrOther = false;

    for (let c = 0; c < row.length; c++) {
      const cellText = normalizeHeader(String(row[c] || ''));
      if (!cellText) continue;

      if (
        cellText === 'ho va ten' ||
        cellText === 'ho ten' ||
        cellText === 'ho va ten hoc sinh' ||
        cellText === 'ho ten hoc sinh' ||
        cellText === 'fullname' ||
        cellText === 'full name' ||
        cellText === 'ten hoc sinh'
      ) {
        foundNameHeader = true;
      }

      if (cellText === 'ho va dem' || cellText === 'ho va ten dem' || cellText === 'ho va chu lot' || cellText === 'ho dem' || cellText === 'ho lot') {
        foundNameHeader = true;
      }

      if (cellText === 'stt' || cellText === 'so thu tu' || cellText === 'no' || cellText === 'ma hs' || cellText === 'ma hoc sinh') {
        foundSttOrOther = true;
      }
    }

    if (foundNameHeader || (foundSttOrOther && row.length >= 3)) {
      headerRowIndex = r;
      // Analyze this specific header row
      const headerRow = rawData[headerRowIndex];
      for (let c = 0; c < headerRow.length; c++) {
        const text = normalizeHeader(String(headerRow[c] || ''));
        if (!text) continue;

        if (text === 'stt' || text === 'so thu tu' || text === 'no') {
          sttColIdx = c;
        } else if (
          text === 'ho va dem' ||
          text === 'ho va ten dem' ||
          text === 'ho va chu lot' ||
          text === 'ho dem' ||
          text === 'ho lot' ||
          text === 'ho'
        ) {
          lastNameColIdx = c;
        } else if (text === 'ten') {
          firstNameColIdx = c;
        } else if (
          text === 'ho va ten' ||
          text === 'ho ten' ||
          text === 'ho va ten hoc sinh' ||
          text === 'ho ten hoc sinh' ||
          text === 'ten hoc sinh' ||
          text === 'fullname' ||
          text === 'full name' ||
          text === 'name'
        ) {
          fullNameColIdx = c;
        } else if (text === 'nu') {
          genderColIdx = c;
          isFemaleOnlyCol = true;
        } else if (
          text.includes('gioi tinh') ||
          text === 'phai' ||
          text === 'gt' ||
          text === 'gender' ||
          text === 'sex'
        ) {
          genderColIdx = c;
        } else if (text.includes('lop') || text === 'class') {
          classColIdx = c;
        } else if (text.includes('ghi chu') || text === 'note') {
          noteColIdx = c;
        }
      }
      break;
    }
  }

  const students: Student[] = [];
  const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;

  for (let r = startRow; r < rawData.length; r++) {
    const row = rawData[r];
    if (!Array.isArray(row) || row.every((c) => !c || String(c).trim() === '')) {
      continue;
    }

    let fullName = '';

    if (lastNameColIdx !== -1 && firstNameColIdx !== -1) {
      const last = String(row[lastNameColIdx] || '').trim();
      const first = String(row[firstNameColIdx] || '').trim();
      fullName = `${last} ${first}`.trim();
    } else if (fullNameColIdx !== -1) {
      fullName = String(row[fullNameColIdx] || '').trim();
    } else if (firstNameColIdx !== -1) {
      fullName = String(row[firstNameColIdx] || '').trim();
    } else {
      // If no columns mapped, find the first string cell with at least 2 words (likely a Vietnamese name)
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || '').trim();
        // Skip purely numeric cells or very short codes
        if (val && isNaN(Number(val)) && val.length >= 3 && !val.toLowerCase().startsWith('stt')) {
          fullName = val;
          break;
        }
      }
    }

    // Skip empty, header repetitions or noise lines
    const norm = normalizeHeader(fullName);
    if (
      !fullName ||
      norm === 'ho va ten' ||
      norm === 'ho ten' ||
      norm === 'ten' ||
      norm === 'ho va ten hoc sinh' ||
      norm.startsWith('danh sach') ||
      norm.startsWith('tong so') ||
      norm.startsWith('nguoi lap') ||
      norm.startsWith('giao vien')
    ) {
      continue;
    }

    let stt: string | number = students.length + 1;
    if (sttColIdx !== -1 && row[sttColIdx] !== undefined && row[sttColIdx] !== '') {
      const parsedStt = parseInt(String(row[sttColIdx]), 10);
      if (!isNaN(parsedStt)) {
        stt = parsedStt;
      } else {
        stt = String(row[sttColIdx]).trim();
      }
    }

    let gender = '';
    if (genderColIdx !== -1 && row[genderColIdx] !== undefined) {
      const rawGender = String(row[genderColIdx]).trim();
      if (isFemaleOnlyCol) {
        // In "Nữ" column, if marked 'x' or '1' or 'v' it's female, else male
        if (['x', 'x', '1', 'v', 'nu', 'nữ'].includes(rawGender.toLowerCase())) {
          gender = 'Nữ';
        } else if (rawGender === '' || rawGender === '0') {
          gender = 'Nam';
        } else {
          gender = normalizeGender(rawGender);
        }
      } else {
        gender = normalizeGender(rawGender);
      }
    }

    let className = detectedClass;
    if (classColIdx !== -1 && row[classColIdx]) {
      className = String(row[classColIdx]).trim();
    }

    const note = noteColIdx !== -1 && row[noteColIdx] ? String(row[noteColIdx]).trim() : '';

    students.push({
      id: `std_${Date.now()}_${students.length + 1}_${Math.random().toString(36).substring(2, 6)}`,
      stt,
      name: fullName,
      gender,
      className,
      note,
      originalIndex: students.length + 1,
    });
  }

  if (students.length === 0) {
    throw new Error(
      'Không trích xuất được danh sách học sinh từ file. Hãy kiểm tra file có cột chứa Tên hoặc Họ và Tên học sinh không!'
    );
  }

  return { students, detectedClass };
}

/**
 * Parse raw text (paste from clipboard or typed manually)
 */
export function parseRawText(text: string): Student[] {
  if (!text.trim()) return [];

  // Check if text is comma-separated on a few lines or single line
  let rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // If only 1 line but contains multiple commas, split by comma or semicolon
  if (rawLines.length === 1 && (rawLines[0].includes(',') || rawLines[0].includes(';')) && !rawLines[0].includes('\t')) {
    const delimiter = rawLines[0].includes(';') ? ';' : ',';
    rawLines = rawLines[0].split(delimiter).map((s) => s.trim()).filter(Boolean);
  }

  const students: Student[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Check if tab-separated (pasted directly from Excel or Google Sheets)
    if (line.includes('\t')) {
      const parts = line.split('\t').map((p) => p.trim());
      const p0Norm = normalizeHeader(parts[0] || '');
      const p1Norm = normalizeHeader(parts[1] || '');

      // Skip header row if pasted
      if (p0Norm === 'stt' || p0Norm === 'ho ten' || p0Norm === 'ho va ten' || p1Norm === 'ho ten' || p1Norm === 'ho va ten') {
        continue;
      }

      let stt: string | number = students.length + 1;
      let name = '';
      let gender = '';
      let className = '';

      // Case 1: Col 0 is numeric STT
      if (!isNaN(Number(parts[0])) && parts.length > 1) {
        stt = Number(parts[0]);
        // Check if Col 1 is "Họ đệm" and Col 2 is "Tên"
        if (parts.length >= 3 && !parts[1].includes(' ') && parts[2].length <= 10 && !['nam', 'nữ', 'nu'].includes(parts[2].toLowerCase())) {
          name = `${parts[1]} ${parts[2]}`.trim();
          if (parts[3]) gender = normalizeGender(parts[3]);
          if (parts[4]) className = parts[4];
        } else {
          name = parts[1];
          if (parts[2]) gender = normalizeGender(parts[2]);
          if (parts[3]) className = parts[3];
        }
      } else {
        // Col 0 is name
        // Check if Col 0 is "Họ đệm" and Col 1 is "Tên"
        if (parts.length >= 2 && !['nam', 'nu', 'nữ'].includes(parts[1].toLowerCase()) && parts[1].length <= 10 && isNaN(Number(parts[1]))) {
          name = `${parts[0]} ${parts[1]}`.trim();
          if (parts[2]) gender = normalizeGender(parts[2]);
          if (parts[3]) className = parts[3];
        } else {
          name = parts[0];
          if (parts[1]) gender = normalizeGender(parts[1]);
          if (parts[2]) className = parts[2];
        }
      }

      if (name && name.length >= 2) {
        students.push({
          id: `std_txt_${Date.now()}_${students.length + 1}`,
          stt,
          name,
          gender,
          className,
          originalIndex: students.length + 1,
        });
      }
    } else {
      // Plain text line
      let clean = line;
      let detectedStt: number | undefined;

      // Match leading number: "1. Nguyễn Văn A", "01/ Nguyễn Văn A", "1) Nguyễn Văn A", "1 - ..."
      const match = line.match(/^(\d+)[\.\/\-\)\s\:]+(.+)$/);
      if (match) {
        detectedStt = parseInt(match[1], 10);
        clean = match[2].trim();
      }

      // Check for inline gender: "Nguyễn Văn A - Nam" or "Trần Thị B (Nữ)"
      let gender = '';
      const genderMatch = clean.match(/[\(\-\,\/]\s*(Nam|Nữ|Nu|nam|nữ)\s*[\)]?$/i);
      if (genderMatch) {
        gender = normalizeGender(genderMatch[1]);
        clean = clean.replace(/[\(\-\,\/]\s*(Nam|Nữ|Nu|nam|nữ)\s*[\)]?$/i, '').trim();
      }

      // Skip lines that look like document headers
      const norm = normalizeHeader(clean);
      if (
        !clean ||
        norm === 'danh sach hoc sinh' ||
        norm === 'ho va ten' ||
        norm === 'ho ten' ||
        norm === 'stt' ||
        norm === 'stt ho va ten' ||
        norm.startsWith('danh sach lop')
      ) {
        continue;
      }

      if (clean.length >= 2) {
        students.push({
          id: `std_txt_${Date.now()}_${students.length + 1}`,
          stt: detectedStt ?? students.length + 1,
          name: clean,
          gender,
          className: '',
          originalIndex: students.length + 1,
        });
      }
    }
  }

  return students;
}

/**
 * Generate a sample Excel template buffer for teachers to download
 */
export function generateSampleExcelTemplate(): Blob {
  const wsData = [
    ['STT', 'Họ và tên', 'Giới tính', 'Lớp', 'Ghi chú'],
    [1, 'Nguyễn An Khang', 'Nam', '10A1', ''],
    [2, 'Trần Thị Bích Ngọc', 'Nữ', '10A1', ''],
    [3, 'Lê Minh Cường', 'Nam', '10A1', ''],
    [4, 'Phạm Thu Dung', 'Nữ', '10A1', ''],
    [5, 'Hoàng Quốc Dũng', 'Nam', '10A1', ''],
    [6, 'Vũ Thị Diễm Hương', 'Nữ', '10A1', ''],
    [7, 'Đặng Tuấn Hải', 'Nam', '10A1', ''],
    [8, 'Bùi Phương Hoa', 'Nữ', '10A1', ''],
    [9, 'Đỗ Tiến Đạt', 'Nam', '10A1', ''],
    [10, 'Ngô Mỹ Linh', 'Nữ', '10A1', ''],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 26 }, // Họ và tên
    { wch: 12 }, // Giới tính
    { wch: 10 }, // Lớp
    { wch: 20 }, // Ghi chú
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'DanhSachHocSinh');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
