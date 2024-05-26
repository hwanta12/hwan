const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

// 업로드된 파일의 저장 위치 설정
const uploadDirectory = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}

// 메인 파일 저장 디렉터리
const mainFilesDirectory = path.join(__dirname, 'main_files');
if (!fs.existsSync(mainFilesDirectory)) {
  fs.mkdirSync(mainFilesDirectory);
}

// 관리자 비밀번호 파일 경로
const adminPasswordPath = path.join(__dirname, 'admin_password.json');
let adminPassword = '0000'; // 초기 비밀번호 설정

if (fs.existsSync(adminPasswordPath)) {
  const data = fs.readFileSync(adminPasswordPath, 'utf8');
  adminPassword = JSON.parse(data).password;
} else {
  fs.writeFileSync(adminPasswordPath, JSON.stringify({ password: adminPassword }));
}

// 업로드된 파일의 저장 위치와 이름 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, mainFilesDirectory);
  },
  filename: function (req, file, cb) {
    const fileId = uuidv4(); // 파일마다 고유한 ID 생성
    const extension = path.extname(file.originalname);
    cb(null, fileId + extension);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
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
        .admin-btn {
          position: absolute;
          right: 10px;
          top: 10px;
          padding: 5px 10px;
          background-color: #f1f1f1;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        }
        .admin-btn:hover {
          background-color: #ddd;
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
        input[type="file"], input[type="password"], input[type="text"] {
          display: block;
          margin-bottom: 10px;
          padding: 10px;
          width: calc(100% - 22px);
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
        <form action="/admin/upload" method="post" enctype="multipart/form-data">
          <input type="file" name="mainfile" accept=".jpeg, .jpg, .png">
          <button type="submit">메인 파일 업로드</button>
        </form>
        <form action="/admin/change-password" method="post">
          <input type="password" name="oldPassword" placeholder="현재 비밀번호" required>
          <input type="password" name="newPassword" placeholder="새로운 비밀번호" required>
          <button type="submit">비밀번호 변경</button>
        </form>
        <a href="/" class="home-btn">HOME으로 돌아가기</a>
      </div>
    </body>
    </html>
  `);
});

// 비밀번호 변경 처리
app.post('/admin/change-password', express.urlencoded({ extended: true }), (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (oldPassword === adminPassword) {
    adminPassword = newPassword;
    fs.writeFileSync(adminPasswordPath, JSON.stringify({ password: adminPassword }));
    res.send(`
      <html>
      <head>
        <title>비밀번호 변경 완료</title>
        <script type="text/javascript">
          alert("비밀번호가 성공적으로 변경되었습니다.");
          window.location.href = "/admin";
        </script>
      </head>
      <body></body>
      </html>
    `);
  } else {
    res.send(`
      <html>
      <head>
        <title>비밀번호 변경 실패</title>
        <script type="text/javascript">
          alert("현재 비밀번호가 틀렸습니다.");
          window.location.href = "/admin";
        </script>
      </head>
      <body></body>
      </html>
    `);
  }
});

// 메인 파일 업로드 처리
app.post('/admin/upload', upload.single('mainfile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('파일이 업로드되지 않았습니다.');
  }

  const fileUrl = `/main_files/${req.file.filename}`;
  res.send(`
    <html>
    <head>
      <title>메인 파일 업로드 완료</title>
      <script type="text/javascript">
        alert("메인 파일이 성공적으로 업로드되었습니다. 파일 URL: ${fileUrl}");
        window.location.href = "/admin";
      </script>
    </head>
    <body></body>
    </html>
  `);
});

// 메인 파일 경로 제공
app.use('/main_files', express.static(mainFilesDirectory));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
