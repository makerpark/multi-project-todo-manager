const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 지원 언어 목록
const SUPPORTED_LANGUAGES = {
  'auto': '자동 감지',
  'ko': '한국어',
  'en': '영어',
  'ja': '일본어',
  'zh': '중국어',
  'es': '스페인어',
  'fr': '프랑스어',
  'de': '독일어',
  'pt': '포르투갈어',
  'ru': '러시아어',
  'ar': '아랍어',
  'hi': '힌디어',
  'it': '이탈리아어',
  'vi': '베트남어',
  'th': '태국어'
};

/**
 * OpenAI Whisper API를 사용하여 음성을 텍스트로 변환
 *
 * @param {string} audioPath - 오디오 파일 경로
 * @param {string} language - 언어 코드 ('auto'면 자동 감지)
 * @returns {Object} 변환 결과 { text, detectedLanguage, segments }
 */
async function transcribe(audioPath, language = 'auto') {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.');
  }

  // 파일 크기 확인 (Whisper API 제한: 25MB)
  const stats = fs.statSync(audioPath);
  const fileSizeMB = stats.size / (1024 * 1024);

  if (fileSizeMB > 25) {
    console.log(`파일 크기가 ${fileSizeMB.toFixed(2)}MB입니다. 청크 분할이 필요할 수 있습니다.`);
    return await transcribeLargeFile(audioPath, language);
  }

  console.log(`Whisper API 호출 중... (파일: ${path.basename(audioPath)}, 크기: ${fileSizeMB.toFixed(2)}MB)`);

  const transcriptionParams = {
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment']
  };

  // 언어가 지정된 경우에만 language 파라미터 추가
  if (language !== 'auto' && SUPPORTED_LANGUAGES[language]) {
    transcriptionParams.language = language;
  }

  try {
    const response = await openai.audio.transcriptions.create(transcriptionParams);

    console.log('Whisper 변환 완료. 감지된 언어:', response.language);

    return {
      text: response.text,
      detectedLanguage: response.language,
      duration: response.duration,
      segments: response.segments?.map(seg => ({
        start: seg.start,
        end: seg.end,
        text: seg.text
      })) || []
    };
  } catch (error) {
    console.error('Whisper API 오류:', error);
    throw new Error(`음성 변환 실패: ${error.message}`);
  }
}

/**
 * 25MB 이상의 큰 파일을 청크로 나눠서 처리
 */
async function transcribeLargeFile(audioPath, language) {
  // 큰 파일의 경우 ffmpeg로 분할하여 처리
  const { spawn } = require('child_process');
  const { v4: uuidv4 } = require('uuid');

  const TEMP_DIR = process.env.TEMP_DIR || './temp';
  const chunkPrefix = path.join(TEMP_DIR, `chunk_${uuidv4()}`);

  // 10분 단위로 분할
  const chunkDuration = 600; // 10분

  return new Promise((resolve, reject) => {
    const args = [
      '-i', audioPath,
      '-f', 'segment',
      '-segment_time', chunkDuration.toString(),
      '-c', 'copy',
      `${chunkPrefix}_%03d.mp3`
    ];

    const ffmpeg = spawn('ffmpeg', args);

    ffmpeg.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error('오디오 분할 실패'));
        return;
      }

      try {
        // 생성된 청크 파일들 찾기
        const files = fs.readdirSync(TEMP_DIR)
          .filter(f => f.startsWith(path.basename(chunkPrefix)))
          .sort();

        console.log(`${files.length}개의 청크로 분할됨`);

        let fullText = '';
        let allSegments = [];
        let detectedLanguage = '';
        let timeOffset = 0;

        // 각 청크 처리
        for (let i = 0; i < files.length; i++) {
          const chunkPath = path.join(TEMP_DIR, files[i]);
          console.log(`청크 ${i + 1}/${files.length} 처리 중...`);

          const result = await transcribe(chunkPath, language);

          fullText += result.text + ' ';
          detectedLanguage = result.detectedLanguage;

          // 세그먼트 타임스탬프 조정
          const adjustedSegments = result.segments.map(seg => ({
            start: seg.start + timeOffset,
            end: seg.end + timeOffset,
            text: seg.text
          }));
          allSegments = allSegments.concat(adjustedSegments);

          timeOffset += result.duration || chunkDuration;

          // 청크 파일 삭제
          fs.unlinkSync(chunkPath);
        }

        resolve({
          text: fullText.trim(),
          detectedLanguage,
          segments: allSegments
        });

      } catch (error) {
        reject(error);
      }
    });

    ffmpeg.on('error', (err) => {
      reject(new Error(`ffmpeg 오류: ${err.message}`));
    });
  });
}

/**
 * 지원 언어 목록 반환
 */
function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}

module.exports = {
  transcribe,
  getSupportedLanguages,
  SUPPORTED_LANGUAGES
};
