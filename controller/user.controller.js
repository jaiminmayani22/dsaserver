const USER_COLLECTION = require("../module/user.module");
const CLIENT_COLLECTION = require("../module/client.module");
const GROUP_COLLECTION = require("../module/group.module");
const CONSTANT = require("../common/constant");
const commonService = require("../common/common");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const { StreamChat } = require("stream-chat");
const excelJS = require("exceljs");
const xlsx = require("xlsx");
const multer = require("multer");
const mongoose = require("mongoose");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { Parser } = require("json2csv");
const fs = require("fs");
const csv = require("csv-parser");
/*
Method: POST
Topic: sign up api 
*/
exports.signUp = async (req, res) => {
  const { password, email, name, phoneNo } = req.body;
  try {
    const errors = validationResult(req).array();
    if (errors && errors.length > 0) {
      let messArr = errors.map((a) => a.msg);
      return res.status(400).send({
        message: messArr.join(", "),
      });
    } else {
      USER_COLLECTION.findOne({
        email: email,
        isDeleted: false,
      }).then(async (user) => {
        if (user) {
          return res.status(409).json({
            message: CONSTANT.MESSAGE.USER_EXIST,
          });
        } else {
          const newPassword = await commonService.encryptPWD(password);
          let userObj = {
            email: email,
            name: name,
            phoneNo: phoneNo,
            password: newPassword,
          };
          USER_COLLECTION.create(userObj)
            .then((result) => {
              if (result["status"] === CONSTANT.FAIL) {
                return res.status(400).send({
                  message:
                    CONSTANT.COLLECTION.USER +
                    CONSTANT.MESSAGE.NOT_REGISTERED,
                });
              } else {
                return res.status(200).send({
                  message:
                    CONSTANT.COLLECTION.USER +
                    CONSTANT.MESSAGE.REGISTER_SUCCESSFULLY
                });
              }
            })
            .catch((err) => {
              return res.status(500).send({
                message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
              });
            });
        }
      });
    }
  } catch (err) {
    return res.status(500).json({ message: CONSTANT.MESSAGE.SOMETHING_WRONG });
  }
};

/*
Method: POST
Todo: login User
*/
exports.loginUser = (req, res) => {
  try {
    const errors = validationResult(req).array();
    if (errors && errors.length > 0) {
      let messArr = errors.map((a) => a.msg);
      return res.status(400).send({
        message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
        error: messArr.join(", "),
      });
    } else {
      let { email, password } = req.body;
      USER_COLLECTION.findOne({
        email: email.toLowerCase(),
        isDeleted: false
      }).then(async (user) => {
        if (user) {
          const decryptedPassword = await commonService.decryptPWD(
            user.password
          );
          if (password === decryptedPassword) {
            let userObj = {
              name: user.name,
              email: user.email,
              phoneNo: user.phoneNo,
              userId: user._id,
            };
            const token = jwt.sign(userObj, process.env.superSecret, {
              expiresIn: '7d',
            });
            return res.status(200).send({
              message: CONSTANT.MESSAGE.LOGIN_SUCCESSFULLY,
              token: token,
              user_id: user._id,
            });
          } else {
            return res.status(403).send({
              message: CONSTANT.MESSAGE.PASSWORD_INVALID,
            });
          }
        } else {
          return res.status(403).send({
            message: CONSTANT.MESSAGE.USER_NOT_FOUND,
          });
        }
      })
        .catch((err) => {
          return res.status(500).send({
            message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
          });
        });
    }
  } catch (error) {
    return res.status(500).send({
      message: error.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
    });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const data = req.decoded;
    const result = await USER_COLLECTION.findById(data.userId);
    res.status(200).send({ data: result, message: CONSTANT.MESSAGE.TOKEN_VERIFIED });
  } catch (error) {
    return res.status(500).send({
      message: error.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
    });
  }
};

/*
TYPE: POST
DETAILS: to verify OTP for reset password
*/
exports.verifyEmail = (req, res) => {
  const { otp, email } = req.body;

  try {
    USER_COLLECTION.findOne({ OTP: otp, email: email }).then((otpObj) => {
      if (!otpObj) {
        return res.status(401).send({
          message: CONSTANT.MESSAGE.OTP_INVALID,
        });
      } else if (otpObj.OTP === otp) {
        USER_COLLECTION.findOne({ email: email }).then((userObj) => {
          if (!userObj) {
            return res.status(401).send({
              message: CONSTANT.MESSAGE.USER_NOT_FOUND,
            });
          } else {
            let updateFields = { isEmailVerified: CONSTANT.TRUE };
            if (userObj.role === CONSTANT.COMMON.CUSTOMER) {
              updateFields.status = CONSTANT.ACTIVE;
            } else {
              updateFields.status = CONSTANT.DEACTIVE;
            }
            const newOTP = commonService.generateOTP();
            USER_COLLECTION.findOneAndUpdate(
              { email: email },
              { $set: updateFields, OTP: newOTP },
              { new: true }
            )
              .then((result) => {
                createUser(result, (error, user) => {
                  return res.status(200).send({
                    message:
                      CONSTANT.COLLECTION.USER +
                      CONSTANT.MESSAGE.EMAIL_VERIFIED,
                  });
                });
              })
              .catch((err) => {
                return res.status(500).send({ message: err.message });
              });
          }
        });
      } else {
        return res.status(401).send({
          message: CONSTANT.MESSAGE.OTP_INVALID,
        });
      }
    });
  } catch (err) {
    res.status(500).json({ message: CONSTANT.MESSAGE.SOMETHING_WRONG });
  }
};

/*
Method: POST
Topic: forgot password
*/
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    USER_COLLECTION.findOne({
      email: email,
      isDeleted: false,
    }).then(async (user) => {
      if (!user) {
        return res.status(400).json({
          message: CONSTANT.MESSAGE.EMAIL_INVALID,
        });
      } else {
        user["subject"] = CONSTANT.MESSAGE.FORGOT_PASSWORD_MAIL;
        const templateData = {
          username: user.name,
        };

        sendEmail(user, templateData, (response) => {
          if (response["status"] === CONSTANT.FAIL) {
            return res.status(500).send({
              message: CONSTANT.MESSAGE.SOMETHING_WRONG,
            });
          } else {
            return res.status(200).send({
              message: CONSTANT.MESSAGE.FORGOT_MAIL,
            });
          }
        });
      }
    });
  } catch (err) {
    res.status(500).json({
      message: CONSTANT.MESSAGE.SOMETHING_WRONG,
      err: err.message,
    });
  }
};

/*
Method: POST
Topic: reset forgot password
*/
exports.resetForgotPassword = async (req, res) => {
  const { password, confirmPassword, otp, email } = req.body;
  try {
    USER_COLLECTION.findOne({
      OTP: otp,
      email: email,
    }).then(async (otpObj) => {
      if (!otpObj) {
        return res.status(401).send({
          message: CONSTANT.MESSAGE.OTP_INVALID,
        });
      } else if (otpObj.OTP === otp) {
        if (password !== confirmPassword) {
          return res.status(403).send({
            message: CONSTANT.MESSAGE.PASSWORD_MISMATCH,
          });
        }
        const encryptedPassword = await commonService.encryptPWD(password);
        const newOTP = commonService.generateOTP();
        USER_COLLECTION.findOneAndUpdate(
          { email: email },
          { $set: { password: encryptedPassword, OTP: newOTP } },
          { new: true }
        )
          .then(() => {
            return res.status(200).send({
              message:
                CONSTANT.COMMON.PASSWORD + CONSTANT.MESSAGE.SET_SUCCESSFULLY,
            });
          })
          .catch((err) => {
            return res.status(500).send({ message: err.message });
          });
      }
    });
  } catch (err) {
    res.status(500).json({
      message: CONSTANT.MESSAGE.SOMETHING_WRONG,
      err: err.message,
    });
  }
};

/*
Method: POST
Topic: reset password
*/
exports.resetPassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  try {
    const { userId, _ } = commonService.getUserIdFromToken(req);
    const user = await USER_COLLECTION.findById(userId);
    if (!user) {
      return res.status(401).send({
        message: CONSTANT.MESSAGE.USER_NOT_FOUND,
      });
    }

    const existingPwd = await commonService.decryptPWD(user.password);
    if (oldPassword !== existingPwd) {
      return res.status(404).send({
        message: CONSTANT.MESSAGE.EXT_PASSWORD_MISMATCH,
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(403).send({
        message: CONSTANT.MESSAGE.PASSWORD_MISMATCH,
      });
    }

    if (existingPwd === newPassword) {
      return res.status(402).send({
        message: CONSTANT.MESSAGE.PASSWORD_MATCH,
      });
    }

    const encryptedPassword = await commonService.encryptPWD(newPassword);
    user.password = encryptedPassword;
    await user.save();

    // let result = {
    //   email: user.email,
    //   name: user.name,
    // };
    // passwordResetSuccessEmail(result);

    return res.status(200).send({
      message: CONSTANT.COMMON.PASSWORD + CONSTANT.MESSAGE.SET_SUCCESSFULLY,
    });
  } catch (err) {
    res.status(500).json({
      message: CONSTANT.MESSAGE.SOMETHING_WRONG,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updatedFields = req.body;
    const { userId } = commonService.getUserIdFromToken(req);

    const result = await USER_COLLECTION.findByIdAndUpdate(
      userId,
      updatedFields,
      { new: true }
    );

    let userObj = {
      name: result.name,
      email: result.email,
      phoneNo: result.phoneNo,
      userId: result._id,
    };
    const token = jwt.sign(userObj, process.env.superSecret, {
      expiresIn: '7d',
    });

    if (!result) {
      return res.status(404).json({
        message: `${CONSTANT.COLLECTION.CLIENT} ${CONSTANT.MESSAGE.NOT_FOUND}`,
      });
    }

    res.status(200).json({
      message: CONSTANT.MESSAGE.UPDATED_SUCCESSFULLY,
      data: result,
      token: token,
    });
  } catch (err) {
    res.status(500).json({
      message: CONSTANT.MESSAGE.SOMETHING_WRONG,
      error: err.message,
    });
  }
};


/*
TODO: POST
Topic: create client 
*/
exports.createClient = async (req, res) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      const profile = CONSTANT.UPLOAD_DOC_PATH.PROFILE_PIC_PATH;
      const companyProfile = CONSTANT.UPLOAD_DOC_PATH.COMPANY_PROFILE_PIC_PATH;
      commonService.pictureUploadFunction(profile, companyProfile, req, res, async (err, profileFiles, companyProfileFiles) => {
        const { name, _ } = commonService.getUserIdFromToken(req);
        let obj = { ...req.body };

        const whatsappNum = formatNumber(obj.whatsapp_number);
        const extUser = await CLIENT_COLLECTION.findOne({ whatsapp_number: whatsappNum, isDeleted: false });
        if (extUser) {
          return res.status(401).send({ message: CONSTANT.MESSAGE.USER_EXIST, data: extUser });
        }

        if (profileFiles && profileFiles[0]) {
          obj[CONSTANT.FIELD.PROFILE_PICTURE] = profileFiles[0];
          obj[CONSTANT.FIELD.PROFILE_PICTURE][CONSTANT.COMMON.URL] =
            process.env.BACKEND_URL +
            profile +
            "/" +
            profileFiles[0][CONSTANT.COMMON.FILE_NAME];
        }

        if (companyProfileFiles && companyProfileFiles[0]) {
          obj[CONSTANT.FIELD.COMPANY_PROFILE_PICTURE] = companyProfileFiles[0];
          obj[CONSTANT.FIELD.COMPANY_PROFILE_PICTURE][CONSTANT.COMMON.URL] =
            process.env.BACKEND_URL +
            companyProfile +
            "/" +
            companyProfileFiles[0][CONSTANT.COMMON.FILE_NAME];
        }

        let clientObj = {
          name: obj.name || "",
          company_name: obj.company_name || "",
          mobile_number: obj.mobile_number ? formatNumber(obj.mobile_number) : "",
          whatsapp_number: whatsappNum,
          email: obj.email || "",
          website: obj.website || "",
          city: obj.city || "",
          district: obj.district || "",
          address: obj.address || "",
          profile_picture: obj.profile_picture || {},
          company_profile_picture: obj.company_profile_picture || {},
          instagramID: obj.instagramID || "",
          facebookID: obj.facebookID || "",
          groupId: obj.groupId || "",
          isFavorite: obj.isFavorite || "no",
          addedBy: name
        };

        const groupIds = clientObj?.groupId
          ? clientObj.groupId.split(',').map(id => id.trim())
          : [];
        const normalizedGroupIds = groupIds.map(id => id.padStart(3, '0'));
        const groups = await GROUP_COLLECTION.find({ groupId: { $in: normalizedGroupIds } });
        const groupNames = groups.map(group => group.name).join(', ');
        clientObj.groupName = groupNames;

        CLIENT_COLLECTION.create(clientObj)
          .then((result) => {
            return res.status(200).send({ data: result, message: CONSTANT.MESSAGE.REGISTER_SUCCESSFULLY_R })
          })
          .catch((err) => {
            return res.status(404).send({
              message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
            });
          });
      });
    } catch (err) {
      return res.status(500).send({
        message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
      });
    }
  }
};

const formatNumber = (number) => {
  if (number) {
    if (number.startsWith("+91")) {
      return number;
    }
    return `+91${number}`;
  }
  return;
};

/*
Method: POST
Todo: get all Clients
*/
exports.getAllClient = async (req, res) => {
  const {
    limit,
    pageCount,
    search,
    sortingField,
    sortingOrder,
    filter,
  } = req.body;
  let query = {
    isDeleted: false,
  };
  try {
    const searchTerm = search || "";
    const filterDate = Object.assign({}, filter);
    const sortOrder =
      sortingOrder && sortingOrder == CONSTANT.COMMON.DESC ? -1 : 1;
    const sortField = sortingField || CONSTANT.FIELD.NAME;

    const pageSize = parseInt(limit);
    const pageNo = parseInt(pageCount);
    const skip = pageSize * pageNo;

    if (searchTerm) {
      const searchTerms = {
        $regex: new RegExp("" + searchTerm.trim().toLowerCase(), "i"),
      };
      query = {
        $and: [
          { isDeleted: false },
          {
            $or: [
              { name: searchTerms },
              { email: searchTerms },
              { mobile_number: searchTerms },
              { groupName: searchTerms },
              { groupId: searchTerms },
            ],
          },
        ],
      };
    }

    if (filterDate) {
      const fromDate = filterDate.fromDate;
      const toDate = filterDate.toDate;
      if (fromDate && !toDate) {
        query = {
          ...query,
          $expr: {
            $and: [
              {
                $eq: [
                  {
                    $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" },
                  },
                  fromDate,
                ],
              },
            ],
          },
        };
      }
      if (!fromDate && toDate) {
        query = {
          ...query,
          $expr: {
            $and: [
              {
                $eq: [
                  { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                  toDate,
                ],
              },
            ],
          },
        };
      }
      if (fromDate && toDate) {
        query = {
          ...query,
          $expr: {
            $and: [
              {
                $gte: [
                  { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                  fromDate,
                ],
              },
              {
                $lte: [
                  { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                  toDate,
                ],
              },
            ],
          },
        };
      }
    }

    const count = await CLIENT_COLLECTION.countDocuments(query);
    const clients = await CLIENT_COLLECTION.find(query)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(pageSize);
    if (clients.length > 0) {
      res.status(200).json({
        message: CONSTANT.MESSAGE.DATA_FOUND,
        totalRecords: count,
        data: clients,
      });
    } else {
      res.status(404).json({
        message: CONSTANT.MESSAGE.DATA_NOT_FOUND,
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: CONSTANT.MESSAGE.SOMETHING_WRONG, err: err.message });
  }
};

exports.getAllDeletedClient = async (req, res) => {
  let query = {
    isDeleted: true,
  };
  try {
    const count = await CLIENT_COLLECTION.countDocuments(query);
    const clients = await CLIENT_COLLECTION.find(query);
    if (clients.length > 0) {
      res.status(200).json({
        message: CONSTANT.MESSAGE.DATA_FOUND,
        totalRecords: count,
        data: clients,
      });
    } else {
      res.status(404).json({
        message: CONSTANT.MESSAGE.DATA_NOT_FOUND,
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: CONSTANT.MESSAGE.SOMETHING_WRONG, err: err.message });
  }
};

/*
Method: POST
Todo: get all clients counts
*/
exports.getAllClientCount = async (req, res) => {
  const { search, filter } = req.body;
  let query = {
    isDeleted: false,
  };
  try {
    const searchTerm = search || "";
    const filterDate = Object.assign({}, filter);

    if (searchTerm) {
      const searchTerms = {
        $regex: new RegExp("" + searchTerm.trim().toLowerCase(), "i"),
      };
      query = {
        $and: [
          { isDeleted: false },
          {
            $or: [
              { name: searchTerms },
              { email: searchTerms },
            ],
          },
        ],
      };
    }

    if (filterDate) {
      const fromDate = filterDate.fromDate;
      const toDate = filterDate.toDate;
      if (fromDate && !toDate) {
        query = {
          ...query,
          $expr: {
            $and: [
              {
                $eq: [
                  {
                    $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" },
                  },
                  fromDate,
                ],
              },
            ],
          },
        };
      }
      if (!fromDate && toDate) {
        query = {
          ...query,
          $expr: {
            $and: [
              {
                $eq: [
                  { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                  toDate,
                ],
              },
            ],
          },
        };
      }
      if (fromDate && toDate) {
        query = {
          ...query,
          $expr: {
            $and: [
              {
                $gte: [
                  { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                  fromDate,
                ],
              },
              {
                $lte: [
                  { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                  toDate,
                ],
              },
            ],
          },
        };
      }
    }

    const count = await CLIENT_COLLECTION.countDocuments(query);

    if (count > 0) {
      res.status(200).json({
        message: CONSTANT.COLLECTION.CLIENT + CONSTANT.MESSAGE.DATA_FOUND,
        totalRecords: count,
      });
    } else {
      res.status(404).json({
        message: CONSTANT.MESSAGE.DATA_NOT_FOUND,
        totalRecords: count,
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: CONSTANT.MESSAGE.SOMETHING_WRONG, err: err.message });
  }
};

/*
Method: GET
Todo: get user by id
*/
exports.getClientById = (req, res) => {
  let query = { isDeleted: false };
  const Id = req.params.id;
  try {
    if (!commonService.isValidObjId(Id)) {
      return res.status(403).send({
        message: CONSTANT.MESSAGE.INVALID_ID,
      });
    } else {
      query["_id"] = { $in: [Id] };
      CLIENT_COLLECTION.findOne(query).then((user) => {
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

/*
Method: PUT
Todo: update Client by ID
*/
exports.updateClientById = async (req, res) => {
  const Id = req.params.id;
  const isValid = commonService.isValidObjId(Id);
  try {
    if (!isValid) {
      return res.status(200).send({
        message: CONSTANT.MESSAGE.INVALID_ID,
      });
    } else {
      const { ...updatedFields } = req.body;

      const groupIds = updatedFields?.groupId
        ? updatedFields.groupId.split(',').map(id => id.trim())
        : [];
      const normalizedGroupIds = groupIds.map(id => id.padStart(3, '0'));
      const groups = await GROUP_COLLECTION.find({ groupId: { $in: normalizedGroupIds } });
      const groupNames = groups.map(group => group.name).join(', ');
      updatedFields.groupName = groupNames;
      updatedFields.whatsapp_number = formatNumber(updatedFields.whatsapp_number);
      updatedFields.mobile_number = formatNumber(updatedFields.mobile_number);
      const result = await CLIENT_COLLECTION.findByIdAndUpdate(
        Id,
        { ...updatedFields },
        { new: true }
      );

      if (!result) {
        return res.json({
          message: CONSTANT.COLLECTION.CLIENT + CONSTANT.MESSAGE.NOT_FOUND,
        });
      } else {
        res.status(200).json({
          message:
            CONSTANT.COLLECTION.CLIENT + CONSTANT.MESSAGE.UPDATED_SUCCESSFULLY,
          data: result,
        });
      }
    }
  } catch (err) {
    res.status(500).json({
      message: CONSTANT.MESSAGE.SOMETHING_WRONG,
      err: err.message,
    });
  }
};

/*
TODO: DELETE
Topic: delete user by id
*/
exports.deleteClientById = (req, res) => {
  const Id = req.params.id;
  try {
    if (!commonService.isValidObjId(Id)) {
      return res.status(403).send({
        message: CONSTANT.MESSAGE.INVALID_ID,
      });
    } else {
      CLIENT_COLLECTION.findOne({ _id: Id, isDeleted: false }).then((user) => {
        if (!user) {
          return res.status(403).send({
            message: CONSTANT.MESSAGE.CLIENT_NOT_FOUND,
          });
        } else {
          CLIENT_COLLECTION.findByIdAndUpdate(
            Id,
            { $set: { isDeleted: true } },
            { new: true }
          )
            .then(async (data) => {
              res.status(200).json({
                data: Id,
                message:
                  CONSTANT.COLLECTION.CLIENT +
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
TODO: POSt
Topic: delete Multiple Clients
*/
exports.deleteClients = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).send({ message: CONSTANT.MESSAGE.NOT_FOUND });
    }

    const result = await CLIENT_COLLECTION.updateMany(
      { _id: { $in: ids } },
      { $set: { isDeleted: true } }
    );
    res.status(200).send(ids);
  } catch (error) {
    console.error('Error deleting contacts:', error);
    res.status(500).send({ message: 'Error deleting contacts', error: error.message });
  }
};

/*
TODO: POST
Topic: HARD DELETE FROM TRASH
*/
exports.hardDeleteClients = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).send({ message: CONSTANT.MESSAGE.NOT_FOUND });
    }
    const result = await CLIENT_COLLECTION.deleteMany({ _id: { $in: ids } });
    res.status(200).send(ids);
  } catch (error) {
    console.error('Error deleting contacts:', error);
    res.status(500).send({ message: 'Error deleting contacts', error: error.message });
  }
};

/*
TODO: POSt
Topic: restore Multiple Clients
*/
exports.restoreClients = async (req, res) => {
  try {
    const ids = req.body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).send({ message: CONSTANT.MESSAGE.NOT_FOUND });
    }

    await CLIENT_COLLECTION.updateMany(
      { _id: { $in: ids } },
      { $set: { isDeleted: false } }
    )
      .then((response) => {
        if (response.ok) {
          res.status(200).send(ids);
        }
      })
      .catch((error) => {
        res.status(500).send({ message: 'Error restoring contacts', error: error.message });
      });
  } catch (error) {
    console.error('Error deleting contacts:', error);
    res.status(500).send({ message: 'Error deleting contacts', error: error.message });
  }
};

// function to update user profile of user.
exports.updateClientProfile = async (req, res) => {
  try {
    const folder = CONSTANT.UPLOAD_DOC_PATH.PROFILE_PIC_PATH;
    commonService.pictureUploadFunction(
      folder,
      "",
      req,
      res,
      async (err, files) => {
        if (err && files && files.length <= 0) {
          return res.status(400).send({
            message: err.message || CONSTANT.MESSAGE.PROFILE_NOT_UPDATE,
          });
        } else {
          let obj = {};
          const id = req.body._id;

          if (files[0]) {
            obj[CONSTANT.FIELD.PROFILE_PICTURE] = files[0];
            obj[CONSTANT.FIELD.PROFILE_PICTURE][CONSTANT.COMMON.URL] =
              process.env.BACKEND_URL +
              folder +
              "/" +
              files[0][CONSTANT.COMMON.FILE_NAME];
          } else {
            obj[CONSTANT.FIELD.PROFILE_PICTURE] = '';
          }

          CLIENT_COLLECTION.findByIdAndUpdate(
            id,
            { profile_picture: obj.profile_picture },
            { new: true }
          )
            .then((result) => {
              return res.status(200).send({
                message: CONSTANT.MESSAGE.PROFILE_UPDATE,
                profileImg: obj.profile_picture.url,
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

exports.updateClientCompanyProfile = async (req, res) => {
  try {
    const folder = CONSTANT.UPLOAD_DOC_PATH.COMPANY_PROFILE_PIC_PATH;
    commonService.pictureUploadFunction("",
      folder,
      req,
      res,
      async (err, profile, files) => {
        if (err && files && files.length <= 0) {
          return res.status(400).send({
            message: err.message || CONSTANT.MESSAGE.PROFILE_NOT_UPDATE,
          });
        } else {
          let obj = {};
          const id = req.body._id;

          if (files[0]) {
            obj[CONSTANT.FIELD.COMPANY_PROFILE_PICTURE] = files[0];
            obj[CONSTANT.FIELD.COMPANY_PROFILE_PICTURE][CONSTANT.COMMON.URL] =
              process.env.BACKEND_URL +
              folder +
              "/" +
              files[0][CONSTANT.COMMON.FILE_NAME];
          } else {
            obj[CONSTANT.FIELD.COMPANY_PROFILE_PICTURE] = '';
          }

          CLIENT_COLLECTION.findByIdAndUpdate(
            id,
            { company_profile_picture: obj.company_profile_picture },
            { new: true }
          )
            .then((result) => {
              return res.status(200).send({
                message: CONSTANT.MESSAGE.COMPANY_PROFILE_UPDATE,
                profileImg: obj.company_profile_picture.url,
                data: result
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

exports.bulkProfilePictureUpload = async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).send({
        message: "No files were uploaded."
      });
    }

    const profileFiles = req.files;
    const updatePromises = profileFiles.map(async (file) => {
      const whatsappNumber = file.originalname.split('.')[0];
      const profilePictureUrl = `${process.env.BACKEND_URL}${CONSTANT.UPLOAD_DOC_PATH.PROFILE_PIC_PATH}/${file.filename}`;
      return CLIENT_COLLECTION.findOneAndUpdate(
        { whatsapp_number: `+${whatsappNumber}` },
        {
          $set: {
            'profile_picture.url': profilePictureUrl,
            'profile_picture.filename': file.originalname,
          },
        },
        { new: true }
      );
    });

    Promise.all(updatePromises)
      .then((results) => {
        return res.status(200).send({
          message: CONSTANT.MESSAGE.PROFILE_UPDATE,
          results: results,
        });
      })
      .catch((updateError) => {
        return res.status(500).send({
          message: updateError.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
        });
      });
  } catch (err) {
    return res.status(404).send({
      message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
    });
  }
};

exports.bulkCompanyProfilePictureUpload = async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).send({
        message: "No files were uploaded."
      });
    }

    const profileFiles = req.files;
    const updatePromises = profileFiles.map(async (file) => {
      const whatsappNumber = file.originalname.split('.')[0];
      const profilePictureUrl = `${process.env.BACKEND_URL}${CONSTANT.UPLOAD_DOC_PATH.COMPANY_PROFILE_PIC_PATH}/${file.filename}`;

      return CLIENT_COLLECTION.findOneAndUpdate(
        { whatsapp_number: `+${whatsappNumber}` },
        {
          $set: {
            'company_profile_picture.url': profilePictureUrl,
            'company_profile_picture.filename': file.originalname,
          },
        },
        { new: true }
      );
    });

    Promise.all(updatePromises)
      .then((results) => {
        return res.status(200).send({
          message: CONSTANT.MESSAGE.PROFILE_UPDATE,
          results: results,
        });
      })
      .catch((updateError) => {
        return res.status(500).send({
          message: updateError.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
        });
      });
  } catch (err) {
    return res.status(404).send({
      message: err.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
    });
  }
};

/*
Topic: Password Reset Success Mail
*/
function passwordResetSuccessEmail(result, callback) {
  var header = commonService.getHeader();
  var footer = commonService.getFooter();
  const username = result.name;
  const TO = result.email;
  const Subject = CONSTANT.MESSAGE.RESET_PASSWORD_SUCCESS_EMAIL;

  commonService.passwordResetSuccessHTML(
    username,
    header,
    footer,
    (htmlTemplate) => {
      var mailOptions = {
        to: TO,
        from: '"Airwe" <vinay.pixerfect@gmail.com>',
        subject: Subject,
        html: htmlTemplate,
      };

      commonService.sendCommonEmail(mailOptions, (result) => {
        if (result.status === CONSTANT.FAIL) {
          callback({
            status: CONSTANT.FAIL,
            message: CONSTANT.MESSAGE.FAIL_TO_SEND_EMAIL,
          });
        } else {
          callback({
            status: CONSTANT.SUCCESS,
            message: CONSTANT.MESSAGE.EMAIL_SENT_SUCCESSFULLY,
          });
        }
      });
    }
  );
}

/*
TODO: get
Topic: Exports clients to CSV
*/
exports.exportClientToCSV = async (req, res) => {
  try {
    const groupId = await req.query.groupId;
    let query = { isDeleted: false };
    if (groupId) {
      query.groupId = { $regex: new RegExp(`(^|,)${groupId}(,|$)`) };
    }
    const clients = await CLIENT_COLLECTION.find(query);

    const fields = [
      { label: "Name", value: "name" },
      { label: "Company_Name", value: "company_name" },
      { label: "Mobile_Number", value: "mobile_number" },
      { label: "Whatsapp_Number", value: "whatsapp_number" },
      { label: "Email", value: "email" },
      { label: "City", value: "city" },
      { label: "District", value: "district" },
      { label: "Address", value: "address" },
      { label: "InstagramID", value: "instagramID" },
      { label: "FacebookID", value: "facebookID" },
      { label: "Is_Favorite", value: "isFavorite" },
      { label: "Group_ID", value: "groupId" }
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(clients);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=clients.csv");

    res.status(200).end(csv);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error exporting data", error: error.message });
  }
};

/*
TODO: POST
Topic: Import clients from CSV
*/
exports.importClientFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
    }

    var results = [];
    const selectedGroup = req.query.groupId;

    const processingPromises = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (clientData) => {
        processingPromises.push(
          (async () => {
            if (!clientData.Name && !clientData.Whatsapp_Number && !clientData.Email && !clientData.Mobile_Number) {
              return;
            }

            let { Mobile_Number, Whatsapp_Number } = clientData;
            if (!Whatsapp_Number && clientData.Name !== null) {
              results.push({
                action: "invalid",
                reason: "WhatsApp Number is required, Please Add Whatsapp Number",
                client: clientData,
              });
              return;
            }

            const sanitizePhoneNumber = (number) => {
              if (!number) return null;
              let sanitizedNumber = number.replace(/\s+/g, "");
              if (/^\+91\d{10}$/.test(sanitizedNumber)) {
                return sanitizedNumber;
              }
              if (/^\d{10}$/.test(sanitizedNumber)) {
                return `+91${sanitizedNumber}`;
              }
              return null;
            };

            Whatsapp_Number = sanitizePhoneNumber(Whatsapp_Number);
            if (!Whatsapp_Number) {
              results.push({
                action: "invalid",
                reason: "Invalid WhatsApp Number, it should be 10 Digits",
                client: clientData,
              });
              return;
            }

            if (Mobile_Number) {
              Mobile_Number = sanitizePhoneNumber(Mobile_Number);
              const invalidMobileNumber = !Mobile_Number;
              if (invalidMobileNumber) {
                results.push({
                  action: "invalid",
                  reason: "Invalid Mobile Number, it should be 10 Digits",
                  client: clientData,
                });
                return;
              }
            }

            const existingClient = await CLIENT_COLLECTION.findOne({
              whatsapp_number: Whatsapp_Number,
              isDeleted: false,
            });

            const clientObj = {
              name: clientData?.Name,
              company_name: clientData?.Company_Name,
              mobile_number: Mobile_Number,
              whatsapp_number: Whatsapp_Number,
              email: clientData?.Email,
              city: clientData?.City,
              district: clientData?.District,
              address: clientData?.Address,
              instagramID: clientData?.InstagramID,
              facebookID: clientData?.FacebookID,
              isFavorite: clientData?.Is_Favorite,
              groupId: selectedGroup ? selectedGroup : clientData?.Group_ID,
              isDeleted: false,
            };

            const groupIds = clientObj?.groupId
              ? clientObj?.groupId.split(",").map((id) => id.trim())
              : [];
            const normalizedGroupIds = groupIds.map((id) => id.padStart(3, "0"));
            const groups = await GROUP_COLLECTION.find({ groupId: { $in: normalizedGroupIds } });
            const groupNames = groups.map((group) => group.name).join(", ");
            clientObj.groupName = groupNames;

            if (existingClient) {
              const updatedClient = await CLIENT_COLLECTION.findByIdAndUpdate(
                existingClient._id,
                { $set: clientObj },
                { new: true }
              );
              results.push({ action: "updated", client: updatedClient });
              await updatedClient.save();
            } else {
              const newClient = await CLIENT_COLLECTION.create(clientObj);
              results.push({ action: "inserted", client: newClient });
              await newClient.save();
            }
          })()
        );
      })
      .on("end", async () => {
        await Promise.all(processingPromises);

        const importedWhatsappNumbers = Array.isArray(results)
          ? results
            .filter((item) => item.action === "inserted" || item.action === "updated")
            .map((item) => item.client?.whatsapp_number)
          : [];

        if (selectedGroup) {
          const contactList = await CLIENT_COLLECTION.find({
            groupId: { $regex: new RegExp(`(^|,)${selectedGroup}(,|$)`) },
            whatsapp_number: { $in: importedWhatsappNumbers },
          });
          res.status(200).send({
            message: "Clients imported successfully in this group",
            data: contactList,
            changes: results,
          });
        } else {
          const contactList = await CLIENT_COLLECTION.find({
            whatsapp_number: { $in: importedWhatsappNumbers },
          });
          res.status(200).send({
            message: "Clients imported successfully",
            data: contactList,
            changes: results,
          });
        }
      })
      .on("error", (error) => {
        res.status(500).send({ message: "Error importing clients", error: error.message });
      });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error importing clients", error: error.message });
  }
};

/*
TODO: POST
Topic: Create Group
*/
exports.createGroup = async (req, res) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      const { name, _ } = commonService.getUserIdFromToken(req);
      const extGrp = await GROUP_COLLECTION.findOne({ name: req.body.name });
      if (extGrp) {
        return res.status(400).send({ message: CONSTANT.MESSAGE.GROUP_ALREADY_EXIST });
      }

      async function generateGroupId() {
        const latestGroup = await GROUP_COLLECTION.findOne().sort({ groupId: -1 }).exec();

        if (latestGroup) {
          const nextId = parseInt(latestGroup.groupId, 10) + 1;
          return nextId.toString().padStart(3, '0');
        } else {
          return '001';
        }
      }

      const groupId = await generateGroupId();
      let groupObj = {
        groupId: groupId,
        name: req.body.name,
        remarks: req.body.remarks ? req.body.remarks : "",
        addedBy: name
      };

      GROUP_COLLECTION.create(groupObj)
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
  }
};

exports.addContactsToGroup = async (req, res) => {
  const { Ids, groupId } = req.body;

  try {
    const newGroupId = groupId.trim();

    const name = await GROUP_COLLECTION.findOne({ groupId: newGroupId, isDeleted: false });
    const results = [];

    for (const id of Ids) {
      const user = await CLIENT_COLLECTION.findById(id);
      if (!user) continue;
      const existingGroupIds = user.groupId && user.groupId !== CONSTANT.NULL_STRING
        ? user.groupId.split(',').map(id => id.trim())
        : [];

      const mergedGroupIds = Array.from(new Set([...existingGroupIds, newGroupId])).join(', ');

      const existingGroupNames = user.groupName && user.groupName !== CONSTANT.NULL_STRING
        ? user.groupName.split(',').map(name => name.trim())
        : [];

      const mergedGroupNames = Array.from(new Set([...existingGroupNames, name.name])).join(', ');

      const updatedUser = await CLIENT_COLLECTION.findByIdAndUpdate(
        id,
        {
          groupId: mergedGroupIds,
          groupName: mergedGroupNames,
        },
        { new: true }
      );

      if (updatedUser) results.push(updatedUser);
    }

    res.status(200).json({
      message: CONSTANT.MESSAGE.ADDED_SUCCESSFULLY,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      message: CONSTANT.MESSAGE.ERROR_OCCURRED,
      error: error.message,
    });
  }
};

/*
TODO: POST
Topic: Create Group
*/
exports.getAllGroupsName = async (req, res) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      await GROUP_COLLECTION.find().then((groups) => {
        const grpArr = groups.map((group) => group.name);
        return res.status(200).send(grpArr)
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
TODO: POST
Topic: Create Group
*/
exports.getAllGroups = async (req, res) => {
  const errors = validationResult(req).array();
  if (errors && errors.length > 0) {
    let messArr = errors.map((a) => a.msg);
    return res.status(400).send({
      message: CONSTANT.MESSAGE.REQUIRED_FIELDS_MISSING,
      error: messArr.join(", "),
    });
  } else {
    try {
      await GROUP_COLLECTION.find({ isDeleted: false }).then((response) => {
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
Method: PUT
Todo: update Group by ID
*/
exports.updateGroupById = async (req, res) => {
  const Id = req.params.id;
  const isValid = commonService.isValidObjId(Id);
  try {
    if (!isValid) {
      return res.status(200).send({
        message: CONSTANT.MESSAGE.INVALID_ID,
      });
    } else {
      const { ...updatedFields } = req.body;
      const result = await GROUP_COLLECTION.findByIdAndUpdate(
        Id,
        { ...updatedFields },
        { new: true }
      );
      if (!result) {
        return res.json({
          message: CONSTANT.COLLECTION.CLIENT + CONSTANT.MESSAGE.NOT_FOUND,
        });
      } else {
        res.status(200).json({
          message:
            CONSTANT.COLLECTION.CLIENT + CONSTANT.MESSAGE.UPDATED_SUCCESSFULLY,
          data: result,
        });
      }
    }
  } catch (err) {
    res.status(500).json({
      message: CONSTANT.MESSAGE.SOMETHING_WRONG,
      err: err.message,
    });
  }
};

/*
TODO: DELETE
Topic: delete Group by id
*/
exports.deleteGroupById = (req, res) => {
  const Id = req.params.id;
  try {
    if (!commonService.isValidObjId(Id)) {
      return res.status(403).send({
        message: CONSTANT.MESSAGE.INVALID_ID,
      });
    } else {
      GROUP_COLLECTION.findOne({ _id: Id, isDeleted: false }).then((group) => {
        if (!group) {
          return res.status(403).send({
            message: CONSTANT.MESSAGE.GROUP_NOT_FOUND,
          });
        } else {
          GROUP_COLLECTION.findByIdAndUpdate(
            Id,
            { $set: { isDeleted: true } },
            { new: true }
          )
            .then(async (data) => {
              res.status(200).json({
                data: Id,
                message:
                  CONSTANT.COLLECTION.GROUP +
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
Todo: get Group by id
*/
exports.getGroupById = (req, res) => {
  let query = { isDeleted: false };
  const Id = req.params.id;
  try {
    if (!commonService.isValidObjId(Id)) {
      return res.status(403).send({
        message: CONSTANT.MESSAGE.INVALID_ID,
      });
    } else {
      query["_id"] = { $in: [Id] };
      GROUP_COLLECTION.findOne(query).then((user) => {
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

/*
TODO: POST
Topic: Get All Members of Group
*/
exports.getMembersForGroup = async (req, res) => {
  try {
    const groupId = req.body.groupId?.trim();
    if (!groupId) {
      return res.status(400).send({
        message: CONSTANT.MESSAGE.INVALID_GROUP_ID,
      });
    }

    const regex = new RegExp(`(^|,\\s*)${groupId}(,|\\s*|$)`);
    const clients = await CLIENT_COLLECTION.find({
      groupId: regex,
      isDeleted: false,
    });

    if (!clients || clients.length === 0) {
      return res.status(404).send({
        message: CONSTANT.MESSAGE.NO_MEMBERS_FOUND,
      });
    }

    return res.status(200).send(clients);

  } catch (error) {
    return res.status(500).send({
      message: error.message || CONSTANT.MESSAGE.ERROR_OCCURRED,
    });
  }
};