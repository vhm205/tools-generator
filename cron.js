const { execFile } = require('child_process');
const cron = require('cron');

function initCron(time, cb = null) {
    return new cron.CronJob({
        cronTime: time,
        start: true, 
        timeZone: 'Asia/Ho_Chi_Minh',
        onTick: function() {
          console.log('Cron job runing...', __dirname);

          if (cb instanceof Function) {
            return cb();
          }

          execFile(__dirname + '/backup/backup_db_to_s3.sh', (error, stdout, stderr) => {
              if (error) {
                return console.error(`error: ${error.message}`);
              }

              if (stderr) {
                return console.error(`stderr:\n${stderr}`);
              }

              console.log(`stdout:\n${stdout}`);
          });
        }
    })
}

initCron('00 15 12 * * 0-6').start(); // Chạy Jobs vào 12h15 trưa
initCron('00 15 00 * * 0-6').start(); // Chạy Jobs vào 00h15 hằng đêm
