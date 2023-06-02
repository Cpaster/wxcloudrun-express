const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
// const { init: initDB, Counter } = require("./db");

const logger = morgan("tiny");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);


async function stream2string(stream, onMessage) {
  if (!stream) {
    return '';
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const trunk = decoder.decode(value, { stream: true });
    onMessage?.(trunk);
    result += trunk;
  }
  reader.releaseLock();
  return result;
}

// 首页
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/chat", async (req, res) => {
  const result = await fetch(`https://www.webcomponent.top/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    // 直接透传，组装逻辑完全由前端实现
    body: JSON.stringify(req.body),
  });

  console.log(result.ok);
  console.log(result.body);

  res.setHeader('Content-Type', 'application/octet-stream');

  const r = await stream2string(result.body, (v) => {
    res.write(v);
  });

  res.end();
});

// 获取计数
// app.get("/api/count", async (req, res) => {
//   const result = await Counter.count();
//   res.send({
//     code: 0,
//     data: result,
//   });
// });

// // 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

const port = process.env.PORT || 80;

async function bootstrap() {
  // await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();