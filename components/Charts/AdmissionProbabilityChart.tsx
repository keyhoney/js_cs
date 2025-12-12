import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { AnalysisResult } from '../../types';

interface AdmissionProbabilityChartProps {
  results: AnalysisResult[];
}

const AdmissionProbabilityChart: React.FC<AdmissionProbabilityChartProps> = ({ results }) => {
  const safeCount = results.filter(r => r.status === 'safe').length;
  const matchCount = results.filter(r => r.status === 'match').length;
  const riskCount = results.filter(r => r.status === 'risk').length;

  const data = [
    { name: '안정 지원', value: safeCount, color: '#3b82f6' },
    { name: '적정 지원', value: matchCount, color: '#22c55e' },
    { name: '위험 지원', value: riskCount, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const total = results.length;
  const safePercentage = total > 0 ? ((safeCount / total) * 100).toFixed(1) : '0';
  const matchPercentage = total > 0 ? ((matchCount / total) * 100).toFixed(1) : '0';
  const riskPercentage = total > 0 ? ((riskCount / total) * 100).toFixed(1) : '0';

  return (
    <div className="bg-white p-6 rounded-xl shadow-soft border border-slate-200/50">
      <h3 className="text-lg font-bold text-slate-800 mb-4">합격 확률 분포</h3>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-sm font-semibold text-blue-900">안정 지원</span>
            <span className="text-lg font-bold text-blue-700">{safeCount}건 ({safePercentage}%)</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-sm font-semibold text-green-900">적정 지원</span>
            <span className="text-lg font-bold text-green-700">{matchCount}건 ({matchPercentage}%)</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
            <span className="text-sm font-semibold text-red-900">위험 지원</span>
            <span className="text-lg font-bold text-red-700">{riskCount}건 ({riskPercentage}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionProbabilityChart;

