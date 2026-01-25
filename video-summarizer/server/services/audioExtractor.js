const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const TEMP_DIR = process.env.TEMP_DIR || './temp';

/**
 * ffmpeg를 사용하여 영상/오디오 파일에서 음성 추출
 * Whisper API는 mp3, mp4, mpeg, mpga, m4a, wav, webm 지원
 */
async function extract(inputPath) {
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(TEMP_DIR, `${baseName}_audio.mp3`);

  // 이미 오디오 파일인 경우 그대로 반환
  const ext = path.extname(inputPath).toLowerCase();
  if (['.mp3', '.m4a', '.wav', '.webm'].includes(ext)) {
    console.log('이미 오디오 파일입니다:', inputPath);
    return inputPath;
  }

  return new Promise((resolve, reject) => {
    const args = [
      '-i', inputPath,
      '-vn',                    // 비디오 제거
      '-acodec', 'libmp3lame',  // MP3 코덱
      '-ab', '128k',            // 비트레이트
      '-ar', '16000',           // 샘플레이트 (Whisper 최적)
      '-ac', '1',               // 모노
      '-y',                     // 덮어쓰기
      outputPath
    ];

    console.log('ffmpeg 실행:', 'ffmpeg', args.join(' '));

    const process = spawn('ffmpeg', args);

    let stderr = '';

    process.stderr.on('data', (data) => {
      stderr += data.toString();
      // ffmpeg는 진행 상황을 stderr로 출력
      const progress = parseProgress(data.toString());
      if (progress) {
        console.log('변환 진행:', progress);
      }
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`음성 추출 실패: ${stderr.slice(-500)}`));
        return;
      }

      if (!fs.existsSync(outputPath)) {
        reject(new Error('음성 파일이 생성되지 않았습니다.'));
        return;
      }

      console.log('음성 추출 완료:', outputPath);
      resolve(outputPath);
    });

    process.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error('ffmpeg가 설치되어 있지 않습니다. "apt install ffmpeg" 또는 "brew install ffmpeg"로 설치해주세요.'));
      } else {
        reject(err);
      }
    });
  });
}

/**
 * 오디오 파일 정보 가져오기
 */
async function getAudioInfo(filePath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-i', filePath,
      '-hide_banner',
      '-f', 'null',
      '-'
    ];

    const process = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath
    ]);

    let stdout = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.on('close', (code) => {
      try {
        const info = JSON.parse(stdout);
        resolve({
          duration: parseFloat(info.format?.duration || 0),
          size: parseInt(info.format?.size || 0),
          bitrate: parseInt(info.format?.bit_rate || 0)
        });
      } catch (e) {
        resolve({ duration: 0, size: 0, bitrate: 0 });
      }
    });

    process.on('error', () => {
      resolve({ duration: 0, size: 0, bitrate: 0 });
    });
  });
}

/**
 * ffmpeg 진행 상황 파싱
 */
function parseProgress(output) {
  const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const seconds = parseInt(timeMatch[3]);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return null;
}

/**
 * 임시 파일 삭제
 */
async function cleanup(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('오디오 파일 삭제:', filePath);
    }
  } catch (error) {
    console.error('파일 삭제 실패:', error);
  }
}

module.exports = {
  extract,
  getAudioInfo,
  cleanup
};
