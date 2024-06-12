const cron = require('node-cron');
const { sendWebhookMessage } = require('../utils/discord');
const { calcNewSeasonApy } = require('./apy');

// All cron jobs which could be activated are configured here
const ALL_JOBS = {
  'silo-apy': {
    cron: '0 * * * *',
    function: calcNewSeasonApy
  },
  alert: {
    cron: '*/10 * * * * *',
    function: () => console.log('10 seconds Alert!!')
  },
  failing: {
    cron: '*/5 * * * * *',
    function: () => {
      throw new Error('ERROR!');
    }
  }
};

// Error handling wrapper for scheduled task functions
async function errorWrapper(fn) {
  try {
    fn();
  } catch (e) {
    console.log(e);
    // Send message only without the stack trace
    sendWebhookMessage(e.message);
  }
}

// Activates the requested cron jobs. If a job isn't included in ALL_JOBS, nothing happens
function activateJobs(jobNames) {
  if (!jobNames) {
    console.log('Skipping cron job activation');
    return;
  }

  let activated = [];
  let failed = [];

  for (const jobName of jobNames) {
    const job = ALL_JOBS[jobName];
    if (job) {
      cron.schedule(job.cron, () => errorWrapper(job.function));
      activated.push(jobName);
    } else {
      failed.push(jobName);
    }
  }
  console.log(`Activated ${activated.length} jobs: ${activated.join(', ')}`);
  if (failed.length > 0) {
    sendWebhookMessage(`Failed to activate jobs: ${failed.join(', ')}`);
    console.log(`Failed to activate jobs: ${failed.join(', ')}`);
  }
}

module.exports = {
  activateJobs
};
