const TEMPLATE_MODULE = require("../module/template.module");
const VARIABLE_MODULE = require("../module/variable.module");
const TEMPLATE_IMAGES_MODULE = require("../module/templateImages.module");
const TEMPLATE_FORMAT_MODULE = require("../module/templateFormat.module");
const TEMPLATE_REFERENCE_FORMAT_MODULE = require("../module/templateReferenceFormat.module");
const MESSAGE_LOG = require("../module/messageLog.module");
const RECEIVED_MESSAGE = require("../module/receivedMessage.module");
const CLIENT_MODULE = require("../module/client.module");
const CONSTANT = require("../common/constant");
const commonService = require("../common/common");
const { validationResult } = require("express-validator");
const multer = require('multer');
const { createCanvas, loadImage } = require('canvas');
const ffmpeg = require('fluent-ffmpeg'); // Correct import
ffmpeg.setFfmpegPath("C:/ffmpeg/bin/ffmpeg.exe");
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

/*
Method: Post
Todo: Create Template
*/
exports.createTemplate = async (req, res, folder) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      const folder = CONSTANT.UPLOAD_DOC_PATH.TEMPLATES_PATH;
      commonService.templateUploadFunction(folder, req, res, async (err, files) => {
        const { userId, _ } = commonService.getUserIdFromToken(req);
        let obj = { ...req.body };

        if (files && files[0]) {
          obj[CONSTANT.FIELD.TEMPLATE] = files[0];
          obj[CONSTANT.FIELD.TEMPLATE][CONSTANT.COMMON.URL] =
            process.env.BACKEND_URL +
            folder +
            "/" +
            files[0][CONSTANT.COMMON.FILE_NAME];
        }

        const extTemplate = await TEMPLATE_MODULE.findOne({ name: obj.name });
        if (extTemplate) {
          return res.status(500).send({
            message: CONSTANT.MESSAGE.TEMPLATE_ALREADY_EXISTS
          });
        }

        await TEMPLATE_MODULE.create({ ...obj })
          .then((response) => {
            return res.status(200).json({
              message:
                CONSTANT.COLLECTION.TEMPLATE +
                CONSTANT.MESSAGE.CREATE_SUCCESSFULLY,
              data: response,
            });
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

exports.templateImageUpload = async (req, res, next) => {
  try {
    const folder = CONSTANT.UPLOAD_DOC_PATH.TEMPLATE_IMAGES_PATH;
    commonService.templateImagesUploadFunction(
      folder,
      req,
      res,
      async (err, files) => {
        if (err && files && files.length <= 0) {
          return res.status(400).send({
            message: err.message || CONSTANT.MESSAGE.IMAGE_NOT_UPLOADED,
          });
        } else {
          let obj = {};
          obj[CONSTANT.FIELD.TEMPLATE_IMAGE] = files[0];
          obj[CONSTANT.FIELD.TEMPLATE_IMAGE][CONSTANT.COMMON.URL] =
            process.env.BACKEND_URL +
            folder +
            "/" +
            files[0][CONSTANT.COMMON.FILE_NAME];

          TEMPLATE_IMAGES_MODULE.create(obj)
            .then((result) => {
              return res.status(200).send({
                message: CONSTANT.MESSAGE.IMAGE_UPLOADED,
                data: result,
              });
            })
            .catch((e) => {
              return res.status(404).send({
                message: e.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
              });
            });
        }
      }
    );
  } catch (err) {
    return res.status(404).send({
      message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
    });
  }
};

exports.templateFormatUpload = async (req, res, next) => {
  try {
    const folder = CONSTANT.UPLOAD_DOC_PATH.TEMPLATE_FORMAT_PATH;
    commonService.templateFormatUploadFunction(
      folder,
      req,
      res,
      async (err, files) => {
        if (err && files && files.length <= 0) {
          return res.status(400).send({
            message: err.message || CONSTANT.MESSAGE.IMAGE_NOT_UPLOADED,
          });
        } else {
          let obj = {};
          obj[CONSTANT.FIELD.TEMPLATE_FORMAT] = files[0];
          obj[CONSTANT.FIELD.TEMPLATE_FORMAT][CONSTANT.COMMON.URL] =
            process.env.BACKEND_URL +
            folder +
            "/" +
            files[0][CONSTANT.COMMON.FILE_NAME];

          TEMPLATE_FORMAT_MODULE.create(obj)
            .then((result) => {
              return res.status(200).send({
                message: CONSTANT.MESSAGE.TEMPLATE_FORMAT_UPLOADED,
                data: result,
              });
            })
            .catch((e) => {
              return res.status(404).send({
                message: e.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
              });
            });
        }
      }
    );
  } catch (err) {
    return res.status(404).send({
      message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
    });
  }
};

exports.templateReferenceFormatUpload = async (req, res, next) => {
  try {
    const folder = CONSTANT.UPLOAD_DOC_PATH.TEMPLATE_FORMAT_PATH;
    commonService.templateFormatUploadFunction(
      folder,
      req,
      res,
      async (err, files) => {
        if (err && files && files.length <= 0) {
          return res.status(400).send({
            message: err.message || CONSTANT.MESSAGE.IMAGE_NOT_UPLOADED,
          });
        } else {
          let obj = { ...req.body };

          if (typeof obj.layers === 'string') {
            try {
              obj.layers = JSON.parse(obj.layers);
            } catch (error) {
              return res.status(400).send({
                message: 'Invalid layers format.',
              });
            }
          }

          obj[CONSTANT.FIELD.TEMPLATE_FORMAT] = files[0];
          obj[CONSTANT.FIELD.TEMPLATE_FORMAT][CONSTANT.COMMON.URL] =
            process.env.BACKEND_URL +
            folder +
            "/" +
            files[0][CONSTANT.COMMON.FILE_NAME];

          try {
            const templateReferenceFormat = await TEMPLATE_REFERENCE_FORMAT_MODULE.create(obj);
            return res.status(201).send({ data: templateReferenceFormat, message: CONSTANT.MESSAGE.TEMPLATE_FORMAT_UPLOADED }); // Send the created object back
          } catch (createError) {
            return res.status(500).send({
              message: createError.message || 'Error saving template reference format.',
            });
          }
        }
      }
    );

  } catch (err) {
    return res.status(404).send({
      message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
    });
  }
};

exports.getAllTemplateImages = async (req, res) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      await TEMPLATE_IMAGES_MODULE.find({ isDeleted: false }).then((response) => {
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

exports.getAllTemplateFormat = async (req, res) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      await TEMPLATE_FORMAT_MODULE.find({ isDeleted: false }).then((response) => {
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

exports.getAllReferenceTemplateFormat = async (req, res) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      await TEMPLATE_REFERENCE_FORMAT_MODULE.find({ isDeleted: false }).then((response) => {
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

exports.getAllTemplates = async (req, res) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      await TEMPLATE_MODULE.find({ isDeleted: false }).then((response) => {
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

exports.deleteTemplate = async (req, res) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      const { id } = req.params;
      const template = await TEMPLATE_MODULE.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
      );
      if (!template) {
        return res.status(404).send({ message: CONSTANT.MESSAGE.TEMPLATE_NOT_FOUND });
      }
      return res.status(200).json({
        message: CONSTANT.COLLECTION.TEMPLATE + CONSTANT.MESSAGE.DELETED_SUCCESSFULLY,
        data: template,
      });
    } catch (err) {
      return res.status(404).send({
        message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
      });
    }
  }
};

exports.deleteRefTemplate = async (req, res) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      const { _id } = req.params;
      const template = await TEMPLATE_REFERENCE_FORMAT_MODULE.findByIdAndUpdate(
        _id,
        { isDeleted: true },
        { new: true }
      );
      if (!template) {
        return res.status(404).send({ message: CONSTANT.MESSAGE.TEMPLATE_NOT_FOUND });
      }
      return res.status(200).json({
        message: CONSTANT.COLLECTION.TEMPLATE + CONSTANT.MESSAGE.DELETED_SUCCESSFULLY,
        data: _id,
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
        const schedules = await TEMPLATE_MODULE.find({
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

// Function to update message status in the database
const updateMessageStatus = async (scheduleId, mobileNumber, status) => {
  await TEMPLATE_MODULE.findByIdAndUpdate(scheduleId, { messageStatus: status });
};

/*
TODO: POST
Topic: Create Variable
*/
exports.createVariable = async (req, res) => {
  try {
    const variable = req.body.key;
    const extGrp = await VARIABLE_MODULE.findOne({ name: variable, isDeleted: false });
    if (extGrp) {
      return res.status(400).send({ message: CONSTANT.MESSAGE.VARIABLE_ALREADY_EXIST });
    } else {
      let groupObj = {
        name: req.body.key,
      };
      VARIABLE_MODULE.create(groupObj)
        .then((result) => {
          return res.status(200).send({ data: result, message: CONSTANT.MESSAGE.REGISTER_SUCCESSFULLY_R })
        })
        .catch((err) => {
          return res.status(404).send({
            message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
          });
        });
    }
  } catch (err) {
    return res.status(500).send({
      message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
    });
  }
};

/*
TODO: POST
Topic: Get all Variables
*/
exports.getAllVariables = async (req, res) => {
  try {
    await VARIABLE_MODULE.find({ isDeleted: false }).then((response) => {
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
};

/*
TODO: DELETE
Topic: delete Variable by id
*/
exports.deleteVariableById = (req, res) => {
  const Id = req.params.id;
  try {
    if (!commonService.isValidObjId(Id)) {
      return res.status(403).send({
        message: CONSTANT.MESSAGE.INVALID_ID,
      });
    } else {
      VARIABLE_MODULE.findOne({ _id: Id, isDeleted: false }).then((group) => {
        if (!group) {
          return res.status(403).send({
            message: CONSTANT.MESSAGE.VARIABLE_NOT_FOUND,
          });
        } else {
          VARIABLE_MODULE.findByIdAndUpdate(
            Id,
            { $set: { isDeleted: true } },
            { new: true }
          )
            .then(async (data) => {
              res.status(200).json({
                data: Id,
                message:
                  CONSTANT.COLLECTION.VARIABLE +
                  CONSTANT.MESSAGE.DELETED_SUCCESSFULLY,
              });
            })
            .catch((err) => {
              return res.status(500).send({ message: err.message });
            });
        }
      });
    }
  } catch (err) {
    res.status(404).json({
      message: CONSTANT.MESSAGE.SOMETHING_WRONG,
      err: err.message,
    });
  }
};

/*
Method: GET
Todo: get Variable by id
*/
exports.getVariableById = (req, res) => {
  let query = { isDeleted: false };
  const Id = req.params.id;
  try {
    if (!commonService.isValidObjId(Id)) {
      return res.status(403).send({
        message: CONSTANT.MESSAGE.INVALID_ID,
      });
    } else {
      query["_id"] = { $in: [Id] };
      VARIABLE_MODULE.findOne(query).then((user) => {
        if (user) {
          res.status(200).send({
            message: CONSTANT.MESSAGE.DATA_FOUND,
            data: user,
          });
        } else {
          return res.status(403).send({
            message: CONSTANT.MESSAGE.DATA_NOT_FOUND,
          });
        }
      });
    }
  } catch (err) {
    res.status(500).json({
      message: CONSTANT.MESSAGE.SOMETHING_WRONG,
      err: err.message,
    });
  }
};