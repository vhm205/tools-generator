const Queue						= require('bull');
const { REDIS_SEPERATOR }		= require('../config/cf_redis');

const JOB_QUEUE_COLL 			= require('../database/job_queue-coll');

module.exports = function(name){
    const jobQueue = new Queue(name, {
        redis: {
            username: REDIS_SEPERATOR.USR,
            host: REDIS_SEPERATOR.HOST,
            password: REDIS_SEPERATOR.PWD
        }
    });

    jobQueue.on('global:completed', async (jobID, resp) => {
		console.log({ ['global:completed(queue)']: resp });

		const job = await jobQueue.getJob(jobID);

		if(job) {
			job.remove();

			await JOB_QUEUE_COLL.updateOne({ jobID }, { 
				$set: { status: 1 }
			});
		}
	});

	jobQueue.on('global:progress', (jobID, progress) => {
		console.log(`Job ${jobID} is ${progress}% ready!`);
	})

	jobQueue.on('global:active', function(jobID){
		// console.log({ __active: jobID });
	});

	jobQueue.on('global:waiting', async (jobID) => {
		console.log({ __waiting: jobID });
	})

	jobQueue.on('global:stalled', (jobID) => {
		console.log({ __stalled: jobID });
	})

	jobQueue.on('global:failed', async (jobID, err) => {
		console.log({ __failed: jobID, err });

		const job = await jobQueue.getJob(jobID);
		// job && jobQueue.retryJob(job);

		if(job) {
			job.retry();

			await JOB_QUEUE_COLL.updateOne({ jobID }, { 
				$set: { status: 2 },
				$inc: { totalFail: 1 }
			});
		}
	})

	jobQueue.on('global:removed', (jobID) => {
		console.log({ __removed: jobID });
	})

    return jobQueue;
}
