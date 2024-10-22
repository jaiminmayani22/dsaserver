// var CronJob = require('cron').CronJob;
// const moment = require('moment');
// const CONSTANT = require("../common/constant");

// class eventCron {

//     postBumpUpdate() {
//         var self = this;
//         var job = new CronJob("0 0 * * * *", async function () {
//           // It cronjob run at every one hour
//           const startDate = moment().valueOf();
//           const startMoment = moment.utc(startDate);
//           const timeNow = startMoment.format("YYYY-MM-DDTHH:mm:ss.SSSZ");
//           const currentUTCDate = new Date(timeNow);

//           const bumps = await BUMP_COLLECTION.find({
//             isDeleted: false,
//             // endAt: { $lt: currentUTCDate }
//           });

//           if (bumps.length > 0) {
//             bumps.forEach(async (bump) => {
//               let endAt = new Date(bump.endAt);
//               // let bumpObj = CONSTANT.PAYMENT_CONSTANT.BUMP_LIST.find((bumps) => bumps.key === (bump.bumpType));
//               let post = await POST_COLLECTION.findOne({ _id: bump.postId, isDeleted: false });

//               const newDateFull = moment(post.visibleTime).add(24, "hours");
//               const dateFull = newDateFull.format("YYYY-MM-DDTHH:mm:ss.SSSZ");
//               const addedDate = new Date(dateFull);

//               const newDateHalf = moment(post.visibleTime).add(12, "hours");
//               const dateHalf = newDateHalf.format("YYYY-MM-DDTHH:mm:ss.SSSZ");
//               const addedHalfDate = new Date(dateHalf);

//               if (endAt < currentUTCDate) {
//                 bump.isDeleted = true;
//                 await bump.save();
//                 post.isBump = false;
//                 post.visibleTime = post.createdAt;
//                 await post.save();
//               } else {
//                 if (
//                   bump.bumpType === "bump_daily_three_days" ||
//                   bump.bumpType === "bump_daily_seven_days"
//                 ) {
//                   if (addedDate < currentUTCDate) {
//                     post.visibleTime = addedDate;
//                     await post.save();
//                   }
//                 }

//                 if (bump.bumpType === "bump_twice_daily_three_days") {
//                   if (addedHalfDate < currentUTCDate) {
//                     post.visibleTime = addedHalfDate;
//                     await post.save();
//                   }
//                 }
//               }
//             });
//           }
//         });
//         job.start();
//     }
// }


// module.exports = new eventCron();