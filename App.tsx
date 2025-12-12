import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import StudentManager from './components/StudentManager';
import Counseling from './components/Counseling';
import Analytics from './components/Analytics';
import HistoryView from './components/HistoryView';
import { RulesData, ExcelRow, Student, ScoreTableData } from './types';
import { STORAGE_KEY_STUDENTS, DEFAULT_RULES, DEFAULT_SCORE_TABLE } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data State
  const [rulesData, setRulesData] = useState<RulesData | null>(null);
  const [scoreTable, setScoreTable] = useState<ScoreTableData | null>(null); // New state
  const [loadingRules, setLoadingRules] = useState(false);
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Selection State for Counseling
  const [counselingTarget, setCounselingTarget] = useState<Student | null>(null);

  useEffect(() => {
    fetchRulesAndTables();
    loadStudents();
  }, []);

  const fetchRulesAndTables = async () => {
    setLoadingRules(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
      
      // In production, fetch these from JSON URLs
      setRulesData(DEFAULT_RULES); 
      setScoreTable(DEFAULT_SCORE_TABLE);
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoadingRules(false);
    }
  };

  const loadStudents = () => {
    const stored = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (stored) {
      try {
        setStudents(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse students", e);
      }
    }
  };

  const handleSelectForCounseling = (student: Student) => {
    setCounselingTarget(student);
    setActiveTab('counseling');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            rulesData={rulesData}
            scoreTable={scoreTable}
            excelData={excelData}
            loadingRules={loadingRules}
            onRulesReload={fetchRulesAndTables}
            onExcelDataLoaded={setExcelData}
          />
        );
      case 'students':
        return (
          <StudentManager 
            students={students}
            setStudents={setStudents}
            onSelectStudentForCounseling={handleSelectForCounseling}
          />
        );
      case 'counseling':
        return (
          <Counseling 
            students={students}
            excelData={excelData}
            rulesData={rulesData}
            scoreTable={scoreTable}
            initialStudent={counselingTarget}
          />
        );
      case 'analytics':
        return (
          <Analytics 
            students={students}
            excelData={excelData}
          />
        );
      case 'history':
        return (
          <HistoryView 
            students={students}
          />
        );
      default:
        return <div>Not found</div>;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
