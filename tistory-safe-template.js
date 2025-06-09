/**
 * 티스토리 안전 HTML 템플릿
 * 기본 모드/HTML 모드 모두 호환
 * 기본 HTML 태그만 사용 (div, style, script 등 제외)
 */

/**
 * 티스토리 안전 HTML 템플릿 생성
 * @param {Object} article - 기사 정보
 * @param {string} fullContent - 전체 기사 내용
 * @returns {string} 티스토리 호환 HTML
 */
function createTistorySafeTemplate(article, fullContent) {
  // 콘텐츠를 문단으로 분할 (최대 8개)
  const paragraphs = fullContent
    .split('\n\n')
    .filter(p => p.trim().length > 50)
    .slice(0, 8);

  // 주요 인사이트 추출 (문단에서 핵심 문장들)
  const insights = paragraphs
    .slice(0, 3)
    .map(p => p.split('.')[0] + '.')
    .filter(insight => insight.length > 30 && insight.length < 150);

  return `<h1>${article.title}</h1>

<p><strong>📅 발행일:</strong> ${new Date(article.pubDate).toLocaleDateString('ko-KR')}</p>
<p><strong>🔗 원문:</strong> <a href="${article.link}" target="_blank">Nielsen Norman Group 기사 보기</a></p>

${article.description ? `
<h2>💡 핵심 요약</h2>
<p><em>${article.description}</em></p>
` : ''}

<h2>📖 주요 내용</h2>
${paragraphs.map(paragraph => `<p>${paragraph.trim()}</p>`).join('\n')}

${insights.length > 0 ? `
<h2>✨ 핵심 인사이트</h2>
<ul>
${insights.map(insight => `  <li>${insight.trim()}</li>`).join('\n')}
</ul>
` : ''}

<h2>🎯 실무 적용 포인트</h2>
<ul>
  <li><strong>디자이너:</strong> 전략적 사고와 스토리텔링 역량 강화</li>
  <li><strong>PM:</strong> 데이턄 기반 의사결정과 사용자 중심 접근</li>
  <li><strong>팀:</strong> AI를 도구로 활용하되 인간의 판단력 유지</li>
</ul>

<h2>📚 관련 학습 자료</h2>
<p>
  <strong>더 많은 UX 인사이트:</strong><br/>
  • <a href="https://www.nngroup.com" target="_blank">Nielsen Norman Group 웹사이트</a><br/>
  • UX 디자인 원칙과 방법론<br/>
  • 사용자 리서치 베스트 프랙티스
</p>

<hr />

<p><em>이 글은 Nielsen Norman Group의 최신 연구를 바탕으로 작성되었습니다.</em></p>`;
}

/**
 * 간단한 티스토리 템플릿 (최소한의 구조)
 */
function createSimpleTistoryTemplate(article, fullContent) {
  const paragraphs = fullContent
    .split('\n\n')
    .filter(p => p.trim().length > 30)
    .slice(0, 5);

  return `<h1>${article.title}</h1>

<p><strong>원문:</strong> <a href="${article.link}" target="_blank">기사 원문 보기</a></p>

${article.description ? `<p><em>${article.description}</em></p>` : ''}

<h2>주요 내용</h2>
${paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n')}

<h2>핵심 포인트</h2>
<ul>
  <li>AI 시대 디자이너의 역할 변화</li>
  <li>전략적 사고의 중요성</li>
  <li>데이터 해석 능력 필요</li>
</ul>

<p><strong>출처:</strong> Nielsen Norman Group</p>`;
}

module.exports = {
  createTistorySafeTemplate,
  createSimpleTistoryTemplate
}; 