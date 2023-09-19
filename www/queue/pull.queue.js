const INIT_QUEUE = require('./initQueue')('TRIGGER_EVENT_QUEUE');

module.exports = ({ func, receiver }) => {
    try {
        if(!process.env.TRIGGER_EVENT_NOTI_QUEUE)
            return console.log('Trigger event is not active');

        const opts = { 
            attempts: 5, 
            backoff: 3000,
            delay: 1500,
            // removeOnComplete: true,
            // removeOnFail: true,
            // jobId: randomStringFixLength(25),
        }

        await INIT_QUEUE.add({ func, receiver }, opts);        
    } catch (error) {
        console.error(error);
    }
}