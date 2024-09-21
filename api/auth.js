const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// Установите dev_mode в true для режима разработки
const dev_mode = false; // Change this to false in production

let applePublicKeys;

// Функция для получения публичных ключей Apple
async function getApplePublicKeys() {
  const response = await axios.get('https://appleid.apple.com/auth/keys');
  return response.data.keys;
}

// Получаем публичные ключи при старте сервера
getApplePublicKeys()
  .then(keys => {
    applePublicKeys = keys;
    console.info('Apple public keys fetched successfully');
  })
  .catch(err => {
    console.error('Error fetching Apple public keys:', err);
  });

app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev")); // Логирование запросов в консоль

// Добавленный маршрут для корневого пути
app.get("/", (req, res) => {
  const message = `Welcome to the Apple Auth Server. Unique ID: 1234567. Time: ${new Date().toISOString()}`;
  console.info(message);
  res.send(message);
});

// Обработка POST-запроса для маршрута /auth/callback
app.post("/auth/callback", (req, res) => {
  console.info("Received request:", req.body);
  const { token } = req.body;

  // Логика верификации токена для продакшн-режима
  if (!token) {
    console.error("No token provided");
    return res.status(401).json({
      message: "Unauthorized: No token provided. Please include a token in the request.",
    });
  }

  const decodedHeader = jwt.decode(token, { complete: true });
  const kid = decodedHeader.header.kid; // Получаем ключ ID из заголовка токена
  const publicKey = applePublicKeys.find(key => key.kid === kid); // Находим публичный ключ

  if (!publicKey) {
    return res.status(401).json({ message: "Unauthorized: Invalid token." });
  }

  const applePublicKey = `-----BEGIN PUBLIC KEY-----\n${publicKey.x.replace(/(.{64})/g, '$1\n')}\n-----END PUBLIC KEY-----`;

  jwt.verify(token, applePublicKey, (err, decoded) => {
    if (err) {
      console.error("Token verification failed:", err.message);
      return res.status(401).json({
        message: "Unauthorized: Token verification failed.",
        error: err.message,
      });
    }

    console.info("Decoded token:", decoded);
    console.info("User authenticated successfully", { userId: decoded.sub });

    res.status(200).json({ message: "Authenticated: Token is valid.", user: decoded });
  });
});

// Обработка ошибок (например, если не найден маршрут)
app.use((req, res, next) => {
  console.warn("404 Not Found", { url: req.originalUrl });
  res.status(404).json({ message: "Not Found: The requested resource was not found." });
});

// Запуск сервера
app.listen(PORT, () => {
  console.info(`Server is running on port ${PORT}`);
});