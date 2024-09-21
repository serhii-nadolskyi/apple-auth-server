const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const winston = require('winston');

const app = express();

// Настройка логирования с использованием winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ],
});

app.use(bodyParser.json());

// Добавленный маршрут для корневого пути
app.get('/', (req, res) => {
  logger.info('Root path accessed');
  res.send('Welcome to the Apple Auth Server');
});

app.post('/auth/callback', (req, res) => {
  const { token } = req.body;

  // Логика верификации токена
  jwt.verify(token, process.env.APPLE_PUBLIC_KEY, (err, decoded) => {
    if (err) {
      logger.error('Token verification failed:', { error: err });
      return res.status(401).json({ message: 'Unauthorized' });
    }
    logger.info('Decoded token:', { decoded });
    logger.info('User authenticated successfully', { userId: decoded.sub });
    res.status(200).json({ message: 'Authenticated', user: decoded });
  });
});

// Экспортируем функцию как обработчик
module.exports = app;