const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const winston = require("winston");
const cors = require("cors"); // Импортируем cors

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка логирования с использованием winston
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(), // Логируем только в консоль
  ],
});

// Установите dev_mode в true для режима разработки
const dev_mode = true; // Change this to false in production

app.use(cors()); // Добавляем поддержку CORS
app.use(bodyParser.json());
app.use(morgan("dev")); // Логирование запросов

// Добавленный маршрут для корневого пути
app.get("/", (req, res) => {
  logger.info("Root path accessed");
  res.send("Welcome to the Apple Auth Server");
});

// Обработка POST-запроса для маршрута /auth/callback
app.post("/auth/callback", (req, res) => {
  logger.info("Received request:", { body: req.body });
  const { token } = req.body;

  if (dev_mode) {
    // Логика для режима разработки
    if (token === "dev") {
      logger.info("Development mode: token is valid");
      return res
        .status(200)
        .json({
          message: "Authenticated in dev mode",
          user: { sub: "dev_user" },
        });
    } else {
      logger.error("Development mode: invalid token");
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  // Логика верификации токена для продакшн-режима
  jwt.verify(token, process.env.APPLE_PUBLIC_KEY, (err, decoded) => {
    if (err) {
      logger.error("Token verification failed:", { error: err });
      return res.status(401).json({ message: "Unauthorized" });
    }
    logger.info("Decoded token:", { decoded });

    // Логируем информацию о запросе
    logger.info("User authenticated successfully", { userId: decoded.sub });

    // Здесь можно добавить логику для обработки аутентифицированного пользователя
    res.status(200).json({ message: "Authenticated", user: decoded });
  });
});

// Обработка ошибок (например, если не найден маршрут)
app.use((req, res, next) => {
  logger.warn("404 Not Found", { url: req.originalUrl });
  res.status(404).json({ message: "Not Found" });
});

// Запуск сервера
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});