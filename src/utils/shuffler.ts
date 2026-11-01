import { Group, NamingTheme, ShuffleConfig, Student } from '../types';

const THEME_NAMES: Record<NamingTheme, string[]> = {
  numeric: Array.from({ length: 50 }, (_, i) => `Nhóm ${i + 1}`),
  colors: [
    'Nhóm Xanh Lam',
    'Nhóm Đỏ Nhiệt Huyết',
    'Nhóm Vàng Kim',
    'Nhóm Lục Bảo',
    'Nhóm Tím Thủy Chung',
    'Nhóm Cam Năng Động',
    'Nhóm Lam Ngọc',
    'Nhóm Hồng San Hô',
    'Nhóm Xanh Bạc Hà',
    'Nhóm Hổ Phách',
    'Nhóm Bạc Sáng',
    'Nhóm Bạch Kim',
  ],
  planets: [
    'Nhóm Mặt Trời',
    'Nhóm Sao Kim',
    'Nhóm Sao Hỏa',
    'Nhóm Sao Mộc',
    'Nhóm Sao Thủy',
    'Nhóm Sao Thổ',
    'Nhóm Sao Hải Vương',
    'Nhóm Sao Thiên Vương',
    'Nhóm Trái Đất',
    'Nhóm Mặt Trăng',
  ],
  animals: [
    'Nhóm Rồng Vàng',
    'Nhóm Hổ Mãnh Mẽ',
    'Nhóm Đại Bàng',
    'Nhóm Phượng Hoàng',
    'Nhóm Sư Tử',
    'Nhóm Báo Gấm',
    'Nhóm Sói Xám',
    'Nhóm Cá Heo',
    'Nhóm Gấu Trúc',
    'Nhóm Tuần Lộc',
  ],
  vietnam_landmarks: [
    'Nhóm Fansipan',
    'Nhóm Vịnh Hạ Long',
    'Nhóm Sơn Đoòng',
    'Nhóm Tràng An',
    'Nhóm Phong Nha',
    'Nhóm Côn Đảo',
    'Nhóm Phú Quốc',
    'Nhóm Sa Pa',
    'Nhóm Tây Bắc',
    'Nhóm Cố Đô Huế',
  ],
};

const GROUP_PALETTE = [
  '#0284c7', // Sky Blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#7c3aed', // Violet
  '#e11d48', // Rose
  '#0d9488', // Teal
  '#4f46e5', // Indigo
  '#ca8a04', // Yellow
  '#ea580c', // Orange
  '#db2777', // Pink
  '#2563eb', // Blue
  '#16a34a', // Green
];

/**
 * Fisher-Yates array shuffle algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Shuffles students and partitions them into groups based on config
 */
export function createShuffledGroups(students: Student[], config: ShuffleConfig): Group[] {
  if (students.length === 0) return [];

  const total = students.length;
  let targetGroupCount = 1;

  if (config.mode === 'by_count') {
    targetGroupCount = Math.max(1, Math.min(total, Math.round(config.sizeOrCount)));
  } else {
    // Mode 'by_size' (e.g. 5, 10, 15 students per group)
    const targetSize = Math.max(1, Math.round(config.sizeOrCount));
    if (config.remainderStrategy === 'new_group') {
      targetGroupCount = Math.ceil(total / targetSize);
    } else {
      // 'distribute' remainder students into existing groups
      targetGroupCount = Math.max(1, Math.round(total / targetSize));
    }
  }

  // Initialize group containers
  const names = THEME_NAMES[config.namingTheme] || THEME_NAMES.numeric;
  const groups: Group[] = Array.from({ length: targetGroupCount }, (_, i) => ({
    id: `grp_${Date.now()}_${i + 1}`,
    name: names[i] || `Nhóm ${i + 1}`,
    members: [],
    color: GROUP_PALETTE[i % GROUP_PALETTE.length],
  }));

  if (config.balanceGender) {
    // Separate into males, females, and unassigned
    const males = students.filter((s) => s.gender === 'Nam');
    const females = students.filter((s) => s.gender === 'Nữ');
    const others = students.filter((s) => s.gender !== 'Nam' && s.gender !== 'Nữ');

    const shuffledMales = shuffleArray(males);
    const shuffledFemales = shuffleArray(females);
    const shuffledOthers = shuffleArray(others);

    // Distribute round-robin to ensure balanced ratios
    let gIdx = 0;
    for (const m of shuffledMales) {
      groups[gIdx % targetGroupCount].members.push(m);
      gIdx++;
    }

    // Offset female distribution to balance group sizes
    gIdx = (targetGroupCount - 1);
    for (const f of shuffledFemales) {
      // Find group with smallest size or round robin
      let minGroup = groups[0];
      for (const grp of groups) {
        if (grp.members.length < minGroup.members.length) {
          minGroup = grp;
        }
      }
      minGroup.members.push(f);
    }

    for (const o of shuffledOthers) {
      let minGroup = groups[0];
      for (const grp of groups) {
        if (grp.members.length < minGroup.members.length) {
          minGroup = grp;
        }
      }
      minGroup.members.push(o);
    }
  } else {
    // Pure Fisher-Yates random shuffle
    const shuffled = shuffleArray(students);

    if (config.mode === 'by_size' && config.remainderStrategy === 'new_group') {
      const targetSize = Math.max(1, Math.round(config.sizeOrCount));
      for (let i = 0; i < shuffled.length; i++) {
        const groupIndex = Math.floor(i / targetSize);
        if (groups[groupIndex]) {
          groups[groupIndex].members.push(shuffled[i]);
        }
      }
    } else {
      // Distribute round-robin into targetGroupCount groups
      shuffled.forEach((student, index) => {
        groups[index % targetGroupCount].members.push(student);
      });
    }
  }

  // Filter out any empty groups if created
  return groups.filter((g) => g.members.length > 0);
}

/**
 * Randomly pick a group leader for each group
 */
export function assignRandomLeaders(groups: Group[]): Group[] {
  return groups.map((g) => {
    if (g.members.length === 0) return g;
    const randomMember = g.members[Math.floor(Math.random() * g.members.length)];
    return {
      ...g,
      leaderId: randomMember.id,
    };
  });
}
