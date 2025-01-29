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
            const groupRegex = new RegExp(
              groupArray.map(groupId => `(^|,\\s*)${groupId}(,|\\s*|$)`).join('|')
            );
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
            const groupRegex = new RegExp(
              groupArray.map(groupId => `(^|,\\s*)${groupId}(,|\\s*|$)`).join('|')
            );
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
        const groupRegex = new RegExp(
          groupArray.map(groupId => `(^|,\\s*)${groupId}(,|\\s*|$)`).join('|')
        );
        const groupClients = await CLIENT_MODULE.find({ groupId: groupRegex, isDeleted: false }, { _id: 1 });
        count = await groupClients.length;
        break;

      case "favoriteContacts":
        const favoriteClients = await CLIENT_MODULE.find({ isFavorite: 'yes', isDeleted: false }, { _id: 1 });
        count = favoriteClients.length;
        break;

      default:
        break;
    }
    res.status(200).send({ message: CONSTANT.MESSAGE.FOUND_SUCCESSFULLY, data: count })
  } catch (err) {
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
      const {
        limit = 10,
        pageCount = 1,
        search = "",
        sortingField = "createdAt",
        sortingOrder = "desc",
        filter = {},
      } = req.body;

      const pageSize = parseInt(limit) || 10;
      const pageNo = parseInt(pageCount) || 1;
      const skip = pageSize * (pageNo - 1);
      const sortOrder = sortingOrder === "desc" ? -1 : 1;

      let query = { isDeleted: false };

      if (search) {
        query.name = { $regex: new RegExp(search.trim(), "i") };
      }

      if (filter) {
        if (filter.type) {
          query.type = filter.type;
        }
        if (filter.freezedAudienceIds === true) {
          query.freezedAudienceIds = { $exists: true, $ne: [] };
        }
        if (filter.nameEndsWith) {
          query.name = { $regex: `${filter.nameEndsWith}$`, $options: "i" };
        }
      }

      const [campaigns, totalRecords] = await Promise.all([
        CAMPAIGN_MODULE.find(query)
          .sort({ [sortingField]: sortOrder })
          .skip(skip)
          .limit(pageSize),
        CAMPAIGN_MODULE.countDocuments(query),
      ]);
      const totalPages = Math.ceil(totalRecords / pageSize);
      return res.status(200).send({
        message: CONSTANT.MESSAGE.DATA_FOUND,
        pageSize: pageSize,
        pageNo: pageNo,
        totalPages: totalPages,
        totalRecords: totalRecords,
        data: campaigns,
      });
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
const sendInstantMessage = async (req, res, cron) => {
  try {
    const { _id, caption, messageType, document, audienceIds, documentType, freezedAudienceIds, freezedSend, selectedRefTemplate } = req.body;
    if (!_id || !messageType) {
      if (cron !== true && res) {
        return res.status(400).json({ message: "Campaign ID and message type are required." });
      } else {
        console.error("Campaign ID and message type are required.");
        return;
      }
    }

    let mobileNumbers = [];
    let freezedAudience = [];
    const oneHourAgo = Date.now() - 3600000;
    let clients;

    try {
      clients = await CLIENT_MODULE.find({
        _id: { $in: freezedSend === 'yes' ? freezedAudienceIds : audienceIds },
        isDeleted: false,
      });

      if (!clients.length) {
        if (cron !== true && res) {
          return res.status(404).json({ message: "No valid clients found for the given audience IDs." });
        } else {
          console.error("No valid clients found for the given audience IDs.");
          return;
        }
      }
    } catch (dbError) {
      if (cron !== true && res) {
        return res.status(500).json({ message: "Database error while retrieving clients.", error: dbError.message });
      } else {
        console.error("Error fetching clients:", dbError);
        return;
      }
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
      if (cron !== true && res) {
        return res.status(500).json({ message: "Error while processing message logs.", error: logError.message });
      } else {
        console.error("Error processing message logs:", logError);
        return;
      }
    }

    try {
      await CAMPAIGN_MODULE.findByIdAndUpdate(_id, { freezedAudienceIds: freezedAudience.length ? freezedAudience : [] });
    } catch (updateError) {
      if (cron !== true && res) {
        return res.status(500).json({ message: "Failed to update campaign data.", error: updateError.message });
      } else {
        console.error("Error updating campaign:", updateError);
        return;
      }
    }

    const imageUrl = document?.url || null;
    try {
      await CAMPAIGN_MODULE.findByIdAndUpdate(_id, { status: "processing" }, { new: true });
    } catch (statusUpdateError) {
      if (cron !== true && res) {
        return res.status(500).json({ message: "Failed to update campaign status.", error: statusUpdateError.message });
      } else {
        console.error("Failed to update campaign status:", statusUpdateError);
        return;
      }
    }
    mobileNumbers = [...new Set(mobileNumbers)];

    if (messageType === 'marketing' && imageUrl) {
      try {
        await sendMarketingWhatsAppMessages(mobileNumbers, imageUrl, _id, caption, messageType, documentType);
        if (cron !== true && res) {
          return res.status(200).json({ message: `${CONSTANT.COLLECTION.CAMPAIGN} ${CONSTANT.MESSAGE.CREATE_SENT_SUCCESSFULLY}` });
        } else {
          console.log("Campaign sent succesfully : ", _id, caption);
          return;
        }
      } catch (error) {
        await CAMPAIGN_MODULE.findByIdAndUpdate(_id, { status: "" }, { new: true });
        if (cron !== true && res) {
          return res.status(500).json({ message: `${CONSTANT.COLLECTION.CAMPAIGN} ${CONSTANT.MESSAGE.SENT_FAILED}`, error: error.message });
        } else {
          console.error("Error sending marketing messages:", error);
          return;
        }
      }
    }

    if (messageType === 'utility' && imageUrl) {
      try {
        const sendSuccess = await sendUtilityWhatsAppMessages(mobileNumbers, imageUrl, _id, caption, selectedRefTemplate, messageType);

        if (sendSuccess) {
          if (cron !== true && res) {
            return res.status(200).json({ message: `${CONSTANT.COLLECTION.CAMPAIGN} ${CONSTANT.MESSAGE.CREATE_SENT_SUCCESSFULLY}` });
          } else {
            console.log("Campaign sent succesfully : ", _id, caption);
            return;
          }
        } else {
          console.warn("Message sent but not confirmed for campaign:", req.body.name);
          return;
        }
      } catch (error) {
        await CAMPAIGN_MODULE.findByIdAndUpdate(_id, { status: "" }, { new: true });
        if (cron !== true && res) {
          return res.status(500).json({ message: `${CONSTANT.COLLECTION.CAMPAIGN} ${CONSTANT.MESSAGE.SENT_FAILED}`, error: error.message });
        } else {
          console.error("Error sending utility messages:", error);
          return;
        }
      }
    }

    if (!imageUrl && caption) {
      try {
        await sendTextWhatsAppMessages(mobileNumbers, _id, caption, messageType);
        if (cron !== true && res) {
          return res.status(200).json({ message: `${CONSTANT.COLLECTION.CAMPAIGN} ${CONSTANT.MESSAGE.CREATE_SENT_SUCCESSFULLY}` });
        } else {
          console.log("Campaign sent successfully : ", _id, caption);
          return;
        }
      } catch (error) {
        await CAMPAIGN_MODULE.findByIdAndUpdate(_id, { status: "" }, { new: true });
        if (cron !== true && res) {
          return res.status(500).json({ message: `${CONSTANT.COLLECTION.CAMPAIGN} ${CONSTANT.MESSAGE.SENT_FAILED}`, error: error.message });
        } else {
          console.error("Error sending text messages:", error);
          return;
        }
      }
    }

    if (cron !== true && res) {
      return res.status(400).json({ message: "Invalid messageType or missing required parameters." });
    } else {
      console.error("Invalid message type or missing required parameters.");
      return;
    }
  } catch (error) {
    if (cron !== true && res) {
      return res.status(500).json({ message: "An unexpected error occurred.", error: error.message });
    } else {
      console.error("An unexpected error occurred:", error);
      return;
    }
  }
};
exports.sendMessage = sendInstantMessage;

const updateCampaignStatus = async (_id, status) => {
  if (!_id) {
    console.log("Error: Cannot update status because campaign _id is missing.");
    return;
  }

  try {
    const updatedCampaign = await CAMPAIGN_MODULE.findByIdAndUpdate(_id, { status: status }, { new: true });
    if (!updatedCampaign) {
      console.log(`Warning: No campaign found with ID ${_id}, status update skipped.`);
    }
  } catch (updateError) {
    console.log(`Failed to update status for campaign ${_id}:`, updateError);
  }
};

const stripHtmlTags = (htmlContent) => {
  return htmlContent.replace(/<\/?[^>]+(>|$)/g, "");
};

const sendMarketingWhatsAppMessages = async (mobileNumbers, images, _id, caption, messageType, documentType) => {
  try {
    for (const mobileNumber of mobileNumbers) {
      try {
        const messageData = await prepareMessageData(mobileNumber, images, caption, documentType);
        if (!messageData) {
          console.error(`Failed to prepare payload for mobile number: ${mobileNumber}`);
          continue;
        }

        const isSuccess = await whatsappAPISend(messageData, _id, messageType, caption);
        if (isSuccess) {
          console.log(`Message sent successfully to: ${mobileNumber}`);
        } else {
          console.error(`Failed to send message to: ${mobileNumber}`);
          continue;
        }
      } catch (error) {
        console.log(`Failed to send message to ${mobileNumber} : `, error);
      }
    };
  } catch (error) {
    console.log(`Error in sending WhatsApp messages for campaign ${_id} : `, error);
  } finally {
    if (_id) {
      try {
        await updateCampaignStatus(_id, "completed");
      } catch (updateError) {
        console.log(`Failed to update campaign status for campaign ${_id}:`, updateError);
      }
    } else {
      console.log("Warning: Cannot update campaign status because _id is undefined.");
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
    const processedNumbers = new Set();
    for (const mobileNumber of mobileNumbers) {
      if (processedNumbers.has(mobileNumber)) {
        console.log(`Skipping already processed number: ${mobileNumber}`);
        continue;
      }

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

        const isSuccess = await whatsappAPISend(messageData, _id, messageType, caption);
        if (isSuccess) {
          console.log(`Message sent successfully to: ${mobileNumber}`);
        } else {
          console.log(`Message failed to send to: ${mobileNumber}`);
        }

        processedNumbers.add(mobileNumber);
      } catch (error) {
        console.log(`Failed to send message to ${mobileNumber}:`, error);
        processedNumbers.add(mobileNumber);
      }
    }
  } catch (error) {
    console.log(`Error in sending WhatsApp messages for campaign ${_id}:`, error);
  } finally {
    if (_id) {
      try {
        await updateCampaignStatus(_id, "completed");
      } catch (updateError) {
        console.log(`Failed to update campaign status for campaign ${_id}:`, updateError);
      }
    } else {
      console.log("Warning: Cannot update campaign status because _id is undefined.");
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
        calculatedx,
        calculatedy,
        size = '24', // Default font size
        fontWeight = 'normal', // Default font weight
        fontStyle = 'normal', // Default font style
        fontFamily = 'Times New Roman', // Default font family
        textDecoration = 'none', // Default text decoration
        fillColor = 'black', // Default text color
        textAlign = 'center', // Default text alignment
        textBaseline = 'middle', // Default text baseline
      } = layer;

      if (type === 'text') {
        let updatedContent = content;

        const replacements = {
          company_name: company_name || '',
          name: username || '',
          number: number || '',
          instagramId: instagramID || '',
          facebookId: facebookID || '',
          email: email || '',
          city: city || '',
          district: district || '',
          address: address || '',
          website: userWebsite || '',
        };

        const sortedKeys = Object.keys(replacements).sort((a, b) => b.length - a.length);

        for (const key of sortedKeys) {
          const value = replacements[key];
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
                    logoWidth = parseFloat(size);
                    logoHeight = (originalHeight / originalWidth) * logoWidth;
                  } else {
                    logoHeight = parseFloat(size);
                    logoWidth = (originalWidth / originalHeight) * logoHeight;
                  }

                  // if (logoHeight !== 140) {
                  //   logoHeight = 160;
                  //   logoWidth = (originalWidth / originalHeight) * logoHeight;
                  // }
                  const drawX = calculatedx - logoWidth / 2;
                  const drawY = calculatedy - logoHeight / 2;

                  ctx.drawImage(logoImageLoaded, drawX, drawY, logoWidth, logoHeight);

                  updatedContent = updatedContent.replace(/logo/i, '');
                }
              } else {
                console.error('Failed to fetch logo image:', logoResponse.statusText);
              }
            } catch (error) {
              console.error('Error loading logo image:', error);
            }
          }

          updatedContent = updatedContent.replace(/logo/i, '');
        }

        ctx.font = `${fontWeight} ${fontStyle} ${parseFloat(size)}px ${fontFamily}`;
        ctx.fillStyle = fillColor;
        ctx.textAlign = textAlign;
        ctx.textBaseline = textBaseline;

        if (updatedContent) {
          if (textDecoration === 'underline') {
            const textWidth = ctx.measureText(stripHtmlTags(updatedContent)).width;
            const lineHeight = parseFloat(size);
            ctx.fillText(stripHtmlTags(updatedContent), calculatedx, calculatedy);

            ctx.beginPath();
            ctx.moveTo(calculatedx - textWidth / 2, calculatedy + lineHeight / 2);
            ctx.lineTo(calculatedx + textWidth / 2, calculatedy + lineHeight / 2);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.stroke();
          } else {
            ctx.fillText(stripHtmlTags(updatedContent), calculatedx, calculatedy);
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

    const processedNumbers = new Set();
    for (const mobileNumber of mobileNumbers) {
      if (processedNumbers.has(mobileNumber)) {
        console.log(`Skipping already processed number: ${mobileNumber}`);
        continue;
      }

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

        const isSuccess = await whatsappAPISend(messageData, _id, messageType, caption);
        if (isSuccess) {
          console.log(`Message sent successfully to: ${mobileNumber}`);
        } else {
          console.log(`Message failed to send to: ${mobileNumber}`);
        }

        processedNumbers.add(mobileNumber);
      } catch (error) {
        console.log(`Failed to process mobile number ${mobileNumber}:`, error);
        processedNumbers.add(mobileNumber);
      }
    }
    if (_id) {
      try {
        await updateCampaignStatus(_id, "completed");
      } catch (updateError) {
        console.log(`Failed to update campaign status for campaign ${_id}:`, updateError);
      }
    } else {
      console.log("Warning: Cannot update campaign status because _id is undefined.");
    }
    return true;
  } catch (error) {
    console.log(`Failed to send WhatsApp messages for campaign ${_id}:`, error);
  }
};

const whatsappAPISend = async (messageData, _id, messageType, caption) => {
  try {
    const existingLog = await MESSAGE_LOG.findOne({
      camId: _id,
      mobileNumber: messageData.to,
      msgType: messageType,
    });

    if (existingLog) {
      console.log(`Message already sent to ${messageData.to} for campaign ${_id}, skipping.`);
      return false;
    }

    const response = await fetch(process.env.WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });

    const data = await response.json();
    if (!response.ok || (!Array.isArray(data.contacts) || !Array.isArray(data.messages) || !data.contacts.length || !data.messages.length)) {
      console.error(
        `WhatsApp API Error (Campaign ${_id}): ${data.message || 'Unknown error'}`
      );
      try {
        await CAMPAIGN_MODULE.findByIdAndUpdate(
          _id,
          { $push: { unproceedNumbers: messageData.to } },
          { new: true }
        );
      } catch (error) {
        console.error(
          `Error updating unproceedNumbers for campaign ${_id}:`,
          error.message
        );
      }
      return false;
    }

    try {
      await CAMPAIGN_MODULE.findByIdAndUpdate(_id, { $inc: { process: 1 } }, { new: true });
    } catch (error) {
      console.error(`Error updating process count for campaign ${_id}:`, error.message);
    }

    const logEntry = {
      camId: _id,
      mobileNumber: data.contacts?.[0]?.input,
      waMessageId: data.messages?.[0]?.id,
      status: data.messages?.[0]?.message_status,
      msgType: messageType,
      messageTitle: caption,
    };

    try {
      const existingLog = await MESSAGE_LOG.findOne({
        camId: logEntry.camId,
        mobileNumber: logEntry.mobileNumber,
        waMessageId: logEntry.waMessageId,
        msgType: logEntry.msgType,
      });

      if (existingLog) {
        await MESSAGE_LOG.updateOne(
          { _id: existingLog._id },
          {
            $set: {
              status: logEntry.status,
              messageTitle: logEntry.messageTitle,
            },
          },
          { new: true }
        );
      } else {
        await MESSAGE_LOG.create(logEntry);
      }
      return true;
    } catch (error) {
      console.error(
        `Error updating or creating message log for campaign ${_id}, number: ${logEntry.mobileNumber}`,
        error.message
      );
      return false;
    }
  } catch (error) {
    console.error(`Error in whatsappAPISend for campaign ${_id}:`, error.message || error);
    return false;
  }
};

exports.getMessagesForCampaign = async (req, res) => {
  try {
    const { _id: campaignId, pageSize = 10, pageNo = 1, filter } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
        errors: ["Campaign ID is required"],
      });
    }

    const limit = parseInt(pageSize);
    const skip = (parseInt(pageNo) - 1) * limit;
    const query = { camId: campaignId, isDeleted: false };

    if (filter) {
      if (filter.status === "read" || filter.status === "delivered" || filter.status === "sent" || filter.status === "accepted") {
        query.status = filter.status;
      }
      if (filter.status === "failed") {
        query.status = "failed";
        query.reason = {
          $nin: [
            "Failed to send message because this user's phone number is part of an experiment",
            "Message Undeliverable."
          ]
        };
      }
      if (filter.status === "unavailable") {
        query.status = "failed";
        query.reason = "Message Undeliverable.";
      }
      if (filter.status === "experiment") {
        query.status = "failed";
        query.reason = "Failed to send message because this user's phone number is part of an experiment";
      }
    }

    const totalData = await MESSAGE_LOG.countDocuments(query);
    const totalLogs = await MESSAGE_LOG.countDocuments({ camId: campaignId, isDeleted: false });
    const success = await MESSAGE_LOG.countDocuments({
      camId: campaignId, isDeleted: false, status: { $in: ["sent", "delivered", "read"] }
    });

    const logs = await MESSAGE_LOG.aggregate([
      {
        $match: query,
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
        $group: {
          _id: { camId: "$camId", mobileNumber: "$mobileNumber" },
          latestLog: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: { newRoot: "$latestLog" },
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
      { $skip: skip },
      { $limit: limit },
    ]);

    const statusData = await MESSAGE_LOG.aggregate([
      {
        $match: { camId: campaignId, isDeleted: false },
      },
      {
        $group: {
          _id: {
            status: "$status",
            reason: "$reason",
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: "$_id.status",
          reason: "$_id.reason",
          count: 1,
        },
      },
    ]);

    const formattedStatusData = {
      read: 0,
      delivered: 0,
      sent: 0,
      accepted: 0,
      failed: 0,
      unavailable: 0,
      experiment: 0,
    };

    statusData.forEach((item) => {
      if (item.status === "read") formattedStatusData.read += item.count;
      else if (item.status === "delivered") formattedStatusData.delivered += item.count;
      else if (item.status === "sent") formattedStatusData.sent += item.count;
      else if (item.status === "accepted") formattedStatusData.accepted += item.count;
      else if (
        item.status === "failed" &&
        item.reason === "Message Undeliverable."
      ) {
        formattedStatusData.unavailable += item.count;
      } else if (
        item.status === "failed" &&
        item.reason ===
        "Failed to send message because this user's phone number is part of an experiment"
      ) {
        formattedStatusData.experiment += item.count;
      } else if (item.status === "failed" &&
        item.reason !== "Failed to send message because this user's phone number is part of an experiment" &&
        item.reason !== "Message Undeliverable.") {
        formattedStatusData.failed += item.count;
      }
    });

    const totalPages = Math.ceil(totalData / limit);

    return res.status(200).json({
      message: CONSTANT.MESSAGE.DATA_FOUND_SUCCESSFULLY,
      pageSize: limit,
      pageNo: parseInt(pageNo),
      totalPages: totalPages,
      totalRecords: totalLogs,
      totalData: totalData,
      success: success,
      data: {
        statusData: formattedStatusData,
        data: logs,
      },
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