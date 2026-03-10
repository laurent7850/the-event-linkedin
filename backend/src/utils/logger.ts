import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.LOG_FORMAT === 'json'
    ? winston.format.combine(winston.format.timestamp(), winston.format.json())
    : winston.format.combine(winston.format.timestamp(), winston.format.simple()),
  defaultMeta: { service: 'the-event-backend' },
  transports: [
    new winston.transports.Console(),
  ],
});
