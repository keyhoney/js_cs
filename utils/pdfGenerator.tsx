import React, { useEffect, useState } from 'react';
// @ts-ignore - @react-pdf/renderer 타입 정의 문제
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';
import { Student, AnalysisResult, ScoreDetail } from '../types';

// 한글 폰트 등록 - KoPub Batang 사용
// 폰트 파일은 public/fonts 폴더에 있으며, BASE_URL을 고려하여 로드
const registerFonts = async () => {
  try {
    // BASE_URL을 사용하여 경로 설정 (빌드 환경에 따라 '/js_cs/' 또는 '/' 일 수 있음)
    const baseUrl = import.meta.env.BASE_URL || '/';
    const fontPaths = {
      light: `${baseUrl}fonts/KoPub Batang Light.ttf`,
      medium: `${baseUrl}fonts/KoPub Batang Medium.ttf`,
      bold: `${baseUrl}fonts/KoPub Batang Bold.ttf`,
    };

    // 각 폰트를 fetch로 로드하여 등록
    // @ts-ignore - @react-pdf/renderer 타입 정의 문제 (ArrayBuffer 타입)
    const [lightData, mediumData, boldData] = await Promise.all([
      fetch(fontPaths.light).then(res => res.arrayBuffer()),
      fetch(fontPaths.medium).then(res => res.arrayBuffer()),
      fetch(fontPaths.bold).then(res => res.arrayBuffer()),
    ]);

    // Font.register를 사용하여 폰트 등록
    // @ts-ignore - @react-pdf/renderer 타입 정의 문제 (ArrayBuffer를 src로 받을 수 있음)
    Font.register({
      family: 'KoPubBatang',
      fonts: [
        {
          // @ts-ignore
          src: lightData,
          fontWeight: 300,
        },
        {
          // @ts-ignore
          src: mediumData,
          fontWeight: 500,
        },
        {
          // @ts-ignore
          src: boldData,
          fontWeight: 700,
        },
      ],
    });
  } catch (error) {
    console.error('Font registration failed:', error);
    // 폰트 등록 실패 시 기본 폰트 사용
  }
};

// 컴포넌트 마운트 시 폰트 등록
registerFonts();

// PDF 스타일 정의 (전문적이고 신뢰감 있는 디자인)
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'KoPubBatang',
    backgroundColor: '#ffffff',
    fontSize: 10,
    color: '#1e293b',
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 35,
    paddingBottom: 25,
    borderBottom: '3px solid #0f172a',
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
    marginTop: -10,
    marginLeft: -10,
    marginRight: -10,
  },
  title: {
    fontSize: 26,
    fontWeight: 700, // Bold
    color: '#0f172a',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 4,
    fontWeight: 'normal',
  },
  studentInfo: {
    backgroundColor: '#f1f5f9',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    border: '2px solid #cbd5e1',
    borderLeft: '5px solid #0f172a',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  studentName: {
    fontSize: 20,
    fontWeight: 700, // Bold
    color: '#0f172a',
    marginBottom: 15,
    letterSpacing: 0.3,
  },
  studentScores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  scoreItem: {
    fontSize: 10,
    color: '#475569',
    marginRight: 15,
  },
  scoreLabel: {
    fontWeight: 700, // Bold
    color: '#64748b',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700, // Bold
    color: '#0f172a',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: '2px solid #0f172a',
    letterSpacing: 0.5,
  },
  universityCard: {
    backgroundColor: '#ffffff',
    border: '1.5px solid #cbd5e1',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    borderLeft: '5px solid #0f172a',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  },
  universityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  universityName: {
    fontSize: 16,
    fontWeight: 700, // Bold
    color: '#0f172a',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  deptName: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 10,
    fontWeight: 'normal',
  },
  statusBadge: {
    padding: '6px 14px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700, // Bold
    border: '1.5px solid',
  },
  statusSafe: {
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    borderColor: '#3b82f6',
  },
  statusMatch: {
    backgroundColor: '#f0fdf4',
    color: '#166534',
    borderColor: '#22c55e',
  },
  statusUpward: {
    backgroundColor: '#fffbeb',
    color: '#92400e',
    borderColor: '#f59e0b',
  },
  statusDanger: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    borderColor: '#ef4444',
  },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottom: '1px solid #f1f5f9',
  },
  scoreSectionLabel: {
    fontSize: 10,
    color: '#64748b',
    width: '40%',
  },
  scoreValue: {
    fontSize: 11,
    fontWeight: 700, // Bold
    color: '#1e293b',
    width: '30%',
    textAlign: 'right',
  },
  scoreDiff: {
    fontSize: 10,
    width: '30%',
    textAlign: 'right',
  },
  scorePositive: {
    color: '#059669',
  },
  scoreNegative: {
    color: '#dc2626',
  },
  cutoffs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #e2e8f0',
  },
  cutoffItem: {
    alignItems: 'center',
    flex: 1,
  },
  cutoffLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 4,
  },
  cutoffValue: {
    fontSize: 12,
    fontWeight: 700, // Bold
  },
  detailSection: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    border: '1px solid #e2e8f0',
  },
  detailTitle: {
    fontSize: 12,
    fontWeight: 700, // Bold
    color: '#0f172a',
    marginBottom: 10,
    letterSpacing: 0.3,
    borderBottom: '1px solid #cbd5e1',
    paddingBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    fontSize: 9,
    color: '#475569',
  },
  detailLabel: {
    fontWeight: 700, // Bold
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#94a3b8',
    borderTop: '1px solid #e2e8f0',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 9,
    color: '#94a3b8',
  },
});

interface PDFReportProps {
  student: Student;
  bookmarkedResults: AnalysisResult[];
  scoreDetails: Map<string, ScoreDetail>;
  generatedDate: string;
}

const PDFReport: React.FC<PDFReportProps> = ({ student, bookmarkedResults, scoreDetails, generatedDate }) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'safe':
        return [styles.statusBadge, styles.statusSafe];
      case 'match':
        return [styles.statusBadge, styles.statusMatch];
      case 'upward':
        return [styles.statusBadge, styles.statusUpward];
      case 'danger':
        return [styles.statusBadge, styles.statusDanger];
      default:
        return [styles.statusBadge, styles.statusDanger];
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'safe':
        return '안정 지원';
      case 'match':
        return '소신 지원';
      case 'upward':
        return '상향 지원';
      case 'danger':
        return '위험 지원';
      default:
        return '위험 지원';
    }
  };

  const formatScore = (score: number) => {
    return score.toFixed(2);
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>2026 정시 입시 상담 리포트</Text>
          <Text style={styles.subtitle}>생성일: {generatedDate}</Text>
        </View>

        {/* Student Info */}
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {student.classNum && student.studentNum 
              ? `${student.classNum}-${student.studentNum} ${student.name}` 
              : student.name}
          </Text>
          <View style={styles.studentScores}>
            <Text style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>국어: </Text>
              {student.scores.kor}점 ({student.subjectOptions?.kor || '미선택'})
            </Text>
            <Text style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>수학: </Text>
              {student.scores.math}점 ({student.subjectOptions?.math || '미선택'})
            </Text>
            <Text style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>탐구1: </Text>
              {student.scores.exp1}점 ({student.subjectOptions?.exp1 || '미선택'})
            </Text>
            <Text style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>탐구2: </Text>
              {student.scores.exp2}점 ({student.subjectOptions?.exp2 || '미선택'})
            </Text>
            <Text style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>영어: </Text>
              {student.scores.eng}등급
            </Text>
            <Text style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>한국사: </Text>
              {student.scores.hist}등급
            </Text>
          </View>
        </View>

        {/* Bookmarked Universities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>관심 대학 분석 ({bookmarkedResults.length}개)</Text>
          
          {bookmarkedResults.map((result, index) => {
            const detail = scoreDetails.get(`${result.univName}-${result.deptName}`);
            const diffColor = result.gapPercent >= 0 ? styles.scorePositive : styles.scoreNegative;
            const diffSign = result.gapPercent >= 0 ? '+' : '';

            return (
              <View key={index} style={styles.universityCard} wrap={false}>
                <View style={styles.universityHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.universityName}>{result.univName}</Text>
                    <Text style={styles.deptName}>{result.deptName}</Text>
                    <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>
                      적용 공식: {result.formulaLabel}
                    </Text>
                  </View>
                  <View style={getStatusStyle(result.status)}>
                    <Text>{getStatusLabel(result.status)}</Text>
                  </View>
                </View>

                {/* Score Comparison */}
                <View style={styles.scoreSection}>
                  <Text style={styles.scoreSectionLabel}>내 환산 점수</Text>
                  <Text style={styles.scoreValue}>{formatScore(result.myScore)}</Text>
                  <Text style={[styles.scoreDiff, diffColor]}>
                    {diffSign}{formatPercent(result.gapPercent)}
                  </Text>
                </View>

                {/* Cutoffs */}
                <View style={styles.cutoffs}>
                  <View style={styles.cutoffItem}>
                    <Text style={styles.cutoffLabel}>안정 기준</Text>
                    <Text style={[styles.cutoffValue, { color: '#1e40af' }]}>
                      {formatScore(result.safeCut)}
                    </Text>
                  </View>
                  <View style={styles.cutoffItem}>
                    <Text style={styles.cutoffLabel}>소신 기준</Text>
                    <Text style={[styles.cutoffValue, { color: '#166534' }]}>
                      {formatScore(result.matchCut)}
                    </Text>
                  </View>
                  <View style={styles.cutoffItem}>
                    <Text style={styles.cutoffLabel}>상향 기준</Text>
                    <Text style={[styles.cutoffValue, { color: '#92400e' }]}>
                      {formatScore(result.upwardCut)}
                    </Text>
                  </View>
                </View>

                {/* Recruitment Info */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>모집 정보</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>최종 모집 인원:</Text>
                    <Text>{result.finalRecruitmentCount}명</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>최초 모집 인원:</Text>
                    <Text>{result.initialRecruitmentCount}명</Text>
                  </View>
                  {result.earlyAdmissionCarryover > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>수시 이월:</Text>
                      <Text>{result.earlyAdmissionCarryover}명</Text>
                    </View>
                  )}
                  {result.lastYearCompetitionRate > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>전년도 경쟁률:</Text>
                      <Text>{result.lastYearCompetitionRate.toFixed(2)}:1</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>군:</Text>
                    <Text>{result.group}</Text>
                  </View>
                </View>

                {/* Score Detail */}
                {detail && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailTitle}>점수 상세 내역</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>국어:</Text>
                      <Text>{formatScore(detail.kor.raw)} × {detail.kor.weight} = {formatScore(detail.kor.calc)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>수학:</Text>
                      <Text>{formatScore(detail.math.raw)} × {detail.math.weight} = {formatScore(detail.math.calc)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>탐구:</Text>
                      <Text>{formatScore(detail.exp.raw)} × {detail.exp.weight} = {formatScore(detail.exp.calc)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>영어:</Text>
                      <Text>{detail.eng.grade}등급 = {formatScore(detail.eng.score)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>한국사:</Text>
                      <Text>{detail.hist.grade}등급 = {formatScore(detail.hist.score)}</Text>
                    </View>
                    <View style={[styles.detailRow, { marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }]}>
                      <Text style={[styles.detailLabel, { fontSize: 10 }]}>최종 환산 점수:</Text>
                      <Text style={{ fontSize: 11, fontWeight: 700, color: '#1e40af' }}>
                        {formatScore(detail.total)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Jeongsi Counselor 2026 - 정시 입시 상담 시스템
        </Text>
        <Text 
          style={styles.pageNumber} 
          render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => (
            `${pageNumber} / ${totalPages}`
          )} 
          fixed 
        />
      </Page>
    </Document>
  );
};

export default PDFReport;

