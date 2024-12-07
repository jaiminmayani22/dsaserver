const { check } = require("express-validator");
const CONSTANT = require("../common/constant");
const phoneNoRegex = /^\d{10,12}$/;
const nameRegex = /^[A-Za-z0-9\s\-]+$/;
const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i;

const userSignupValidators = [
  check("name")
    .optional()
    .custom((value) => {
      if (value && !nameRegex.test(value)) {
        throw new Error(CONSTANT.COMMON.NAME + CONSTANT.MESSAGE.IS_INVALID);
      }
      return true;
    }),

  check("phoneNo")
    .optional()
    .custom((value) => {
      if (value && !phoneNoRegex.test(value)) {
        throw new Error(
          CONSTANT.COMMON.PHONE_NO + CONSTANT.MESSAGE.PHONE_DIGIT
        );
      }
      return true;
    }),

  check("email").custom((value) => {
    if (!value || value.replace(/\s*/g, "").length <= 0) {
      throw new Error(CONSTANT.COMMON.EMAIL + CONSTANT.MESSAGE.IS_REQUIRED);
    }
    if (value && !emailRegex.test(value)) {
      throw new Error(CONSTANT.COMMON.EMAIL + CONSTANT.MESSAGE.IS_INVALID);
    }
    return true;
  }),

  check("password").custom((value, { req }) => {
      if (!value || value.replace(/\s*/g, "").length <= 0) {
        throw new Error(
          CONSTANT.COMMON.PASSWORD + CONSTANT.MESSAGE.IS_REQUIRED
        );
      }
    return true;
  }),
];

const userLoginValidators = [
  check("email").custom((value) => {
    if (!value || value.replace(/\s*/g, "").length <= 0) {
      throw new Error(CONSTANT.COMMON.EMAIL + CONSTANT.MESSAGE.IS_REQUIRED);
    }
    return true;
  }),

  check("password").custom((value, { req }) => {
      if (!value || value.replace(/\s*/g, "").length <= 0) {
        throw new Error(
          CONSTANT.COMMON.PASSWORD + CONSTANT.MESSAGE.IS_REQUIRED
        );
      }
    return true;
  })
];

const userVerifyValidators = [
  check("OTP").custom((value) => {
    if (!value || value.replace(/\s*/g, "").length <= 0) {
      throw new Error(CONSTANT.COMMON.OTP + CONSTANT.MESSAGE.IS_REQUIRED);
    }
    return true;
  }),

  check("email").custom((value) => {
    if (!value || value.replace(/\s*/g, "").length <= 0) {
      throw new Error(CONSTANT.COMMON.EMAIL + CONSTANT.MESSAGE.IS_REQUIRED);
    }
    return true;
  }),
];

const userForgotValidators = [
  check("email").custom((value) => {
    if (!value || value.replace(/\s*/g, "").length <= 0) {
      throw new Error(CONSTANT.COMMON.EMAIL + CONSTANT.MESSAGE.IS_REQUIRED);
    }
    return true;
  }),
];

const userForgotResetValidators = [
  check("email").custom((value) => {
    if (!value || value.replace(/\s*/g, "").length <= 0) {
      throw new Error(CONSTANT.COMMON.EMAIL + CONSTANT.MESSAGE.IS_REQUIRED);
    }
    return true;
  }),
  check("password").custom((value) => {
    if (!value || value.replace(/\s*/g, "").length <= 0) {
      throw new Error(
        CONSTANT.COMMON.NEW_PASSWORD + CONSTANT.MESSAGE.IS_REQUIRED
      );
    }
    return true;
  }),
  check("confirmPassword").custom((value) => {
    if (!value || value.replace(/\s*/g, "").length <= 0) {
      throw new Error(
        CONSTANT.COMMON.CONFIRM_PASSWORD + CONSTANT.MESSAGE.IS_REQUIRED
      );
    }
    return true;
  }),
  check("otp").custom((value) => {
    if (!value || value.replace(/\s*/g, "").length <= 0) {
      throw new Error(CONSTANT.COMMON.OTP + CONSTANT.MESSAGE.IS_REQUIRED);
    }
    return true;
  }),
];

const userResetValidators = [
  check("email").custom((value) => {
    if (!value || value.replace(/\s*/g, "").length <= 0) {
      throw new Error(CONSTANT.COMMON.EMAIL + CONSTANT.MESSAGE.IS_REQUIRED);
    }
    return true;
  }),
  check("newPassword").custom((value) => {
    if (!value || value.replace(/\s*/g, "").length <= 0) {
      throw new Error(
        CONSTANT.COMMON.NEW_PASSWORD + CONSTANT.MESSAGE.IS_REQUIRED
      );
    }
    return true;
  }),
  check("confirmPassword").custom((value) => {
    if (!value || value.replace(/\s*/g, "").length <= 0) {
      throw new Error(
        CONSTANT.COMMON.CONFIRM_PASSWORD + CONSTANT.MESSAGE.IS_REQUIRED
      );
    }
    return true;
  }),
];

const createUserValidators = [
   check("name")
    .optional()
    .custom((value) => {
      if (value && !nameRegex.test(value)) {
        throw new Error(CONSTANT.COMMON.NAME + CONSTANT.MESSAGE.IS_INVALID);
      }
      return true;
    }),

  check("phoneNo")
    .optional()
    .custom((value) => {
      if (value && !phoneNoRegex.test(value)) {
        throw new Error(
          CONSTANT.COMMON.PHONE_NO + CONSTANT.MESSAGE.PHONE_DIGIT
        );
      }
      return true;
    }),
];

const sendPushNotificationToUserValidator = [
  check("title").custom((value) => {
    if (!value || value.replace(/\s*/g, "").length <= 0) {
      throw new Error(CONSTANT.COMMON.TITLE + CONSTANT.MESSAGE.IS_REQUIRED);
    }
    return true;
  }),
];

module.exports = {
  userSignupValidators,
  userLoginValidators,
  userVerifyValidators,
  userForgotValidators,
  userForgotResetValidators,
  userResetValidators,
  createUserValidators,
  sendPushNotificationToUserValidator
};
