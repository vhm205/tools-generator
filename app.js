"use strict";

let express = require("express"),
  cluster   = require("cluster"),
  net       = require("net"),
  sio       = require("socket.io"),
  sio_redis = require("socket.io-redis"),
  farmhash  = require("farmhash");

let v8            = require('v8');
let OS            = require("os");
require('dotenv').config()

let { REDIS_SEPERATOR }
                  = require('./www/config/cf_redis');
const httpsConfig = require("./www/config/cf_https");
let hostConf      = require("./www/config/cf_host");
let stringUtils   = require("./www/utils/string_utils");

let totalHeapSize = v8.getHeapStatistics().total_available_size;
totalHeapSize     = totalHeapSize / 1024 / 1024 / 1024
console.log(`Total heap size: ${totalHeapSize} GB`)

exports.BASE_DIR  = __dirname;
exports.EXPRESS   = express;
let i;

/**
 * Config logical core (thường logical_core = physical_core * 2)
*/
let num_processes = +process.env.NUMBER_PROCESSOR || OS.cpus().length; //✅ pass stress_test (bestpractices pm2 -> os.cpus)
process.env.UV_THREADPOOL_SIZE = num_processes;

if (cluster.isMaster) {
  // require('./www/queue/sqs/pull.queue');
  // require('./cron');

  let workers = [];
  let spawn = function (i) {
    i = Number(i);
    workers[i] = cluster.fork();
    workers[i].on("exit", function (code, signal) {
      spawn(i);
    });
  };

  for (i = 0; i < num_processes; i++) {
    spawn(i);
  }

  let worker_index = function (ip, len) {
    return farmhash.fingerprint32(stringUtils.listCharacter()[i]) % Number(len); // Farmhash is the fastest and works with IPv6, too
  };
  let server;
  (server = net
    .createServer({ pauseOnConnect: true }, function (connection) {
      var worker =
        workers[worker_index(connection.remoteAddress, num_processes)];
      worker.send("sticky-session:connection", connection);
    })
    .listen(hostConf.port, hostConf.host)),
    () => {
      console.log(
        `server start at port ${hostConf.host}:${hostConf.port} | CLUSTER`
      );
    };

	let io = sio(server);

	io.adapter(sio_redis({ host: REDIS_SEPERATOR.HOST, port: REDIS_SEPERATOR.PORT, auth_pass: REDIS_SEPERATOR.PWD }));
} else {
  let app = require("express")();
  let server = require("http").Server(app);
  let io = sio(server);

  if (httpsConfig.status) {
    app.use(function (req, res, next) {
      if (!/https/.test(req.protocol)) {
        res.redirect("https://" + req.headers.host + req.url);
      } else {
        return next();
      }
    });

    app.listen(0, hostConf.host);
  } else {
    app.listen(0, hostConf.host, () => {
      console.log(
        `server start at port ${hostConf.host}:${hostConf.port} via process ${process.pid}`
      );
    });
  }

  io.adapter(sio_redis({ host: REDIS_SEPERATOR.HOST, port: REDIS_SEPERATOR.PORT, auth_pass: REDIS_SEPERATOR.PWD }));

  let socket = require("./www/socket/socket");
  socket(io);

  process.on("message", function (message, connection) {
    if (message !== "sticky-session:connection") {
      return;
    }

    server.emit("connection", connection);
    connection.resume();
  });

  let config = require("./www/config/config");
  config(app, io);

  let routing = require("./www/routing/routing");
  routing.mainHandel(app, io);
  // ĐÃ CHẠY NHIỀU LẦN

  let localsRouting = require("./www/locals/locals_routing");
  localsRouting(app);
}
