const morgan = require('morgan');
const logger = require('./winston.config');

const stream = {
	write: message => logger.http(message)
}

const skip = () => {
	const env = process.env.NODE_ENV || "development";
	return env !== "development";
};

const morganMiddleware = morgan(
	// Define message format string (this is the default one).
	// The message format is made from tokens, and each token is
	// defined inside the Morgan library.
	// You can create your custom token to show what do you want from a request.
	// :res[content-length]
	":method :url - :status - :remote-addr :remote-user HTTP/:http-version - :response-time ms - tt/:total-time ms",
	// Options: in this case, I overwrote the stream and the skip logic.
	// See the methods above.
	{ stream, skip }
);

module.exports = morganMiddleware;