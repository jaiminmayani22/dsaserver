const MESSAGE_LOG = require("../module/messageLog.module");
const RECEIVED_MESSAGE = require("../module/receivedMessage.module");
const CLIENT_MODULE = require("../module/client.module");
const CONSTANT = require("../common/constant");
const commonService = require("../common/common");
const { validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs");
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
      const messages = await RECEIVED_MESSAGE.find();
      if (messages.length > 0) {
        const groupedMessages = messages.reduce((groups, message) => {
          const fromKey = message.from;
          if (!groups[fromKey]) {
            groups[fromKey] = [];
          }

          groups[fromKey].push({
            ...message.toObject(),
            updatedAt: message.updatedAt,
          });

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

exports.sendDirectMessage = async (req, res) => {
  try {
    const folder = CONSTANT.UPLOAD_DOC_PATH.CHAT;
    commonService.marketingUploadFunction(folder, req, res, async (err, files) => {
      const { userId, _ } = commonService.getUserIdFromToken(req);
      let data = { ...req.body };

      if (files && files[0]) {
        data[CONSTANT.FIELD.DOCUMENT] = files[0];
        data[CONSTANT.FIELD.DOCUMENT][CONSTANT.COMMON.URL] =
          process.env.BACKEND_URL +
          folder +
          "/" +
          files[0][CONSTANT.COMMON.FILE_NAME];
      }
      let mobileNumbers = Array.isArray(data.mobileNumbers) 
        ? data.mobileNumbers 
        : JSON.parse(data.mobileNumbers);
      
      if (data.type === 'text') {
        await sendTextWhatsAppMessages(mobileNumbers, data._id, data.caption, data.messageType, data.ticket);
      } else {
        await sendMarketingWhatsAppMessages(mobileNumbers, data.document.url, data._id, data.caption, data.messageType, data.type, data.ticket);
      }

      const messages = await RECEIVED_MESSAGE.find();
      if (messages.length > 0) {
        const groupedMessages = messages.reduce((groups, message) => {
          const fromKey = message.from;
          if (!groups[fromKey]) {
            groups[fromKey] = [];
          }

          groups[fromKey].push({
            ...message.toObject(),
            updatedAt: message.updatedAt,
          });

          return groups;
        }, {});

        const groupedMessagesArray = Object.keys(groupedMessages).map(from => ({
          from,
          messages: groupedMessages[from],
        }));

        return res.status(200).send({
          message: CONSTANT.MESSAGE.DATA_FOUND_SUCCESSFULLY,
          data: groupedMessagesArray,
        });
      } else {
        return res.status(200).send({
          data: [],
          message: CONSTANT.MESSAGE.NO_MESSAGES,
        });
      }
    });
  } catch (err) {
    return res.status(500).send({
      message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
    });
  }
};

const sendMarketingWhatsAppMessages = async (mobileNumbers, images, _id, caption, messageType, documentType, ticket) => {
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

    await whatsappAPISend(messageData, _id, messageType, caption, ticket);
  }
};

const sendTextWhatsAppMessages = async (mobileNumbers, _id, caption, messageType, ticket) => {
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

    await whatsappAPISend(messageData, _id, messageType, caption, ticket);
  }
};

const whatsappAPISend = async (messageData, _id, messageType, caption, ticket) => {
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

        if (ticket) {
          const parameter = messageData.template.components[0].parameters[0];
          const link = parameter.image?.link || parameter.document?.link || parameter.video?.link || '';
          const type = parameter.image?.link
            ? 'image'
            : parameter.document?.link
              ? 'document'
              : parameter.video?.link
                ? 'video'
                : 'text';

          const newReceivedMessage = new RECEIVED_MESSAGE({
            from: data.contacts[0].input,
            message: caption,
            ticketNumber: ticket,
            document: link,
            type: type,
          });
          await newReceivedMessage.save();
        } else {
          const obj = {
            camId: _id,
            mobileNumber: data.contacts[0].input,
            waMessageId: data.messages[0].id,
            status: data.messages[0].message_status,
            msgType: messageType ? messageType : "direct",
            messageTitle: caption
          };
          await MESSAGE_LOG.create(obj);
        }
      }).catch((error) => {
        return console.error(error.message);
      });
  } catch (error) {
    return console.error(`Failed to send message to ${mobileNumber}:`, error);
  }
};