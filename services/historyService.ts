import { CounselingSession, ScoreChangeHistory, Student, StudentScores, AnalysisResult } from '../types';
import { formatDate } from '../utils/formatUtils';

const STORAGE_KEY_SESSIONS = 'jeongsi_sessions_v1';
const STORAGE_KEY_SCORE_HISTORY = 'jeongsi_score_history_v1';

/**
 * 상담 세션 저장
 */
export const saveCounselingSession = (
  student: Student,
  results: AnalysisResult[],
  notes?: string
): CounselingSession => {
  const session: CounselingSession = {
    id: Date.now().toString(),
    studentId: student.id,
    studentName: student.name,
    timestamp: new Date(),
    scores: { ...student.scores },
    results: [...results],
    notes,
  };

  const sessions = getCounselingSessions();
  sessions.unshift(session); // 최신이 앞에
  // 최근 100개만 유지
  if (sessions.length > 100) {
    sessions.splice(100);
  }
  localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  
  return session;
};

/**
 * 상담 세션 조회
 */
export const getCounselingSessions = (): CounselingSession[] => {
  const stored = localStorage.getItem(STORAGE_KEY_SESSIONS);
  if (!stored) return [];
  
  try {
    const sessions = JSON.parse(stored);
    // Date 객체 복원
    return sessions.map((s: any) => ({
      ...s,
      timestamp: new Date(s.timestamp),
    }));
  } catch (e) {
    console.error('Failed to parse sessions', e);
    return [];
  }
};

/**
 * 학생별 상담 세션 조회
 */
export const getSessionsByStudent = (studentId: string): CounselingSession[] => {
  return getCounselingSessions().filter(s => s.studentId === studentId);
};

/**
 * 점수 변경 이력 저장
 */
export const saveScoreChange = (
  studentId: string,
  oldScores: StudentScores,
  newScores: StudentScores
): ScoreChangeHistory | null => {
  const changedFields: (keyof StudentScores)[] = [];
  
  (Object.keys(newScores) as (keyof StudentScores)[]).forEach(key => {
    if (oldScores[key] !== newScores[key]) {
      changedFields.push(key);
    }
  });

  if (changedFields.length === 0) return null;

  const history: ScoreChangeHistory = {
    id: Date.now().toString(),
    studentId,
    timestamp: new Date(),
    oldScores: { ...oldScores },
    newScores: { ...newScores },
    changedFields,
  };

  const histories = getScoreChangeHistory();
  histories.unshift(history);
  // 최근 200개만 유지
  if (histories.length > 200) {
    histories.splice(200);
  }
  localStorage.setItem(STORAGE_KEY_SCORE_HISTORY, JSON.stringify(histories));
  
  return history;
};

/**
 * 점수 변경 이력 조회
 */
export const getScoreChangeHistory = (): ScoreChangeHistory[] => {
  const stored = localStorage.getItem(STORAGE_KEY_SCORE_HISTORY);
  if (!stored) return [];
  
  try {
    const histories = JSON.parse(stored);
    return histories.map((h: any) => ({
      ...h,
      timestamp: new Date(h.timestamp),
    }));
  } catch (e) {
    console.error('Failed to parse score history', e);
    return [];
  }
};

/**
 * 학생별 점수 변경 이력 조회
 */
export const getScoreHistoryByStudent = (studentId: string): ScoreChangeHistory[] => {
  return getScoreChangeHistory().filter(h => h.studentId === studentId);
};

/**
 * 이력 삭제 (오래된 데이터 정리)
 */
export const clearOldHistory = (daysToKeep: number = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const sessions = getCounselingSessions().filter(s => s.timestamp >= cutoffDate);
  const histories = getScoreChangeHistory().filter(h => h.timestamp >= cutoffDate);

  localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  localStorage.setItem(STORAGE_KEY_SCORE_HISTORY, JSON.stringify(histories));
};

