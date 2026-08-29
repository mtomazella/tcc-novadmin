import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import config from '.'

const { combine, timestamp, errors, colorize, simple, json } = winston.format

const warnTransport = new DailyRotateFile({
    filename: 'logs/warn-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'warn',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: combine(timestamp(), errors({ stack: true }), json()),
})

const infoTransport = new DailyRotateFile({
    filename: 'logs/info-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: combine(timestamp(), errors({ stack: true }), json()),
})

const transports: winston.transport[] = [warnTransport, infoTransport]

if (config.nodeEnv !== 'production') {
    transports.push(
        new winston.transports.Console({
            level: 'debug',
            format: combine(colorize(), errors({ stack: true }), simple()),
        })
    )
}

export const systemLogger = winston.createLogger({
    level: 'debug',
    format: combine(timestamp(), errors({ stack: true })),
    transports,
    exitOnError: false,
})
