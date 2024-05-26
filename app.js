const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

// 초기 관리자 비밀번호 설정
let adminPassword = '0000';

// 업로드된 파일의 저장 위치 설정
const mainFilesDirectory = path.join(__dirname, 'uploads', 'mainFiles');
const uploadDirectory = path.join(__dirname, 'uploads', 'userFiles');
if (!fs.existsSync(mainFilesDirectory)) {
  fs.mkdirSync(mainFilesDirectory, { recursive: true });
}
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Multer 설정
const storageMain = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, mainFilesDirectory);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // 원래 파일 이름 사용
  }
});

const storageUser = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    const fileId = uuidv4(); // 파일마다 고유한 ID 생성
    const extension = path.extname(file.originalname);
    cb(null, fileId + extension);
  }
});

const uploadMain = multer({ storage: storageMain });
const uploadUser = multer({ storage: storageUser });

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
        .admin-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background-color: #007BFF;
          color: white;
          padding: 10px 20px;
          border-radius: 4px;
          text-decoration: none;
        }
        .admin-btn:hover {
          background-color: #0056b3;
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
        <a href="/admin-login" class="admin-btn">관리자 모드</a>
      </div>
    </body>
    </html>
  `);
});

// 관리자 로그인 페이지
app.get('/admin-login', (req, res) => {
  res.send(`
    <html>
    <head>
      <title>관리자 로그인</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 400px;
          margin: 100px auto;
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 8px;
          background-color: #fff;
        }
        h1 {
          text-align: center;
          color: #333;
        }
        form {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        input[type="password"] {
          margin-bottom: 10px;
          padding: 10px;
          width: 100%;
          border: 1px solid #ccc;
          border-radius: 4px;
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
      </style>
    </head>
    <body>
      <div class="container">
        <h1>관리자 로그인</h1>
        <form action="/admin-login" method="post">
          <input type="password" name="password" placeholder="비밀번호" required>
          <button type="submit">로그인</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// 관리자 로그인 처리
app.post('/admin-login', (req, res) => {
  const { password } = req.body;
  if (password === adminPassword) {
    res.redirect('/admin');
  } else {
    res.send(`
      <html>
      <head>
        <title>로그인 실패</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 400px;
            margin: 100px auto;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 8px;
            background-color: #fff;
          }
          h1 {
            text-align: center;
            color: #333;
          }
          p {
            text-align: center;
            color: red;
          }
          a {
            display: block;
            width: 100px;
            margin: 20px auto;
            background-color: #007BFF;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            text-align: center;
            text-decoration: none;
          }
          a:hover {
            background-color: #0056b3;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>로그인 실패</h1>
          <p>비밀번호가 잘못되었습니다.</p>
          <a href="/admin-login">다시 시도</a>
        </div>
      </body>
      </html>
    `);
  }
});

// 관리자 페이지
app.get('/admin', (req, res) => {
  res.send(`
    <html>
    <head>
      <title>관리자 모드</title>
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
        }
        h1 {
          text-align: center;
          color: #333;
        }
        .btn-container {
          display: flex;
          justify-content: space-around;
        }
        .btn-container button {
          padding: 10px 20px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .btn-container button:hover {
          background-color: #45a049;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>관리자 모드</h1>
        <div class="btn-container">
          <form action="/upload-main" method="get" style="display:inline;">
            <button type="submit">메인 파일 업로드</button>
          </form>
          <form action="/change-password" method="get" style="display:inline;">
            <button type="submit">비밀번호 변경</button>
          </form>
        </div>
      </div>
    </body>
    </html>
  `);
});

// 비밀번호 변경 폼
app.get('/change-password', (req, res) => {
  res.send(`
    <html>
    <head>
      <title>비밀번호 변경</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 400px;
          margin: 100px auto;
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 8px;
          background-color: #fff;
        }
        h1 {
          text-align: center;
          color: #333;
        }
        form {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        input[type="password"] {
          margin-bottom: 10px;
          padding: 10px;
          width: 100%;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        button {
          padding: 10px 20px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 10px;
        }
        button:hover {
          background-color: #45a049;
        }
        .btn-container {
          display: flex;
          justify-content: space-between;
        }
        .btn-container button.cancel {
          background-color: #f44336;
        }
        .btn-container button.cancel:hover {
          background-color: #e31e1e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>비밀번호 변경</h1>
        <form action="/change-password" method="post">
          <input type="password" name="newPassword" placeholder="새 비밀번호 (4자리 숫자)" required pattern="\\d{4}">
          <div class="btn-container">
            <button type="submit">변경</button>
            <button type="button" class="cancel" onclick="window.location.href='/admin'">취소</button>
          </div>
        </form>
      </div>
    </body>
    </html>
  `);
});

// 비밀번호 변경 처리
app.post('/change-password', (req, res) => {
  const { newPassword } = req.body;
  adminPassword = newPassword;
  res.send(`
    <html>
    <head>
      <title>비밀번호 변경 완료</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 400px;
          margin: 100px auto;
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 8px;
          background-color: #fff;
        }
        h1 {
          text-align: center;
          color: #333;
        }
        a {
          display: block;
          width: 100px;
          margin: 20px auto;
          background-color: #007BFF;
          color: white;
          padding: 10px 20px;
          border-radius: 4px;
          text-align: center;
          text-decoration: none;
        }
        a:hover {
          background-color: #0056b3;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>비밀번호 변경 완료</h1>
        <p>비밀번호가 성공적으로 변경되었습니다.</p>
        <a href="/admin">돌아가기</a>
      </div>
    </body>
    </html>
  `);
});

// 메인 파일 업로드 폼
app.get('/upload-main', (req, res) => {
  res.send(`
    <html>
    <head>
      <title>메인 파일 업로드</title>
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
        }
        h1 {
          text-align: center;
          color: #333;
        }
        form {
          display: flex;
          flex-direction: column;
          align-items: center;
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
      </style>
    </head>
    <body>
      <div class="container">
        <h1>메인 파일 업로드</h1>
        <form action="/upload-main" method="post" enctype="multipart/form-data">
          <input type="file" name="mainFile" accept=".jpg, .jpeg, .png" required>
          <button type="submit">업로드</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// 메인 파일 업로드 처리
app.post('/upload-main', uploadMain.single('mainFile'), (req, res) => {
  res.send(`
    <html>
    <head>
      <title>업로드 완료</title>
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
        }
        h1 {
          text-align: center;
          color: #333;
        }
        p {
          text-align: center;
        }
        a {
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
        a:hover {
          background-color: #218838;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>업로드 완료</h1>
        <p>메인 파일이 성공적으로 업로드되었습니다.</p>
        <a href="/upload-main">다시 업로드</a>
      </div>
    </body>
    </html>
  `);
});

// 히스토리 페이지
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


// 분석 페이지
app.post('/analyze', uploadUser.single('video'), (req, res) => {
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
  fs.writeFileSync('db.json', JSON.stringify(history, null, 2));

  // Python 스크립트의 실행을 임시 결과로 대체
  setTimeout(() => { // setTimeout을 사용하여 비동기 처리를 시뮬레이션
    const analysisResult = {
      status: "Success",
      message: "분석 결과 개발중. 세부 정보는 여기에 포함됩니다."
    };
    videoData.analysisResult = analysisResult;
    fs.writeFileSync('db.json', JSON.stringify(history, null, 2)); // 결과 업데이트

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
