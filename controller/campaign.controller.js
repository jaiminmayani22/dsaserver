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

        let data = {
          name: obj.name,
          type: obj.type,
          audience: obj.audience,
          messageType: obj.messageType,
          documentType: obj.documentType,
          caption: obj.caption,
          button: obj.button,
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
            const allClients = await CLIENT_MODULE.find({}, { _id: 1 });
            count = allClients.length;
            clientIds = allClients.map(client => client._id);
            break;

          case "group":
            const groupArray = obj.groups.split(',').map(groupId => groupId.trim());
            const groupRegex = new RegExp(groupArray.map(groupId => `(^|,)${groupId}(,|$)`).join('|'));

            const groupClients = await CLIENT_MODULE.find({ groupId: groupRegex }, { _id: 1 });
            count = groupClients.length;
            clientIds = groupClients.map(client => client._id);
            data.groups = obj.groups;
            break;

          case "favoriteContacts":
            const favoriteClients = await CLIENT_MODULE.find({ isFavorite: 'yes' }, { _id: 1 });
            count = favoriteClients.length;
            clientIds = favoriteClients.map(client => client._id);
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
              }
              return res.status(200).json({
                message:
                  CONSTANT.COLLECTION.CAMPAIGN +
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
            const allClients = await CLIENT_MODULE.find({}, { _id: 1 });
            count = allClients.length;
            clientIds = allClients.map(client => client._id);
            break;

          case "group":
            const groupArray = obj.groups.split(',').map(groupId => groupId.trim());
            const groupRegex = new RegExp(groupArray.map(groupId => `(^|,)${groupId}(,|$)`).join('|'));

            const groupClients = await CLIENT_MODULE.find({ groupId: groupRegex }, { _id: 1 });
            count = groupClients.length;
            clientIds = groupClients.map(client => client._id);
            data.groups = obj.groups;
            break;

          case "favoriteContacts":
            const favoriteClients = await CLIENT_MODULE.find({ isFavorite: 'yes' }, { _id: 1 });
            count = favoriteClients.length;
            clientIds = favoriteClients.map(client => client._id);
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

exports.campaignAudienceCount = async (req, res) => {
  try {
    const audience = req.body.audience;
    const groups = req.body.groups;
    let count;

    switch (audience) {
      case "allContacts":
        const allClients = await CLIENT_MODULE.find({}, { _id: 1 });
        count = allClients.length;
        break;

      case "group":
        const groupArray = groups.split(',').map(groupId => groupId.trim());
        const groupRegex = new RegExp(groupArray.map(groupId => `(^|,)${groupId}(,|$)`).join('|'));
        const groupClients = await CLIENT_MODULE.find({ groupId: groupRegex }, { _id: 1 });
        count = groupClients.length;
        break;

      case "favoriteContacts":
        const favoriteClients = await CLIENT_MODULE.find({ isFavorite: 'yes' }, { _id: 1 });
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

        CAMPAIGN_MODULE.create({ ...obj })
          .then((response) => {
            if (commonService.isValidObjId(response._id)) {
              return res.status(200).json({
                message:
                  CONSTANT.COLLECTION.TEMPLATE +
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
        const schedules = await CAMPAIGN_MODULE.find({
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

// FUNCTIONS FOR WHATSAPP MESSAGE
const sendInstantMessage = async (req, res) => {
  const { _id, caption, messageType, document, audienceIds } = req.body;

  const mobileNumbers = [];
  const clients = await CLIENT_MODULE.find({ _id: { $in: audienceIds } });
  clients.forEach(client => {
    if (client.whatsapp_number) {
      mobileNumbers.push(client.whatsapp_number);
    }
  });

  const imageUrl = document.url;
  if (messageType === 'marketing') {
    try {
      await sendMarketingWhatsAppMessages(mobileNumbers, imageUrl, _id, caption);
      return res.status(200).json({
        message: CONSTANT.COLLECTION.CAMPAIGN + CONSTANT.MESSAGE.CREATE_SENT_SUCCESSFULLY,
      });
    } catch (error) {
      return Promise.reject(error);
    }
  } else {
    const selectedRefTemplate = req.body.selectedRefTemplate;
    try {
      await sendUtilityWhatsAppMessages(mobileNumbers, imageUrl, _id, caption, selectedRefTemplate);
      return res.status(200).json({
        message: CONSTANT.COLLECTION.CAMPAIGN + CONSTANT.MESSAGE.CREATE_SENT_SUCCESSFULLY,
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }
};
exports.sendMessage = sendInstantMessage;

//SEND MARKETING MESSAGE
const sendMarketingWhatsAppMessages = async (mobileNumbers, images, _id, caption) => {
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
            parameters: [{ type: "text", text: caption }],
          },
        ],
      },
    };
    console.log("messageData : " + JSON.stringify(messageData));

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
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          // return data;
        }).catch((error) => {
          return error.message
        });
    } catch (error) {
      console.error(`Failed to send message to ${mobileNumber}:`, error);
    }
  }
  await updateMessageStatus(_id, 'completed');
};

//SEND UTILITY MESSAGE
const sendUtilityWhatsAppMessages = async (mobileNumbers, images, _id, caption, selectedRefTemplate) => {
  let cnt = 0;
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
      userWebsite: "www.google.com",
      // userWebsite: user[0].website,
      selectedRefTemplate: refTemplate,
      imagePath: images
    });
    const absoluteTempImagePath = path.resolve(tempImagePath);
    const imageUrl = `http://localhost:8080/./public/schedule_utility/${path.basename(absoluteTempImagePath)}`;

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
            parameters: [{ type: "image", image: { link: imageUrl } }],
          },
          {
            type: "body",
            parameters: [{ type: "text", text: caption }],
          },
        ],
      },
    };
    console.log("message Data : ", messageData);

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
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          // return data;
        }).catch((error) => {
          return error.message
        });
    } catch (error) {
      console.error(`Failed to send message to ${mobileNumber}:`, error);
    }
    fs.unlink(absoluteTempImagePath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${absoluteTempImagePath}`, err);
      } else {
        console.log(`Successfully deleted file: ${absoluteTempImagePath}`);
      }
    });
  }
  await updateMessageStatus(_id, 'completed');
};

// Function to update message status in the database
const updateMessageStatus = async (_id, status) => {
  await CAMPAIGN_MODULE.findByIdAndUpdate(_id, { status: status });
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
  imagePath }) => {

  try {
    const tempFolder = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder);
    }

    let mainImage;
    try {
      const response = await fetch(imagePath);
      if (!response.ok) throw new Error('Failed to load main image');
      const buffer = await response.buffer();
      mainImage = await loadImage(buffer);
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
          updatedContent = updatedContent.replace(/NAME/i, username ? username : '');
        }
        if (/Number/i.test(content)) {
          updatedContent = updatedContent.replace(/NUMBER/i, number ? number : '');
        }
        if (/instagramId/i.test(content)) {
          updatedContent = updatedContent.replace(/INSTAGRAMID/i, instagramID ? instagramID : '');
        }
        if (/facebookId/i.test(content)) {
          updatedContent = updatedContent.replace(/FACEBOOKID/i, facebookID ? facebookID : '');
        }
        if (/companyName/i.test(content)) {
          updatedContent = updatedContent.replace(/COMPANYNAME/i, company_name ? company_name : '');
        }
        if (/email/i.test(content)) {
          updatedContent = updatedContent.replace(/EMAIL/i, email ? email : '');
        }
        if (/Website/i.test(content)) {
          updatedContent = updatedContent.replace(/WEBSITE/i, userWebsite);
        }

        if (/Logo/i.test(content)) {
          if (logoImage) {
            const logoResponse = await fetch(logoImage);
            if (!logoResponse.ok) throw new Error('Failed to fetch logo image');
            const logoBuffer = await logoResponse.buffer();
            const logoImageLoaded = await loadImage(logoBuffer);
            const logoWidth = parseFloat(fontSize);
            const logoHeight = parseFloat(fontSize);
            ctx.drawImage(logoImageLoaded, x, y, logoWidth, logoHeight);
            continue;
          } else {
            updatedContent = updatedContent.replace(/LOGO/i, '');
          }
        }

        ctx.font = `${fontWeight} ${fontStyle} ${parseFloat(fontSize)}px ${fontFamily}`;
        ctx.fillStyle = fillColor;
        ctx.textAlign = 'left';

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


    const tempImagePath = path.join(CONSTANT.UPLOAD_DOC_PATH.SCHEDULE_UTILITY, `${Date.now()}_edited_image.png`);
    const buffer = canvas.toBuffer('image/png');
    if (buffer.length === 0) {
      throw new Error('The buffer is empty, cannot write to file.');
    }
    fs.writeFileSync(tempImagePath, buffer);
    return tempImagePath;
  } catch (err) {
    throw new Error('Failed to process image: ' + err.message);
  }
};

const stripHtmlTags = (htmlContent) => {
  return htmlContent.replace(/<\/?[^>]+(>|$)/g, "");
};