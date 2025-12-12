/**
 * 날짜 포맷팅 유틸리티
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const formatDateShort = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

/**
 * 숫자 포맷팅
 */
export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals);
};

export const formatScore = (score: number): string => {
  return score.toFixed(2);
};

/**
 * 파일명 생성
 */
export const generateFileName = (prefix: string, extension: string = 'xlsx'): string => {
  const now = new Date();
  const dateStr = formatDateShort(now).replace(/\./g, '');
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  return `${prefix}_${dateStr}_${timeStr}.${extension}`;
};

/**
 * 안전한 파일명 생성 (특수문자 제거)
 */
export const sanitizeFileName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
};

