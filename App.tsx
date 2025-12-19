
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import StudentManager from './components/StudentManager';
import Counseling from './components/Counseling';
import { RulesData, ExcelRow, Student, ScoreTableData, ConversionTableData } from './types';
import { STORAGE_KEY_STUDENTS, DEFAULT_RULES, DEFAULT_SCORE_TABLE, DEFAULT_ADMISSION_DATA, DEFAULT_CONVERSION_TABLE, RULE_URL, SCORE_TABLE_URL, ADMISSION_URL, CONVERSION_TABLE_URL, SECRET_KEY } from './constants';
import { decryptJSON } from './utils/security';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Data State
  const [rulesData, setRulesData] = useState<RulesData | null>(null);
  const [scoreTable, setScoreTable] = useState<ScoreTableData | null>(null);
  const [conversionTable, setConversionTable] = useState<ConversionTableData | null>(null);
  const [admissionData, setAdmissionData] = useState<ExcelRow[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Selection State for Counseling
  const [counselingTarget, setCounselingTarget] = useState<Student | null>(null);

  useEffect(() => {
    fetchAllData();
    loadStudents();
  }, []);

  const fetchSecureData = async <T,>(url: string): Promise<T | null> => {
      try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to fetch ${url}`);
          const text = await res.text();
          return decryptJSON<T>(text);
      } catch (e) {
          console.error(e);
          return null;
      }
  };

  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      // Fetch Rules, Score Tables, Admission Data, Conversion Tables in parallel
      const [loadedRules, loadedTable, loadedAdmission, loadedConversion] = await Promise.all([
        fetchSecureData<RulesData>(RULE_URL),
        fetchSecureData<ScoreTableData>(SCORE_TABLE_URL),
        fetchSecureData<ExcelRow[]>(ADMISSION_URL),
        fetchSecureData<ConversionTableData>(CONVERSION_TABLE_URL)
      ]);

      // Fallbacks
      if (!loadedRules) {
        console.warn(`Rules data failed to load/decrypt. Using internal default.`);
      }
      if (!loadedTable) {
        console.warn(`Score table failed to load/decrypt. Using internal default.`);
      }
      if (!loadedAdmission) {
        console.warn(`Admission data failed to load/decrypt. Using internal default.`);
      }
      if (!loadedConversion) {
        console.warn(`Conversion table failed to load/decrypt. Using internal default.`);
      }

      setRulesData(loadedRules || DEFAULT_RULES);
      setScoreTable(loadedTable || DEFAULT_SCORE_TABLE);
      setAdmissionData(loadedAdmission || DEFAULT_ADMISSION_DATA);
      setConversionTable(loadedConversion || DEFAULT_CONVERSION_TABLE);

    } catch (e) {
      console.error("Critical error loading data:", e);
      setRulesData(DEFAULT_RULES);
      setScoreTable(DEFAULT_SCORE_TABLE);
      setAdmissionData(DEFAULT_ADMISSION_DATA);
      setConversionTable(DEFAULT_CONVERSION_TABLE);
    } finally {
      setLoadingData(false);
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

  const handleLogin = (key: string) => {
    if (key === SECRET_KEY) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleSelectForCounseling = (student: Student) => {
    setCounselingTarget(student);
    setActiveTab('counseling');
  };

  const handleTabChange = (tab: string) => {
    if (!isAuthenticated && tab !== 'dashboard') {
      alert("비밀키 인증이 필요합니다.");
      return;
    }
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            rulesData={rulesData}
            scoreTable={scoreTable}
            conversionTable={conversionTable}
            admissionData={admissionData}
            loading={loadingData}
            onReload={fetchAllData}
            isAuthenticated={isAuthenticated}
            onLogin={handleLogin}
          />
        );
      case 'students':
        return isAuthenticated ? (
          <StudentManager 
            students={students}
            setStudents={setStudents}
            onSelectStudentForCounseling={handleSelectForCounseling}
          />
        ) : <div>Access Denied</div>;
      case 'counseling':
        return isAuthenticated ? (
          <Counseling 
            students={students}
            admissionData={admissionData}
            rulesData={rulesData}
            scoreTable={scoreTable}
            conversionTable={conversionTable}
            initialStudent={counselingTarget}
          />
        ) : <div>Access Denied</div>;
      default:
        return <div>Not found</div>;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange} isAuthenticated={isAuthenticated}>
      {renderContent()}
    </Layout>
  );
};

export default App;
