const MESSAGE_SCHEDULE = require("../module/messageSchedule.module");
const MESSAGE_LOG = require("../module/messageLog.module");
const RECEIVED_MESSAGE = require("../module/receivedMessage.module");
const CLIENT_MODULE = require("../module/client.module");
const CONSTANT = require("../common/constant");
const commonService = require("../common/common");
const { validationResult } = require("express-validator");

/*
Method: Post
Todo: Message Schedule Marketting 
*/
exports.messageScheduleMarketting = async (req, res, folder) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      const folder = CONSTANT.UPLOAD_DOC_PATH.SCHEDULE_MARKETING;
      commonService.pictureUploadFunction(folder, req, res, (err, files) => {
        const { userId, _ } = commonService.getUserIdFromToken(req);
        let obj = { ...req.body, addedBy: userId };

        if (files && files[0]) {
          obj[CONSTANT.FIELD.ATTACHMENT] = files[0];
          obj[CONSTANT.FIELD.ATTACHMENT][CONSTANT.COMMON.URL] =
            process.env.BACKEND_URL +
            folder +
            "/" +
            files[0][CONSTANT.COMMON.FILE_NAME];
        }

        MESSAGE_SCHEDULE.create({ ...obj })
          .then((response) => {
            if (commonService.isValidObjId(response._id)) {
              return res.status(200).json({
                message:
                  CONSTANT.COLLECTION.MESSAGE_SCHEDULE +
                  CONSTANT.MESSAGE.CREATE_SUCCESSFULLY,
                data: response,
              });
            } else {
              return res.status(500).send({
                message: CONSTANT.MESSAGE.INVALID_ID,
              });
            }
          })
          .catch((e) => {
            return res.status(404).send({
              message: e.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
            });
          });
      });
    } catch (err) {
      return res.status(404).send({
        message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
      });
    }
  }
};

/*
Method: GET
Todo: Send Instant Message 
*/
exports.sendInstantMessage = async (req, res, folder) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      let slotTiming = '';
      const currentHour = new Date().getHours();

      if (req.query.schedule) {
        slotTiming = 'instant';
      } else {
        if (currentHour >= 10 && currentHour <= 12) slotTiming = 'morning';
        if (currentHour >= 15 && currentHour <= 17) slotTiming = 'afternoon';
        if (currentHour >= 19 && currentHour <= 24) slotTiming = 'evening';
      }

      if (slotTiming) {
        const todayDate = new Date().toISOString().split('T')[0]; // current date
        const schedules = await MESSAGE_SCHEDULE.find({
          scheduleDate: `${todayDate}`,
          scheduleTime: slotTiming,
          messageStatus: { $ne: 'sent' },
        });

        if (schedules.length > 0) {
          for (const schedule of schedules) {
            const { messageTitle, messageText, messageType, attachment, clientId } = schedule;
            const clientContactNos = [];

            // Get client contact numbers from clientMaster
            for (const client of clientId) {
              const clientData = await CLIENT_MODULE.findById(client);
              clientContactNos.push(clientData.mobile_number);
            }

            const imageUrls = attachment.url;
            if (messageType === 'marketing') {
              const data = await sendMarketingWhatsAppMessages(clientContactNos, imageUrls, schedule._id, messageTitle, messageText);
              return res.status(200).json({ success: true, data: data });
            } else {
              await sendUtilityWhatsAppMessages(clientContactNos, imageUrls, schedule._id, messageTitle, messageText);
            }
          }
        } else {
          return res.status(404).json({ message: CONSTANT.MESSAGE.NO_SCHEDULE_FOUND });
        }
      } else {
        return res.status(404).json({ message: CONSTANT.MESSAGE.INVALID_SCHEDULE_TIME });
      }
    } catch (err) {
      return res.status(404).send({
        message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
      });
    }
  }
};

/*
Method: GET
Todo: Get all received Messages 
*/
exports.receivedMessagesHistory = async (req, res) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      const messages = await RECEIVED_MESSAGE.find().sort({ _id: -1 });

      if (messages.length > 0) {
        const responseData = messages.map((message) => ({
          from_contact_no: message.from,
          from_name: message.fromName,
          message_text: message.message,
          received_on: message.createdAt, 
        }));
        res.status(200).send({data: responseData, message: CONSTANT.MESSAGE.DATA_FOUND_SUCCESSFULLY});
      } else {
        res.status(200).send({ data: [ ] , message: CONSTANT.MESSAGE.NO_MESSAGES});  
      }
    } catch (err) {
      return res.status(500).send({
        message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
      });
    }
  }
};

/*
Method: GET
Todo: Get Message Logs
*/
exports.getMessageLog = async (req, res) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      const logs = await MESSAGE_LOG.aggregate([
        {
          $group: {
            _id: {
              msgType: "$msgType",
              messageTitle: "$messageTitle",
            },
            Total_Contacts: { $sum: 1 },
            scheduled: { $sum: 1 },
            Accept: { $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } },
            Sent: { $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] } },
            Delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
            read_: { $sum: { $cond: [{ $eq: ["$status", "read"] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
          },
        },
        {
          $sort: {
            createdAt: -1, // Sort by date in descending order
          },
        },
      ]);
  
      // Transform the results into the required structure
      const result = logs.map((log) => ({
        Campaigns: log._id.msgType,
        Title: log._id.messageTitle,
        Total_Contacts: log.Total_Contacts,
        Date: log._id.date,
        scheduled: log.scheduled,
        Accept: log.Accept,
        Sent: log.Sent,
        Delivered: log.Delivered,
        read_: log.read_,
        failed: log.failed,
      }));
  
      res.json(result);
    } catch (err) {
      return res.status(500).send({
        message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
      });
    }
  }
};

const sendMarketingWhatsAppMessages = async (mobileNumbers, images, scheduleId, messageTitle, messageText) => {
  for (const mobileNumber of mobileNumbers) {
    const messageData = {
      messaging_product: "whatsapp",
      to: `+91${mobileNumber}`,
      type: "template",
      template: {
        name: CONSTANT.TEMPLATE_NAME.FOR_IMAGE,
        language: { code: "en" },
        components: [
          {
            type: "header",
            parameters: [{ type: "image", image: { link: images } }],
          },
          {
            type: "body",
            parameters: [{ type: "text", text: messageText }],
          },
        ],
      },
    };

    try {
      await fetch(process.env.WHATSAPP_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      })
        .then(async (response) => {
          console.log("Status: " + response.status);
          console.log("Headers: " + JSON.stringify(response.headers));

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          await updateMessageStatus(scheduleId, mobileNumber, 'sent');
          return data;
        }).catch((error) => {
          return error.message
        });
    } catch (error) {
      console.error(`Failed to send message to ${mobileNumber}:`, error);
    }
  }
};

const sendUtilityWhatsAppMessages = async (mobileNumbers, images, scheduleId, messageTitle, messageText) => {
  let cnt = 0;
  for (const mobileNumber of mobileNumbers) {
    const image = images[cnt++];

    const messageData = {
      messaging_product: "whatsapp",
      to: `+91${mobileNumber}`,
      type: "template",
      template: {
        name: CONSTANT.TEMPLATE_NAME.FOR_IMAGE,
        language: { code: "en" },
        components: [
          {
            type: "header",
            parameters: [{ type: "image", image: { link: image } }],
          },
          {
            type: "body",
            parameters: [{ type: "text", text: messageText }],
          },
        ],
      },
    };

    try {
      const response = await axios.post('https://graph.facebook.com/v19.0/{your_facebook_api_key}/messages', messageData, {
        headers: {
          'Authorization': `Bearer {your_facebook_api_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`Sent message to ${mobileNumber}: `, response.data);
      await updateMessageStatus(scheduleId, mobileNumber, 'sent');
    } catch (error) {
      console.error(`Failed to send message to ${mobileNumber}:`, error);
    }
  }
};

// Function to update message status in the database
const updateMessageStatus = async (scheduleId, mobileNumber, status) => {
  await MESSAGE_SCHEDULE.findByIdAndUpdate(scheduleId, { messageStatus: status });
};