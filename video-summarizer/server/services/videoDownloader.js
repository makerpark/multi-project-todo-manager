const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = process.env.TEMP_DIR || './temp';

/**
 * yt-dlp를 사용하여 영상 다운로드
 */
async function download(url) {
  const videoId = uuidv4();
  const outputPath = path.join(TEMP_DIR, `${videoId}.%(ext)s`);
  const finalPath = path.join(TEMP_DIR, `${videoId}.mp4`);

  // 먼저 영상 정보 가져오기
  const info = await getVideoInfo(url);

  return new Promise((resolve, reject) => {
    const args = [
      '-f', 'bestaudio[ext=m4a]/bestaudio/best',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '-o', path.join(TEMP_DIR, `${videoId}.%(ext)s`),
      '--no-playlist',
      '--max-filesize', '500M',
      url
    ];

    console.log('yt-dlp 실행:', 'yt-dlp', args.join(' '));

    const process = spawn('yt-dlp', args);

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('yt-dlp:', data.toString().trim());
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('yt-dlp stderr:', data.toString().trim());
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`영상 다운로드 실패: ${stderr || '알 수 없는 오류'}`));
        return;
      }

      // 다운로드된 파일 찾기
      const files = fs.readdirSync(TEMP_DIR).filter(f => f.startsWith(videoId));
      if (files.length === 0) {
        reject(new Error('다운로드된 파일을 찾을 수 없습니다.'));
        return;
      }

      const downloadedFile = path.join(TEMP_DIR, files[0]);

      resolve({
        filePath: downloadedFile,
        title: info.title,
        duration: info.duration,
        thumbnail: info.thumbnail,
        videoId
      });
    });

    process.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error('yt-dlp가 설치되어 있지 않습니다. "pip install yt-dlp" 또는 "brew install yt-dlp"로 설치해주세요.'));
      } else {
        reject(err);
      }
    });
  });
}

/**
 * 영상 정보 가져오기
 */
async function getVideoInfo(url) {
  return new Promise((resolve, reject) => {
    const args = [
      '--dump-json',
      '--no-playlist',
      url
    ];

    const process = spawn('yt-dlp', args);

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`영상 정보를 가져올 수 없습니다: ${stderr}`));
        return;
      }

      try {
        const info = JSON.parse(stdout);
        resolve({
          title: info.title || '제목 없음',
          duration: info.duration || 0,
          thumbnail: info.thumbnail || null,
          description: info.description || '',
          uploader: info.uploader || ''
        });
      } catch (e) {
        reject(new Error('영상 정보 파싱 실패'));
      }
    });

    process.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error('yt-dlp가 설치되어 있지 않습니다.'));
      } else {
        reject(err);
      }
    });
  });
}

/**
 * 임시 파일 삭제
 */
async function cleanup(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('임시 파일 삭제:', filePath);
    }
  } catch (error) {
    console.error('파일 삭제 실패:', error);
  }
}

module.exports = {
  download,
  getVideoInfo,
  cleanup
};
