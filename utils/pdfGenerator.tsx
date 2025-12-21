import React, { useEffect, useState } from 'react';
// @ts-ignore - @react-pdf/renderer 타입 정의 문제
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';
import { Student, AnalysisResult, ScoreDetail, ScoreTableData } from '../types';

// 한글 폰트 등록 - KoPub Batang 사용
// 폰트 파일은 public/fonts 폴더에 있으며, BASE_URL을 고려하여 로드
let fontRegistrationPromise: Promise<void> | null = null;
let fontsRegistered = false;

const registerFonts = async (): Promise<void> => {
  if (fontsRegistered) return;
  if (fontRegistrationPromise) return fontRegistrationPromise;

  fontRegistrationPromise = (async () => {
    try {
      // BASE_URL을 사용하여 경로 설정 (빌드 환경에 따라 '/js_cs/' 또는 '/' 일 수 있음)
      const baseUrl = import.meta.env.BASE_URL || '/';
      const fontPaths = {
        light: `${baseUrl}fonts/KoPub Batang Light.ttf`,
        medium: `${baseUrl}fonts/KoPub Batang Medium.ttf`,
        bold: `${baseUrl}fonts/KoPub Batang Bold.ttf`,
      };

      // 각 폰트를 fetch로 로드하여 base64로 변환
      const [lightData, mediumData, boldData] = await Promise.all([
        fetch(fontPaths.light).then(res => {
          if (!res.ok) throw new Error(`Failed to load font: ${fontPaths.light}`);
          return res.arrayBuffer();
        }),
        fetch(fontPaths.medium).then(res => {
          if (!res.ok) throw new Error(`Failed to load font: ${fontPaths.medium}`);
          return res.arrayBuffer();
        }),
        fetch(fontPaths.bold).then(res => {
          if (!res.ok) throw new Error(`Failed to load font: ${fontPaths.bold}`);
          return res.arrayBuffer();
        }),
      ]);

      // ArrayBuffer를 base64 문자열로 변환하는 헬퍼 함수
      const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        // 큰 파일을 위한 청크 처리 (Maximum call stack size 초과 방지)
        const chunkSize = 8192;
        for (let i = 0; i < bytes.byteLength; i += chunkSize) {
          const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength));
          binary += String.fromCharCode.apply(null, Array.from(chunk) as any);
        }
        return btoa(binary);
      };

      // Font.register는 src로 base64 data URI 문자열을 받습니다
      Font.register({
        family: 'KoPubBatang',
        fonts: [
          {
            src: `data:font/truetype;charset=utf-8;base64,${arrayBufferToBase64(lightData)}`,
            fontWeight: 300,
          },
          {
            src: `data:font/truetype;charset=utf-8;base64,${arrayBufferToBase64(mediumData)}`,
            fontWeight: 500,
          },
          {
            src: `data:font/truetype;charset=utf-8;base64,${arrayBufferToBase64(boldData)}`,
            fontWeight: 700,
          },
        ],
      });
      
      fontsRegistered = true;
      console.log('KoPub Batang fonts registered successfully');
    } catch (error) {
      console.error('Font registration failed:', error);
      fontsRegistered = false;
      fontRegistrationPromise = null;
      // 폰트 등록 실패 시 기본 폰트 사용
    }
  })();

  return fontRegistrationPromise;
};

// 앱 시작 시 폰트 등록 시작
registerFonts();

// 폰트 등록 Promise를 export하여 다른 곳에서 await할 수 있도록 함
export { registerFonts };

// PDF 스타일 정의 (전문적/신뢰감: react-pdf 호환 스타일)
const BRAND = {
  navy: '#0B1F3A',
  navy2: '#123A63',
  slate: '#334155',
  muted: '#64748B',
  line: '#E2E8F0',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  safeBg: '#EFF6FF',
  safeText: '#1D4ED8',
  matchBg: '#F0FDF4',
  matchText: '#166534',
  upBg: '#FFFBEB',
  upText: '#92400E',
  dangerBg: '#FEF2F2',
  dangerText: '#991B1B',
};

const ENCOURAGEMENT = [
    "입시는 단순히 결과만으로 완성되는 과정이 아닙니다.",
    "그동안 쌓아온 시간과 노력, 그리고 스스로를 돌아보고 방향을 고민해 온 모든 순간들이 함께 어우러져 만들어지는 여정입니다. 한 번의 시험이나 하나의 결과가 한 사람의 가치를 결정하지는 않습니다.",
    "지금 이 시기에 느끼는 고민과 불안은, 자신을 더 깊이 이해하고 앞으로 나아갈 방향을 차분히 세우고 있다는 증거이기도 합니다. 그 과정 하나하나가 당신을 더욱 단단하게 만들고 있으며, 이미 충분히 의미 있는 걸음을 내딛고 있습니다.",
    "누군가와 비교하지 않아도 괜찮습니다.",
    "당신에게는 당신만의 속도와 리듬이 있고, 그 속도대로 걸어가는 길이 가장 올바른 길입니다. 지금까지 성실하게 쌓아온 태도와 시간은 앞으로의 선택을 지탱해 줄 가장 큰 힘이 될 것입니다.",
    "이 상담 리포트가 결과에 대한 판단을 넘어, 스스로를 믿고 다음 단계를 준비하는 데 작은 기준점이 되기를 바랍니다. 차분하게, 그리고 자신을 믿으며 나아가길 진심으로 응원합니다.",
    "당신의 길 위에 놓인 모든 선택을 끝까지 지지합니다."
  ];

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 52,
    paddingHorizontal: 42,
    fontFamily: 'KoPubBatang',
    backgroundColor: BRAND.card,
    fontSize: 10,
    color: BRAND.slate,
    lineHeight: 1.55,
  },

    // ===== Quote (첫 페이지 응원 문구) =====
    quoteBox: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: BRAND.line,
        borderRadius: 12,
        backgroundColor: BRAND.bg,
        paddingVertical: 12,
        paddingHorizontal: 14,
        position: 'relative',
      },
      quoteAccent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: BRAND.navy,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
      },
      quoteHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 8,
      },
      quoteTitle: {
        fontSize: 10,
        fontWeight: 700,
        color: BRAND.navy,
        letterSpacing: 0.2,
      },
      quoteTag: {
        fontSize: 8.5,
        color: BRAND.muted,
      },
      quoteText: {
        fontSize: 9.5,
        color: BRAND.slate,
        lineHeight: 1.65,
      },
      quoteParagraph: {
        marginBottom: 6,
      },
      quoteFooter: {
        marginTop: 6,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: BRAND.line,
        fontSize: 8.5,
        color: BRAND.muted,
      },

  // ===== Header =====
  header: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
  },
  brandBar: {
    height: 6,
    backgroundColor: BRAND.navy,
    borderRadius: 3,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: BRAND.navy,
    letterSpacing: 0.2,
  },
  metaRight: {
    alignItems: 'flex-end',
  },
  metaText: {
    fontSize: 9,
    color: BRAND.muted,
  },

  // ===== Section =====
  section: {
    marginTop: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: BRAND.navy,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 9,
    color: BRAND.muted,
    marginTop: -6,
    marginBottom: 10,
  },

  // ===== Card (generic) =====
  card: {
    backgroundColor: BRAND.card,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 10,
    padding: 14,
  },

  // ===== Student Card =====
  studentCard: {
    backgroundColor: BRAND.bg,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    marginBottom: 14,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 700,
    color: BRAND.navy,
    marginBottom: 10,
  },
  kvGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  kvItem: {
    width: '50%',
    paddingRight: 10,
    marginBottom: 6,
    flexDirection: 'row',
  },
  kvLabel: {
    width: 48,
    fontSize: 9,
    color: BRAND.muted,
    fontWeight: 700,
  },
  kvValue: {
    fontSize: 10,
    color: BRAND.slate,
  },

  // ===== University Card =====
  univCard: {
    backgroundColor: BRAND.card,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  univTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  univName: {
    fontSize: 13,
    fontWeight: 700,
    color: BRAND.navy,
    marginBottom: 3,
  },
  deptName: {
    fontSize: 10,
    color: BRAND.slate,
    marginBottom: 2,
  },
  formula: {
    fontSize: 8.5,
    color: BRAND.muted,
    marginTop: 3,
  },

  // Badge: View + Text를 분리해서 안정적으로
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 700,
  },
  badgeSafe: { backgroundColor: BRAND.safeBg, borderColor: '#BFDBFE' },
  badgeSafeText: { color: BRAND.safeText },
  badgeMatch: { backgroundColor: BRAND.matchBg, borderColor: '#BBF7D0' },
  badgeMatchText: { color: BRAND.matchText },
  badgeUp: { backgroundColor: BRAND.upBg, borderColor: '#FDE68A' },
  badgeUpText: { color: BRAND.upText },
  badgeDanger: { backgroundColor: BRAND.dangerBg, borderColor: '#FECACA' },
  badgeDangerText: { color: BRAND.dangerText },

  // ===== Score Table =====
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.bg,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  th: { fontSize: 9, color: BRAND.muted, fontWeight: 700 },
  colLabel: { width: '45%' },
  colValue: { width: '30%', textAlign: 'right' as const },
  colDiff: { width: '25%', textAlign: 'right' as const },

  tr: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
  },
  tdLabel: { width: '45%', fontSize: 9.5, color: BRAND.muted },
  tdValue: { width: '30%', fontSize: 10.5, fontWeight: 700, color: BRAND.slate, textAlign: 'right' as const },
  tdDiff: { width: '25%', fontSize: 9.5, textAlign: 'right' as const },
  diffPos: { color: '#0F766E' },
  diffNeg: { color: '#B91C1C' },

  // ===== Cutoffs =====
  cutoffs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cutoffBox: {
    width: '32%',
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: BRAND.bg,
  },
  cutoffLabel: { fontSize: 8.5, color: BRAND.muted, marginBottom: 4, fontWeight: 700 },
  cutoffValue: { fontSize: 11, fontWeight: 700 },

  // ===== Detail Blocks =====
  detailBlock: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  detailTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    color: BRAND.navy,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: { fontSize: 9, color: BRAND.muted, fontWeight: 700 },
  detailValue: { fontSize: 9.5, color: BRAND.slate },

  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: { fontSize: 10, fontWeight: 700, color: BRAND.navy },
  totalValue: { fontSize: 11, fontWeight: 700, color: BRAND.navy2 },

  // ===== Footer =====
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 42,
    right: 42,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    paddingTop: 8,
    fontSize: 8.5,
    color: BRAND.muted,
    textAlign: 'center',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 22,
    right: 42,
    fontSize: 8.5,
    color: BRAND.muted,
  },
});

interface PDFReportProps {
  student: Student;
  bookmarkedResults: AnalysisResult[];
  scoreDetails: Map<string, ScoreDetail>;
  generatedDate: string;
  scoreTable: ScoreTableData;
}

const PDFReport: React.FC<PDFReportProps> = ({ student, bookmarkedResults, scoreDetails, generatedDate, scoreTable }) => {
  // 백분위 계산 헬퍼 함수
  const getPercentile = (tableName: string, stdScore: number): number => {
    const table = scoreTable.tables[tableName];
    if (!table) {
      // 탐구 과목의 경우 'exp'라는 일반 표를 사용
      if (tableName !== '국어' && tableName !== '수학' && scoreTable.tables['exp']) {
        const fallbackEntry = scoreTable.tables['exp'][stdScore];
        return fallbackEntry ? fallbackEntry.pct : 0;
      }
      return 0;
    }
    return table[stdScore]?.pct || 0;
  };

  // 등급 계산 헬퍼 함수
  const getGrade = (tableName: string, stdScore: number): number => {
    const table = scoreTable.tables[tableName];
    if (!table) return 9;
    return table[stdScore]?.grade || 9;
  };

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'safe': return styles.badgeSafe;
      case 'match': return styles.badgeMatch;
      case 'upward': return styles.badgeUp;
      case 'danger': return styles.badgeDanger;
      default: return styles.badgeDanger;
    }
  };

  const getBadgeTextStyle = (status: string) => {
    switch (status) {
      case 'safe': return styles.badgeSafeText;
      case 'match': return styles.badgeMatchText;
      case 'upward': return styles.badgeUpText;
      case 'danger': return styles.badgeDangerText;
      default: return styles.badgeDangerText;
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
          <View style={styles.brandBar} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>2026학년도 대입 정시 상담 리포트</Text>
            <View style={styles.metaRight}>
              <Text style={styles.metaText}>생성일: {generatedDate}</Text>
              <Text style={styles.metaText}>송현여자고등학교</Text>
            </View>
          </View>
        </View>

        {/* Student Info */}
        <View style={styles.studentCard}>
          <Text style={styles.studentName}>
            {student.classNum && student.studentNum 
              ? `${student.classNum}-${student.studentNum} ${student.name}` 
              : student.name}
          </Text>
          {/* 성적 테이블 */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { width: '20%' }]}>과목</Text>
              <Text style={[styles.th, { width: '25%' }]}>선택과목</Text>
              <Text style={[styles.th, { width: '18%', textAlign: 'right' as const }]}>표준점수</Text>
              <Text style={[styles.th, { width: '18%', textAlign: 'right' as const }]}>백분위</Text>
              <Text style={[styles.th, { width: '19%', textAlign: 'right' as const }]}>등급</Text>
            </View>

            {/* 국어 */}
            <View style={styles.tr}>
              <Text style={[styles.tdLabel, { width: '20%' }]}>국어</Text>
              <Text style={[styles.tdLabel, { width: '25%' }]}>{student.subjectOptions?.kor || '미선택'}</Text>
              <Text style={[styles.tdValue, { width: '18%' }]}>{student.scores.kor}</Text>
              <Text style={[styles.tdValue, { width: '18%' }]}>{getPercentile('국어', student.scores.kor).toFixed(2)}</Text>
              <Text style={[styles.tdValue, { width: '19%' }]}>{getGrade('국어', student.scores.kor)}등급</Text>
            </View>

            {/* 수학 */}
            <View style={styles.tr}>
              <Text style={[styles.tdLabel, { width: '20%' }]}>수학</Text>
              <Text style={[styles.tdLabel, { width: '25%' }]}>{student.subjectOptions?.math || '미선택'}</Text>
              <Text style={[styles.tdValue, { width: '18%' }]}>{student.scores.math}</Text>
              <Text style={[styles.tdValue, { width: '18%' }]}>{getPercentile('수학', student.scores.math).toFixed(2)}</Text>
              <Text style={[styles.tdValue, { width: '19%' }]}>{getGrade('수학', student.scores.math)}등급</Text>
            </View>

            {/* 탐구1 */}
            {student.subjectOptions?.exp1 && (
              <View style={styles.tr}>
                <Text style={[styles.tdLabel, { width: '20%' }]}>탐구1</Text>
                <Text style={[styles.tdLabel, { width: '25%' }]}>{student.subjectOptions.exp1}</Text>
                <Text style={[styles.tdValue, { width: '18%' }]}>{student.scores.exp1}</Text>
                <Text style={[styles.tdValue, { width: '18%' }]}>{getPercentile(student.subjectOptions.exp1, student.scores.exp1).toFixed(2)}</Text>
                <Text style={[styles.tdValue, { width: '19%' }]}>{getGrade(student.subjectOptions.exp1, student.scores.exp1)}등급</Text>
              </View>
            )}

            {/* 탐구2 */}
            {student.subjectOptions?.exp2 && (
              <View style={styles.tr}>
                <Text style={[styles.tdLabel, { width: '20%' }]}>탐구2</Text>
                <Text style={[styles.tdLabel, { width: '25%' }]}>{student.subjectOptions.exp2}</Text>
                <Text style={[styles.tdValue, { width: '18%' }]}>{student.scores.exp2}</Text>
                <Text style={[styles.tdValue, { width: '18%' }]}>{getPercentile(student.subjectOptions.exp2, student.scores.exp2).toFixed(2)}</Text>
                <Text style={[styles.tdValue, { width: '19%' }]}>{getGrade(student.subjectOptions.exp2, student.scores.exp2)}등급</Text>
              </View>
            )}

            {/* 영어 */}
            <View style={styles.tr}>
              <Text style={[styles.tdLabel, { width: '20%' }]}>영어</Text>
              <Text style={[styles.tdLabel, { width: '25%' }]}>-</Text>
              <Text style={[styles.tdValue, { width: '18%' }]}>-</Text>
              <Text style={[styles.tdValue, { width: '18%' }]}>-</Text>
              <Text style={[styles.tdValue, { width: '19%' }]}>{student.scores.eng}등급</Text>
            </View>

            {/* 한국사 */}
            <View style={styles.tr}>
              <Text style={[styles.tdLabel, { width: '20%' }]}>한국사</Text>
              <Text style={[styles.tdLabel, { width: '25%' }]}>-</Text>
              <Text style={[styles.tdValue, { width: '18%' }]}>-</Text>
              <Text style={[styles.tdValue, { width: '18%' }]}>-</Text>
              <Text style={[styles.tdValue, { width: '19%' }]}>{student.scores.hist}등급</Text>
            </View>
          </View>
        </View>

        {/* Bookmarked Universities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>관심 대학 분석</Text>
          <Text style={styles.sectionSubtitle}>총 {bookmarkedResults.length}개 대학/학과</Text>


        <View style={styles.quoteBox} wrap={false}>
        <View style={styles.quoteAccent} />

        <View style={styles.quoteHeaderRow}>
          <Text style={styles.quoteTitle}>응원의 글</Text>
          <Text style={styles.quoteTag}>송현여자고등학교 진로진학부</Text>
        </View>

        {ENCOURAGEMENT.map((p, i) => (
          <Text key={i} style={[styles.quoteText, i < ENCOURAGEMENT.length - 1 ? styles.quoteParagraph : null]}>
            {p}
          </Text>
        ))}    
         </View>
          
          {bookmarkedResults.map((result, index) => {
            const detail = scoreDetails.get(`${result.univName}-${result.deptName}`);

            return (
              <View key={index} style={styles.univCard} wrap={false}>
                <View style={styles.univTopRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.univName}>{result.univName}</Text>
                    <Text style={styles.deptName}>{result.deptName}</Text>
                    <Text style={styles.formula}>적용 공식: {result.formulaLabel}</Text>
                  </View>

                  <View style={[styles.badge, getBadgeStyle(result.status)]}>
                    <Text style={[styles.badgeText, getBadgeTextStyle(result.status)]}>
                      {getStatusLabel(result.status)}
                    </Text>
                  </View>
                </View>

                {/* Score Comparison Table */}
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, styles.colLabel]}>지표</Text>
                    <Text style={[styles.th, styles.colValue]}>점수</Text>
                    <Text style={[styles.th, styles.colDiff]}>격차(%)</Text>
                  </View>

                  <View style={styles.tr}>
                    <Text style={styles.tdLabel}>내 환산 점수</Text>
                    <Text style={styles.tdValue}>{formatScore(result.myScore)}</Text>
                    <Text style={[styles.tdDiff, result.gapPercent >= 0 ? styles.diffPos : styles.diffNeg]}>
                      {result.gapPercent >= 0 ? '' : ''}{formatPercent(result.gapPercent)}
                    </Text>
                  </View>
                </View>

                {/* Cutoffs */}
                <View style={styles.cutoffs}>
                  <View style={styles.cutoffBox}>
                    <Text style={styles.cutoffLabel}>안정 기준</Text>
                    <Text style={[styles.cutoffValue, { color: BRAND.safeText }]}>{formatScore(result.safeCut)}</Text>
                  </View>
                  <View style={styles.cutoffBox}>
                    <Text style={styles.cutoffLabel}>소신 기준</Text>
                    <Text style={[styles.cutoffValue, { color: BRAND.matchText }]}>{formatScore(result.matchCut)}</Text>
                  </View>
                  <View style={styles.cutoffBox}>
                    <Text style={styles.cutoffLabel}>상향 기준</Text>
                    <Text style={[styles.cutoffValue, { color: BRAND.upText }]}>{formatScore(result.upwardCut)}</Text>
                  </View>
                </View>

                {/* Recruitment Info */}
                <View style={styles.detailBlock}>
                  <Text style={styles.detailTitle}>모집 정보</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>최종 모집 인원</Text>
                    <Text style={styles.detailValue}>{result.finalRecruitmentCount}명</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>최초 모집 인원</Text>
                    <Text style={styles.detailValue}>{result.initialRecruitmentCount}명</Text>
                  </View>
                  {result.earlyAdmissionCarryover > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>수시 이월</Text>
                      <Text style={styles.detailValue}>{result.earlyAdmissionCarryover}명</Text>
                    </View>
                  )}
                  {result.lastYearCompetitionRate > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>전년도 경쟁률</Text>
                      <Text style={styles.detailValue}>{result.lastYearCompetitionRate.toFixed(2)}:1</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>군</Text>
                    <Text style={styles.detailValue}>{result.group}</Text>
                  </View>
                </View>

                {/* Score Detail */}
                {detail && (
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailTitle}>점수 상세 내역</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>국어</Text>
                      <Text style={styles.detailValue}>{formatScore(detail.kor.raw)} × {detail.kor.weight} = {formatScore(detail.kor.calc)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>수학</Text>
                      <Text style={styles.detailValue}>{formatScore(detail.math.raw)} × {detail.math.weight} = {formatScore(detail.math.calc)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>탐구</Text>
                      <Text style={styles.detailValue}>{formatScore(detail.exp.raw)} × {detail.exp.weight} = {formatScore(detail.exp.calc)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>영어</Text>
                      <Text style={styles.detailValue}>{detail.eng.grade}등급 = {formatScore(detail.eng.score)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>한국사</Text>
                      <Text style={styles.detailValue}>{detail.hist.grade}등급 = {formatScore(detail.hist.score)}</Text>
                    </View>

                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>최종 환산 점수</Text>
                      <Text style={styles.totalValue}>{formatScore(detail.total)}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Jeongsi Counselor 2026 · 본 리포트는 입력된 성적 및 기준 데이터에 기반한 참고 자료입니다.
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

