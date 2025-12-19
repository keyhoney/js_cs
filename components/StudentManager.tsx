
import React, { useState, useEffect } from 'react';
import { Student, StudentScores, StudentOptionalSubjects } from '../types';
import { STORAGE_KEY_STUDENTS, SUBJECT_OPTS_KOR, SUBJECT_OPTS_MATH, SUBJECT_OPTS_EXP } from '../constants';
import { Plus, Trash2, Save, User, BarChart3, Users, ClipboardCopy, X, Check } from 'lucide-react';

interface StudentManagerProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  onSelectStudentForCounseling: (student: Student) => void;
}

const initialScores: StudentScores = {
  kor: 0, math: 0, eng: 1, hist: 1, exp1: 0, exp2: 0
};

const initialSubjectOptions: StudentOptionalSubjects = {
    kor: SUBJECT_OPTS_KOR[0],
    math: SUBJECT_OPTS_MATH[0],
    exp1: SUBJECT_OPTS_EXP[0],
    exp2: SUBJECT_OPTS_EXP[1],
};

const StudentManager: React.FC<StudentManagerProps> = ({ students, setStudents, onSelectStudentForCounseling }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showBulkInput, setShowBulkInput] = useState(false); // Toggle for bulk input
  const [bulkText, setBulkText] = useState(''); // Textarea content
  const [currentId, setCurrentId] = useState<string | null>(null);

  const downloadBulkTemplateCsv = () => {
    // 헤더 순서:
    // (A)반 | (B)번호 | (C)이름 | (D)국어선택 | (E)국어표점 | (F)수학선택 | (G)수학표점 |
    // (H)탐구1선택 | (I)탐구1표점 | (J)탐구2선택 | (K)탐구2표점 | (L)영어등급 | (M)한국사등급
    const headers = [
      '반',
      '번호',
      '이름',
      '국어선택',
      '국어표점',
      '수학선택',
      '수학표점',
      '탐구1선택',
      '탐구1표점',
      '탐구2선택',
      '탐구2표점',
      '영어등급',
      '한국사등급',
    ];

    // 예시 1줄(빈 값) 넣어두면 엑셀에서 열 구조가 더 안정적으로 잡힙니다.
    const exampleRow = new Array(headers.length).fill('');

    const csvLines = [
      headers.join(','),
      exampleRow.join(','),
    ].join('\r\n');

    // Excel 한글 깨짐 방지용 UTF-8 BOM
    const csvWithBom = '\uFEFF' + csvLines;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = '학생_일괄등록_양식.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formClassInfo, setFormClassInfo] = useState<{classNum: number | string, studentNum: number | string}>({ classNum: '', studentNum: '' });
  const [formScores, setFormScores] = useState<StudentScores>(initialScores);
  const [formSubjectOpts, setFormSubjectOpts] = useState<StudentOptionalSubjects>(initialSubjectOptions);

  const handleEdit = (student: Student) => {
    setCurrentId(student.id);
    setFormName(student.name);
    setFormClassInfo({
        classNum: student.classNum || '',
        studentNum: student.studentNum || ''
    });
    setFormScores(student.scores);
    setFormSubjectOpts(student.subjectOptions || initialSubjectOptions);
    setIsEditing(true);
    setShowBulkInput(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation(); // Stop click from triggering parent row click
    
    if (window.confirm('정말 삭제하시겠습니까?')) {
      const updated = students.filter(s => s.id !== id);
      setStudents(updated);
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));

      // If deleted student was being edited, reset form
      if (currentId === id) {
        setIsEditing(false);
        resetForm();
      }
    }
  };

  const handleSave = () => {
    if (!formName.trim()) {
      alert('학생 이름을 입력해주세요.');
      return;
    }

    const newStudent: Student = {
      id: currentId || Date.now().toString(),
      name: formName,
      classNum: formClassInfo.classNum ? Number(formClassInfo.classNum) : undefined,
      studentNum: formClassInfo.studentNum ? Number(formClassInfo.studentNum) : undefined,
      scores: { ...formScores },
      subjectOptions: { ...formSubjectOpts }
    };

    let updatedStudents;
    if (currentId) {
      updatedStudents = students.map(s => s.id === currentId ? newStudent : s);
    } else {
      updatedStudents = [...students, newStudent];
    }

    setStudents(updatedStudents);
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updatedStudents));
    
    // Reset form
    resetForm();
    setIsEditing(false);
  };

  const handleBulkRegister = () => {
    if (!bulkText.trim()) return;

    const rows = bulkText.trim().split('\n');
    const newStudents: Student[] = [];
    let successCount = 0;
    let failCount = 0;

    rows.forEach((row, index) => {
      // Excel copy-paste uses tabs as delimiters
      const cols = row.split('\t');
      
      // Expected structure:
      // 0:반, 1:번호, 2:이름, 3:국선, 4:국표, 5:수선, 6:수표, 7:탐1선, 8:탐1표, 9:탐2선, 10:탐2표, 11:영등, 12:한등
      
      // Basic validation: Must have at least name (Index 2)
      if (!cols[2]) {
        failCount++;
        return;
      }

      try {
        const student: Student = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          classNum: parseInt(cols[0]) || undefined,
          studentNum: parseInt(cols[1]) || undefined,
          name: cols[2].trim(),
          subjectOptions: {
            kor: cols[3]?.trim() || SUBJECT_OPTS_KOR[0],
            math: cols[5]?.trim() || SUBJECT_OPTS_MATH[1],
            exp1: cols[7]?.trim() || SUBJECT_OPTS_EXP[0],
            exp2: cols[9]?.trim() || SUBJECT_OPTS_EXP[1],
          },
          scores: {
            kor: parseInt(cols[4]) || 0,
            math: parseInt(cols[6]) || 0,
            exp1: parseInt(cols[8]) || 0,
            exp2: parseInt(cols[10]) || 0,
            eng: parseInt(cols[11]) || 1,
            hist: parseInt(cols[12]) || 1,
          }
        };
        newStudents.push(student);
        successCount++;
      } catch (e) {
        failCount++;
      }
    });

    if (newStudents.length > 0) {
      const updatedStudents = [...students, ...newStudents];
      setStudents(updatedStudents);
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updatedStudents));
      alert(`${successCount}명 등록 성공, ${failCount}건 실패 (빈 행 포함)`);
      setBulkText('');
      setShowBulkInput(false);
    } else {
      alert("등록할 유효한 데이터가 없습니다. 형식을 확인해주세요.");
    }
  };

  const handleCreateNew = () => {
    resetForm();
    setIsEditing(true);
    setShowBulkInput(false);
  };

  const resetForm = () => {
    setCurrentId(null);
    setFormName('');
    setFormClassInfo({ classNum: '', studentNum: '' });
    setFormScores(initialScores);
    setFormSubjectOpts(initialSubjectOptions);
  };

  const handleScoreChange = (field: keyof StudentScores, value: string) => {
    const numVal = parseInt(value) || 0;
    setFormScores(prev => ({ ...prev, [field]: numVal }));
  };

  const handleSubjectOptChange = (field: keyof StudentOptionalSubjects, value: string) => {
    setFormSubjectOpts(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">학생 관리</h2>
        {!isEditing && !showBulkInput && (
          <div className="flex gap-2">
             <button 
              onClick={() => {
                downloadBulkTemplateCsv();
                setShowBulkInput(true);
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <ClipboardCopy size={18} /> 일괄 등록
            </button>
            <button 
              onClick={handleCreateNew}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Plus size={18} /> 개별 등록
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student List */}
        <div className="lg:col-span-1 space-y-4">
          {students.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-400">
              등록된 학생이 없습니다.
            </div>
          ) : (
            students.map(student => (
              <div key={student.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-blue-400 transition-all flex justify-between items-center group cursor-pointer" onClick={() => handleEdit(student)}>
                <div className="flex-1">
                  <div className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <User size={18} className="text-slate-400" />
                    {student.name}
                    {student.classNum && student.studentNum && (
                        <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {student.classNum}반 {student.studentNum}번
                        </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    국{student.scores.kor} 수{student.scores.math} 영{student.scores.eng}
                  </div>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectStudentForCounseling(student);
                    }}
                    className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded border border-green-200"
                    title="바로 상담하기"
                  >
                    <BarChart3 size={18} />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, student.id)}
                    className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded border border-red-200"
                    title="삭제"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Section: Edit Form OR Bulk Input */}
        <div className="lg:col-span-2">
          {showBulkInput ? (
             <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
                 <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                      <ClipboardCopy className="text-green-600" size={20}/>
                      엑셀 붙여넣기 (일괄 등록)
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => setShowBulkInput(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700">취소</button>
                    <button onClick={handleBulkRegister} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md">
                      <Check size={18} /> 일괄 등록 실행
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg border border-blue-100">
                        <strong>📌 사용 방법</strong><br/>
                        엑셀에서 아래 순서의 열을 선택하여 복사(Ctrl+C)한 후 하단 입력창에 붙여넣기(Ctrl+V) 하세요.<br/>
                        <span className="text-xs text-slate-500 mt-1 block">
                            (A열)반 | (B)번호 | (C)이름 | (D)국어선택 | (E)국어표점 | (F)수학선택 | (G)수학표점 | (H)탐구1선택 | (I)탐구1표점 | (J)탐구2선택 | (K)탐구2표점 | (L)영어등급 | (M)한국사등급
                        </span>
                    </div>
                    <textarea 
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder={`예시:\n3\t15\t홍길동\t언어와 매체\t125\t미적분\t130\t물리학학1\t65\t화학1\t63\t2\t1`}
                        className="w-full h-80 p-4 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none bg-slate-50"
                    />
                </div>
             </div>
          ) : isEditing ? (
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-700">
                  {currentId ? '학생 정보 수정' : '새 학생 등록'}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700">취소</button>
                  <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">
                    <Save size={18} /> 저장
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Basic Info Section */}
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-3 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">반</label>
                        <input 
                            type="number" 
                            value={formClassInfo.classNum}
                            onChange={(e) => setFormClassInfo({...formClassInfo, classNum: e.target.value})}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="반"
                        />
                    </div>
                    <div className="col-span-3 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">번호</label>
                        <input 
                            type="number" 
                            value={formClassInfo.studentNum}
                            onChange={(e) => setFormClassInfo({...formClassInfo, studentNum: e.target.value})}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="번호"
                        />
                    </div>
                    <div className="col-span-6 md:col-span-8">
                        <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
                        <input 
                            type="text" 
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="이름 입력"
                        />
                    </div>
                </div>

                <div className="h-px bg-slate-100 my-2"></div>

                {/* Scores & Subjects Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Kor */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">국어 <span className="text-xs font-normal text-slate-400">표준점수</span></label>
                    </div>
                    <div className="flex gap-2">
                        <select 
                            value={formSubjectOpts.kor}
                            onChange={(e) => handleSubjectOptChange('kor', e.target.value)}
                            className="w-1/2 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:border-blue-500 outline-none"
                        >
                            {SUBJECT_OPTS_KOR.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <input 
                            type="number" 
                            value={formScores.kor} 
                            onChange={(e) => handleScoreChange('kor', e.target.value)}
                            className="w-1/2 px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:border-blue-500 outline-none text-right" 
                        />
                    </div>
                  </div>

                  {/* Math */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">수학 <span className="text-xs font-normal text-slate-400">표준점수</span></label>
                    </div>
                    <div className="flex gap-2">
                         <select 
                            value={formSubjectOpts.math}
                            onChange={(e) => handleSubjectOptChange('math', e.target.value)}
                            className="w-1/2 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:border-blue-500 outline-none"
                        >
                            {SUBJECT_OPTS_MATH.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <input 
                            type="number" 
                            value={formScores.math} 
                            onChange={(e) => handleScoreChange('math', e.target.value)}
                            className="w-1/2 px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:border-blue-500 outline-none text-right" 
                        />
                    </div>
                  </div>

                  {/* Exp 1 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">탐구 1 <span className="text-xs font-normal text-slate-400">표준점수</span></label>
                    </div>
                    <div className="flex gap-2">
                         <select 
                            value={formSubjectOpts.exp1}
                            onChange={(e) => handleSubjectOptChange('exp1', e.target.value)}
                            className="w-1/2 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:border-blue-500 outline-none"
                        >
                            {SUBJECT_OPTS_EXP.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <input 
                            type="number" 
                            value={formScores.exp1} 
                            onChange={(e) => handleScoreChange('exp1', e.target.value)}
                            className="w-1/2 px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:border-blue-500 outline-none text-right" 
                        />
                    </div>
                  </div>

                  {/* Exp 2 */}
                   <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">탐구 2 <span className="text-xs font-normal text-slate-400">표준점수</span></label>
                    </div>
                    <div className="flex gap-2">
                         <select 
                            value={formSubjectOpts.exp2}
                            onChange={(e) => handleSubjectOptChange('exp2', e.target.value)}
                            className="w-1/2 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:border-blue-500 outline-none"
                        >
                            {SUBJECT_OPTS_EXP.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <input 
                            type="number" 
                            value={formScores.exp2} 
                            onChange={(e) => handleScoreChange('exp2', e.target.value)}
                            className="w-1/2 px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:border-blue-500 outline-none text-right" 
                        />
                    </div>
                  </div>

                  {/* Eng */}
                  <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700">영어 <span className="text-xs font-normal text-slate-400">등급</span></label>
                     <select value={formScores.eng} onChange={(e) => handleScoreChange('eng', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:border-blue-500 outline-none">
                      {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}등급</option>)}
                    </select>
                  </div>
                  
                  {/* History */}
                   <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700">한국사 <span className="text-xs font-normal text-slate-400">등급</span></label>
                     <select value={formScores.hist} onChange={(e) => handleScoreChange('hist', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:border-blue-500 outline-none">
                      {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}등급</option>)}
                    </select>
                  </div>

                </div>
              </div>
            </div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
               <Users size={48} className="mb-4 opacity-50" />
               <p>학생 목록에서 선택하여 수정하거나, 새로운 학생을 등록하세요.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentManager;
