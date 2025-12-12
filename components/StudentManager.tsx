import React, { useState, useEffect } from 'react';
import { Student, StudentScores } from '../types';
import { STORAGE_KEY_STUDENTS } from '../constants';
import { saveScoreChange } from '../services/historyService';
import { Plus, Trash2, Save, User, BarChart3, Users } from 'lucide-react';

interface StudentManagerProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  onSelectStudentForCounseling: (student: Student) => void;
}

const initialScores: StudentScores = {
  kor: 0, math: 0, eng: 1, hist: 1, exp1: 0, exp2: 0
};

const StudentManager: React.FC<StudentManagerProps> = ({ students, setStudents, onSelectStudentForCounseling }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formScores, setFormScores] = useState<StudentScores>(initialScores);

  // Load from local storage on mount (handled in App, but sync here if needed)
  
  const handleEdit = (student: Student) => {
    setCurrentId(student.id);
    setFormName(student.name);
    setFormScores(student.scores);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      const updated = students.filter(s => s.id !== id);
      setStudents(updated);
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
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
      scores: { ...formScores } // Copy object
    };

    // Track score changes for existing students
    if (currentId) {
      const oldStudent = students.find(s => s.id === currentId);
      if (oldStudent) {
        saveScoreChange(currentId, oldStudent.scores, newStudent.scores);
      }
    }

    let updatedStudents;
    if (currentId) {
      updatedStudents = students.map(s => s.id === currentId ? newStudent : s);
    } else {
      updatedStudents = [...students, newStudent];
    }

    setStudents(updatedStudents);
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updatedStudents));
    
    // Reset form
    setIsEditing(false);
    setCurrentId(null);
    setFormName('');
    setFormScores(initialScores);
  };

  const handleCreateNew = () => {
    setCurrentId(null);
    setFormName('');
    setFormScores(initialScores);
    setIsEditing(true);
  };

  const handleScoreChange = (field: keyof StudentScores, value: string) => {
    const numVal = parseInt(value) || 0;
    setFormScores(prev => ({ ...prev, [field]: numVal }));
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">학생 관리</h2>
          <p className="text-slate-600 font-medium">학생 정보를 등록하고 관리하세요</p>
        </div>
        {!isEditing && (
          <button 
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl transition-all shadow-soft hover:shadow-medium font-semibold"
          >
            <Plus size={20} /> 학생 등록
          </button>
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
              <div key={student.id} className="bg-white p-5 rounded-xl shadow-soft border border-slate-200/50 hover:border-blue-400 hover:shadow-medium transition-all flex justify-between items-center group">
                <div 
                  className="cursor-pointer flex-1"
                  onClick={() => handleEdit(student)}
                >
                  <div className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                      <User size={16} className="text-white" />
                    </div>
                    {student.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex gap-3">
                    <span>국어 {student.scores.kor}</span>
                    <span>수학 {student.scores.math}</span>
                    <span>영어 {student.scores.eng}등급</span>
                    <span>탐구 {student.scores.exp1 + student.scores.exp2}</span>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => onSelectStudentForCounseling(student)}
                    className="p-2.5 text-green-600 hover:bg-green-50 rounded-lg transition-all hover:scale-110 shadow-sm"
                    title="바로 상담하기"
                  >
                    <BarChart3 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(student.id)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-all hover:scale-110 shadow-sm"
                    title="삭제"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          {isEditing ? (
            <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200/50 animate-fade-in">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-800">
                  {currentId ? '학생 정보 수정' : '새 학생 등록'}
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditing(false)} 
                    className="px-5 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                  >
                    취소
                  </button>
                  <button 
                    onClick={handleSave} 
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-soft hover:shadow-medium font-semibold transition-all"
                  >
                    <Save size={18} /> 저장
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">이름</label>
                  <input 
                    type="text" 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm hover:shadow-md transition-all"
                    placeholder="학생 이름 입력"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {/* Scores Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase">국어 (표준점수)</label>
                    <input 
                      type="number" 
                      value={formScores.kor} 
                      onChange={(e) => handleScoreChange('kor', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm hover:shadow-md transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase">수학 (표준점수)</label>
                    <input 
                      type="number" 
                      value={formScores.math} 
                      onChange={(e) => handleScoreChange('math', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm hover:shadow-md transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase">영어 (등급)</label>
                    <select 
                      value={formScores.eng} 
                      onChange={(e) => handleScoreChange('eng', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white shadow-sm hover:shadow-md transition-all"
                    >
                      {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}등급</option>)}
                    </select>
                  </div>
                   <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase">한국사 (등급)</label>
                    <select 
                      value={formScores.hist} 
                      onChange={(e) => handleScoreChange('hist', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white shadow-sm hover:shadow-md transition-all"
                    >
                      {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}등급</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase">탐구1 (표준점수)</label>
                    <input 
                      type="number" 
                      value={formScores.exp1} 
                      onChange={(e) => handleScoreChange('exp1', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm hover:shadow-md transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase">탐구2 (표준점수)</label>
                    <input 
                      type="number" 
                      value={formScores.exp2} 
                      onChange={(e) => handleScoreChange('exp2', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm hover:shadow-md transition-all"
                    />
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