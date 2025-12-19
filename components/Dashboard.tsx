import React, { useState } from 'react';
import { ExcelRow, RulesData, ScoreTableData, ConversionTableData } from '../types';
import { CheckCircle, FileSpreadsheet, RefreshCw, Table2, Lock, KeyRound, ArrowRight, Shuffle } from 'lucide-react';

interface DashboardProps {
  rulesData: RulesData | null;
  scoreTable: ScoreTableData | null;
  conversionTable: ConversionTableData | null;
  admissionData: ExcelRow[];
  loading: boolean;
  onReload: () => void;
  isAuthenticated: boolean;
  onLogin: (key: string) => boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  rulesData, 
  scoreTable, 
  conversionTable,
  admissionData, 
  loading, 
  onReload,
  isAuthenticated,
  onLogin
}) => {
  const [inputKey, setInputKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin(inputKey)) {
        setErrorMsg('');
    } else {
        setErrorMsg('비밀키가 올바르지 않습니다.');
    }
  };

  if (!isAuthenticated) {
    return (
        <div className="max-w-md mx-auto mt-20">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Lock size={40} className="text-blue-500" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">접근 제한</h2>
                <p className="text-slate-500">솔루션을 사용하려면 인증이 필요합니다.</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-2">접근 코드 입력</label>
                <div className="relative mb-4">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="password"
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Secret Key"
                        autoFocus
                    />
                </div>
                {errorMsg && (
                    <p className="text-red-500 text-sm mb-4 font-medium flex items-center gap-1 animate-pulse">
                        <Lock size={12} /> {errorMsg}
                    </p>
                )}
                <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                >
                    인증하기 <ArrowRight size={18} />
                </button>
            </form>
            <p className="text-center text-slate-400 text-xs mt-6">
                &copy; 2026 Jeongsi Counselor. All rights reserved.
            </p>
        </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">2026 정시 상담 대시보드</h2>
        <p className="text-slate-500">서버 데이터 연동 상태를 확인하세요.</p>
        {!loading && (
             <button onClick={onReload} className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors">
                <RefreshCw size={14} /> 데이터 새로고침
             </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1: Score Table Status */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 flex flex-col hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <Table2 size={20} className="text-purple-500" />
              실채점
            </h3>
            <span className={`px-2 py-1 rounded text-xs font-bold ${scoreTable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {loading ? '로딩...' : scoreTable ? '로드됨' : '실패'}
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center p-4 bg-slate-50 rounded-lg">
             {scoreTable ? (
                <>
                  <CheckCircle className="text-green-500 mb-2" size={32} />
                  <p className="text-sm font-semibold text-slate-700">표점/백분위 연동</p>
                  <p className="text-xs text-slate-400 mt-1">{scoreTable.version}</p>
                </>
             ) : (
                <div className="text-slate-400 text-sm">데이터 확인 필요</div>
             )}
          </div>
        </div>

        {/* Card 2: Rules Status */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 flex flex-col hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <RefreshCw size={20} className="text-blue-500" />
              산출 공식
            </h3>
            <span className={`px-2 py-1 rounded text-xs font-bold ${rulesData ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {loading ? '로딩...' : rulesData ? '로드됨' : '실패'}
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center p-4 bg-slate-50 rounded-lg">
            {rulesData ? (
              <>
                <CheckCircle className="text-green-500 mb-2" size={32} />
                <p className="text-sm font-semibold text-slate-700">대학별 공식 연동</p>
                <p className="text-xs text-slate-400 mt-1">{Object.keys(rulesData.rules).length}개 대학</p>
              </>
            ) : (
                <div className="text-slate-400 text-sm">데이터 확인 필요</div>
            )}
          </div>
        </div>

        {/* Card 3: Admission Data Status */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 flex flex-col hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-green-600" />
              입결 자료
            </h3>
            <span className={`px-2 py-1 rounded text-xs font-bold ${admissionData.length > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {loading ? '로딩...' : admissionData.length > 0 ? '로드됨' : '없음'}
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center p-4 bg-slate-50 rounded-lg">
            {admissionData.length > 0 ? (
               <>
                <CheckCircle className="text-green-500 mb-2" size={32} />
                <p className="text-sm font-semibold text-slate-700">입시 결과 연동</p>
                <p className="text-xs text-slate-400 mt-1">{admissionData.length}개 모집단위</p>
               </>
            ) : (
                <div className="text-slate-400 text-sm">데이터 확인 필요</div>
            )}
          </div>
        </div>

        {/* Card 4: Conversion Table Status */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 flex flex-col hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <Shuffle size={20} className="text-orange-500" />
              변표
            </h3>
            <span className={`px-2 py-1 rounded text-xs font-bold ${conversionTable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {loading ? '로딩...' : conversionTable ? '로드됨' : '실패'}
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center p-4 bg-slate-50 rounded-lg">
             {conversionTable ? (
                <>
                  <CheckCircle className="text-green-500 mb-2" size={32} />
                  <p className="text-sm font-semibold text-slate-700">탐구 변환점수 연동</p>
                  <p className="text-xs text-slate-400 mt-1">{conversionTable.version}</p>
                </>
             ) : (
                <div className="text-slate-400 text-sm">데이터 확인 필요</div>
             )}
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
        <h4 className="font-bold text-blue-800 mb-2">데이터 연동 안내</h4>
        <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
          <li>모든 데이터는 <code>public/data/</code> 폴더 내의 JSON 파일을 자동으로 불러옵니다.</li>
          <li><strong>univ_rules.json</strong>: 대학별 산출 공식</li>
          <li><strong>score_table.json</strong>: 과목별 표점-백분위 변환표</li>
          <li><strong>conversion_table.json</strong>: 탐구 영역 변환표준점수표 (대학/과목별)</li>
          <li><strong>admission_data.json</strong>: 대학별 입결(모집단위, 예상컷 등) 자료</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;