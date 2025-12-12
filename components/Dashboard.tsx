import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { ExcelRow, RulesData, ScoreTableData } from '../types';
import { Upload, CheckCircle, AlertTriangle, FileSpreadsheet, RefreshCw, Table2, BarChart3 } from 'lucide-react';
import { MOCK_EXCEL_DATA } from '../constants';

interface DashboardProps {
  rulesData: RulesData | null;
  scoreTable: ScoreTableData | null;
  excelData: ExcelRow[];
  loadingRules: boolean;
  onRulesReload: () => void;
  onExcelDataLoaded: (data: ExcelRow[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  rulesData, 
  scoreTable, 
  excelData, 
  loadingRules, 
  onRulesReload, 
  onExcelDataLoaded 
}) => {
  const [parsing, setParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setErrorMsg(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<any>(sheet);

      const parsedRows: ExcelRow[] = [];
      
      jsonData.forEach((row) => {
        const univName = row['대학명'] || row['Univ'] || row['university'];
        const deptName = row['모집단위'] || row['Dept'] || row['department'];
        const group = row['군'] || row['Group'];
        const cutoff = row['예상컷'] || row['Cutoff'] || row['score'];

        if (univName && deptName && group && cutoff) {
          parsedRows.push({
            univName: String(univName).trim(),
            deptName: String(deptName).trim(),
            group: String(group).trim(),
            cutoff: parseFloat(cutoff),
          });
        }
      });

      if (parsedRows.length === 0) {
        throw new Error("유효한 데이터 행을 찾을 수 없습니다.");
      }

      onExcelDataLoaded(parsedRows);
    } catch (err) {
      console.error(err);
      setErrorMsg("파일 파싱 중 오류가 발생했습니다.");
    } finally {
      setParsing(false);
      e.target.value = "";
    }
  };

  const loadMockData = () => {
    onExcelDataLoaded(MOCK_EXCEL_DATA);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center mb-12">
        <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-strong mb-4">
          <BarChart3 className="text-white" size={40} />
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
          2025 정시 상담 대시보드
        </h2>
        <p className="text-slate-600 text-lg font-medium">데이터를 로드하고 상담 준비를 완료하세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Score Table Status */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200/50 flex flex-col hover:shadow-medium transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                <Table2 size={18} className="text-white" />
              </div>
              점수 변환표
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
              scoreTable 
                ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200' 
                : 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200'
            }`}>
              {loadingRules ? '로딩...' : scoreTable ? '로드됨' : '실패'}
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200/50">
             {scoreTable ? (
                <>
                  <div className="p-4 bg-green-100 rounded-full mb-3 shadow-sm">
                    <CheckCircle className="text-green-600" size={36} />
                  </div>
                  <p className="text-sm font-bold text-slate-700 mb-1">표점/백분위 연동</p>
                  <p className="text-xs text-slate-500 font-medium">{scoreTable.version}</p>
                </>
             ) : (
                <div className="text-slate-400 text-sm font-medium">데이터 필요</div>
             )}
          </div>
        </div>

        {/* Card 2: Rules Status */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200/50 flex flex-col hover:shadow-medium transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                <RefreshCw size={18} className="text-white" />
              </div>
              산출 공식
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
              rulesData 
                ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200' 
                : 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200'
            }`}>
              {loadingRules ? '로딩...' : rulesData ? '로드됨' : '실패'}
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200/50">
            {rulesData ? (
              <>
                <div className="p-4 bg-green-100 rounded-full mb-3 shadow-sm">
                  <CheckCircle className="text-green-600" size={36} />
                </div>
                <p className="text-sm font-bold text-slate-700 mb-1">대학별 공식 연동</p>
                <p className="text-xs text-slate-500 font-medium">{Object.keys(rulesData.rules).length}개 대학</p>
              </>
            ) : (
              <button 
                onClick={onRulesReload} 
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm font-medium text-sm"
              >
                재시도
              </button>
            )}
          </div>
        </div>

        {/* Card 3: Excel Upload */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200/50 flex flex-col hover:shadow-medium transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                <FileSpreadsheet size={18} className="text-white" />
              </div>
              입결 자료
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
              excelData.length > 0 
                ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200' 
                : 'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-500 border border-slate-200'
            }`}>
              {excelData.length > 0 ? `${excelData.length}건` : '미등록'}
            </span>
          </div>

          <div className="flex-1 border-2 border-dashed border-slate-300 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 hover:from-blue-50 hover:to-blue-100 hover:border-blue-400 transition-all duration-300 relative flex flex-col justify-center items-center p-6 group/upload">
            <input 
              type="file" 
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {parsing ? (
               <div className="flex flex-col items-center gap-2">
                 <RefreshCw className="animate-spin text-blue-500" size={28} />
                 <p className="text-xs text-slate-500 font-medium">파싱 중...</p>
               </div>
            ) : (
              <div className="text-center">
                <div className="p-3 bg-white rounded-full shadow-sm mb-2 group-hover/upload:scale-110 transition-transform">
                  <Upload className="text-slate-400 group-hover/upload:text-blue-500" size={24} />
                </div>
                <p className="text-xs font-semibold text-slate-600 group-hover/upload:text-blue-600">파일 선택</p>
                <p className="text-[10px] text-slate-400 mt-1">.xlsx, .xls</p>
              </div>
            )}
          </div>
          {excelData.length === 0 && !parsing && (
             <button 
               onClick={loadMockData} 
               className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-semibold text-center w-full hover:underline transition-colors"
             >
               샘플 데이터 로드
             </button>
          )}
        </div>
      </div>
      
      {errorMsg && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 text-red-700 p-4 rounded-xl border border-red-200 shadow-sm flex items-center gap-3 animate-slide-up">
          <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
          <p className="font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-200/50 shadow-soft">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500 rounded-lg">
            <AlertTriangle className="text-white" size={20} />
          </div>
          <h4 className="font-bold text-blue-900 text-lg">사용 가이드 (고급)</h4>
        </div>
        <ul className="list-none space-y-2.5 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold mt-0.5">•</span>
            <span>표준점수만 입력하면 <strong className="text-blue-900">백분위/등급</strong>은 자동으로 조회되어 계산에 반영됩니다.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold mt-0.5">•</span>
            <span>한 모집단위에 여러 점수 산출 방식(예: 표점전형/백분위전형)이 있는 경우, <strong className="text-blue-900">가장 유리한 점수</strong>가 자동으로 선택됩니다.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold mt-0.5">•</span>
            <span>분석 결과 리스트의 '상세' 버튼을 누르면 적용된 전형 방식과 상세 계산 내역을 볼 수 있습니다.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
