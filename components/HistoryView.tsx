import React, { useState, useEffect } from 'react';
import { CounselingSession, ScoreChangeHistory, Student } from '../types';
import { getCounselingSessions, getScoreChangeHistory, getSessionsByStudent, getScoreHistoryByStudent } from '../services/historyService';
import { formatDate, formatDateShort } from '../utils/formatUtils';
import { Clock, User, FileText, TrendingUp, TrendingDown, ArrowRight, Calendar } from 'lucide-react';

interface HistoryViewProps {
  students: Student[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ students }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'sessions' | 'scores'>('sessions');
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScoreChangeHistory[]>([]);

  useEffect(() => {
    if (selectedStudentId === 'all') {
      setSessions(getCounselingSessions());
      setScoreHistory(getScoreChangeHistory());
    } else {
      setSessions(getSessionsByStudent(selectedStudentId));
      setScoreHistory(getScoreHistoryByStudent(selectedStudentId));
    }
  }, [selectedStudentId]);

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || '알 수 없음';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-strong mb-4">
          <Clock className="text-white" size={40} />
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
          상담 이력
        </h2>
        <p className="text-slate-600 text-lg font-medium">과거 상담 기록과 점수 변경 이력을 확인하세요</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-soft border border-slate-200/50">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <User size={18} className="text-slate-500" />
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg bg-gradient-to-r from-slate-50 to-white focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700 shadow-sm"
            >
              <option value="all">전체 학생</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'sessions'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <FileText size={16} className="inline mr-2" />
              상담 세션
            </button>
            <button
              onClick={() => setActiveTab('scores')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'scores'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <TrendingUp size={16} className="inline mr-2" />
              점수 변경
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow-soft border border-slate-200/50 text-center">
              <FileText className="text-slate-300 mx-auto mb-4" size={48} />
              <h3 className="text-lg font-bold text-slate-700 mb-2">상담 세션이 없습니다</h3>
              <p className="text-slate-500">상담 분석을 진행하면 이력이 기록됩니다.</p>
            </div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                className="bg-white p-6 rounded-xl shadow-soft border border-slate-200/50 hover:shadow-medium transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                      <Calendar className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{session.studentName}</h3>
                      <p className="text-sm text-slate-500">{formatDate(session.timestamp)}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                    {session.results.length}건 분석
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">국어</div>
                    <div className="font-bold text-slate-800">{session.scores.kor}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">수학</div>
                    <div className="font-bold text-slate-800">{session.scores.math}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">탐구 합</div>
                    <div className="font-bold text-slate-800">{session.scores.exp1 + session.scores.exp2}</div>
                  </div>
                </div>

                {session.notes && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-800">
                    <strong>메모:</strong> {session.notes}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex gap-2 flex-wrap">
                    {session.results.slice(0, 5).map((result, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700"
                      >
                        {result.univName} ({result.status === 'safe' ? '안정' : result.status === 'match' ? '적정' : '위험'})
                      </div>
                    ))}
                    {session.results.length > 5 && (
                      <div className="px-3 py-1.5 bg-slate-200 rounded-lg text-xs font-medium text-slate-600">
                        +{session.results.length - 5}건 더
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Score History Tab */}
      {activeTab === 'scores' && (
        <div className="space-y-4">
          {scoreHistory.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow-soft border border-slate-200/50 text-center">
              <TrendingUp className="text-slate-300 mx-auto mb-4" size={48} />
              <h3 className="text-lg font-bold text-slate-700 mb-2">점수 변경 이력이 없습니다</h3>
              <p className="text-slate-500">학생 점수를 수정하면 이력이 기록됩니다.</p>
            </div>
          ) : (
            scoreHistory.map(history => (
              <div
                key={history.id}
                className="bg-white p-6 rounded-xl shadow-soft border border-slate-200/50 hover:shadow-medium transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm">
                      <TrendingUp className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{getStudentName(history.studentId)}</h3>
                      <p className="text-sm text-slate-500">{formatDate(history.timestamp)}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                    {history.changedFields.length}개 변경
                  </span>
                </div>

                <div className="space-y-3">
                  {history.changedFields.map(field => {
                    const oldVal = history.oldScores[field];
                    const newVal = history.newScores[field];
                    const increased = newVal > oldVal;
                    const fieldNames: Record<string, string> = {
                      kor: '국어',
                      math: '수학',
                      eng: '영어',
                      hist: '한국사',
                      exp1: '탐구1',
                      exp2: '탐구2',
                    };

                    return (
                      <div
                        key={field}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <span className="font-semibold text-slate-700">{fieldNames[field]}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 line-through">{oldVal}</span>
                          <ArrowRight size={16} className="text-slate-400" />
                          <span className={`font-bold ${increased ? 'text-green-600' : 'text-red-600'}`}>
                            {newVal}
                          </span>
                          {increased ? (
                            <TrendingUp size={16} className="text-green-600" />
                          ) : (
                            <TrendingDown size={16} className="text-red-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryView;

