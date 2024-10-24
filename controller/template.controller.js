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
            return res.status(201).send({data: templateReferenceFormat, message: CONSTANT.MESSAGE.TEMPLATE_FORMAT_UPLOADED}); // Send the created object back
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
      const extGrp = await VARIABLE_MODULE.findOne({ name: req.body.name });
      if (extGrp) {
        return res.status(400).send({ message: CONSTANT.MESSAGE.VARIABLE_ALREADY_EXIST });
      }

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

exports.testAPI = async (req, res) => {
  try {
    const folder = CONSTANT.UPLOAD_DOC_PATH.TEMPLATES_PATH; // Template upload folder
    commonService.templateUploadFunction(
      folder,
      req,
      res,
      async (err, files) => {
        if (err || !files || files.length <= 0) {
          return res.status(400).send({
            message: err?.message || CONSTANT.MESSAGE.PROFILE_NOT_UPDATE,
          });
        } else {
          const { username, profilePicUrl } = req.body; // Expecting profilePicUrl and username from body

          // Download the profile picture from the provided URL
          let profileImageBuffer;
          try {
            if (profilePicUrl.startsWith('http')) {
              const response = await fetch(profilePicUrl);
              if (!response.ok) throw new Error('Failed to fetch profile picture');
              profileImageBuffer = await response.buffer();
            } else {
              // Handle case where profilePicUrl is a local path
              const profileImagePath = path.resolve(profilePicUrl);
              if (!fs.existsSync(profileImagePath)) {
                throw new Error('Profile image not found on local path');
              }
              profileImageBuffer = fs.readFileSync(profileImagePath);
            }
          } catch (err) {
            console.error('Failed to load profile picture:', err.message);
            return res.status(400).json({ error: 'Failed to load profile picture' });
          }

          // Load main image (template) that was uploaded
          const imagePath = path.resolve(folder, files[0].filename); // Assuming the uploaded file is saved in 'folder'
          let mainImage;
          try {
            mainImage = await loadImage(imagePath);
            console.log("Main Image loaded successfully");
          } catch (err) {
            console.error('Failed to load main image:', err.message);
            return res.status(400).json({ error: 'Failed to load main image' });
          }

          // Load profile image from the buffer
          let profileImage;
          try {
            profileImage = await loadImage(profileImageBuffer);
            console.log("Profile Image loaded successfully");
          } catch (err) {
            console.error('Failed to load profile image:', err.message);
            return res.status(400).json({ error: 'Failed to load profile image' });
          }

          // Create a canvas with the main image dimensions
          const canvas = createCanvas(mainImage.width, mainImage.height);
          const ctx = canvas.getContext('2d');

          // Draw the main image
          ctx.drawImage(mainImage, 0, 0, mainImage.width, mainImage.height);

          // Draw the profile image in the bottom-left corner
          const profileSize = 100; // Define profile picture size
          ctx.drawImage(profileImage, 10, mainImage.height - profileSize - 10, profileSize, profileSize);

          // Add the username text at the bottom center
          const fontSize = 30;
          ctx.font = `${fontSize}px Arial`;
          ctx.fillStyle = 'black';
          ctx.textAlign = 'center';
          ctx.fillText(username, mainImage.width / 2, mainImage.height - 20);

          // Convert the canvas to a PNG buffer
          const buffer = canvas.toBuffer('image/png');

          // Remove the uploaded image file to clean up the server
          fs.unlinkSync(imagePath);

          // Send the processed image buffer as response
          res.setHeader('Content-Type', 'image/png');
          res.status(200).send(buffer);
        }
      }
    );
  } catch (err) {
    console.error('Image processing error:', err.message);
    res.status(500).json({ error: 'Failed to process image' });
  }
};

// exports.processVideo = async (req, res) => {
//   try {
//     const { videoPath, logoPath, username } = req.body;
//     const localVideoPath = path.join(__dirname, '../public', path.basename(videoPath));
//     const localLogoPath = path.join(__dirname, '../public', 'profile_picture', path.basename(logoPath));

//     console.log("Resolved videoPath:", localVideoPath);
//     console.log("Resolved logoPath:", localLogoPath);

//     if (!fs.existsSync(localVideoPath) || !fs.existsSync(localLogoPath)) {
//       return res.status(400).json({ error: 'Invalid video or logo path' });
//     }

//     const outputVideoPath = path.join(__dirname, '../public', `output-${Date.now()}.mp4`);

//     ffmpeg(localVideoPath)
//       .input(localLogoPath)
//       .complexFilter([
//         '[0:v][1:v] overlay=x=10:y=main_h-overlay_h-10 [tmp]',  // No extra semicolon here
//         {
//           filter: 'drawtext',
//           options: {
//             fontfile: 'C:/Windows/Fonts/Arial.ttf',  // Double quotes for Windows compatibility
//             text: `"${username}"`,  // Double quotes around username
//             fontsize: 30,
//             fontcolor: 'white',
//             x: '(main_w/2-text_w/2)',
//             y: 'main_h-30',
//             box: 1,
//             boxcolor: 'black@0.5',
//             boxborderw: 5
//           },
//           inputs: '[tmp]',  // Chain the drawtext filter to the output of the overlay
//           outputs: 'final'  // Define the final output
//         }
//       ])
//       .outputOptions('-map', '[final]')  // Map the final output video
//       .output(outputVideoPath)
//       .on('end', () => {
//         console.log('Video processing finished');
//         res.json({ message: 'Video processed successfully', outputVideo: outputVideoPath });
//       })
//       .on('error', (err) => {
//         console.error('Video processing error:', err);
//         res.status(500).json({ error: 'Video processing failed' });
//       })
//       .run();
//   } catch (err) {
//     console.error('Video processing error:', err.message);
//     res.status(500).json({ error: 'Failed to process video' });
//   }
// };

exports.processVideo = async (req, res) => {
  try {
    const { videoPath, logoPath, username, footerText } = req.body;
    const localVideoPath = path.join(__dirname, '../public', path.basename(videoPath));
    const localLogoPath = path.join(__dirname, '../public', 'profile_picture', path.basename(logoPath));

    console.log("Resolved videoPath:", localVideoPath);
    console.log("Resolved logoPath:", localLogoPath);

    if (!fs.existsSync(localVideoPath) || !fs.existsSync(localLogoPath)) {
      return res.status(400).json({ error: 'Invalid video or logo path' });
    }

    const outputVideoPath = path.join(__dirname, '../public', `output-${Date.now()}.mp4`);

    ffmpeg(localVideoPath)
      .input(localLogoPath)
      .complexFilter([
        '[0:v][1:v] overlay=x=10:y=main_h-overlay_h-10 [videoWithLogo]',
        'color=c=white:s=main_wx100 [whiteFooter]',
        '[videoWithLogo][whiteFooter] vstack=inputs=2 [videoWithFooter]',
        {
          filter: 'drawtext',
          options: {
            fontfile: 'C:/Windows/Fonts/Arial.ttf',
            text: `"${username}"`,  // Add username text on the video
            fontsize: 30,
            fontcolor: 'white',
            x: '(main_w/2-text_w/2)',  // Centered horizontally
            y: 'main_h-130',  // Positioned just above the footer
            box: 1,
            boxcolor: 'black@0.5',
            boxborderw: 5
          },
          inputs: '[videoWithFooter]',  // Apply this on the video with the footer
          outputs: 'videoWithUsername'
        },

        {
          filter: 'drawtext',
          options: {
            fontfile: 'C:/Windows/Fonts/Arial.ttf',
            text: `"${footerText}"`,  // Add footer text on the white footer
            fontsize: 24,
            fontcolor: 'black',
            x: '(main_w/2-text_w/2)',  // Centered horizontally on the footer
            y: 'h-line_h-10',  // Positioned near the bottom of the white footer
            box: 1,
            boxcolor: 'white@0.0',
            boxborderw: 5
          },
          inputs: '[videoWithUsername]',  // Apply the text on the final video with username and footer
          outputs: 'finalOutput'
        }
      ])
      .outputOptions('-map', '[finalOutput]')  // Map the final video output
      .output(outputVideoPath)
      .on('end', () => {
        console.log('Video processing finished');
        res.json({ message: 'Video processed successfully', outputVideo: outputVideoPath });
      })
      .on('error', (err) => {
        console.error('Video processing error:', err);
        res.status(500).json({ error: 'Video processing failed' });
      })
      .run();
  } catch (err) {
    console.error('Video processing error:', err.message);
    res.status(500).json({ error: 'Failed to process video' });
  }
};