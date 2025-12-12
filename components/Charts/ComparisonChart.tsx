import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Student } from '../../types';

interface ComparisonChartProps {
  students: Student[];
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ students }) => {
  if (students.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-soft border border-slate-200/50 text-center text-slate-400">
        비교할 학생이 없습니다.
      </div>
    );
  }

  const chartData = students.map(student => ({
    name: student.name.length > 4 ? student.name.substring(0, 4) + '...' : student.name,
    fullName: student.name,
    국어: student.scores.kor,
    수학: student.scores.math,
    탐구합: student.scores.exp1 + student.scores.exp2,
  }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-soft border border-slate-200/50">
      <h3 className="text-lg font-bold text-slate-800 mb-4">학생별 점수 비교</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value: number, name: string) => [value, name]}
            labelFormatter={(label) => `학생: ${chartData.find(d => d.name === label)?.fullName || label}`}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          />
          <Bar dataKey="국어" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="수학" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="탐구합" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonChart;

