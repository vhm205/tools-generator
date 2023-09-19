const winston = require('winston');
require('winston-daily-rotate-file');

const logConfigurate = {
	levels: {
		error: 0,
		warn: 1,
		info: 2,
		http: 3,
		verbose: 4,
		debug: 5,
		silly: 6
	},
	colors: {
		error: 'red',
		warn: 'yellow',
		info: 'green',
		http: 'magenta',
		debug: 'white',
	}
}

const level = () => {
	const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';
	return isDevelopment ? 'debug' : 'warn';
}

winston.addColors(logConfigurate.colors);

const format = winston.format.combine(
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
	winston.format.colorize({ all: true }),
	winston.format.prettyPrint(),
	winston.format.printf(
		info => `${info.timestamp} ${info.level}: ${info.message}`,
	),
)

const transports = [
	new winston.transports.Console(),
	new winston.transports.File({
		filename: 'logs/error.log',
		level: 'error',
		maxsize: 5242880,
	}),
	new winston.transports.File({ 
		filename: 'logs/all.log',
		maxsize: 5242880,
	}),
	new winston.transports.DailyRotateFile({
		filename: `logs/%DATE%.log`, // path.join(__dirname, '..', 'logs', `%DATE%.log`),
		datePattern: 'YYYY-MM-DD',
		zippedArchive: true,
		maxSize: '3m',
		maxFiles: '14d'
	}),
]

const Logger = winston.createLogger({
	level: process.env.LOG_LEVEL || level(),
	levels: logConfigurate.levels,
	format,
	transports,
	exceptionHandlers: [
		new winston.transports.File({ filename: 'logs/exceptions.log' })
	]
})

module.exports = Logger;