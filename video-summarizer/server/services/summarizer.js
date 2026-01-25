const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 요약 언어 설정
const SUMMARY_LANGUAGES = {
  'ko': {
    name: '한국어',
    systemPrompt: `당신은 전문적인 내용 분석가입니다. 주어진 텍스트를 한국어로 요약해주세요.
다음 형식으로 응답해주세요:
1. 전체 요약 (3-5문장)
2. 핵심 포인트 (불릿 포인트 5개 이내)
3. 주요 키워드 (5개 이내)`,
    userPrompt: '다음 영상 스크립트를 분석하고 요약해주세요:'
  },
  'en': {
    name: 'English',
    systemPrompt: `You are a professional content analyst. Summarize the given text in English.
Please respond in the following format:
1. Overall Summary (3-5 sentences)
2. Key Points (up to 5 bullet points)
3. Main Keywords (up to 5)`,
    userPrompt: 'Please analyze and summarize the following video transcript:'
  },
  'ja': {
    name: '日本語',
    systemPrompt: `あなたはプロのコンテンツアナリストです。与えられたテキストを日本語で要約してください。
次の形式で回答してください：
1. 全体の要約（3〜5文）
2. 重要なポイント（5つ以内の箇条書き）
3. 主要キーワード（5つ以内）`,
    userPrompt: '次のビデオスクリプトを分析し、要約してください：'
  },
  'zh': {
    name: '中文',
    systemPrompt: `您是专业的内容分析师。请用中文总结给定的文本。
请按以下格式回复：
1. 整体摘要（3-5句话）
2. 要点（最多5个要点）
3. 主要关键词（最多5个）`,
    userPrompt: '请分析并总结以下视频脚本：'
  }
};

/**
 * GPT를 사용하여 텍스트 요약
 *
 * @param {string} text - 요약할 텍스트
 * @param {string} language - 요약 언어 ('ko', 'en', 'ja', 'zh')
 * @returns {Object} 요약 결과 { text, keyPoints }
 */
async function summarize(text, language = 'ko') {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
  }

  const langConfig = SUMMARY_LANGUAGES[language] || SUMMARY_LANGUAGES['ko'];

  // 텍스트가 너무 길면 청크로 나누어 처리
  const MAX_TOKENS = 12000; // GPT-4 토큰 제한 고려
  const estimatedTokens = text.length / 4; // 대략적인 토큰 수 추정

  if (estimatedTokens > MAX_TOKENS) {
    console.log('텍스트가 길어 청크 단위로 요약합니다.');
    return await summarizeLongText(text, language);
  }

  console.log(`GPT 요약 생성 중... (언어: ${langConfig.name})`);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: langConfig.systemPrompt
        },
        {
          role: 'user',
          content: `${langConfig.userPrompt}\n\n${text}`
        }
      ],
      temperature: 0.5,
      max_tokens: 2000
    });

    const summaryText = response.choices[0].message.content;

    // 요약 텍스트에서 핵심 포인트 추출
    const keyPoints = extractKeyPoints(summaryText, language);

    return {
      text: summaryText,
      keyPoints,
      language: langConfig.name,
      model: 'gpt-4o-mini'
    };

  } catch (error) {
    console.error('GPT 요약 오류:', error);
    throw new Error(`요약 생성 실패: ${error.message}`);
  }
}

/**
 * 긴 텍스트를 청크로 나누어 요약
 */
async function summarizeLongText(text, language) {
  const langConfig = SUMMARY_LANGUAGES[language] || SUMMARY_LANGUAGES['ko'];
  const CHUNK_SIZE = 8000; // 문자 기준

  // 텍스트를 청크로 분할
  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }

  console.log(`${chunks.length}개의 청크로 분할하여 요약합니다.`);

  // 각 청크 요약
  const chunkSummaries = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`청크 ${i + 1}/${chunks.length} 요약 중...`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '주어진 텍스트의 핵심 내용을 간단히 요약해주세요.'
        },
        {
          role: 'user',
          content: chunks[i]
        }
      ],
      temperature: 0.5,
      max_tokens: 500
    });

    chunkSummaries.push(response.choices[0].message.content);
  }

  // 청크 요약들을 합쳐서 최종 요약
  const combinedSummary = chunkSummaries.join('\n\n');

  console.log('최종 요약 생성 중...');

  const finalResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: langConfig.systemPrompt
      },
      {
        role: 'user',
        content: `${langConfig.userPrompt}\n\n${combinedSummary}`
      }
    ],
    temperature: 0.5,
    max_tokens: 2000
  });

  const summaryText = finalResponse.choices[0].message.content;
  const keyPoints = extractKeyPoints(summaryText, language);

  return {
    text: summaryText,
    keyPoints,
    language: langConfig.name,
    model: 'gpt-4o-mini',
    chunksProcessed: chunks.length
  };
}

/**
 * 요약 텍스트에서 핵심 포인트 추출
 */
function extractKeyPoints(summaryText, language) {
  const lines = summaryText.split('\n');
  const keyPoints = [];

  let inKeyPointsSection = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 핵심 포인트 섹션 감지
    if (trimmedLine.includes('핵심 포인트') ||
        trimmedLine.includes('Key Points') ||
        trimmedLine.includes('重要なポイント') ||
        trimmedLine.includes('要点')) {
      inKeyPointsSection = true;
      continue;
    }

    // 다음 섹션 시작 감지
    if (inKeyPointsSection && (
        trimmedLine.includes('키워드') ||
        trimmedLine.includes('Keywords') ||
        trimmedLine.includes('キーワード') ||
        trimmedLine.includes('关键词') ||
        trimmedLine.match(/^\d+\.\s*(주요|Main|主要)/))) {
      break;
    }

    // 불릿 포인트 추출
    if (inKeyPointsSection && (
        trimmedLine.startsWith('-') ||
        trimmedLine.startsWith('•') ||
        trimmedLine.startsWith('*') ||
        trimmedLine.match(/^[\d]+\./))) {
      const point = trimmedLine.replace(/^[-•*\d.]\s*/, '').trim();
      if (point) {
        keyPoints.push(point);
      }
    }
  }

  return keyPoints;
}

/**
 * 지원 언어 목록 반환
 */
function getSupportedLanguages() {
  return Object.entries(SUMMARY_LANGUAGES).map(([code, config]) => ({
    code,
    name: config.name
  }));
}

module.exports = {
  summarize,
  getSupportedLanguages,
  SUMMARY_LANGUAGES
};
