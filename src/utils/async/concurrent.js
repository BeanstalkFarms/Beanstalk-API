// Allows high levels of concurrency by continually running up to a maximum number of requests,
// as opposed to waiting for the existing batch to complete before continuing.
// Usage: likely in a loop: await Concurrent.run('uniqueId-timestamp', 50, async () => {});
// When all have been started, need to await the completion with: await Concurrent.allResolved('uniqueId');
class Concurrent {
  static running = {};
  static queue = {};
  static runCount = {};
  static errors = {};

  static run(id, maxConcurrent, asyncCallback) {
    this.running[id] ||= 0;
    this.queue[id] ||= [];
    this.runCount[id] ||= 0;
    this.errors[id] ||= [];

    return new Promise(async (resolve) => {
      if (this.running[id] >= maxConcurrent) {
        let queueResolve;
        const queueable = new Promise((res) => {
          queueResolve = res;
        });
        this.queue[id].push(queueResolve);
        await queueable;
      }

      asyncCallback()
        .then((r) => {
          --this.running[id];
          this._pop(id);
        })
        .catch((e) => {
          --this.running[id];
          this.errors[id].push(e);
          this._pop(id);
        });
      ++this.running[id];

      resolve();
    });
  }

  static tag(name) {
    return `${name}-${Date.now()}`;
  }

  static allResolved(id) {
    if (this.running[id] === undefined) {
      // Nothing with this id ever got ran
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (this.running[id] === 0 && this.queue[id].length === 0) {
          const errors = this.errors[id];
          this._clearState(id);
          clearInterval(interval);
          if (errors.length === 0) {
            resolve();
          } else {
            reject(`Failed with errors: ${this.errors[id]}`);
          }
        }
      }, 50);
    });
  }

  static allSettled(id) {
    if (this.running[id] === undefined) {
      // Nothing with this id ever got ran
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.running[id] === 0 && this.queue[id].length === 0) {
          this._clearState(id);
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

  static _pop(id) {
    if (this.queue[id].length > 0) {
      this.queue[id].shift()();
    }
  }

  static _clearState(id) {
    delete this.running[id];
    delete this.queue[id];
    delete this.runCount[id];
    delete this.errors[id];
  }
}
module.exports = Concurrent;
