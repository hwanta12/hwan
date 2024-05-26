const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

// 업로드된 파일의 저장 위치 설정
const uploadDirectory = path.join(__dirname, 'uploads');
const mainFilesDirectory = path.join(uploadDirectory, 'mainFiles');

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}

if (!fs.existsSync(mainFilesDirectory)) {
  fs.mkdirSync(mainFilesDirectory);
}

// 데이터베이스 파일 경로
const dbPath = path.join(__dirname, 'db.json');

// 히스토리 데이터 로드
let history = [];
if (fs.existsSync(dbPath)) {
  const data = fs.readFileSync(dbPath, 'utf8');
  history = JSON.parse(data);
}

// 업로드된 파일의 저장 위치와 이름 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const fileId = uuidv4(); // 파일마다 고유한 ID 생성
    const extension = path.extname(file.originalname);
    cb(null, fileId + extension);
  }
});

const mainStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, mainFilesDirectory);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /mp4|avi|mpeg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb("Error: File upload only supports the following filetypes - " + filetypes);
  }
});

const uploadMain = multer({
  storage: mainStorage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpg|jpeg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb("Error: File upload only supports the following filetypes - " + filetypes);
  }
});

// 홈 페이지
app.get('/', (req, res) => {
  res.send(`
    <html>
    <head>
      <title>볼링자세 분석</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 800px;
          margin: 20px auto;
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        h1 {
          text-align: center;
        }
        form {
          margin-bottom: 20px;
        }
        input[type="file"] {
          margin-bottom: 10px;
        }
        button {
          padding: 10px 20px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background-color: #45a049;
        }
        .home-btn {
          display: block;
          text-align: center;
          margin-top: 20px;
          text-decoration: none;
          background-color: #008CBA;
          color: white;
          padding: 10px 20px;
          border-radius: 4px;
        }
        .home-btn:hover {
          background-color: #005580;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>볼링자세 분석</h1>
        <form action="/analyze" method="post" enctype="multipart/form-data">
          <input type="file" name="video" accept=".mp4, .avi, .mpeg">
          <input type="text" name="userId" placeholder="회원 ID">
          <button type="submit">분석하기</button>
        </form>
        <form action="/upload-main" method="post" enctype="multipart/form-data">
          <input type="file" name="mainFiles" accept=".jpg, .jpeg, .png" multiple>
          <button type="submit">메인 파일 업로드</button>
        </form>
        <a href="/history" class="home-btn">업로드 히스토리</a>
      </div>
    </body>
    </html>
  `);
});

// 메인 파일 업로드 엔드포인트
app.post('/upload-main', uploadMain.array('mainFiles', 30), (req, res) => {
  if (req.files) {
    res.json({ message: 'Main files uploaded successfully', files: req.files });
  } else {
    res.status(400).json({ message: 'Failed to upload main files' });
  }
});

// 사용자 파일 업로드 엔드포인트
app.post('/analyze', upload.single('video'), (req, res) => {
  if (!req.file) { // 파일이 첨부되지 않았을 경우
    return res.send(`
      <html>
      <head>
        <title>파일 첨부 필요</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 8px;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          h1 {
            text-align: center;
            color: #333;
          }
          .home-btn {
            display: block;
            text-align: center;
            margin-top: 20px;
            background-color: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            text-decoration: none;
          }
          .home-btn:hover {
            background-color: #218838;
          }
        </style>
        <script type="text/javascript">
          alert("영상 파일을 첨부해주세요.");
          window.close;
        </script>
      </head>
      <body>
        <div class="container">
          <h1>파일 첨부 오류</h1>
          <p>분석을 위해 영상 파일을 첨부해야 합니다. 그동안 업로드 한 영상을 보시려면 업로드 히스토리 메뉴를 이용해주세요.</p>
          <a href="/" class="home-btn">HOME으로 돌아가기</a>
        </div>
      </body>
      </html>
    `);
  }

  const uploadTime = new Date().toLocaleString();
  const fileSize = (req.file.size / 1024).toFixed(2) + ' KB';
  const userId = req.body.userId; // 회원 ID 입력 받기

  const videoData = {
    uploadTime: uploadTime,
    fileName: req.file.filename,
    fileSize: fileSize,
    userId: userId,
    videoPath: path.join('uploads/', req.file.filename)
  };

  // 히스토리에 업로드 정보 추가
  history.push(videoData);
  fs.writeFileSync(dbPath, JSON.stringify(history, null, 2));

  // Python 스크립트의 실행
  const mainFilePaths = fs.readdirSync(mainFilesDirectory).map(file => path.join(mainFilesDirectory, file)); // 메인 파일들 경로
  const userFilePath = videoData.videoPath;
  const command = `python compare_videos.py ${mainFilePaths.join(' ')} ${userFilePath}`; // 비교를 위한 Python 스크립트 명령어

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send('분석 중 오류가 발생했습니다.');
    }

    const analysisResult = {
      status: "Success",
      message: stdout
    };
    videoData.analysisResult = analysisResult;
    fs.writeFileSync(dbPath, JSON.stringify(history, null, 2)); // 결과 업데이트

    // 사용자 파일 삭제
    fs.unlinkSync(userFilePath);

    res.send(`
      <html>
      <head>
        <title>분석 완료</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 8px;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          h1 {
            text-align: center;
            color: #333;
          }
          p {
            text-align: center;
          }
          .home-btn {
            display: block;
            width: 200px;
            margin: 20px auto;
            background-color: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            text-align: center;
            text-decoration: none;
          }
          .home-btn:hover {
            background-color: #218838;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>분석이 완료되었습니다.</h1>
          <p>분석 결과가 성공적으로 저장되었습니다.</p>
          <a href="/" class="home-btn">HOME으로 돌아가기</a>
        </div>
      </body>
      </html>
    `);
  });
});

// 회원별 히스토리 조회 페이지
app.get('/viewHistory', (req, res) => {
  const userId = req.query.userId;
  const filteredHistory = history.filter(video => video.userId === userId);

  let historyHtml = `
    <html>
    <head>
      <title>회원별 업로드 히스토리</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 800px;
          margin: 20px auto;
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 8px;
          background-color: #fff;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
          text-align: center;
          color: #333;
        }
        ul {
          list-style-type: none;
          padding: 0;
        }
        li {
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #ccc;
        }
        a {
          color: #0066CC;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        .btn {
          display: inline-block;
          padding: 8px 15px;
          margin-right: 10px;
          border-radius: 4px;
          background-color: #007BFF;
          color: white;
          text-align: center;
          text-decoration: none;
        }
        .btn:hover {
          background-color: #0056b3;
        }
        .home-btn {
          display: block;
          text-align: center;
          margin-top: 20px;
          background-color: #28a745;
          color: white;
          padding: 10px 20px;
          border-radius: 4px;
          text-decoration: none;
        }
        .home-btn:hover {
          background-color: #218838;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>회원별 업로드 히스토리</h1>
        <ul>
  `;
  if (filteredHistory.length > 0) {
    filteredHistory.forEach((video, index) => {
      historyHtml += `<li>${index + 1}. 업로드 일시: ${video.uploadTime}, 영상명: ${video.fileName}, 크기: ${video.fileSize} <a href="/video/${video.fileName}" class="btn">영상 보기</a><a href="/results/${video.fileName}" class="btn">분석 결과 보기</a></li>`;
    });
  } else {
    historyHtml += '<p>일치하는 회원 ID로 업로드된 영상이 없습니다.</p>';
  }
  historyHtml += `
        </ul>
        <a href="/" class="home-btn">HOME으로 돌아가기</a>
      </div>
    </body>
    </html>
  `;
  res.send(historyHtml);
});

// 분석 결과 보기 페이지
app.get('/results/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const videoEntry = history.find(video => video.fileName === fileName);
  if (videoEntry && videoEntry.analysisResult) {
    const resultHtml = `
      <html>
      <head>
        <title>분석 결과</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 8px;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          h1 {
            text-align: center;
            color: #333;
          }
          p {
            white-space: pre-wrap; /* Maintains whitespace formatting */
            word-wrap: break-word;
          }
          .home-btn {
            display: block;
            text-align: center;
            margin-top: 20px;
            background-color: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            text-decoration: none;
          }
          .home-btn:hover {
            background-color: #218838;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>분석 결과</h1>
          <p>${JSON.stringify(videoEntry.analysisResult, null, 2)}</p>
          <a href="/viewHistory?userId=${videoEntry.userId}" class="home-btn">돌아가기</a>
        </div>
      </body>
      </html>
    `;
    res.send(resultHtml);
  } else {
    res.status(404).send('분석 결과를 찾을 수 없습니다.');
  }
});

// 영상 보기 페이지
app.get('/video/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, 'uploads', fileName);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('영상을 찾을 수 없습니다.');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
