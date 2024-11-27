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
        const groupedMessages = messages.reduce((groups, message) => {
          const fromKey = message.from; 
          if (!groups[fromKey]) {
            groups[fromKey] = []; 
          }
          groups[fromKey].push(message);
          return groups;
        }, {});

        const groupedMessagesArray = Object.keys(groupedMessages).map(from => ({
          from,
          messages: groupedMessages[from],
        }));

        res.status(200).send({ message: CONSTANT.MESSAGE.DATA_FOUND_SUCCESSFULLY, data: groupedMessagesArray });
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
  await updateCampaignStatus(_id, 'completed');
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
  await updateCampaignStatus(_id, 'completed');
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
        if (/companyName/i.test(content)) {
          updatedContent = updatedContent.replace(/companyName/i, company_name ? company_name : '');
        }
        if (/email/i.test(content)) {
          updatedContent = updatedContent.replace(/email/i, email ? email : '');
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
            updatedContent = updatedContent.replace(/LOGO/i, '');
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
    const uploadPath = path.resolve(__dirname, CONSTANT.UPLOAD_DOC_PATH.SCHEDULE_UTILITY_EDITED);
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
  await updateCampaignStatus(_id, 'completed');
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
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

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
        return console.error(error.message);
      });
  } catch (error) {
    return console.error(`Failed to send message to ${mobileNumber}:`, error);
  }
};