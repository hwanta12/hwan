const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload directory settings
const userFilesDirectory = path.join(__dirname, 'uploads', 'userFiles');
const mainFilesDirectory = path.join(__dirname, 'uploads', 'mainFiles');
if (!fs.existsSync(userFilesDirectory)) {
  fs.mkdirSync(userFilesDirectory, { recursive: true });
}
if (!fs.existsSync(mainFilesDirectory)) {
  fs.mkdirSync(mainFilesDirectory, { recursive: true });
}

// Admin password file path and initial password
const adminPasswordPath = path.join(__dirname, 'adminPassword.json');
let adminPassword = '0000'; // Default password
if (fs.existsSync(adminPasswordPath)) {
  const data = fs.readFileSync(adminPasswordPath, 'utf8');
  adminPassword = JSON.parse(data).password;
} else {
  fs.writeFileSync(adminPasswordPath, JSON.stringify({ password: adminPassword }));
}

// Multer settings for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'mainFile') {
      cb(null, mainFilesDirectory);
    } else {
      cb(null, userFilesDirectory);
    }
  },
  filename: function (req, file, cb) {
    const fileId = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, fileId + extension);
  }
});

const upload = multer({ storage: storage });

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
        .admin-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 10px 20px;
          background-color: #f00;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
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
        <a href="/history" class="home-btn">업로드 히스토리</a>
        <button class="admin-btn" onclick="location.href='/admin'">관리자 모드</button>
      </div>
    </body>
    </html>
  `);
});

// 분석 페이지
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
          window.location.href = '/';
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
    videoPath: path.join('uploads', 'userFiles', req.file.filename)
  };

  // 히스토리에 업로드 정보 추가
  const dbPath = path.join(__dirname, 'db.json');
  let history = [];
  if (fs.existsSync(dbPath)) {
    history = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }
  history.push(videoData);
  fs.writeFileSync(dbPath, JSON.stringify(history, null, 2));

  // Python 스크립트의 실행을 임시 결과로 대체
  setTimeout(() => { // setTimeout을 사용하여 비동기 처리를 시뮬레이션
    const analysisResult = {
      status: "Success",
      message: "분석 결과 개발중. 세부 정보는 여기에 포함됩니다."
    };
    videoData.analysisResult = analysisResult;
    fs.writeFileSync(dbPath, JSON.stringify(history, null, 2)); // 결과 업데이트

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
  }, 1000); // 1초 후에 결과 반환
});

// 업로드 히스토리 페이지
app.get('/history', (req, res) => {
  res.send(`
    <html>
    <head>
      <title>업로드 히스토리</title>
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
        input[type="text"] {
          padding: 8px;
          width: 200px;
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
        ul {
          list-style-type: none;
          padding: 0;
        }
        li {
          margin-bottom: 10px;
        }
        .home-btn {
          display: block;
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
        <h1>업로드 히스토리</h1>
        <form action="/viewHistory" method="get">
          <input type="text" name="userId" placeholder="회원 ID">
          <button type="submit">조회하기</button>
        </form>
        <a href="/" class="home-btn">HOME으로 돌아가기</a>
      </div>
    </body>
    </html>
  `);
});

// 회원별 업로드 히스토리 조회
app.get('/viewHistory', (req, res) => {
  const userId = req.query.userId;
  const dbPath = path.join(__dirname, 'db.json');
  let history = [];
  if (fs.existsSync(dbPath)) {
    history = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }
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
  const dbPath = path.join(__dirname, 'db.json');
  let history = [];
  if (fs.existsSync(dbPath)) {
    history = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }
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
  const filePath = path.join(__dirname, 'uploads', 'userFiles', fileName);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('영상을 찾을 수 없습니다.');
  }
});

// 관리자 모드 페이지
app.get('/admin', (req, res) => {
  res.send(`
    <html>
    <head>
      <title>관리자 모드</title>
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
        input[type="file"], input[type="password"] {
          margin-bottom: 10px;
          display: block;
          width: 100%;
          padding: 10px;
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
        <h1>관리자 로그인</h1>
        <form action="/adminLogin" method="post">
          <input type="password" name="password" placeholder="비밀번호" required>
          <button type="submit">로그인</button>
        </form>
        <a href="/" class="home-btn">HOME으로 돌아가기</a>
      </div>
    </body>
    </html>
  `);
});

app.post('/adminLogin', (req, res) => {
  const { password } = req.body;
  if (password === adminPassword) {
    res.send(`
      <html>
      <head>
        <title>관리자 모드</title>
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
          input[type="file"], input[type="password"] {
            margin-bottom: 10px;
            display: block;
            width: 100%;
            padding: 10px;
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
          <h1>관리자 모드</h1>
          <form action="/uploadMainFile" method="post" enctype="multipart/form-data">
            <input type="file" name="mainFile" accept=".jpg, .jpeg, .png" required>
            <button type="submit">메인 파일 업로드</button>
          </form>
          <form action="/changePassword" method="post">
            <input type="password" name="newPassword" placeholder="새 비밀번호" required>
            <button type="submit">비밀번호 변경</button>
          </form>
          <h2>업로드된 메인 파일 목록</h2>
          <ul>
            ${fs.readdirSync(mainFilesDirectory).map(file => `<li>${file} <a href="/deleteMainFile?fileName=${file}">삭제</a></li>`).join('')}
          </ul>
          <a href="/" class="home-btn">HOME으로 돌아가기</a>
        </div>
      </body>
      </html>
    `);
  } else {
    res.send(`
      <html>
      <head>
        <title>로그인 실패</title>
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
            color: red;
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
          <h1>비밀번호가 틀렸습니다</h1>
          <a href="/admin" class="home-btn">다시 시도하기</a>
        </div>
      </body>
      </html>
    `);
  }
});

// 메인 파일 업로드
app.post('/uploadMainFile', upload.single('mainFile'), (req, res) => {
  if (!req.file) {
    return res.send('파일 업로드 실패');
  }
  res.send(`
    <html>
    <head>
      <title>업로드 완료</title>
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
          color: green;
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
        <h1>메인 파일 업로드 완료</h1>
        <a href="/admin" class="home-btn">관리자 모드로 돌아가기</a>
      </div>
    </body>
    </html>
  `);
});

// 메인 파일 삭제
app.get('/deleteMainFile', (req, res) => {
  const { fileName } = req.query;
  const filePath = path.join(mainFilesDirectory, fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.send(`
      <html>
      <head>
        <title>삭제 완료</title>
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
            color: red;
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
          <h1>메인 파일 삭제 완료</h1>
          <a href="/admin" class="home-btn">관리자 모드로 돌아가기</a>
        </div>
      </body>
      </html>
    `);
  } else {
    res.status(404).send('파일을 찾을 수 없습니다.');
  }
});

// 비밀번호 변경
app.post('/changePassword', (req, res) => {
  const { newPassword } = req.body;
  adminPassword = newPassword;
  fs.writeFileSync(adminPasswordPath, JSON.stringify({ password: adminPassword }));
  res.send(`
    <html>
    <head>
      <title>비밀번호 변경 완료</title>
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
          color: green;
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
        <h1>비밀번호 변경 완료</h1>
        <a href="/admin" class="home-btn">관리자 모드로 돌아가기</a>
      </div>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
