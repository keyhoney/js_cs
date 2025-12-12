import React, { useMemo } from 'react';
import { Student, AnalysisResult } from '../types';
import ComparisonChart from './Charts/ComparisonChart';
import { Users, TrendingUp, Award, AlertTriangle, BarChart3 } from 'lucide-react';

interface AnalyticsProps {
  students: Student[];
  excelData: any[];
  results?: AnalysisResult[];
}

const Analytics: React.FC<AnalyticsProps> = ({ students, excelData, results = [] }) => {
  const stats = useMemo(() => {
    if (students.length === 0) {
      return {
        totalStudents: 0,
        avgKor: 0,
        avgMath: 0,
        avgExp: 0,
        totalResults: 0,
        safeCount: 0,
        matchCount: 0,
        riskCount: 0,
      };
    }

    const totalKor = students.reduce((sum, s) => sum + s.scores.kor, 0);
    const totalMath = students.reduce((sum, s) => sum + s.scores.math, 0);
    const totalExp = students.reduce((sum, s) => sum + s.scores.exp1 + s.scores.exp2, 0);

    const safeCount = results.filter(r => r.status === 'safe').length;
    const matchCount = results.filter(r => r.status === 'match').length;
    const riskCount = results.filter(r => r.status === 'risk').length;

    return {
      totalStudents: students.length,
      avgKor: totalKor / students.length,
      avgMath: totalMath / students.length,
      avgExp: totalExp / students.length,
      totalResults: results.length,
      safeCount,
      matchCount,
      riskCount,
    };
  }, [students, results]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-strong mb-4">
          <TrendingUp className="text-white" size={40} />
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
          통계 분석 대시보드
        </h2>
        <p className="text-slate-600 text-lg font-medium">전체 학생 현황 및 통계를 확인하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200/50 hover:shadow-medium transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm">
              <Users className="text-white" size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-1">{stats.totalStudents}</div>
          <div className="text-sm text-slate-500 font-medium">전체 학생 수</div>
        </div>

        {/* Average Korean */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200/50 hover:shadow-medium transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm">
              <BarChart3 className="text-white" size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-1">{stats.avgKor.toFixed(1)}</div>
          <div className="text-sm text-slate-500 font-medium">국어 평균 (표준)</div>
        </div>

        {/* Average Math */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200/50 hover:shadow-medium transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm">
              <Award className="text-white" size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-1">{stats.avgMath.toFixed(1)}</div>
          <div className="text-sm text-slate-500 font-medium">수학 평균 (표준)</div>
        </div>

        {/* Average Exploration */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200/50 hover:shadow-medium transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm">
              <TrendingUp className="text-white" size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-1">{stats.avgExp.toFixed(1)}</div>
          <div className="text-sm text-slate-500 font-medium">탐구 평균 합</div>
        </div>
      </div>

      {/* Results Stats */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-soft border border-blue-200/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500 rounded-xl shadow-sm">
                <Award className="text-white" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-700 mb-1">{stats.safeCount}</div>
            <div className="text-sm text-blue-600 font-medium">안정 지원</div>
            <div className="text-xs text-blue-500 mt-2">
              {stats.totalResults > 0 ? ((stats.safeCount / stats.totalResults) * 100).toFixed(1) : 0}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl shadow-soft border border-green-200/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500 rounded-xl shadow-sm">
                <TrendingUp className="text-white" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-700 mb-1">{stats.matchCount}</div>
            <div className="text-sm text-green-600 font-medium">적정 지원</div>
            <div className="text-xs text-green-500 mt-2">
              {stats.totalResults > 0 ? ((stats.matchCount / stats.totalResults) * 100).toFixed(1) : 0}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl shadow-soft border border-red-200/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-500 rounded-xl shadow-sm">
                <AlertTriangle className="text-white" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-red-700 mb-1">{stats.riskCount}</div>
            <div className="text-sm text-red-600 font-medium">위험 지원</div>
            <div className="text-xs text-red-500 mt-2">
              {stats.totalResults > 0 ? ((stats.riskCount / stats.totalResults) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      )}

      {/* Comparison Chart */}
      {students.length > 0 && (
        <div className="mt-6">
          <ComparisonChart students={students} />
        </div>
      )}

      {/* Empty State */}
      {students.length === 0 && (
        <div className="bg-white p-12 rounded-2xl shadow-soft border border-slate-200/50 text-center">
          <Users className="text-slate-300 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-bold text-slate-700 mb-2">학생 데이터가 없습니다</h3>
          <p className="text-slate-500">학생 관리에서 학생을 등록해주세요.</p>
        </div>
      )}
    </div>
  );
};

export default Analytics;

