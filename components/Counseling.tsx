import React, { useState, useEffect } from 'react';
import { Student, ExcelRow, RulesData, AnalysisResult, ScoreDetail, ScoreTableData } from '../types';
import { analyzeAdmission, calculateBestUnivScore } from '../services/calcService';
import { exportToExcel, exportToPDF } from '../services/exportService';
import { saveCounselingSession } from '../services/historyService';
import ScoreDistributionChart from './Charts/ScoreDistributionChart';
import AdmissionProbabilityChart from './Charts/AdmissionProbabilityChart';
import { Search, Filter, AlertCircle, CheckCircle, ArrowRight, Star, Info, X, SlidersHorizontal, ArrowUpDown, Download, FileSpreadsheet, FileText } from 'lucide-react';

interface CounselingProps {
  students: Student[];
  excelData: ExcelRow[];
  rulesData: RulesData | null;
  scoreTable: ScoreTableData | null;
  initialStudent?: Student | null;
}

const STORAGE_KEY_BOOKMARKS = 'jeongsi_bookmarks_v1';

const Counseling: React.FC<CounselingProps> = ({ students, excelData, rulesData, scoreTable, initialStudent }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudent?.id || '');
  
  // Filters & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<'all' | '가' | '나' | '다'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'safe' | 'match' | 'risk'>('all');
  const [sortOption, setSortOption] = useState<'diff' | 'name'>('diff');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  
  // Data State
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  // Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<{ result: AnalysisResult, detail: ScoreDetail } | null>(null);

  // Load Bookmarks on Mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    if (stored) {
      try {
        setBookmarks(new Set(JSON.parse(stored)));
      } catch(e) { console.error(e); }
    }
  }, []);

  // Update selected student if initialStudent prop changes
  useEffect(() => {
    if (initialStudent) {
      setSelectedStudentId(initialStudent.id);
    }
  }, [initialStudent]);

  // Main Analysis Logic
  useEffect(() => {
    if (!selectedStudentId || !rulesData || !scoreTable || excelData.length === 0) return;

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    // 1. Calculate basic scores
    const analyzed = analyzeAdmission(student, excelData, rulesData.rules, scoreTable);
    
    // 2. Filter
    let filtered = analyzed.filter(item => {
      const matchesSearch = item.univName.includes(searchTerm) || item.deptName.includes(searchTerm);
      const matchesGroup = groupFilter === 'all' || item.group === groupFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      const key = `${item.univName}-${item.deptName}`;
      const matchesBookmark = showBookmarksOnly ? bookmarks.has(key) : true;

      return matchesSearch && matchesGroup && matchesStatus && matchesBookmark;
    });

    // 3. Sort
    filtered.sort((a, b) => {
      if (sortOption === 'diff') {
        return b.diff - a.diff; // Highest diff (safe) first
      } else {
        return a.univName.localeCompare(b.univName);
      }
    });

    setResults(filtered);

    // 4. Save to history (only when student changes or initial load)
    if (filtered.length > 0) {
      saveCounselingSession(student, analyzed); // Save all results, not filtered
    }
  }, [selectedStudentId, searchTerm, groupFilter, statusFilter, sortOption, showBookmarksOnly, bookmarks, students, excelData, rulesData, scoreTable]);

  const toggleBookmark = (univName: string, deptName: string) => {
    const key = `${univName}-${deptName}`;
    const newBookmarks = new Set(bookmarks);
    if (newBookmarks.has(key)) {
      newBookmarks.delete(key);
    } else {
      newBookmarks.add(key);
    }
    setBookmarks(newBookmarks);
    localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(Array.from(newBookmarks)));
  };

  const openDetailModal = (result: AnalysisResult) => {
    if (!rulesData || !scoreTable) return;
    const student = students.find(s => s.id === selectedStudentId);
    const rule = rulesData.rules[result.univName];
    if (student && rule) {
      const detail = calculateBestUnivScore(student, rule, scoreTable);
      setDetailData({ result, detail });
      setDetailModalOpen(true);
    }
  };

  const handleExportExcel = () => {
    if (!selectedStudent || results.length === 0) return;
    exportToExcel(results, selectedStudent.name);
  };

  const handleExportPDF = () => {
    if (!selectedStudent || results.length === 0) return;
    // Get detail for first result if available
    let detail: ScoreDetail | undefined;
    if (results.length > 0 && rulesData && scoreTable) {
      const rule = rulesData.rules[results[0].univName];
      if (rule) {
        detail = calculateBestUnivScore(selectedStudent, rule, scoreTable);
      }
    }
    exportToPDF(selectedStudent, results, detail);
  };

  if (excelData.length === 0) {
    return (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-700 mb-2">데이터가 없습니다.</h3>
            <p className="text-slate-500">홈 화면에서 입결 엑셀 파일을 업로드해주세요.</p>
        </div>
    )
  }

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="flex flex-col h-full space-y-4 relative">
      {/* Top Bar: Controls */}
      <div className="bg-white p-4 rounded-xl shadow-soft border border-slate-200/50 flex flex-col gap-4 sticky top-0 z-10">
        {/* Row 1: Student & Search & Export */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="relative min-w-[240px] flex-shrink-0">
                <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg appearance-none bg-gradient-to-r from-slate-50 to-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 shadow-sm hover:shadow-md transition-shadow"
                >
                <option value="" disabled>학생을 선택하세요</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} (국{s.scores.kor} / 수{s.scores.math})</option>)}
                </select>
            </div>

            <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                type="text" 
                placeholder="대학/학과 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm"
                />
            </div>

            {selectedStudent && results.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-sm hover:shadow-md font-semibold text-sm"
                  title="Excel로 내보내기"
                >
                  <FileSpreadsheet size={16} />
                  Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-sm hover:shadow-md font-semibold text-sm"
                  title="PDF로 내보내기"
                >
                  <FileText size={16} />
                  PDF
                </button>
              </div>
            )}
        </div>

        {/* Row 2: Advanced Filters */}
        <div className="flex flex-wrap items-center gap-4 text-sm pt-2 border-t border-slate-100">
           <button 
             onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
               showBookmarksOnly 
                ? 'bg-yellow-50 border-yellow-300 text-yellow-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
             }`}
           >
             <Star size={16} className={showBookmarksOnly ? 'fill-yellow-500 text-yellow-500' : 'text-slate-400'} />
             <span>관심 대학만</span>
           </button>

           <div className="h-4 w-px bg-slate-200"></div>

           <div className="flex items-center gap-2">
             <span className="text-slate-500 font-medium">군:</span>
             <div className="flex bg-slate-100 p-0.5 rounded-lg">
                {['all', '가', '나', '다'].map((g) => (
                    <button
                        key={g}
                        onClick={() => setGroupFilter(g as any)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                            groupFilter === g ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {g === 'all' ? '전체' : g}
                    </button>
                ))}
             </div>
           </div>

           <div className="flex items-center gap-2">
             <span className="text-slate-500 font-medium">진단:</span>
             <select 
               value={statusFilter} 
               onChange={(e) => setStatusFilter(e.target.value as any)}
               className="bg-white border border-slate-200 rounded-md px-2 py-1 outline-none focus:border-blue-500"
             >
               <option value="all">전체 보기</option>
               <option value="safe">🟦 안정 지원</option>
               <option value="match">🟩 적정 지원</option>
               <option value="risk">🟥 위험 지원</option>
             </select>
           </div>

           <div className="flex items-center gap-2 ml-auto">
             <ArrowUpDown size={14} className="text-slate-400"/>
             <select 
               value={sortOption} 
               onChange={(e) => setSortOption(e.target.value as any)}
               className="bg-transparent text-slate-600 font-medium outline-none cursor-pointer hover:text-blue-600"
             >
               <option value="diff">합격 확률순</option>
               <option value="name">대학 이름순</option>
             </select>
           </div>
        </div>
      </div>

      {/* Charts Section */}
      {selectedStudent && results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ScoreDistributionChart results={results} />
          <AdmissionProbabilityChart results={results} />
        </div>
      )}

      {/* Main Content Layout */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar: Student Stats */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto hidden lg:block">
          {selectedStudent ? (
             <div className="bg-white p-6 rounded-xl shadow-soft border border-slate-200/50">
               <div className="text-center mb-6">
                 <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-3xl font-bold shadow-strong">
                   {selectedStudent.name[0]}
                 </div>
                 <h2 className="text-xl font-bold text-slate-800 mb-1">{selectedStudent.name}</h2>
                 <p className="text-xs text-slate-500">학생 정보</p>
               </div>
               
               <div className="space-y-3 text-sm">
                 <div className="flex justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200/50 shadow-sm">
                   <span className="text-slate-600 font-medium">국어 (표준)</span>
                   <span className="font-bold text-slate-800 text-base">{selectedStudent.scores.kor}</span>
                 </div>
                 <div className="flex justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200/50 shadow-sm">
                   <span className="text-slate-600 font-medium">수학 (표준)</span>
                   <span className="font-bold text-slate-800 text-base">{selectedStudent.scores.math}</span>
                 </div>
                 <div className="flex justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200/50 shadow-sm">
                   <span className="text-slate-600 font-medium">탐구 합</span>
                   <span className="font-bold text-slate-800 text-base">{selectedStudent.scores.exp1 + selectedStudent.scores.exp2}</span>
                 </div>
                 <div className="flex justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200/50 shadow-sm">
                   <span className="text-blue-700 font-medium">영어</span>
                   <span className="font-bold text-blue-800 text-base">{selectedStudent.scores.eng}등급</span>
                 </div>
                 <div className="flex justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200/50 shadow-sm">
                   <span className="text-purple-700 font-medium">한국사</span>
                   <span className="font-bold text-purple-800 text-base">{selectedStudent.scores.hist}등급</span>
                 </div>
               </div>
             </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-soft border border-slate-200/50 text-center text-slate-400">
              학생을 선택해주세요.
            </div>
          )}
        </div>

        {/* Main: Results Table */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-soft border border-slate-200/50 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-blue-600" />
                분석 결과 
                <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">{results.length}</span>
            </h3>
          </div>
          
          <div className="flex-1 overflow-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-gradient-to-r from-slate-100 to-slate-50 text-slate-600 font-semibold sticky top-0 shadow-sm z-10 border-b border-slate-200">
                 <tr>
                   <th className="p-4 w-12 text-center">
                     <Star size={14} className="mx-auto text-yellow-500" />
                   </th>
                   <th className="p-4">대학 / 모집단위</th>
                   <th className="p-4 w-16 text-center">군</th>
                   <th className="p-4 w-32 text-center">진단</th>
                   <th className="p-4 text-right">점수차</th>
                   <th className="p-4 w-16 text-center">상세</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {results.map((r, idx) => {
                   const key = `${r.univName}-${r.deptName}`;
                   const isBookmarked = bookmarks.has(key);
                   const barPercent = Math.min(100, Math.max(0, (r.diff + 10) * 5)); 
                   const barColor = r.diff >= 5 ? 'bg-blue-500' : r.diff >= -2 ? 'bg-green-500' : 'bg-red-500';

                   return (
                   <tr key={`${key}-${idx}`} className={`hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/30 transition-all duration-200 ${isBookmarked ? 'bg-yellow-50/50 border-l-4 border-yellow-400' : ''}`}>
                     <td className="p-4 text-center">
                       <button onClick={() => toggleBookmark(r.univName, r.deptName)} className="hover:scale-110 transition-transform">
                         <Star 
                            size={18} 
                            className={isBookmarked ? "fill-yellow-400 text-yellow-400 drop-shadow-sm" : "text-slate-300 hover:text-yellow-400"} 
                         />
                       </button>
                     </td>
                     <td className="p-4">
                       <div className="font-bold text-slate-800 text-base mb-1">{r.univName}</div>
                       <div className="text-slate-500 text-xs mb-1">{r.deptName}</div>
                       <div className="text-blue-600 text-[10px] bg-gradient-to-r from-blue-50 to-blue-100 inline-block px-2 py-0.5 rounded-full border border-blue-200 font-medium">{r.formulaLabel}</div>
                     </td>
                     <td className="p-4 text-center">
                       <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${
                           r.group === '가' ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border border-purple-200' :
                           r.group === '나' ? 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border border-orange-200' :
                           'bg-gradient-to-r from-teal-100 to-teal-50 text-teal-700 border border-teal-200'
                       }`}>{r.group}</span>
                     </td>
                     <td className="p-4 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-2 shadow-sm ${
                          r.status === 'safe' ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200' :
                          r.status === 'match' ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200' :
                          'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200'
                        }`}>
                          {r.status === 'safe' && <CheckCircle size={12}/>}
                          {r.status === 'match' && <ArrowRight size={12}/>}
                          {r.status === 'risk' && <AlertCircle size={12}/>}
                          {r.status === 'safe' ? '안정' : r.status === 'match' ? '적정' : '위험'}
                        </div>
                        <div className="w-28 h-2 bg-slate-200 rounded-full mx-auto overflow-hidden shadow-inner">
                            <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${barPercent}%` }}></div>
                        </div>
                     </td>
                     <td className="p-4 text-right">
                       <div className={`font-mono font-bold text-lg mb-1 ${
                         r.diff > 0 ? 'text-blue-600' : r.diff >= -2 ? 'text-green-600' : 'text-red-500'
                       }`}>
                         {r.diff > 0 ? '+' : ''}{r.diff.toFixed(2)}
                       </div>
                       <div className="text-xs text-slate-400 font-medium">
                         컷: {r.cutoff.toFixed(2)} / 내점수: {r.myScore.toFixed(2)}
                       </div>
                     </td>
                     <td className="p-4 text-center">
                        <button 
                            onClick={() => openDetailModal(r)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110 shadow-sm hover:shadow-md"
                        >
                            <Info size={18} />
                        </button>
                     </td>
                   </tr>
                 )})}
               </tbody>
             </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detailModalOpen && detailData && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-strong w-full max-w-lg overflow-hidden animate-scale-in">
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-xl mb-1">{detailData.result.univName}</h3>
                        <p className="text-slate-300 text-sm">{detailData.result.deptName}</p>
                      </div>
                      <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg">
                          <X size={24} />
                      </button>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-slate-50 to-white">
                      <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
                         <span className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-bold border border-blue-200 shadow-sm">
                            적용: {detailData.detail.formulaLabel}
                         </span>
                         <div className="text-right">
                              <div className="text-xs text-slate-500 uppercase font-bold mb-1">최종 환산 점수</div>
                              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{detailData.detail.total.toFixed(2)}점</div>
                          </div>
                      </div>

                      <div className="space-y-3">
                          <DetailRow label="국어" raw={detailData.detail.kor.raw} weight={detailData.detail.kor.weight} calc={detailData.detail.kor.calc} />
                          <DetailRow label="수학" raw={detailData.detail.math.raw} weight={detailData.detail.math.weight} calc={detailData.detail.math.calc} />
                          <DetailRow label="탐구(합)" raw={detailData.detail.exp.raw} weight={detailData.detail.exp.weight} calc={detailData.detail.exp.calc} />
                          
                          <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg text-sm border border-blue-200 shadow-sm">
                              <span className="font-semibold text-blue-700">영어</span>
                              <div className="flex gap-4 text-blue-600">
                                  <span className="font-medium">{detailData.detail.eng.grade}등급</span>
                                  <span className="font-bold text-blue-800">
                                    {detailData.detail.eng.score >= 0 ? '+' : ''}{detailData.detail.eng.score.toFixed(2)}점
                                  </span>
                              </div>
                          </div>
                          <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg text-sm border border-purple-200 shadow-sm">
                              <span className="font-semibold text-purple-700">한국사</span>
                              <div className="flex gap-4 text-purple-600">
                                  <span className="font-medium">{detailData.detail.hist.grade}등급</span>
                                  <span className="font-bold text-purple-800">
                                     {detailData.detail.hist.score >= 0 ? '+' : ''}{detailData.detail.hist.score.toFixed(2)}점
                                  </span>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-5 text-center border-t border-slate-200">
                      <button 
                        onClick={() => setDetailModalOpen(false)} 
                        className="px-8 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm hover:shadow-md"
                      >
                          닫기
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const DetailRow = ({ label, raw, weight, calc }: { label: string, raw: number, weight: number, calc: number }) => (
    <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded text-sm">
        <span className="font-medium text-slate-600 w-20">{label}</span>
        <div className="flex-1 flex justify-end gap-1 text-slate-500 text-xs">
            <span>{raw.toFixed(1)}</span>
            <span className="text-slate-300">×</span>
            <span>{weight}</span>
            <span className="text-slate-300">=</span>
        </div>
        <span className="font-bold text-slate-800 w-20 text-right">{calc.toFixed(2)}</span>
    </div>
);

export default Counseling;
