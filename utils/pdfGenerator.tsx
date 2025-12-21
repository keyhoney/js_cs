import React from 'react';
// @ts-ignore - @react-pdf/renderer 타입 정의 문제
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { Student, AnalysisResult, ScoreDetail } from '../types';

// PDF 스타일 정의 (고급스럽고 신뢰도 높은 디자인)
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '2px solid #1e40af',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  studentInfo: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
    marginBottom: 25,
    borderLeft: '4px solid #3b82f6',
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
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
    fontWeight: 'bold',
    color: '#64748b',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottom: '1px solid #e2e8f0',
  },
  universityCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderLeft: '4px solid #3b82f6',
  },
  universityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  universityName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  deptName: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusSafe: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  statusMatch: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusUpward: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusDanger: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
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
    fontWeight: 'bold',
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
    fontWeight: 'bold',
  },
  detailSection: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  detailTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    fontSize: 9,
    color: '#475569',
  },
  detailLabel: {
    fontWeight: 'bold',
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
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e40af' }}>
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

