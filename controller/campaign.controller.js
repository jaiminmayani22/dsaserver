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
        audienceIds: obj.audienceIds?.map(item => item._id),
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
      await CAMPAIGN_MODULE.find({ isDeleted: false }).then((response) => {
        return res.status(200).send(response)
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
    const campaign = await CAMPAIGN_MODULE.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
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
  const { _id, caption, messageType, document, audienceIds, documentType } = req.body;

  const mobileNumbers = [];
  const clients = await CLIENT_MODULE.find({ _id: { $in: audienceIds } });
  clients.forEach(client => {
    if (client.whatsapp_number) {
      mobileNumbers.push(client.whatsapp_number);
    }
  });

  const imageUrl = document.url;
  if (messageType === 'marketing' && imageUrl) {
    try {
      await sendMarketingWhatsAppMessages(mobileNumbers, imageUrl, _id, caption, messageType, documentType);
      return res.status(200).json({
        message: CONSTANT.COLLECTION.CAMPAIGN + CONSTANT.MESSAGE.CREATE_SENT_SUCCESSFULLY,
      });
    } catch (error) {
      return Promise.reject(error);
    }
  } else if (messageType === 'utility' && imageUrl) {
    const selectedRefTemplate = req.body.selectedRefTemplate;
    try {
      await sendUtilityWhatsAppMessages(mobileNumbers, imageUrl, _id, caption, selectedRefTemplate, messageType);
      return res.status(200).json({
        message: CONSTANT.COLLECTION.CAMPAIGN + CONSTANT.MESSAGE.CREATE_SENT_SUCCESSFULLY,
      });
    } catch (error) {
      return Promise.reject(error);
    }
  } else if (!imageUrl && caption) {
    try {
      await sendTextWhatsAppMessages(mobileNumbers, _id, caption, messageType);
      return res.status(200).json({
        message: CONSTANT.COLLECTION.CAMPAIGN + CONSTANT.MESSAGE.CREATE_SENT_SUCCESSFULLY,
      });
    } catch (error) {
      return Promise.reject(error);
    }
  };
};
exports.sendMessage = sendInstantMessage;

// Function to update message status in the database
const updateCampaignStatus = async (_id, status) => {
  await CAMPAIGN_MODULE.findByIdAndUpdate(_id, { status: status });
};

const stripHtmlTags = (htmlContent) => {
  return htmlContent.replace(/<\/?[^>]+(>|$)/g, "");
};

const sendMarketingWhatsAppMessages = async (mobileNumbers, images, _id, caption, messageType, documentType) => {
  for (const mobileNumber of mobileNumbers) {
    let messageData;
    if (documentType === "image") {
      messageData = {
        messaging_product: "whatsapp",
        to: `${mobileNumber}`,
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
              parameters: [{ type: "text", text: caption ? caption : "Hello" }],
            },
          ],
        },
      };
    } else if (documentType === "video") {
      messageData = {
        messaging_product: "whatsapp",
        to: `${mobileNumber}`,
        type: "template",
        template: {
          name: CONSTANT.TEMPLATE_NAME.FOR_VIDEO,
          language: { code: "en" },
          components: [
            {
              type: "header",
              parameters: [{ type: "video", video: { link: images } }],
            },
            {
              type: "body",
              parameters: [{ type: "text", text: caption ? caption : "Hello" }],
            },
          ],
        },
      };
    } else if (documentType === "document") {
      messageData = {
        messaging_product: "whatsapp",
        to: `${mobileNumber}`,
        type: "template",
        template: {
          name: CONSTANT.TEMPLATE_NAME.FOR_DOCUMENT,
          language: { code: "en" },
          components: [
            {
              type: "header",
              parameters: [{ type: "document", document: { link: images } }],
            },
            {
              type: "body",
              parameters: [{ type: "text", text: caption ? caption : "Hello" }],
            },
          ],
        },
      };
    } else {
      messageData = {
        messaging_product: "whatsapp",
        to: `${mobileNumber}`,
        type: "template",
        template: {
          name: CONSTANT.TEMPLATE_NAME.FOR_ONLY_TEXT,
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: caption ? caption : "Hello" }],
            },
          ],
        },
      };
    }

    await whatsappAPISend(messageData, _id, messageType, caption);
  }
  await updateCampaignStatus(_id, "completed");
};

const sendTextWhatsAppMessages = async (mobileNumbers, _id, caption, messageType) => {
  for (const mobileNumber of mobileNumbers) {
    const messageData = {
      messaging_product: "whatsapp",
      to: `${mobileNumber}`,
      type: "template",
      template: {
        name: CONSTANT.TEMPLATE_NAME.FOR_ONLY_TEXT,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: caption ? caption : "Hello" }],
          },
        ],
      },
    };

    await whatsappAPISend(messageData, _id, messageType, caption);
  }
  await updateCampaignStatus(_id, "completed");
};

const editUtilityImage = async ({
  username,
  number,
  company_name,
  email,
  instagramID,
  facebookID,
  profilePicUrl,
  logoImage,
  userWebsite,
  selectedRefTemplate,
  imagePath,
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

    // let profileImageBuffer;
    // try {
    //   const response = await fetch(profilePicUrl);
    //   if (!response.ok) throw new Error('Failed to fetch profile picture');
    //   profileImageBuffer = await response.buffer();
    // } catch (err) {
    //   throw new Error('Failed to load profile picture: ' + err.message);
    // }

    const canvas = createCanvas(mainImage.width, mainImage.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(mainImage, 0, 0, mainImage.width, mainImage.height);

    const layers = selectedRefTemplate.layers;

    for (const layer of layers) {
      const { type, content, x, y, fontSize, fontWeight, fontStyle, fontFamily, textDecoration, fillColor } = layer;

      if (type === 'text') {
        let updatedContent = content;
        if (/Name/i.test(content)) {
          updatedContent = updatedContent.replace(/Name/i, username ? username : '');
        }
        if (/Number/i.test(content)) {
          updatedContent = updatedContent.replace(/Number/i, number ? number : '');
        }
        if (/instagramId/i.test(content)) {
          updatedContent = updatedContent.replace(/instagramId/i, instagramID ? instagramID : '');
        }
        if (/facebookId/i.test(content)) {
          updatedContent = updatedContent.replace(/facebookId/i, facebookID ? facebookID : '');
        }
        if (/company_name/i.test(content)) {
          updatedContent = updatedContent.replace(/company_name/i, company_name ? company_name : '');
        }
        if (/email/i.test(content)) {
          updatedContent = updatedContent.replace(/email/i, email ? email : '');
        }
        if (/city/i.test(content)) {
          updatedContent = updatedContent.replace(/city/i, city ? city : '');
        }
        if (/district/i.test(content)) {
          updatedContent = updatedContent.replace(/district/i, district ? district : '');
        }
        if (/address/i.test(content)) {
          updatedContent = updatedContent.replace(/address/i, address ? address : '');
        }
        if (/Website/i.test(content)) {
          updatedContent = updatedContent.replace(/Website/i, userWebsite ? userWebsite : '');
        }

        if (/Logo/i.test(content)) {
          if (logoImage) {
            const logoResponse = await fetch(logoImage);
            if (logoResponse.ok) {
              const logoBuffer = await logoResponse.buffer();
              const logoImageLoaded = await loadImage(logoBuffer);

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
              if (logoHeight < 140) {
                logoHeight = 140;
                logoWidth = (originalWidth / originalHeight) * logoHeight;
              }
              const centerX = x;
              const centerY = y;
              const drawX = centerX - logoWidth / 2;
              const drawY = centerY - logoHeight / 2;
              ctx.drawImage(logoImageLoaded, drawX, drawY, logoWidth, logoHeight);
              continue;
            };
          } else {
            updatedContent = updatedContent.replace(/logo/i, '');
          }
        }

        ctx.font = `${fontWeight} ${fontStyle} ${parseFloat(fontSize)}px ${fontFamily}`;
        ctx.fillStyle = fillColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'center';

        if (textDecoration === 'underline') {
          const textWidth = ctx.measureText(stripHtmlTags(updatedContent)).width;
          const lineHeight = parseFloat(fontSize);
          ctx.fillText(stripHtmlTags(updatedContent), x, y);
          ctx.beginPath();
          ctx.moveTo(x, y + lineHeight);
          ctx.lineTo(x + textWidth, y + lineHeight);
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.fillText(stripHtmlTags(updatedContent), x, y);
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
      throw new Error('The buffer is empty, cannot write to file.');
    }
    fs.writeFileSync(tempImagePath, buffer);
    return tempImagePath;
  } catch (err) {
    throw new Error('Failed to process image: ' + err.message);
  }
};

const sendUtilityWhatsAppMessages = async (mobileNumbers, images, _id, caption, selectedRefTemplate, messageType) => {
  const refTemplate = await REF_TEMPLATE_MODULE.findById(selectedRefTemplate);
  if (!refTemplate) {
    throw new Error('Template not found');
  }
  for (const mobileNumber of mobileNumbers) {
    const user = await CLIENT_MODULE.find({ whatsapp_number: mobileNumber });
    if (!user) {
      console.error(`User not found for mobile number: ${mobileNumber}`);
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
      _id: _id
    });
    const absoluteTempImagePath = path.resolve(tempImagePath);
    const imageUrl = `${process.env.BACKEND_URL}` + CONSTANT.UPLOAD_DOC_PATH.SCHEDULE_UTILITY_EDITED + "/" + `${path.basename(absoluteTempImagePath)}`;

    const messageData = {
      messaging_product: "whatsapp",
      recepient_type: "individual",
      to: `${mobileNumber}`,
      type: "template",
      template: {
        name: CONSTANT.TEMPLATE_NAME.FOR_IMAGE,
        language: { code: "en" },
        components: [
          {
            type: "header",
            parameters: [{ type: "image", image: { link: imageUrl } }],
          },
          {
            type: "body",
            parameters: [{ type: "text", text: (caption ? caption : "") }],
          },
        ],
      },
    };

    await whatsappAPISend(messageData, _id, messageType, caption);
  }
  await updateCampaignStatus(_id, "completed");
};

const whatsappAPISend = async (messageData, _id, messageType, caption) => {
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
        const data = await response.json();

        const obj = {
          camId: _id,
          mobileNumber: data.contacts[0].input,
          waMessageId: data.messages[0].id,
          status: data.messages[0].message_status,
          msgType: messageType ? messageType : "marketing",
          messageTitle: caption
        };
        await MESSAGE_LOG.create(obj);
      }).catch((error) => {
        console.error(error.message);
      });
  } catch (error) {
    console.error(`Failed to send message to ${mobileNumber}:`, error);
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
          as: "clientInfo", // Resulting array will be stored in this field
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
          "clientInfo.isDeleted": false,
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