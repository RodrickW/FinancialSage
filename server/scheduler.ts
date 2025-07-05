import { checkTrialNotifications } from './notifications';

/**
 * Simple scheduler that runs daily tasks
 * In production, you would use a proper cron job or scheduled task service
 */
class TaskScheduler {
  private intervals: NodeJS.Timeout[] = [];
  
  start() {
    console.log('Starting task scheduler...');
    
    // Trial notifications temporarily disabled to prevent fake notifications
    // const trialCheckInterval = setInterval(async () => {
    //   console.log('Running daily trial notification check...');
    //   await checkTrialNotifications();
    // }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds
    // 
    // this.intervals.push(trialCheckInterval);
    
    // Disabled initial trial check to prevent fake notifications
    // setTimeout(async () => {
    //   console.log('Running initial trial notification check...');
    //   await checkTrialNotifications();
    // }, 5000); // 5 seconds after startup
  }
  
  stop() {
    console.log('Stopping task scheduler...');
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }
}

export const scheduler = new TaskScheduler();

/**
 * Start the scheduler when the server starts
 */
export function startScheduler() {
  scheduler.start();
}

/**
 * Stop the scheduler when the server shuts down
 */
export function stopScheduler() {
  scheduler.stop();
}

/**
 * Manual trigger for testing trial notifications
 */
export async function triggerTrialCheck() {
  console.log('Manually triggering trial notification check...');
  await checkTrialNotifications();
}