const CronJob = require('cron').CronJob;
const CAMPAIGN_COLLECTION = require("../module/campaign.module");
const CAMP_CTRL = require("../controller/campaign.controller");

class eventCron {
  shceduleCampaign() {
    // const job = new CronJob("*/5 * * * * *", async function () { // Runs every 5 second
      const job = new CronJob("*/10 * * * *", async function () { // Runs every 10 minute
      try {
        const currentUTCDate = new Date();
        const campaigns = await CAMPAIGN_COLLECTION.find({
          isDeleted: false,
          type: "schedule",
          status: ""
        });

        for (const campaign of campaigns) {
          const scheduleDate = new Date(campaign.schedule);

          if (scheduleDate <= currentUTCDate) {
            const mockReq = {
              body: campaign
            };

            await CAMP_CTRL.sendMessage(mockReq);
          }
        }
      } catch (error) {
        console.error("Error in cron job:", error);
      }
    });

    job.start();
  }
}

module.exports = new eventCron();