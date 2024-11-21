const crypto = require("crypto");
var multer = require("multer");
const fs = require("fs");
const mongodb = require("mongodb");
const jwt = require("jsonwebtoken");
const config = require("config");
const CONSTANT = require("../common/constant");
const path = require("path");
const ALGO = config.get("ALGO");
const ENCRYPTION_KEY = config.get("ENCRYPTION_KEY");
const IV_LENGTH = config.get("IV_LENGTH");
const ejs = require("ejs");
const { createLogger, format, transports } = require("winston");
const nodemailer = require("nodemailer");
const winston = require("winston");
const { callbackify } = require("util");
const moment = require("moment");
const USER_COLLECTION = require("../module/user.module");
const transporter = nodemailer.createTransport({
  host: process.env.HOST,
  service: process.env.SERVICE,
  port: process.env.PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/*-------------------------------------------------------*/

exports.isUndefinedOrNull = _isUndefinedOrNull;
exports.isObjEmpty = _isObjEmpty;
exports.isArrayEmpty = _isArrayEmpty;
exports.isValidEmail = _isValidEmail;
exports.encryptPWD = _encryptPWD;
exports.decryptPWD = _decryptPWD;
exports.UUID = _UUID;
exports.isValidURL = _isValidURL;
exports.generateHashCode = _generateHashCode;
exports.sendCommonEmail = _sendCommonEmail;
exports.generateOTP = _generateOTP;
exports.generatePassword = _generatePassword;
exports.isValidObjId = _isValidObjId;
exports.pictureUploadFunction = _pictureUploadFunction;
exports.marketingUploadFunction = _marketingUploadFunction;
exports.templateUploadFunction = _templateUploadFunction;
exports.templateImagesUploadFunction = _templateImagesUploadFunction;
exports.templateFormatUploadFunction = _templateFormatUploadFunction;
exports.multiplePictureUploadFunction = _multiplePictureUploadFunction;
exports.generateToken = _generateToken;
exports.getUserDetail = _getUserDetail;
exports.containsAllItemInArray = _containsAllItemInArray;
exports.getLogData = _getLogData;
exports.getUserIdFromToken = _getUserIdFromToken;
exports.groupBy = _groupBy;
exports.groupByNew = _groupByNew;
exports.getAverage = _getAverage;
exports.getMMYYYYDate = _getMMYYYYDate;
exports.isArrayOfObjectEmpty = _isArrayOfObjectEmpty;
exports.isValidMonthDayYearFormat = _isValidMonthDayYearFormat;
exports.getTimeStampsData = _getTimeStampsData;
exports.getUserData = _getUserData;
/*-------------------------------------------------------*/

/*
To grouping data.
*/
function _groupBy(objectArray, property) {
  return objectArray.reduce(function (acc, obj) {
    var key = obj[property];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);
    return acc;
  }, {});
}

/*
To grouping data.
*/
function _groupByNew(objectArray, property, subProperty) {
  return objectArray.reduce(function (acc, obj) {
    if (obj[property] && obj[property][subProperty]) {
      var key = obj[property][subProperty];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(obj);
    }
    return acc;
  }, {});
}

// get average value
function _getAverage(numbers) {
  if (numbers.length === 0) {
    return 0;
  }

  const sum = numbers.reduce(
    (accumulator, currentValue) => accumulator + currentValue
  );
  const average = sum / numbers.length;
  const getAverage = average.toFixed(1);

  return parseFloat(getAverage);
}

// check email valid or not
function _isValidEmail(email) {
  if (!email) return false;
  var re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  email = email.trim();
  return re.test(email.toLowerCase());
}

// get user id from token

function _getUserIdFromToken(req) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.decode(token);
    const userId = decodedToken.userId;
    const role = decodedToken.role;
    const name = decodedToken.name;
    return { userId, role, name };
  } catch (error) {
    return null;
  }
}

/*
To string encrypt
*/
function _encryptPWD(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv(ALGO, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

/*
To string decrypt
*/
function _decryptPWD(text) {
  let textParts = text.split(":");
  let iv = Buffer.from(textParts.shift(), "hex");
  let encryptedText = Buffer.from(textParts.join(":"), "hex");
  let decipher = crypto.createDecipheriv(ALGO, Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

/*
Generate uniqueID  function
*/
function _UUID() {
  var result = "";
  var characters = CONSTANT.CHARACTERS;
  var charactersLength = characters.length;
  for (var i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/*
To check value is undefined or null.
*/
function _isUndefinedOrNull(value) {
  return typeof value == CONSTANT.UNDEFINED || value == null || value == "";
}

/*
To check validate a URL
 */
function _isValidURL(url) {
  if (_isUndefinedOrNull(url)) {
    return false;
  }
  let re =
    /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i;
  return re.test(url.toLowerCase());
}

/*
To check object is undefined or null.
*/
function _isObjEmpty(obj) {
  return (
    typeof obj == CONSTANT.UNDEFINED || obj == null || !Object.keys(obj).length
  );
}

/*
To check value is empty array.
*/
function _isArrayEmpty(array) {
  return (
    typeof array == CONSTANT.UNDEFINED || array == null || array.length <= 0
  );
}

/*
To check value is empty for array of object.
*/
function _isArrayOfObjectEmpty(array) {
  const hasBlankValue = array.some((obj) =>
    Object.values(obj).some((value) => value === "")
  );
  console.log("============ hasBlankValue ============", hasBlankValue);
  return hasBlankValue;
}

/*
to generate hashCode
*/
function _generateHashCode() {
  return crypto.randomBytes(16).toString("hex");
}

/*
OTP generator( 8 digit) function
*/
function _generateOTP() {
  let digits = CONSTANT.DIGITS;
  let OTP = "";
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

/*
password generator( 8 digit) function
*/
function _generatePassword() {
  var characters = CONSTANT.CHARACTERS;
  var password = "";
  for (var i = 0; i < 8; i++) {
    password += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return password;
}

/*
token generator( 10 digit) function
*/
function _generateToken() {
  let characters = CONSTANT.PWD_CHAR;
  let token = "";
  for (let i = 0; i < 10; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
}
/*
To check id is valid or not.
*/
function _isValidObjId(id) {
  if (!_isUndefinedOrNull(id)) {
    return mongodb.ObjectId.isValid(id);
  } else {
    return false;
  }
}

// send email
function _sendCommonEmail(mailOptions, callback) {
  transporter.verify(function (error, success) {
    if (error) {
      console.log(CONSTANT.MESSAGE.ERROR_VERIFY_TRANSPORTER, error);
      if (callback) {
        callback(error, null);
      }
    } else {
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(CONSTANT.MESSAGE.ERROR_SEND_MAIL, error);
          if (callback) {
            callback(error, null);
          }
        } else {
          console.log(CONSTANT.MESSAGE.ERROR_SENT, info.response);
          callback({
            status: CONSTANT.SUCCESS,
            message: CONSTANT.MESSAGE.EMAIL_SENT_SUCCESSFULLY,
          });
        }
      });
    }
  });
}

// profile uploading
function _pictureUploadFunction(profile, companyProfile, req, res, callback) {
  var profileFiles = [];
  var companyProfileFiles = [];
  var file_name;
  var type;
  var fileType = "";
  var userData = { ...req.decoded };
  const number = req.query.whatsapp_number;
  const whatsapp_number = String(number).trim().replace('+', '');

  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === CONSTANT.FIELD.PROFILE_PICTURE) {
        cb(null, profile);
      } else if (file.fieldname === CONSTANT.FIELD.COMPANY_PROFILE_PICTURE) {
        cb(null, companyProfile);
      } else {
        cb(new Error('Invalid field name'), null);
      }
    },
    filename: (req, file, cb) => {
      fileType = path.extname(file.originalname);
      type = file.fieldname;
      var date = new Date().getTime();
      file_name = whatsapp_number + path.extname(file.originalname);
      cb(null, file_name);

      if (
        type === CONSTANT.FIELD.ATTACHMENT ||
        type === CONSTANT.FIELD.PROFILE_PICTURE
      ) {
        profileFiles.push({
          filename: file_name,
          timestamp: date,
          extension: path.extname(file.originalname),
          originalname: file.originalname,
          fieldName: type,
        });
      }

      if (type === CONSTANT.FIELD.COMPANY_PROFILE_PICTURE) {
        companyProfileFiles.push({
          filename: file_name,
          timestamp: date,
          extension: path.extname(file.originalname),
          originalname: file.originalname,
          fieldName: type,
        });
      }
    },
  });

  const fileFilter = function (req, file, cb) {
    const allowedMimeTypes = CONSTANT.ALLOW_IMAGE_TYPE;
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(CONSTANT.MESSAGE.FILE_UPLOAD_TYPE_VALIDATION_MESSAGE),
        false
      );
    }
  };

  var upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 4 * 1024 * 1024, // Limit file size to 4MB
    },
  }).fields([
    { name: CONSTANT.FIELD.PROFILE_PICTURE },
    { name: CONSTANT.FIELD.COMPANY_PROFILE_PICTURE },
  ]);
  upload(req, res, (err) => {
    if (err) {
      callback(err, [], []);
    } else {
      callback(null, profileFiles, companyProfileFiles);
    }
  });
}

function _marketingUploadFunction(folder, req, res, callback) {
  var files = [];
  var file_name;
  var type;
  var fileType = "";

  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === CONSTANT.FIELD.DOCUMENT) {
        cb(null, folder);
      } else {
        cb(new Error('Invalid field name'), null);
      }
    },
    filename: (req, file, cb) => {
      fileType = path.extname(file.originalname);
      type = file.fieldname;
      var date = new Date().getTime();

      if (!req) {
        file_name =
          type === CONSTANT.FIELD.DOCUMENT
            ? file.originalname
            : file.originalname;
        cb(null, file_name);
      } else {
        file_name =
          type === CONSTANT.FIELD.DOCUMENT
            ? file.originalname
            : file.originalname;
        cb(null, file_name);
      }

      if (
        type === CONSTANT.FIELD.ATTACHMENT ||
        type === CONSTANT.FIELD.DOCUMENT
      ) {
        files.push({
          filename: file_name,
          timestamp: date,
          extension: path.extname(file.originalname),
          originalname: file.originalname,
          fieldName: type,
        });
      }
    },
  });

  const fileFilter = function (req, file, cb) {
    const allowedMimeTypes = CONSTANT.ALLOW_IMAGE_TYPE;
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(CONSTANT.MESSAGE.FILE_UPLOAD_TYPE_VALIDATION_MESSAGE),
        false
      );
    }
  };

  var upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 15 * 1024 * 1024, // Limit file size to 15MB
    },
  }).fields([
    { name: CONSTANT.FIELD.DOCUMENT },
  ]);

  upload(req, res, (err) => {
    if (err) {
      callback(err, []);
    } else {
      callback(null, files);
    }
  });
};

function _templateUploadFunction(folder, req, res, callback) {
  var files = [];
  var file_name;
  var type;
  var fileType = "";
  const name = req.query.name;

  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === CONSTANT.FIELD.TEMPLATE) {
        cb(null, folder);
      } else {
        cb(new Error('Invalid field name'), null);
      }
    },
    filename: (req, file, cb) => {
      fileType = path.extname(file.originalname);
      type = file.fieldname;
      var name = _UUID();
      var date = new Date().getTime();

      if (!req) {
        file_name =
          type === CONSTANT.FIELD.TEMPLATE
            ? file.originalname
            : file.originalname;
        cb(null, file_name);
      } else {
        file_name =
          type === CONSTANT.FIELD.TEMPLATE
            ? file.originalname
            : file.originalname;
        cb(null, file_name);
      }

      if (
        type === CONSTANT.FIELD.ATTACHMENT ||
        type === CONSTANT.FIELD.TEMPLATE
      ) {
        files.push({
          filename: file_name,
          timestamp: date,
          extension: path.extname(file.originalname),
          originalname: file.originalname,
          fieldName: type,
        });
      }
    },
  });

  const fileFilter = function (req, file, cb) {
    const allowedMimeTypes = CONSTANT.ALLOW_IMAGE_TYPE;
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(CONSTANT.MESSAGE.FILE_UPLOAD_TYPE_VALIDATION_MESSAGE),
        false
      );
    }
  };

  var upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 4 * 1024 * 1024, // Limit file size to 4MB
    },
  }).fields([
    { name: CONSTANT.FIELD.TEMPLATE },
  ]);

  upload(req, res, (err) => {
    if (err) {
      callback(err, []);
    } else {
      callback(null, files);
    }
  });
};

function _templateImagesUploadFunction(folder, req, res, callback) {
  var files = [];
  var file_name;
  var type;
  var fileType = "";

  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === CONSTANT.FIELD.TEMPLATE_IMAGE) {
        cb(null, folder);
      } else {
        cb(new Error('Invalid field name'), null);
      }
    },
    filename: (req, file, cb) => {
      fileType = path.extname(file.originalname);
      type = file.fieldname;
      var date = new Date().getTime();

      if (!req) {
        file_name =
          type === CONSTANT.FIELD.TEMPLATE_IMAGE
            ? file.originalname
            : file.originalname;
        cb(null, file_name);
      } else {
        file_name =
          type === CONSTANT.FIELD.TEMPLATE_IMAGE
            ? file.originalname
            : file.originalname;
        cb(null, file_name);
      }

      if (
        type === CONSTANT.FIELD.ATTACHMENT ||
        type === CONSTANT.FIELD.TEMPLATE_IMAGE
      ) {
        files.push({
          filename: file_name,
          timestamp: date,
          extension: path.extname(file.originalname),
          originalname: file.originalname,
          fieldName: type,
        });
      }
    },
  });

  const fileFilter = function (req, file, cb) {
    const allowedMimeTypes = CONSTANT.ALLOW_IMAGE_TYPE;
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(CONSTANT.MESSAGE.FILE_UPLOAD_TYPE_VALIDATION_MESSAGE),
        false
      );
    }
  };

  var upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 4 * 1024 * 1024, // Limit file size to 4MB
    },
  }).fields([
    { name: CONSTANT.FIELD.TEMPLATE_IMAGE },
  ]);

  upload(req, res, (err) => {
    if (err) {
      callback(err, []);
    } else {
      callback(null, files);
    }
  });
};

function _templateFormatUploadFunction(folder, req, res, callback) {
  var files = [];
  var file_name;
  var type;
  var fileType = "";

  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === CONSTANT.FIELD.TEMPLATE_FORMAT) {
        cb(null, folder);
      } else {
        cb(new Error('Invalid field name'), null);
      }
    },
    filename: (req, file, cb) => {
      fileType = path.extname(file.originalname);
      type = file.fieldname;
      var date = new Date().getTime();

      if (!req) {
        file_name =
          type === CONSTANT.FIELD.TEMPLATE_FORMAT
            ? file.originalname
            : file.originalname;
        cb(null, file_name);
      } else {
        file_name =
          type === CONSTANT.FIELD.TEMPLATE_FORMAT
            ? file.originalname
            : file.originalname;
        cb(null, file_name);
      }

      if (
        type === CONSTANT.FIELD.ATTACHMENT ||
        type === CONSTANT.FIELD.TEMPLATE_FORMAT
      ) {
        files.push({
          filename: file_name,
          timestamp: date,
          extension: path.extname(file.originalname),
          originalname: file.originalname,
          fieldName: type,
        });
      }
    },
  });

  const fileFilter = function (req, file, cb) {
    const allowedMimeTypes = CONSTANT.ALLOW_IMAGE_TYPE;
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(CONSTANT.MESSAGE.FILE_UPLOAD_TYPE_VALIDATION_MESSAGE),
        false
      );
    }
  };

  var upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 4 * 1024 * 1024, // Limit file size to 4MB
    },
  }).fields([
    { name: CONSTANT.FIELD.TEMPLATE_FORMAT },
  ]);

  upload(req, res, (err) => {
    if (err) {
      callback(err, []);
    } else {
      callback(null, files);
    }
  });
};

function _multiplePictureUploadFunction(profile, companyProfile, req, res, callback) {
  var profileFiles = [];
  var companyProfileFiles = [];
  var file_name;
  var type;
  var fileType = "";

  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === CONSTANT.FIELD.PROFILE_PICTURE) {
        cb(null, profile);
      } else if (file.fieldname === CONSTANT.FIELD.COMPANY_PROFILE_PICTURE) {
        cb(null, companyProfile);
      } else {
        cb(new Error('Invalid field name'), null);
      }
    },
    filename: (req, file, cb) => {
      fileType = path.extname(file.originalname);
      type = file.fieldname;
      var date = new Date().getTime();
      file_name = file.originalname;

      if (type === CONSTANT.FIELD.PROFILE_PICTURE || "") {
        profileFiles.push({
          filename: file_name,
          timestamp: date,
          extension: path.extname(file.originalname),
          originalname: file.originalname,
          fieldName: type,
        });
      }

      if (type === CONSTANT.FIELD.COMPANY_PROFILE_PICTURE) {
        companyProfileFiles.push({
          filename: file_name,
          timestamp: date,
          extension: path.extname(file.originalname),
          originalname: file.originalname,
          fieldName: type,
        });
      }
    },
  });

  const fileFilter = function (req, file, cb) {
    const allowedMimeTypes = CONSTANT.ALLOW_IMAGE_TYPE;
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(CONSTANT.MESSAGE.FILE_UPLOAD_TYPE_VALIDATION_MESSAGE),
        false
      );
    }
  };

  var upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 100 * 1024 * 1024, //limit 4 mb
    },
  }).fields([
    { name: CONSTANT.FIELD.PROFILE_PICTURE },
    { name: CONSTANT.FIELD.COMPANY_PROFILE_PICTURE },
  ]);

  upload(req, res, (err) => {
    if (err) {
      callback(err, []);
    } else {
      callback(null, profileFiles, companyProfileFiles);
    }
  });

}

function _getUserDetail(req) {
  const token = req.body.token || req.query.token || req.headers.authorization;
  if (token) {
    let userToken = token.split(" ")[1];
    let user = jwt.decode(userToken);
    return user;
  }
  return token;
}

function _containsAllItemInArray(arr1, arr2) {
  return arr2.every((arr2Item) => arr1.includes(arr2Item));
}

function _getLogData() {
  let logData = "";
  try {
    console.log(__dirname + "/..");
    const data = fs.readFileSync(__dirname + "/../logs/server.log", "utf8");
    const logs = data.trim().split("\n");

    // Get the last log entry
    const latestLog = logs[logs.length - 1];

    logData = latestLog;
  } catch (err) {
    logData = err;
  }
  return logData;
}

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${level}: ${timestamp} :\t${message}`;
});

exports.logger = createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
    logFormat
  ),
  transports: [
    new winston.transports.Console(),
    new transports.File({
      filename: "logs/server.log",
      format: format.combine(
        format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
        format.align(),
        format.printf(
          (info) => `${info.level}: ${[info.timestamp]}: ${info.message}`
        )
      ),
    }),
  ],
});

function _getMMYYYYDate(date) {
  let dateArray = date.split("-");
  return dateArray[0] + "-" + dateArray[2];
}

function _isValidMonthDayYearFormat(dateString) {
  const format = "MM-DD-YYYY";
  return moment(dateString, format, true).isValid();
}

/*
Return start and end time base on days
*/
function _getTimeStampsData(day) {
  // Get the current timestamp in the local timezone
  const startDate = moment().valueOf();
  // Get the timestamp after 24 hours in the local timezone
  const endDate = moment().add(day * 24, "hours");

  return { startDate, endDate };
}

async function _getUserData(id) {
  const userData = await USER_COLLECTION.findById(id);
  return userData;
}