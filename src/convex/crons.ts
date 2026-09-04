import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Process due email schedules every 5 minutes
crons.interval("processDueEmailSchedules", { minutes: 5 }, internal.emailProcessor.processDueSchedulesInternal);

export default crons;
