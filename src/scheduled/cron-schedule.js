const cron = require('node-cron');
const { sendWebhookMessage } = require('../utils/discord');
const SunriseTask = require('./tasks/sunrise');
const Log = require('../utils/logging');
const DepositsTask = require('./tasks/deposits');

// All cron jobs which could be activated are configured here
const ALL_JOBS = {
  sunrise: {
    cron: '0 * * * *',
    function: SunriseTask.handleSunrise
  },
  deposits: {
    cron: '* * * * *',
    function: async () => {
      if (DepositsTask.__cronLock) {
        Log.info('Deposits task is still running, skipping this minute...');
        return;
      }

      try {
        DepositsTask.__cronLock = true;
        await DepositsTask.updateDeposits();
      } finally {
        DepositsTask.__cronLock = false;
      }
    }
  },
  alert: {
    cron: '*/10 * * * * *',
    function: () => Log.info('10 seconds testing Alert')
  },
  failing: {
    cron: '*/5 * * * * *',
    function: () => {
      throw new Error('Testing cron ERROR!');
    }
  }
};

// Error handling wrapper for scheduled task functions
async function errorWrapper(fn) {
  try {
    fn();
  } catch (e) {
    Log.info(e);
    // Send message only without the stack trace
    sendWebhookMessage(e.message);
  }
}

// Activates the requested cron jobs. If a job isn't included in ALL_JOBS, nothing happens
function activateJobs(jobNames) {
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
  Log.info(`Activated ${activated.length} jobs: ${activated.join(', ')}`);
  if (failed.length > 0) {
    sendWebhookMessage(`Failed to activate jobs: ${failed.join(', ')}`);
    Log.info(`Failed to activate jobs: ${failed.join(', ')}`);
  }
}

module.exports = {
  activateJobs
};
