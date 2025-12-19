
import React, { useState, useEffect } from 'react';
import { Student, ExcelRow, RulesData, AnalysisResult, ScoreDetail, ScoreTableData, ConversionTableData, UnivRule } from '../types';
import { analyzeAdmission, calculateUnivScore } from '../services/calcService';
import { Search, AlertCircle, CheckCircle, ArrowRight, Star, Info, X, SlidersHorizontal, ArrowUpDown, TrendingUp } from 'lucide-react';

interface CounselingProps {
  students: Student[];
  admissionData: ExcelRow[];
  rulesData: RulesData | null;
  scoreTable: ScoreTableData | null;
  conversionTable: ConversionTableData | null;
  initialStudent?: Student | null;
}

const STORAGE_KEY_BOOKMARKS = 'jeongsi_bookmarks_v1';

const Counseling: React.FC<CounselingProps> = ({ students, admissionData, rulesData, scoreTable, conversionTable, initialStudent }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudent?.id || '');
  
  // Filters & Sort State
  const [univSearchTerm, setUnivSearchTerm] = useState('');
  const [deptSearchTerm, setDeptSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<'all' | '가' | '나' | '다'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'safe' | 'match' | 'upward' | 'danger'>('all');
  const [sortOption, setSortOption] = useState<'diff' | 'name'>('name');
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
    if (!selectedStudentId || !rulesData || !scoreTable || admissionData.length === 0) {
      console.log('Counseling: Missing required data', { selectedStudentId, hasRules: !!rulesData, hasScoreTable: !!scoreTable, admissionDataLength: admissionData.length });
      return;
    }

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) {
      console.log('Counseling: Student not found', selectedStudentId);
      return;
    }

    console.log('Counseling: Analyzing for student', student.name, { scores: student.scores, subjectOptions: student.subjectOptions });

    // 1. Calculate basic scores using admissionData
    const analyzed = analyzeAdmission(student, admissionData, rulesData.rules, scoreTable, conversionTable);
    
    console.log('Counseling: Analysis complete', { 
      total: analyzed.length, 
      sample: analyzed.slice(0, 3).map(r => ({ univ: r.univName, score: r.myScore, status: r.status }))
    });
    
    // 2. Filter
    let filtered = analyzed.filter(item => {
      const univNeedle = univSearchTerm.trim().toLowerCase();
      const deptNeedle = deptSearchTerm.trim().toLowerCase();
      const univHaystack = (item.univName || '').toLowerCase();
      const deptHaystack = (item.deptName || '').toLowerCase();

      // AND 방식: 둘 다 입력되면 둘 다 만족해야 함
      const matchesUniv = !univNeedle || univHaystack.includes(univNeedle);
      const matchesDept = !deptNeedle || deptHaystack.includes(deptNeedle);
      const matchesGroup = groupFilter === 'all' || item.group === groupFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      const key = `${item.univName}-${item.deptName}`;
      const matchesBookmark = showBookmarksOnly ? bookmarks.has(key) : true;

      return matchesUniv && matchesDept && matchesGroup && matchesStatus && matchesBookmark;
    });

    // 3. Sort
    filtered.sort((a, b) => {
      if (sortOption === 'diff') {
        // Sort by Percentage Gap instead of Absolute Diff
        // Higher percentage (more safe) comes first
        return b.gapPercent - a.gapPercent; 
      } else {
        return a.univName.localeCompare(b.univName);
      }
    });

    setResults(filtered);
  }, [selectedStudentId, univSearchTerm, deptSearchTerm, groupFilter, statusFilter, sortOption, showBookmarksOnly, bookmarks, students, admissionData, rulesData, scoreTable, conversionTable]);

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

  const findRule = (univName: string): UnivRule | null => {
    if (!rulesData) return null;
    // Try exact match first
    if (rulesData.rules[univName]) return rulesData.rules[univName];
    // Try variations
    const variations = [
      univName.replace('학교', ''),
      univName + '학교',
      univName.replace('대학교', '대'),
      univName.replace('대', '대학교')
    ];
    for (const variant of variations) {
      if (rulesData.rules[variant]) return rulesData.rules[variant];
    }
    return null;
  };

  const openDetailModal = (result: AnalysisResult) => {
    console.log('openDetailModal called', { result, hasRules: !!rulesData, hasScoreTable: !!scoreTable });
    
    if (!rulesData || !scoreTable) {
      console.warn('openDetailModal: Missing rulesData or scoreTable');
      return;
    }
    
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) {
      console.warn('openDetailModal: Student not found', selectedStudentId);
      alert('학생 정보를 찾을 수 없습니다.');
      return;
    }
    
    const rule = findRule(result.univName);
    console.log('openDetailModal: Rule lookup', { 
      univName: result.univName, 
      ruleKeys: Object.keys(rulesData.rules).slice(0, 10), 
      found: !!rule 
    });
    
    if (!rule) {
      alert(`대학 규칙을 찾을 수 없습니다: ${result.univName}`);
      return;
    }
    
    try {
      // Pass the explicit scoringClass found in the result
      const detail = calculateUnivScore(student, rule, scoreTable, conversionTable, result.scoringClass);
      console.log('openDetailModal: Detail calculated', detail);
      setDetailData({ result, detail });
      setDetailModalOpen(true);
    } catch (e) {
      console.error('openDetailModal: Error calculating score', e);
      alert(`점수 산출 중 오류가 발생했습니다: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // Helper to lookup score meta info
  const getScoreInfo = (tableKey: string, score: number) => {
    if (!scoreTable || !scoreTable.tables[tableKey]) return { pct: '-', grade: '-' };
    const meta = scoreTable.tables[tableKey][score];
    return meta ? { pct: meta.pct, grade: meta.grade } : { pct: '-', grade: '-' };
  };

  if (admissionData.length === 0) {
    return (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-700 mb-2">입시 결과 데이터가 없습니다.</h3>
            <p className="text-slate-500">서버에 admission_data.json 파일이 존재하는지 확인해주세요.</p>
        </div>
    )
  }

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="flex flex-col h-full space-y-4 relative">
      {/* Top Bar: Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4 sticky top-0 z-10">
        {/* Row 1: Student & Search */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="relative min-w-[240px] flex-shrink-0">
                <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg appearance-none bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                >
                <option value="" disabled>학생을 선택하세요</option>
                {students.map(s => {
                    const label = s.classNum && s.studentNum 
                        ? `${s.classNum}-${s.studentNum}-${s.name}` 
                        : s.name;
                    return (
                        <option key={s.id} value={s.id}>{label}</option>
                    )
                })}
                </select>
            </div>

            <div className="flex-1 flex flex-wrap gap-2 justify-end">
              <div className="w-full max-w-[260px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="대학 검색 (예: 경북)"
                  value={univSearchTerm}
                  onChange={(e) => setUnivSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                />
              </div>

              <div className="w-full max-w-[260px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="모집단위 검색 (예: 치위)"
                  value={deptSearchTerm}
                  onChange={(e) => setDeptSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                />
              </div>
            </div>
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
               <option value="match">🟩 소신 지원</option>
               <option value="upward">🟨 상향 지원</option>
               <option value="danger">🟥 위험 지원</option>
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

      {/* Main Content Layout */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar: Student Stats */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto hidden lg:block">
          {selectedStudent ? (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold shadow-lg">
                   {selectedStudent.name[0]}
                 </div>
                 <h2 className="text-xl font-bold text-slate-800">{selectedStudent.name}</h2>
               </div>
               
               <div className="space-y-3 text-xs">
                 {/* Kor */}
                 <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="text-slate-500 font-bold mb-1">국어 ({selectedStudent.subjectOptions?.kor || '미선택'})</div>
                   <div className="flex justify-between items-center text-slate-700">
                      <div>표준 <span className="font-bold">{selectedStudent.scores.kor}</span></div>
                      <div>백분위 <span className="font-bold">{getScoreInfo('국어', selectedStudent.scores.kor).pct}</span></div>
                      <div><span className="font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-blue-600">{getScoreInfo('국어', selectedStudent.scores.kor).grade}</span>등급</div>
                   </div>
                 </div>

                 {/* Math */}
                 <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="text-slate-500 font-bold mb-1">수학 ({selectedStudent.subjectOptions?.math || '미선택'})</div>
                   <div className="flex justify-between items-center text-slate-700">
                      <div>표준 <span className="font-bold">{selectedStudent.scores.math}</span></div>
                      <div>백분위 <span className="font-bold">{getScoreInfo('수학', selectedStudent.scores.math).pct}</span></div>
                      <div><span className="font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-blue-600">{getScoreInfo('수학', selectedStudent.scores.math).grade}</span>등급</div>
                   </div>
                 </div>

                 {/* Exp 1 */}
                 <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="text-slate-500 font-bold mb-1">탐구1 ({selectedStudent.subjectOptions?.exp1 || '미선택'})</div>
                   <div className="flex justify-between items-center text-slate-700">
                      <div>표준 <span className="font-bold">{selectedStudent.scores.exp1}</span></div>
                      <div>백분위 <span className="font-bold">{getScoreInfo(selectedStudent.subjectOptions?.exp1 || 'exp', selectedStudent.scores.exp1).pct}</span></div>
                      <div><span className="font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-blue-600">{getScoreInfo(selectedStudent.subjectOptions?.exp1 || 'exp', selectedStudent.scores.exp1).grade}</span>등급</div>
                   </div>
                 </div>

                 {/* Exp 2 */}
                 <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="text-slate-500 font-bold mb-1">탐구2 ({selectedStudent.subjectOptions?.exp2 || '미선택'})</div>
                   <div className="flex justify-between items-center text-slate-700">
                      <div>표준 <span className="font-bold">{selectedStudent.scores.exp2}</span></div>
                      <div>백분위 <span className="font-bold">{getScoreInfo(selectedStudent.subjectOptions?.exp2 || 'exp', selectedStudent.scores.exp2).pct}</span></div>
                      <div><span className="font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-blue-600">{getScoreInfo(selectedStudent.subjectOptions?.exp2 || 'exp', selectedStudent.scores.exp2).grade}</span>등급</div>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                     <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                        <div className="text-slate-500 mb-1">영어</div>
                        <div className="font-bold text-lg text-blue-600">{selectedStudent.scores.eng} <span className="text-xs text-slate-500 font-normal">등급</span></div>
                     </div>
                     <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                        <div className="text-slate-500 mb-1">한국사</div>
                        <div className="font-bold text-lg text-blue-600">{selectedStudent.scores.hist} <span className="text-xs text-slate-500 font-normal">등급</span></div>
                     </div>
                 </div>
               </div>
             </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center text-slate-400">
              학생을 선택해주세요.
            </div>
          )}
        </div>

        {/* Main: Results Table */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <SlidersHorizontal size={16} />
                분석 결과 
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{results.length}</span>
            </h3>
          </div>
          
          <div className="flex-1 overflow-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 shadow-sm z-10">
                 <tr>
                   <th className="p-4 w-12 text-center">
                     <Star size={14} className="mx-auto" />
                   </th>
                   <th className="p-4">대학 / 모집단위</th>
                   <th className="p-4 w-16 text-center">군</th>
                   <th className="p-4 w-40 text-center">모집 인원</th>
                   <th className="p-4 w-32 text-center">진단</th>
                   <th className="p-4 text-right">내 점수 / 기준(소신)</th>
                   <th className="p-4 w-16 text-center">상세</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {results.map((r, idx) => {
                   const key = `${r.univName}-${r.deptName}`;
                   const isBookmarked = bookmarks.has(key);
                   
                   // Determine Color Scheme
                   let badgeClass = '';
                   let icon = null;
                   let label = '';
                   let rowBg = '';

                   switch(r.status) {
                       case 'safe':
                           badgeClass = 'bg-blue-100 text-blue-700';
                           icon = <CheckCircle size={12}/>;
                           label = '안정';
                           break;
                       case 'match':
                           badgeClass = 'bg-green-100 text-green-700';
                           icon = <ArrowRight size={12}/>;
                           label = '소신';
                           break;
                       case 'upward':
                            badgeClass = 'bg-yellow-100 text-yellow-700';
                            icon = <TrendingUp size={12}/>;
                            label = '상향';
                            break;
                       case 'danger':
                           badgeClass = 'bg-red-100 text-red-700';
                           icon = <AlertCircle size={12}/>;
                           label = '위험';
                           rowBg = 'bg-red-50/10';
                           break;
                   }
                   
                   const diffColor = r.gapPercent > 0 ? 'text-blue-600' : r.gapPercent < 0 ? 'text-red-500' : 'text-slate-600';
                   const diffSign = r.gapPercent > 0 ? '+' : '';

                   return (
                   <tr key={`${key}-${idx}`} className={`hover:bg-slate-50 transition-colors ${isBookmarked ? 'bg-yellow-50/30' : rowBg}`}>
                     <td className="p-4 text-center">
                       <button onClick={() => toggleBookmark(r.univName, r.deptName)} className="hover:scale-110 transition-transform">
                         <Star 
                            size={18} 
                            className={isBookmarked ? "fill-yellow-400 text-yellow-400" : "text-slate-300 hover:text-yellow-400"} 
                         />
                       </button>
                     </td>
                     <td className="p-4">
                       <div className="font-bold text-slate-800 text-base">{r.univName}</div>
                       <div className="text-slate-500 text-xs mt-0.5">{r.deptName}</div>
                       <div className="text-blue-600 text-[10px] mt-1 bg-blue-50 inline-block px-1.5 rounded border border-blue-100">{r.formulaLabel}</div>
                     </td>
                     <td className="p-4 text-center">
                       <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                           r.group === '가' ? 'bg-purple-100 text-purple-700' :
                           r.group === '나' ? 'bg-orange-100 text-orange-700' :
                           'bg-teal-100 text-teal-700'
                       }`}>{r.group}</span>
                     </td>
                     <td className="p-4 text-center text-slate-600 font-medium">
                        <div className="flex flex-col gap-0.5">
                          <div className="text-xs text-slate-500">최종: <span className="font-bold text-slate-700">{r.finalRecruitmentCount ?? r.recruitmentCount}명</span></div>
                          <div className="text-[10px] text-slate-400">
                            최초: {r.initialRecruitmentCount ?? r.recruitmentCount}명
                            {r.earlyAdmissionCarryover > 0 && (
                              <span className="ml-1">+ 수시이월: {r.earlyAdmissionCarryover}명</span>
                            )}
                          </div>
                        </div>
                     </td>
                     <td className="p-4 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-1.5 ${badgeClass}`}>
                          {icon}
                          {label}
                        </div>
                     </td>
                     <td className="p-4 text-right">
                       <div className="flex flex-col items-end">
                          <div className={`font-mono font-bold text-lg text-slate-800`}>
                            {r.myScore.toFixed(2)}
                          </div>
                          <div className={`text-xs font-bold ${diffColor}`}>
                            ({diffSign}{r.gapPercent}%)
                          </div>
                       </div>
                       <div className="text-xs text-slate-400 mt-1">
                         소신컷: {r.matchCut.toFixed(2)}
                       </div>
                     </td>
                     <td className="p-4 text-center">
                        <button 
                            onClick={() => openDetailModal(r)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
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
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg">{detailData.result.univName}</h3>
                        <p className="text-slate-400 text-sm">{detailData.result.deptName}</p>
                      </div>
                      <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                          <X size={24} />
                      </button>
                  </div>
                  <div className="p-6">
                      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                         <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                            적용: {detailData.detail.formulaLabel}
                         </span>
                         <div className="text-right">
                              <div className="text-xs text-slate-500 uppercase font-bold mb-1">최종 환산 점수</div>
                              <div className="text-3xl font-bold text-blue-600">{detailData.detail.total.toFixed(2)}점</div>
                          </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg mb-6 text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-500">최초 모집 인원</span>
                            <span className="font-bold text-slate-800">{detailData.result.initialRecruitmentCount ?? detailData.result.recruitmentCount}명</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">수시 이월 모집 인원</span>
                            <span className="font-bold text-slate-800">{detailData.result.earlyAdmissionCarryover ?? 0}명</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 mt-1">
                            <span className="text-slate-700 font-semibold">최종 모집 인원</span>
                            <span className="font-bold text-blue-600">{detailData.result.finalRecruitmentCount ?? detailData.result.recruitmentCount}명</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 mt-1">
                          <span className="text-slate-500">전년도 경쟁률</span>
                          <span className="font-bold text-slate-800">
                            {detailData.result.lastYearCompetitionRate > 0 
                              ? `${detailData.result.lastYearCompetitionRate.toFixed(2)}:1` 
                              : '0:1'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg mb-6 text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-500">안정 기준</span>
                            <span className="font-bold text-blue-600">{detailData.result.safeCut.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">소신 기준</span>
                            <span className="font-bold text-green-600">{detailData.result.matchCut.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-slate-500">상향 기준</span>
                            <span className="font-bold text-yellow-600">{detailData.result.upwardCut.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                          <DetailRow label="국어" raw={detailData.detail.kor.raw} weight={detailData.detail.kor.weight} calc={detailData.detail.kor.calc} />
                          <DetailRow label="수학" raw={detailData.detail.math.raw} weight={detailData.detail.math.weight} calc={detailData.detail.math.calc} />
                          <DetailRow label="탐구" raw={detailData.detail.exp.raw} weight={detailData.detail.exp.weight} calc={detailData.detail.exp.calc} />
                          
                          <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded text-sm">
                              <span className="font-medium text-slate-600">영어</span>
                              <div className="flex gap-4 text-slate-500">
                                  <span>{detailData.detail.eng.grade}등급</span>
                                  <span className="font-bold text-slate-800">
                                    {detailData.detail.eng.score >= 0 ? '+' : ''}{detailData.detail.eng.score.toFixed(2)}점
                                  </span>
                              </div>
                          </div>
                          <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded text-sm">
                              <span className="font-medium text-slate-600">한국사</span>
                              <div className="flex gap-4 text-slate-500">
                                  <span>{detailData.detail.hist.grade}등급</span>
                                  <span className="font-bold text-slate-800">
                                     {detailData.detail.hist.score >= 0 ? '+' : ''}{detailData.detail.hist.score}점
                                  </span>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                      <button 
                        onClick={() => setDetailModalOpen(false)} 
                        className="px-6 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-sm"
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
