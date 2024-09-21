const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Установите dev_mode в true для режима разработки
const dev_mode = true; // Change this to false in production

app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev")); // Логирование запросов в консоль

// Добавленный маршрут для корневого пути
app.get("/", (req, res) => {
  console.info("Root path accessed");
  res.send("Welcome to the Apple Auth Server");
});

// Обработка POST-запроса для маршрута /auth/callback
app.post("/auth/callback", (req, res) => {
  console.info("Received request:", req.body);
  const { token } = req.body;

  if (dev_mode) {
    // Логика для режима разработки
    if (token === "dev") {
      console.info("Development mode: token is valid");
      return res.status(200).json({
        message: "Authenticated in dev mode",
        user: { sub: "dev_user" },
      });
    } else {
      console.error("Development mode: invalid token", { token });
      return res.status(401).json({
        message: "Unauthorized",
        tokenEntered: token,
        expectedToken: "dev",
      });
    }
  }

  // Логика верификации токена для продакшн-режима
  if (!token) {
    console.error("No token provided");
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, process.env.APPLE_PUBLIC_KEY, (err, decoded) => {
    if (err) {
      console.error("Token verification failed:", err.message);
      return res.status(401).json({ message: "Unauthorized", error: err.message });
    }

    console.info("Decoded token:", decoded);

    // Логируем информацию о запросе
    console.info("User authenticated successfully", { userId: decoded.sub });

    // Здесь можно добавить логику для обработки аутентифицированного пользователя
    res.status(200).json({ message: "Authenticated", user: decoded });
  });
});

// Обработка ошибок (например, если не найден маршрут)
app.use((req, res, next) => {
  console.warn("404 Not Found", { url: req.originalUrl });
  res.status(404).json({ message: "Not Found" });
});

// Запуск сервера
app.listen(PORT, () => {
  console.info(`Server is running on port ${PORT}`);
});