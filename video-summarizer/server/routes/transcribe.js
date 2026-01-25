const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const videoDownloader = require('../services/videoDownloader');
const audioExtractor = require('../services/audioExtractor');
const transcriber = require('../services/transcriber');
const summarizer = require('../services/summarizer');

// 작업 상태 저장소
const jobs = new Map();

/**
 * POST /api/transcribe
 * 영상 URL을 받아 음성 추출, 텍스트 변환, 요약을 수행
 */
router.post('/transcribe', async (req, res) => {
  const { url, language, summaryLanguage } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: '영상 URL을 입력해주세요.'
    });
  }

  const jobId = uuidv4();

  // 작업 상태 초기화
  jobs.set(jobId, {
    status: 'processing',
    progress: 0,
    step: '영상 정보 확인 중...',
    startedAt: new Date().toISOString()
  });

  // 비동기로 처리 시작
  processVideo(jobId, url, language, summaryLanguage);

  res.json({
    success: true,
    jobId,
    message: '처리가 시작되었습니다. 작업 ID로 상태를 확인하세요.'
  });
});

/**
 * GET /api/status/:jobId
 * 작업 상태 확인
 */
router.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: '작업을 찾을 수 없습니다.'
    });
  }

  res.json({
    success: true,
    ...job
  });
});

/**
 * POST /api/transcribe/sync
 * 동기 방식 - 결과를 바로 반환 (짧은 영상용)
 */
router.post('/transcribe/sync', async (req, res) => {
  const { url, language = 'auto', summaryLanguage = 'ko' } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: '영상 URL을 입력해주세요.'
    });
  }

  try {
    // 1. 영상 다운로드
    console.log('📥 영상 다운로드 중...');
    const videoInfo = await videoDownloader.download(url);

    // 2. 음성 추출
    console.log('🎵 음성 추출 중...');
    const audioPath = await audioExtractor.extract(videoInfo.filePath);

    // 3. 음성을 텍스트로 변환
    console.log('📝 텍스트 변환 중...');
    const transcription = await transcriber.transcribe(audioPath, language);

    // 4. 텍스트 요약
    console.log('📋 요약 생성 중...');
    const summary = await summarizer.summarize(transcription.text, summaryLanguage);

    // 5. 임시 파일 정리
    await videoDownloader.cleanup(videoInfo.filePath);
    await audioExtractor.cleanup(audioPath);

    res.json({
      success: true,
      data: {
        videoInfo: {
          title: videoInfo.title,
          duration: videoInfo.duration,
          thumbnail: videoInfo.thumbnail
        },
        transcription: {
          text: transcription.text,
          language: transcription.detectedLanguage,
          segments: transcription.segments
        },
        summary: {
          text: summary.text,
          keyPoints: summary.keyPoints,
          language: summaryLanguage
        }
      }
    });

  } catch (error) {
    console.error('처리 중 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message || '처리 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 비동기 영상 처리 함수
 */
async function processVideo(jobId, url, language = 'auto', summaryLanguage = 'ko') {
  try {
    // 1. 영상 다운로드
    updateJob(jobId, { progress: 10, step: '영상 다운로드 중...' });
    const videoInfo = await videoDownloader.download(url);

    // 2. 음성 추출
    updateJob(jobId, { progress: 30, step: '음성 추출 중...' });
    const audioPath = await audioExtractor.extract(videoInfo.filePath);

    // 3. 음성을 텍스트로 변환
    updateJob(jobId, { progress: 50, step: '텍스트 변환 중 (Whisper)...' });
    const transcription = await transcriber.transcribe(audioPath, language);

    // 4. 텍스트 요약
    updateJob(jobId, { progress: 80, step: '요약 생성 중...' });
    const summary = await summarizer.summarize(transcription.text, summaryLanguage);

    // 5. 정리
    updateJob(jobId, { progress: 95, step: '임시 파일 정리 중...' });
    await videoDownloader.cleanup(videoInfo.filePath);
    await audioExtractor.cleanup(audioPath);

    // 완료
    updateJob(jobId, {
      status: 'completed',
      progress: 100,
      step: '완료',
      completedAt: new Date().toISOString(),
      result: {
        videoInfo: {
          title: videoInfo.title,
          duration: videoInfo.duration,
          thumbnail: videoInfo.thumbnail
        },
        transcription: {
          text: transcription.text,
          language: transcription.detectedLanguage,
          segments: transcription.segments
        },
        summary: {
          text: summary.text,
          keyPoints: summary.keyPoints,
          language: summaryLanguage
        }
      }
    });

  } catch (error) {
    console.error('처리 중 오류:', error);
    updateJob(jobId, {
      status: 'failed',
      error: error.message || '처리 중 오류가 발생했습니다.',
      failedAt: new Date().toISOString()
    });
  }
}

function updateJob(jobId, updates) {
  const job = jobs.get(jobId);
  if (job) {
    jobs.set(jobId, { ...job, ...updates });
  }
}

module.exports = router;
