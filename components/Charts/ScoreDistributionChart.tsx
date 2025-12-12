import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AnalysisResult } from '../../types';

interface ScoreDistributionChartProps {
  results: AnalysisResult[];
}

const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({ results }) => {
  // 점수대별 분포 계산
  const scoreRanges = [
    { range: '0-10', min: -Infinity, max: 10, count: 0 },
    { range: '10-20', min: 10, max: 20, count: 0 },
    { range: '20-30', min: 20, max: 30, count: 0 },
    { range: '30+', min: 30, max: Infinity, count: 0 },
  ];

  results.forEach(result => {
    const diff = result.diff;
    scoreRanges.forEach(range => {
      if (diff >= range.min && diff < range.max) {
        range.count++;
      }
    });
  });

  const chartData = scoreRanges.map(range => ({
    name: range.range,
    '안정 지원': results.filter(r => r.diff >= range.min && r.diff < range.max && r.status === 'safe').length,
    '적정 지원': results.filter(r => r.diff >= range.min && r.diff < range.max && r.status === 'match').length,
    '위험 지원': results.filter(r => r.diff >= range.min && r.diff < range.max && r.status === 'risk').length,
  }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-soft border border-slate-200/50">
      <h3 className="text-lg font-bold text-slate-800 mb-4">점수차 분포</h3>
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
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          />
          <Bar dataKey="안정 지원" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="적정 지원" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="위험 지원" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreDistributionChart;

