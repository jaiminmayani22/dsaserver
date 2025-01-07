const CAMPAIGN_MODULE = require("../module/campaign.module");
const MESSAGE_LOG = require("../module/messageLog.module");
const RECEIVED_MESSAGE = require("../module/receivedMessage.module");
const CLIENT_MODULE = require("../module/client.module");
const REF_TEMPLATE_MODULE = require("../module/templateReferenceFormat.module");
const CONSTANT = require("../common/constant");
const commonService = require("../common/common");
const { validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs");
const { createCanvas, Image, loadImage } = require('canvas');
const fetch = require('node-fetch');
const dotenv = require("dotenv");
dotenv.config();

/*
Method: Post
Todo: Message Schedule Marketting 
*/
exports.createCampaignMarketing = async (req, res, folder) => {
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
      commonService.marketingUploadFunction(folder, req, res, async (err, files) => {
        const { userId, _ } = commonService.getUserIdFromToken(req);
        let obj = { ...req.body, addedBy: userId };

        if (files && files[0]) {
          obj[CONSTANT.FIELD.DOCUMENT] = files[0];
          obj[CONSTANT.FIELD.DOCUMENT][CONSTANT.COMMON.URL] =
            process.env.BACKEND_URL +
            folder +
            "/" +
            files[0][CONSTANT.COMMON.FILE_NAME];
        }
        const existing = await CAMPAIGN_MODULE.findOne({ name: obj.name });
        if (existing) {
          return res.status(500).json({
            message: CONSTANT.MESSAGE.CAMPAIGN_EXIST_ERROR,
          });
        }
        let data = {
          name: obj.name,
          type: obj.type,
          audience: obj.audience,
          messageType: obj.messageType,
          documentType: obj.documentType,
          caption: obj.caption,
          button: obj?.button,
          added: obj.addedBy,
          document: obj.document,
        };

        if (data.type === 'schedule') {
          data.schedule = obj.schedule;
        }

        let count;
        let clientIds = [];

        switch (data.audience) {
          case "allContacts":
            const allClients = await CLIENT_MODULE.find({ isDeleted: false }, { _id: 1 });
            count = allClients.length;
            clientIds = allClients.map(client => client._id);
            break;

          case "group":
            const groupArray = obj.groups.split(',').map(groupId => groupId.trim());
            const groupRegex = new RegExp(groupArray.map(groupId => `(^|,)${groupId}(,|$)`).join('|'));

            const groupClients = await CLIENT_MODULE.find({ groupId: groupRegex, isDeleted: false }, { _id: 1 });
            count = groupClients.length;
            clientIds = groupClients.map(client => client._id);
            data.groups = obj.groups;
            break;

          case "favoriteContacts":
            const favoriteClients = await CLIENT_MODULE.find({ isFavorite: 'yes', isDeleted: false }, { _id: 1 });
            count = favoriteClients.length;
            clientIds = favoriteClients.map(client => client._id);
            break;

          case "quickAudience":
            const contactArray = obj.quickAudience.split(',').map(contact => contact.trim());
            const numberRegex = new RegExp(
              contactArray.map(number => `(^|,)\\${number}(,|$)`).join('|')
            );

            const contacts = await CLIENT_MODULE.find(
              {
                whatsapp_number: { $regex: numberRegex, $options: 'i' }, // Case-insensitive match
                isDeleted: false,
              },
              { _id: 1 }
            );

            count = contacts.length;
            clientIds = contacts.map(client => client._id);
            break;

          default:
            break;
        }

        data.countAudience = count;
        data.audienceIds = clientIds;

        CAMPAIGN_MODULE.create({ ...data })
          .then(async (response) => {
            if (commonService.isValidObjId(response._id)) {
              if (obj.send === "yes") {
                try {
                  await sendInstantMessage({ body: response }, res);
                } catch (error) {
                  return res.status(500).json({
                    message: CONSTANT.MESSAGE.ERROR_OCCURRED_SENDING,
                    error: error.message,
                  });
                }
              } else {
                return res.status(200).json({
                  message:
                    CONSTANT.COLLECTION.CAMPAIGN +
                    CONSTANT.MESSAGE.CREATE_SUCCESSFULLY,
                  data: response,
                });
              }
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
Method: Post
Todo: Message Schedule Marketting 
*/
exports.createCampaignUtility = async (req, res, folder) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      const folder = CONSTANT.UPLOAD_DOC_PATH.SCHEDULE_UTILITY;
      commonService.marketingUploadFunction(folder, req, res, async (err, files) => {
        const { userId, _ } = commonService.getUserIdFromToken(req);
        let obj = { ...req.body, addedBy: userId };

        if (files && files[0]) {
          obj[CONSTANT.FIELD.DOCUMENT] = files[0];
          obj[CONSTANT.FIELD.DOCUMENT][CONSTANT.COMMON.URL] =
            process.env.BACKEND_URL +
            folder +
            "/" +
            files[0][CONSTANT.COMMON.FILE_NAME];
        }

        let data = {
          name: obj.name,
          type: obj.type,
          audience: obj.audience,
          messageType: obj.messageType,
          caption: obj.caption,
          button: obj.button,
          added: obj.addedBy,
          document: obj.document,
          addedBy: obj.addedBy,
          selectedRefTemplate: obj.selectedRefTemplate,
        };

        if (data.type === 'schedule') {
          data.schedule = obj.schedule;
        }

        let count;
        let clientIds = [];

        switch (data.audience) {
          case "allContacts":
            const allClients = await CLIENT_MODULE.find({ isDeleted: false }, { _id: 1 });
            count = allClients.length;
            clientIds = allClients.map(client => client._id);
            break;

          case "group":
            const groupArray = obj.groups.split(',').map(groupId => groupId.trim());
            const groupRegex = new RegExp(groupArray.map(groupId => `(^|,)${groupId}(,|$)`).join('|'));

            const groupClients = await CLIENT_MODULE.find({ groupId: groupRegex, isDeleted: false }, { _id: 1 });
            count = groupClients.length;
            clientIds = groupClients.map(client => client._id);
            data.groups = obj.groups;
            break;

          case "favoriteContacts":
            const favoriteClients = await CLIENT_MODULE.find({ isFavorite: 'yes', isDeleted: false }, { _id: 1 });
            count = favoriteClients.length;
            clientIds = favoriteClients.map(client => client._id);
            break;

          case "quickAudience":
            const contactArray = obj.quickAudience.split(',').map(contact => contact.trim());
            const numberRegex = new RegExp(
              contactArray.map(number => `(^|,)\\${number}(,|$)`).join('|')
            );

            const contacts = await CLIENT_MODULE.find(
              {
                whatsapp_number: { $regex: numberRegex, $options: 'i' }, // Case-insensitive match
                isDeleted: false,
              },
              { _id: 1 }
            );

            count = contacts.length;
            clientIds = contacts.map(client => client._id);
            break;

          default:
            break;
        }

        data.countAudience = count;
        data.audienceIds = clientIds;

        CAMPAIGN_MODULE.create({ ...data })
          .then(async (response) => {
            if (commonService.isValidObjId(response._id)) {
              if (obj.send === "yes") {
                try {
                  await sendInstantMessage({ body: response }, res);
                } catch (error) {
                  return res.status(500).json({
                    message: CONSTANT.MESSAGE.ERROR_OCCURRED_SENDING,
                    error: error.message,
                  });
                }
              } else {
                return res.status(200).json({
                  message:
                    CONSTANT.COLLECTION.CAMPAIGN +
                    CONSTANT.MESSAGE.CREATE_SUCCESSFULLY,
                  data: response,
                });
              }
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

exports.duplicateCampaign = async (req, res) => {
  const { id } = req.params;
  const name = req.body.name;
  try {
    const originalCampaign = await CAMPAIGN_MODULE.findById(id);
    if (!originalCampaign) {
      return res.status(404).json({ message: "Original campaign not found" });
    }

    const existCampaign = await CAMPAIGN_MODULE.find({ name: name, isDeleted: false });
    if (!existCampaign) {
      return res.status(403).json({ message: `Campaign With name "${name}" already Exist ! Please Use Different Name.` });
    }

    const { createdAt, updatedAt, _id, status, receiver, overallHealth, phonenumberHealth, wabaHealth, businessHealth, ...rest } = originalCampaign.toObject();
    const duplicateData = { ...rest, name };
    const newCampaign = await CAMPAIGN_MODULE.create(duplicateData);

    res.status(200).json({
      message: "Duplicate campaign created successfully",
      data: newCampaign
    });
  } catch (error) {
    console.error("Error duplicating campaign:", error);
    res.status(500).json({ message: "Error duplicating campaign", error });
  }
};

/*
Method: Post
Todo: Retarget Campaign
*/
exports.createRetargetCampaign = async (req, res) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      const { userId, _ } = commonService.getUserIdFromToken(req);
      let obj = req.body;
      const numbers = obj.audienceIds;
      const clients = await CLIENT_MODULE.find({
        whatsapp_number: { $in: numbers },
        isDeleted: false,
      });
      const ids = clients.map(client => client._id);

      let data = {
        name: obj.name,
        type: obj.type,
        audience: obj.audience,
        messageType: obj.messageType,
        caption: obj.caption,
        button: obj.button,
        addedBy: obj.addedBy,
        document: obj.document,
        addedBy: obj.addedBy,
        documentType: obj.documentType,
        selectedRefTemplate: obj.selectedRefTemplate,
        addedBy: userId,
        groups: obj.groups,
        audienceIds: ids,
        countAudience: ids.length,
      };
      if (data.type === 'schedule') {
        data.schedule = obj.schedule;
      }
      CAMPAIGN_MODULE.create({ ...data })
        .then(async (response) => {
          if (commonService.isValidObjId(response._id)) {
            if (req.body.trigger === true) {
              try {
                await sendInstantMessage({ body: response }, res);
              } catch (error) {
                return res.status(500).json({
                  message: CONSTANT.MESSAGE.ERROR_OCCURRED_SENDING,
                  error: error.message,
                });
              }
            } else {
              return res.status(200).json({
                message:
                  CONSTANT.COLLECTION.CAMPAIGN +
                  CONSTANT.MESSAGE.CREATE_SUCCESSFULLY,
                data: response,
              });
            }
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
    } catch (err) {
      return res.status(404).send({
        message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
      });
    }
  }
};

exports.campaignAudienceCount = async (req, res) => {
  try {
    const audience = req.body.audience;
    const groups = req.body.groups;
    let count;

    switch (audience) {
      case "allContacts":
        const allClients = await CLIENT_MODULE.find({ isDeleted: false }, { _id: 1 });
        count = allClients.length;
        break;

      case "group":
        const groupArray = groups.split(',').map(groupId => groupId.trim());
        const groupRegex = new RegExp(groupArray.map(groupId => `(^|,)${groupId}(,|$)`).join('|'));
        const groupClients = await CLIENT_MODULE.find({ groupId: groupRegex, isDeleted: false }, { _id: 1 });
        count = groupClients.length;
        break;

      case "favoriteContacts":
        const favoriteClients = await CLIENT_MODULE.find({ isFavorite: 'yes', isDeleted: false }, { _id: 1 });
        count = favoriteClients.length;
        break;

      default:
        break;
    }
    res.status(200).send({ message: CONSTANT.MESSAGE.FOUND_SUCCESSFULLY, data: count })
  } catch (error) {
    return res.status(500).send({
      message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
    });
  }
};

exports.getAllCampaigns = async (req, res) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      const campaigns = await CAMPAIGN_MODULE.aggregate([
        {
          $match: { isDeleted: false },
        },
        {
          $lookup: {
            from: "messagelog",
            let: { campaignId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$camId", { $toString: "$$campaignId" }] },
                      { $in: ["$status", ["sent", "delivered", "read"]] },
                      { $eq: ["$isDeleted", false] },
                    ],
                  },
                },
              },
            ],
            as: "logs",
          },
        },
        {
          $addFields: {
            successMessages: { $size: "$logs" },
          },
        },
        {
          $project: {
            logs: 0,
          },
        },
      ]);

      return res.status(200).send(campaigns);
    } catch (err) {
      return res.status(500).send({
        message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
      });
    }
  }
};

exports.getCampaignById = async (req, res) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      const _id = req.body._id;
      await CAMPAIGN_MODULE.findById(_id)
        .populate({
          path: 'audienceIds',
          model: 'clients',
          select: 'whatsapp_number name'
        })
        .populate({
          path: 'freezedAudienceIds',
          model: 'clients',
          select: 'whatsapp_number name'
        })
        .populate({
          path: 'selectedRefTemplate',
          model: 'templateReferenceFormat',
        })
        .then((response) => {
          return res.status(200).send(response);
        })
        .catch((err) => {
          return res.status(404).send({
            message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
          });
        });
    } catch (err) {
      return res.status(500).send({
        message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
      });
    }
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const { id } = req.body;
    const campaign = await CAMPAIGN_MODULE.deleteOne({ _id: id });
    if (!campaign) {
      return res.status(404).send({ message: CONSTANT.MESSAGE.CAMPAIGN_NOT_FOUND });
    }
    return res.status(200).json({
      message: CONSTANT.COLLECTION.TEMPLATE + CONSTANT.MESSAGE.DELETED_SUCCESSFULLY,
      data: campaign,
    });
  } catch (err) {
    return res.status(404).send({
      message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
    });
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
        res.status(200).send({ data: responseData, message: CONSTANT.MESSAGE.DATA_FOUND_SUCCESSFULLY });
      } else {
        res.status(200).send({ data: [], message: CONSTANT.MESSAGE.NO_MESSAGES });
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
              name: "$name",
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
            createdAt: -1,
          },
        },
      ]);

      const result = logs.map((log) => ({
        Campaigns: log._id.msgType,
        Title: log._id.name,
        Message: log._id.messageTitle,
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

// FUNCTIONS FOR WHATSAPP MESSAGE
const sendInstantMessage = async (req, res) => {
  try {
    const { _id, caption, messageType, document, audienceIds, documentType, freezedAudienceIds, freezedSend } = req.body;
    if (!_id || !messageType) {
      return res.status(400).json({ message: "Campaign ID and message type are required." });
    }

    const mobileNumbers = [];
    const freezedAudience = [];
    const oneHourAgo = Date.now() - 3600000;
    let clients;

    try {
      clients = await CLIENT_MODULE.find({
        _id: { $in: freezedSend === 'yes' ? freezedAudienceIds : audienceIds },
        isDeleted: false,
      });

      if (!clients.length) {
        return res.status(404).json({ message: "No valid clients found for the given audience IDs." });
      }
    } catch (dbError) {
      console.error("Error fetching clients:", dbError);
      return res.status(500).json({ message: "Database error while retrieving clients.", error: dbError.message });
    }

    try {
      for (const client of clients) {
        if (client.whatsapp_number) {
          const latestLog = await MESSAGE_LOG.findOne({ mobileNumber: client.whatsapp_number, isDeleted: false }).sort({ updatedAt: -1 });

          if (latestLog) {
            const isStatusInvalid = !['read', 'sent', 'delivered'].includes(latestLog.status);
            const isWithinLastHour =
              latestLog.updatedAt instanceof Date &&
              latestLog.updatedAt.getTime() > oneHourAgo &&
              latestLog.updatedAt.getTime() <= Date.now();

            if (isStatusInvalid && isWithinLastHour) {
              freezedAudience.push(client._id);
              continue;
            }
          }
          mobileNumbers.push(client.whatsapp_number);
        }
      }
    } catch (logError) {
      console.error("Error processing message logs:", logError);
      return res.status(500).json({ message: "Error while processing message logs.", error: logError.message });
    }

    try {
      await CAMPAIGN_MODULE.findByIdAndUpdate(_id, { freezedAudienceIds: freezedAudience.length ? freezedAudience : [] });
    } catch (updateError) {
      console.error("Error updating campaign:", updateError);
      return res.status(500).json({ message: "Failed to update campaign data.", error: updateError.message });
    }

    const imageUrl = document?.url || null;
    try {
      await CAMPAIGN_MODULE.findByIdAndUpdate(_id, { status: "processing" }, { new: true });
    } catch (statusUpdateError) {
      console.error("Error updating campaign status:", statusUpdateError);
      return res.status(500).json({ message: "Failed to update campaign status.", error: statusUpdateError.message });
    }

    if (messageType === 'marketing' && imageUrl) {
      try {
        await sendMarketingWhatsAppMessages(mobileNumbers, imageUrl, _id, caption, messageType, documentType);
        return res.status(200).json({ message: `${CONSTANT.COLLECTION.CAMPAIGN} ${CONSTANT.MESSAGE.CREATE_SENT_SUCCESSFULLY}` });
      } catch (error) {
        console.error("Error sending marketing messages:", error);
        await CAMPAIGN_MODULE.findByIdAndUpdate(_id, { status: "" }, { new: true });
        return res.status(500).json({ message: `${CONSTANT.COLLECTION.CAMPAIGN} ${CONSTANT.MESSAGE.SENT_FAILED}`, error: error.message });
      }
    }

    if (messageType === 'utility' && imageUrl) {
      try {
        const sendSuccess = await sendUtilityWhatsAppMessages(mobileNumbers, imageUrl, _id, caption, selectedRefTemplate, messageType);

        if (sendSuccess) {
          return res.status(200).json({ message: `${CONSTANT.COLLECTION.CAMPAIGN} ${CONSTANT.MESSAGE.CREATE_SENT_SUCCESSFULLY}` });
        } else {
          console.warn("Message sent but not confirmed for campaign:", req.body.name);
        }
      } catch (error) {
        console.error("Error sending utility messages:", error);
        await CAMPAIGN_MODULE.findByIdAndUpdate(_id, { status: "" }, { new: true });
        return res.status(500).json({ message: `${CONSTANT.COLLECTION.CAMPAIGN} ${CONSTANT.MESSAGE.SENT_FAILED}`, error: error.message });
      }
    }

    if (!imageUrl && caption) {
      try {
        await sendTextWhatsAppMessages(mobileNumbers, _id, caption, messageType);
        return res.status(200).json({ message: `${CONSTANT.COLLECTION.CAMPAIGN} ${CONSTANT.MESSAGE.CREATE_SENT_SUCCESSFULLY}` });
      } catch (error) {
        console.error("Error sending text messages:", error);
        await CAMPAIGN_MODULE.findByIdAndUpdate(_id, { status: "" }, { new: true });
        return res.status(500).json({ message: `${CONSTANT.COLLECTION.CAMPAIGN} ${CONSTANT.MESSAGE.SENT_FAILED}`, error: error.message });
      }
    }

    return res.status(400).json({ message: "Invalid messageType or missing required parameters." });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ message: "An unexpected error occurred.", error: error.message });
  }
};
exports.sendMessage = sendInstantMessage;

const updateCampaignStatus = async (_id, status) => {
  try {
    await CAMPAIGN_MODULE.findByIdAndUpdate(_id, { status: status }, { new: true });
  } catch (updateError) {
    console.log(`Failed to update status for campaign ${_id} : `, updateError);
  }
};

const stripHtmlTags = (htmlContent) => {
  return htmlContent.replace(/<\/?[^>]+(>|$)/g, "");
};

const sendMarketingWhatsAppMessages = async (mobileNumbers, images, _id, caption, messageType, documentType) => {
  try {
    for (const mobileNumber of mobileNumbers) {
      try {
        const messageData = prepareMessageData(mobileNumber, images, caption, documentType);
        await whatsappAPISend(messageData, _id, messageType, caption);
      } catch (error) {
        console.log(`Failed to send message to ${mobileNumber} : `, error);
      }
    };
  } catch (error) {
    console.log(`Error in sending WhatsApp messages for campaign ${_id} : `, error);
  } finally {
    try {
      await updateCampaignStatus(_id, "completed");
    } catch (updateError) {
      console.log(`Failed to update campaign status for campaign ${_id} : `, updateError);
    }
  }
};

const prepareMessageData = (mobileNumber, images, caption, documentType) => {
  const baseTemplate = {
    messaging_product: "whatsapp",
    recepient_type: "individual",
    to: mobileNumber,
    type: "template",
    template: {
      language: { code: "en" },
      components: [
        { type: "body", parameters: [{ type: "text", text: caption || "Hello" }] },
      ],
    },
  };

  if (documentType === "image") {
    baseTemplate.template.name = CONSTANT.TEMPLATE_NAME.FOR_UTILITY;
    baseTemplate.template.components.unshift({
      type: "header",
      parameters: [{ type: "image", image: { link: images } }],
    });
  } else if (documentType === "video") {
    baseTemplate.template.name = CONSTANT.TEMPLATE_NAME.FOR_VIDEO;
    baseTemplate.template.components.unshift({
      type: "header",
      parameters: [{ type: "video", video: { link: images } }],
    });
  } else if (documentType === "document") {
    baseTemplate.template.name = CONSTANT.TEMPLATE_NAME.FOR_DOCUMENT;
    baseTemplate.template.components.unshift({
      type: "header",
      parameters: [{ type: "document", document: { link: images } }],
    });
  } else {
    baseTemplate.template.name = CONSTANT.TEMPLATE_NAME.FOR_ONLY_TEXT;
  }
  return baseTemplate;
};

const sendTextWhatsAppMessages = async (mobileNumbers, _id, caption, messageType) => {
  try {
    for (const mobileNumber of mobileNumbers) {
      try {
        const messageData = {
          messaging_product: "whatsapp",
          recepient_type: "individual",
          to: `${mobileNumber}`,
          type: "template",
          template: {
            name: CONSTANT.TEMPLATE_NAME.FOR_ONLY_TEXT,
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: caption || "Hello" }],
              },
            ],
          },
        };

        await whatsappAPISend(messageData, _id, messageType, caption);
      } catch (error) {
        console.log(`Failed to send message to ${mobileNumber}:`, error);
      }
    }
  } catch (error) {
    console.log(`Error in sending WhatsApp messages for campaign ${_id}:`, error);
  } finally {
    try {
      await updateCampaignStatus(_id, "completed");
    } catch (updateError) {
      console.log(`Failed to update campaign status for campaign ${_id}:`, updateError);
    }
  }
};

const editUtilityImage = async ({
  username,
  number,
  company_name,
  email,
  instagramID,
  facebookID,
  logoImage,
  userWebsite,
  selectedRefTemplate,
  imagePath,
  city,
  district,
  address,
  _id }) => {

  try {
    const tempFolder = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder);
    }

    let mainImage;
    try {
      const response = await fetch(imagePath);
      if (response.ok) {
        const buffer = await response.buffer();
        mainImage = await loadImage(buffer);
      }
    } catch (err) {
      throw new Error('Failed to load main image: ' + err.message);
    }

    const canvas = createCanvas(mainImage.width, mainImage.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(mainImage, 0, 0, mainImage.width, mainImage.height);

    const layers = selectedRefTemplate.layers;

    for (const layer of layers) {
      const {
        type,
        content,
        x,
        y,
        fontSize = '24px', // Default font size
        fontWeight = 'normal', // Default font weight
        fontStyle = 'normal', // Default font style
        fontFamily = 'Times New Roman', // Default font family
        textDecoration = 'none', // Default text decoration
        fillColor = 'black', // Default text color
        textAlign = 'center', // Default text alignment
        textBaseline = 'center', // Default text baseline
      } = layer;

      if (type === 'text') {
        let updatedContent = content;

        const replacements = {
          name: username || '',
          number: number || '',
          instagramId: instagramID || '',
          facebookId: facebookID || '',
          company_name: company_name || '',
          email: email || '',
          city: city || '',
          district: district || '',
          address: address || '',
          website: userWebsite || '',
        };

        for (const [key, value] of Object.entries(replacements)) {
          const regex = new RegExp(key, 'i');
          updatedContent = updatedContent.replace(regex, value);
        }

        if (/logo/i.test(content)) {
          if (logoImage) {
            try {
              const logoResponse = await fetch(logoImage);
              if (logoResponse.ok) {
                const logoBuffer = await logoResponse.buffer();
                const logoImageLoaded = await loadImage(logoBuffer);

                if (logoImageLoaded) {
                  const originalWidth = logoImageLoaded.width;
                  const originalHeight = logoImageLoaded.height;
                  let logoWidth, logoHeight;

                  if (originalWidth > originalHeight) {
                    logoWidth = parseFloat(fontSize);
                    logoHeight = (originalHeight / originalWidth) * logoWidth;
                  } else {
                    logoHeight = parseFloat(fontSize);
                    logoWidth = (originalWidth / originalHeight) * logoHeight;
                  }

                  if (logoHeight !== 140) {
                    logoHeight = 160;
                    logoWidth = (originalWidth / originalHeight) * logoHeight;
                  }

                  const drawX = x - logoWidth / 2;
                  const drawY = y - logoHeight / 2;

                  ctx.drawImage(logoImageLoaded, drawX, drawY, logoWidth, logoHeight);

                  updatedContent = updatedContent.replace(/logo/i, '');
                }
              }
            } catch (error) {
              console.error('Error loading logo image:', error);
            }
          } else {
            updatedContent = updatedContent.replace(/logo/i, '');
          }
        }

        ctx.font = `${fontWeight} ${fontStyle} ${parseFloat(fontSize)}px ${fontFamily}`;
        ctx.fillStyle = fillColor;
        ctx.textAlign = textAlign;
        ctx.textBaseline = textBaseline;

        if (updatedContent) {
          if (textDecoration === 'underline') {
            const textWidth = ctx.measureText(stripHtmlTags(updatedContent)).width;
            const lineHeight = parseFloat(fontSize);
            ctx.fillText(stripHtmlTags(updatedContent), x, y);

            ctx.beginPath();
            ctx.moveTo(x - textWidth / 2, y + lineHeight / 2);
            ctx.lineTo(x + textWidth / 2, y + lineHeight / 2);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.stroke();
          } else {
            ctx.fillText(stripHtmlTags(updatedContent), x, y);
          }
        }
      }
    }

    const sanitizedNumber = number.replace('+', '');
    const uploadPath = path.resolve(__dirname, '..', CONSTANT.UPLOAD_DOC_PATH.SCHEDULE_UTILITY_EDITED);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    const tempImagePath = path.join(uploadPath, `${_id}_${sanitizedNumber}.jpeg`);
    const buffer = canvas.toBuffer('image/jpeg');
    if (buffer.length === 0) {
      console.log('The buffer is empty, cannot write to file.');
    }
    fs.writeFileSync(tempImagePath, buffer);
    return tempImagePath;
  } catch (err) {
    console.log('Failed to process image: ' + err.message);
  }
};

const sendUtilityWhatsAppMessages = async (mobileNumbers, images, _id, caption, selectedRefTemplate, messageType) => {
  try {
    const refTemplate = await REF_TEMPLATE_MODULE.findById(selectedRefTemplate);
    if (!refTemplate) {
      console.log("Template not found");
    }

    for (const mobileNumber of mobileNumbers) {
      try {
        const user = await CLIENT_MODULE.find({ whatsapp_number: mobileNumber });
        if (!user || user.length === 0) {
          console.log(`User not found for mobile number: ${mobileNumber}`);
          continue;
        }

        const tempImagePath = await editUtilityImage({
          username: user[0].name,
          number: mobileNumber,
          company_name: user[0].company_name,
          email: user[0].email,
          instagramID: user[0].instagramID,
          facebookID: user[0].facebookID,
          profilePicUrl: user[0].profile_picture?.url,
          logoImage: user[0].company_profile_picture?.url,
          userWebsite: user[0].website,
          selectedRefTemplate: refTemplate,
          imagePath: images,
          city: user[0].city,
          district: user[0].district,
          address: user[0].address,
          _id: _id,
        });

        const absoluteTempImagePath = path.resolve(tempImagePath);
        const imageUrl =
          `${process.env.BACKEND_URL}` +
          CONSTANT.UPLOAD_DOC_PATH.SCHEDULE_UTILITY_EDITED +
          "/" +
          `${path.basename(absoluteTempImagePath)}`;

        const messageData = {
          messaging_product: "whatsapp",
          recepient_type: "individual",
          to: `${mobileNumber}`,
          type: "template",
          template: {
            name: CONSTANT.TEMPLATE_NAME.FOR_UTILITY,
            language: { code: "en" },
            components: [
              {
                type: "header",
                parameters: [{ type: "image", image: { link: imageUrl } }],
              },
              {
                type: "body",
                parameters: [{ type: "text", text: caption || "" }],
              },
            ],
          },
        };

        await whatsappAPISend(messageData, _id, messageType, caption);
      } catch (error) {
        console.log(`Failed to process mobile number ${mobileNumber}:`, error);
      }
    }
    await updateCampaignStatus(_id, "completed");
    return true;
  } catch (error) {
    console.log(`Failed to send WhatsApp messages for campaign ${_id}:`, error);
  }
};

const whatsappAPISend = async (messageData, _id, messageType, caption) => {
  try {
    await CAMPAIGN_MODULE.findByIdAndUpdate(_id, { $inc: { process: 1 } }, { new: true });

    const response = await fetch(process.env.WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });

    const data = await response.json();
    if (!response.ok) {
      console.log(`WhatsApp API Error : ${data.message || 'Unknown error'}`);
      return false;
    }

    const obj = {
      camId: _id,
      mobileNumber: data.contacts?.[0]?.input,
      waMessageId: data.messages?.[0]?.id,
      status: data.messages?.[0]?.message_status,
      msgType: messageType,
      messageTitle: caption,
    };

    const existingLog = await MESSAGE_LOG.findOne({
      camId: obj.camId,
      mobileNumber: obj.mobileNumber,
      waMessageId: obj.waMessageId,
      msgType: obj.msgType,
    });

    try {
      if (existingLog) {
        await MESSAGE_LOG.updateOne(
          { _id: existingLog._id },
          {
            $set: {
              status: obj.status,
              messageTitle: obj.messageTitle,
            },
          },
          { new: true }
        );
      } else {
        await MESSAGE_LOG.create({
          ...obj
        });
      }
      return true;
    } catch (error) {
      console.log("Error updating or creating message log : ", error.message);
      return false;
    }
  } catch (error) {
    console.log(`Failed to send message for campaign ${_id} : `, error.message || error);
    return false;
  }
};

exports.getMessagesForCampaign = async (req, res) => {
  try {
    const { _id: campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
        errors: ["Campaign ID is required"],
      });
    }

    const logs = await MESSAGE_LOG.aggregate([
      {
        $match: { camId: campaignId },
      },
      {
        $lookup: {
          from: "clients",
          localField: "mobileNumber",
          foreignField: "whatsapp_number",
          as: "clientInfo",
        },
      },
      {
        $unwind: {
          path: "$clientInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "clientInfo.isDeleted": { $ne: true },
        },
      },
      {
        $project: {
          _id: 1,
          camId: 1,
          mobileNumber: 1,
          waMessageId: 1,
          status: 1,
          reason: 1,
          msgType: 1,
          messageTitle: 1,
          isDeleted: 1,
          createdAt: 1,
          updatedAt: 1,
          clientName: "$clientInfo.name",
        },
      },
    ]);

    return res.status(200).json({
      message: CONSTANT.MESSAGE.DATA_FOUND_SUCCESSFULLY,
      data: logs,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
    });
  }
};

exports.removeDuplicateLogs = async (req, res) => {
  try {
    const duplicates = await MESSAGE_LOG.aggregate([
      {
        $sort: { updatedAt: -1 },
      },
      {
        $group: {
          _id: {
            camId: "$camId",
            mobileNumber: "$mobileNumber",
          },
          ids: { $push: "$_id" },
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ]);

    if (duplicates.length === 0) {
      return res.status(200).send({
        message: "No duplicates found. Table is already clean.",
      });
    }

    let deletedCount = 0;

    for (const group of duplicates) {
      const [keepId, ...deleteIds] = group.ids;
      const result = await MESSAGE_LOG.deleteMany({
        _id: { $in: deleteIds },
      });
      deletedCount += result.deletedCount;
    }

    res.status(200).send({
      message: "Duplicate removal complete.",
      totalDuplicatesDeleted: deletedCount,
    });
  } catch (error) {
    console.log("Error deleting duplicates:", error);
    res.status(500).send({
      message: "Error deleting duplicates.",
      error: error.message,
    });
  }
};