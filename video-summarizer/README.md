# 영상 음성 추출 및 요약 (Video Transcription & Summary)

영상 링크를 입력하면 음성을 추출하고, 텍스트로 변환한 후 요약해주는 애플리케이션입니다.

## 주요 기능

- **영상 다운로드**: YouTube, Vimeo 등 다양한 플랫폼 지원 (yt-dlp)
- **음성 추출**: 영상에서 오디오 트랙 추출 (ffmpeg)
- **음성→텍스트 변환**: OpenAI Whisper API로 다국어 음성 인식
- **AI 요약**: GPT를 활용한 내용 요약 및 핵심 포인트 추출
- **다국어 지원**: 한국어, 영어, 일본어, 중국어 등

## 시스템 요구사항

### 필수 설치 도구

1. **Node.js** (v18 이상)
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **yt-dlp** (영상 다운로드)
   ```bash
   # pip로 설치
   pip install yt-dlp

   # 또는 brew (macOS)
   brew install yt-dlp
   ```

3. **ffmpeg** (음성 추출)
   ```bash
   # Ubuntu/Debian
   sudo apt install ffmpeg

   # macOS
   brew install ffmpeg
   ```

## 설치 및 실행

### 1. 의존성 설치

```bash
cd video-summarizer
npm install
```

### 2. 환경 변수 설정

```bash
# .env.example을 복사하여 .env 파일 생성
cp .env.example .env

# .env 파일을 열고 OpenAI API 키 입력
OPENAI_API_KEY=sk-your-api-key-here
```

### 3. 서버 실행

```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 또는 일반 실행
npm start
```

서버가 `http://localhost:3001`에서 실행됩니다.

### 4. 클라이언트 실행

```bash
# 별도 터미널에서
npx serve client -p 3000
```

브라우저에서 `http://localhost:3000` 접속

## API 엔드포인트

### POST /api/transcribe

비동기 처리 - 작업 ID 반환

```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "language": "auto",
  "summaryLanguage": "ko"
}
```

응답:
```json
{
  "success": true,
  "jobId": "uuid-here",
  "message": "처리가 시작되었습니다."
}
```

### GET /api/status/:jobId

작업 상태 확인

응답:
```json
{
  "success": true,
  "status": "processing",
  "progress": 50,
  "step": "텍스트 변환 중..."
}
```

완료 시:
```json
{
  "success": true,
  "status": "completed",
  "result": {
    "videoInfo": { "title": "...", "duration": 300 },
    "transcription": { "text": "...", "language": "ko" },
    "summary": { "text": "...", "keyPoints": [...] }
  }
}
```

### POST /api/transcribe/sync

동기 처리 - 결과 즉시 반환 (짧은 영상용)

## 지원 언어

### 음성 인식 (Whisper)
- 자동 감지, 한국어, 영어, 일본어, 중국어, 스페인어, 프랑스어, 독일어 등 50+ 언어

### 요약 언어
- 한국어, English, 日本語, 中文

## 제한 사항

- 최대 영상 길이: 1시간 (설정 변경 가능)
- 최대 파일 크기: 500MB
- Whisper API 제한: 25MB (자동 분할 처리)

## 프로젝트 구조

```
video-summarizer/
├── server/
│   ├── index.js              # Express 서버 진입점
│   ├── routes/
│   │   └── transcribe.js     # API 라우트
│   └── services/
│       ├── videoDownloader.js  # yt-dlp 영상 다운로드
│       ├── audioExtractor.js   # ffmpeg 음성 추출
│       ├── transcriber.js      # Whisper API 연동
│       └── summarizer.js       # GPT 요약
├── client/
│   └── index.html            # React 프론트엔드
├── package.json
├── .env.example
└── README.md
```

## 라이선스

MIT License
