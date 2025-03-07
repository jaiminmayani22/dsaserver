module.exports = Object.freeze({
  SUCCESS: "success",
  SUCCEEDED: "succeeded",
  REFUNDED: "refunded",
  CANCELED: "canceled",
  FAIL: "fail",
  ERROR: "error",
  CANCEL: "cancel",
  REFUND: "refund",
  ACTIVE: "active",
  DEACTIVE: "deactive",
  PUBLISH: "published",
  UNPUBLISH: "unpublished",
  TRAVEL_PARTNER: "travelPartner",
  CARRY_PARCEL: "carryParcel",
  NEW: "new",
  FALSE: "false",
  TRUE: "true",
  CUSTOMER: "customer",
  SUSPEND: "suspend",
  STATUS_LIST: ["active", "deactive", "suspend"],
  _STATUS: ["active", "new", "closed"],
  STAFF_LIST: ["admin", "super_admin"],
  CUSTOMER_LIST: ["customer"],
  FROM_MAIL: '"Airwe" <vinay.pixerfect@gmail.com>',
  POST_STATUS_LIST: ["published", "unpublished"],
  SUPPORT_STATUS_LIST: ["new", "active", "closed"],
  ROLE_LIST: ["customer", "admin", "super_admin"],
  ROLE_LIST_OBJ: {
    customer: "Customer",
    admin: "Admin",
    super_admin: "Super Admin",
  },
  ROLE_ACCESS_LIST: [
    {
      dashboard: "Dashboard",
      posts: "Posts",
      staff: "Staff",
      customers: "Customers",
      feedback: "Feedback",
      support: "Support",
      transaction: "Transaction",
      refund: "Refund",
      notification: "Notification",
      faqs: "FAQ's",
      settings: "Settings",
      role_access: "Role Access",
    },
  ],
  REVIEW_FOR_LIST: ["post", "app"],
  SERVICE_DETAIL_CATEGORY_LIST: [
    "travelPartner",
    "carryParcel",
    "bumpTransaction",
  ],
  SERVICE_DETAIL_TYPE_LIST: ["needy", "give"],
  SERVICE_DETAIL_SUB_TYPE_LIST: ["post"],
  NEEDY: "needy",
  GIVE: "give",
  UNDEFINED: "undefined",
  INVALID_EMAIL: "Invalid email address",
  USER: "user",
  POST: "post ",
  NULL_STRING: "",
  NOT_APPROVED: "notApproved",
  ZERO: 0,
  NO: "no",
  NULL_ARRAY: [],
  SUPPORT_STATUS: ["new", "active", "closed"],
  PWD_CHAR: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  CHARACTERS: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  DIGITS: "0123456789",
  NULL_VALUE: 0,
  FLEXIBLE: "flexible",
  EXACT: "exact",
  SEND_ALL_CUSTOMERS: "send all customers",
  CUSTOM_SELECTION: "custom selection",
  ALLOW_IMAGE_TYPE: [
    "image/jpeg", // JPEG
    "image/png",  // PNG
    "image/jpg",  // JPG
    "image/heic", // HEIC
    "image/svg+xml", // SVG
    "video/mpeg",  // MPEG
    "video/mp4",   // MP4
    "video/3gp",   // 3GP
    "video/mpeg2", // MPEG-2
    "video/mpeg3",  // MPEG-3
    "application/pdf", // PDF
    "application/msword", // DOC
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
    "text/plain", // TXT
    "application/vnd.ms-excel", // XLS
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
    "application/vnd.ms-powerpoint", // PPT
    "application/vnd.openxmlformats-officedocument.presentationml.presentation" // PPTX
  ],
  MESSAGE: {
    TEMPLATE_NOT_FOUND: "Template not found",
    CAMPAIGN_NOT_FOUND: "Campaign not found",
    IMAGE_NOT_UPLOADED: "Image not uploaded",
    IMAGE_UPLOADED: "Image uploaded",
    TEMPLATE_FORMAT_UPLOADED: "Template Format uploaded",
    LOGIN_SUCCESSFULLY: "Login success!",
    CLIENTS_IMPORTED: "Clients imported successfully",
    MESSAGE_NOT_SEND: "Message send failed!",
    REGISTER_SUCCESSFULLY: "register successfully, ",
    NOT_REGISTERED: " Registration Failed!",
    REGISTER_SUCCESSFULLY_R: "Register successfully ",
    SAVED_SUCCESSFULLY: "Saved successfully",
    SENT_MAIL: "Verification code sent on your mail!",
    LOGIN_DETAIL_MAIL: "Login detail sent on mail!",
    FORGOT_MAIL: "Otp sent on your mail!",
    PASSWORD_INVALID: "Incorrect Password",
    PASSWORD_MISMATCH: "New and Confirm Password not matched",
    PASSWORD_MATCH:
      "Your new Password is same as Old Password, Please Choose different one",
    EXT_PASSWORD_MISMATCH: "Existing Password not matched",
    PASSWORD_CHANGE_SUCCESSFULLY: "Password change successfully!",
    EMAIL_REQUIRED: "Email address is required",
    EMAIL_INVALID: "Incorrect Email",
    NOT_ACTIVE_USER:
      "You are not active yet, please contact to administration!",
    EMAIL_VERIFIED: "Email verified successfully!",
    REQUIRED_FIELDS_MISSING: "Required fields are missing!",
    INVALID_REQ_DATA: "Invalid request data!",
    INVALID_ID: "Invalid id!",
    INVALID_TICKET: "Invalid ticket!",
    IS_REQUIRED: "is required",
    IS_FLEXIBLE_OR_EXCAT: "may be flexible or exact",
    IS_INVALID: "is invalid",
    INVALID_MODE: "invalid mode",
    INVALID_DEVICE_TYPE: "Invalid device type",
    INVALID_OBJ_ID: "Invalid objectId",
    INVALID_CATEGORY: "Invalid category",
    INVALID_TYPE: "Invalid type",
    INVALID_SUB_TYPE: "Invalid sub type",
    INVALID_ROLE_KEY: "Invalid Role Key",
    INVALID_ROLE_NAME: "Invalid Role Name",
    NOT_FOUND: "not found",
    NOT_FOUND_BY_ID: "not found with ID ",
    DATA_FOUND: "Data found",
    DATA_NOT_FOUND: "Data not found",
    TICKET_NOT_FOUND: "Ticket not found",
    IS_UPDATED_SUCCESSFULLY: "is Updated Successfully!",
    FAIL_TO_UPDATED: "Error while update data!",
    ACTIVE_SUCCESSFULLY: "active successfully!",
    ADDED_SUCCESSFULLY: "added successfully!",
    CREATE_SUCCESSFULLY: "created successfully!",
    CREATE_SENT_SUCCESSFULLY: "Sent successfully!",
    SENT_FAILED: "Sent failed!",
    FOUND_SUCCESSFULLY: "found successfully!",
    CANCEL_SUCCESSFULLY: "cancel successfully!",
    ROLE_ADDED_SUCCESSFULLY: "Access for role has settled successfully!",
    ROLE_ADDED_SUCCESSFULLY: "Access for role has updated successfully!",
    TEMPLATE_ALREADY_EXISTS: "Template Already Exists! please use different name",
    ROLE_FOUND_SUCCESSFULLY: "Access for role has found successfully!",
    SUCCESSFUL_PAYMENT_MAIL: "Successful payment!",
    CANCEL_PAYMENT_MAIL: "Cancel payment!",
    REFUND_PAYMENT_MAIL: "Refund payment!",
    DATA_FOUND_SUCCESSFULLY: "Data found successfully!",
    NO_MESSAGES: "No messages received!",
    FAIL_TO_CREATE_OTP: "Fail to create OTP!",
    RESET_PASSWORD_TITLE: "Reset Password Link",
    SET_SUCCESSFULLY: "set successfully!",
    VERIFICATION_CODE_MISSING: "VerificationCode missing !",
    VERIFICATION_MAIL: "Verification mail",
    STATUS_MAIL: "Status updated mail",
    USER_DELETED_MAIL: "User Deleted Mail",
    FORGOT_PASSWORD_MAIL: "Forgot password mail",
    USER_ID_MISSING: "UserId missing !",
    OTP_MISSING: "OTP missing !",
    HASH_CODE_MISSING: "HashCode missing !",
    SECRET_CODE_MISSING: "SecretCode missing !",
    OTP_INVALID: "Wrong OTP or Expired !",
    FAIL_TO_SEND_EMAIL: "Fail to send Email",
    EMAIL_SENT_SUCCESSFULLY: "Mail sent successfully",
    OTP_SENT_SUCCESSFULLY: "OTP sent successfully",
    STATUS_UPDATED_SUCCESSFULLY: "status updated successfully",
    PHONE_DIGIT: "should be 10 to 12 digits",
    ERROR_SEND_MAIL: "Error sending email:",
    ERROR_SENT: "Email sent:",
    ERROR_VERIFY_TRANSPORTER: "Error verifying transporter:",
    UPDATE_FOR: "Please enter what do you want to update (card or bank) ?",

    NOT_ACCESS_FOR_REVIEW: "You have not access to review for own post",
    UPDATE_FOR: "Please enter what do you want to update (card or bank) ?",
    FAIL_CREATE_CARD: "Fail to create new card",
    FAIL_REQ: "Request failed!",
    FAIL_CREATE_ACC: "Fail to create new account",

    DELETE_POST_EMAIL: "Post deleted Successfully",
    SUPPORT_STATUS_CHANGE_EMAIL: "Support Status Change Email",
    POST_STATUS_CHANGE_EMAIL: "Post Status Change Email",
    RESET_PASSWORD_SUCCESS_EMAIL: "Password reset Success Email",

    //exist item constant
    TOKEN_GENERATE_FAIL: "Fail to generate token",
    CARD_EXIST: "Card already exists please try with another card!",
    NAME_EXIST: "Name already exists please try with another name!",
    LOCATION_EXIST: "Record already exists please try with other location!",
    EMAIL_EXIST: "Record already exists please try with other email!",
    USER_EXIST: "User already exists please try with other Mobile Number!",
    TICKET_EXIST: "Ticket already exists",
    QUESTION_EXIST: "Question already exists",
    COUPON_EXIST: "Coupon already exists",
    GROUP_ALREADY_EXIST: "Group already exists",
    VARIABLE_ALREADY_EXIST: "Variable already exists",
    USER_NOT_FOUND: "User not found",
    CLIENT_NOT_FOUND: "Client not found",
    GROUP_NOT_FOUND: "Group not found",
    VARIABLE_NOT_FOUND: "Variable not found",
    POST_NOT_FOUND: "Post not found",
    QUESTION_NOT_FOUND: "Question not found",
    COUPON_NOT_FOUND: "Coupon not found",
    USER_NOT_EXIST_WITH_EMAIL: "User not exists with this email!",
    USER_SIGNUP_SUCCESSFULLY: "USER SIGNUP SUCCESSFULLY!",
    FORGOT_PASSWORD_SUCCESSFULLY: "FORGOT PASSWORD MAIL SEND SUCCESSFULLY!",
    UPDATED_SUCCESSFULLY: "updated successfully!",
    DELETED_SUCCESSFULLY: "deleted successfully!",
    FAIL_TO_SUBMIT: "Failed to submit data",
    SOMETHING_WRONG: "Something went wrong",
    NO_DATA: "No data found",
    TOKEN_NOT_GENERATED: "Token not generated",
    TOKEN_GENERATED: "Token generated successfully!",
    INVALID_EMAIL: "Email is invalid",
    INVALID_ROLE: "Role is invalid",
    INVALID_REVIEW_FOR: "Review for is invalid",
    INVALID_OBJ_ID: "Invalid ObjectId",
    NOT_ACCESS: "You have no access ",
    USER_LOGIN_GOOGLE: "Login with google successfully",
    USER_LOGIN: "Login successfully",
    AUTHENTICATION_TOKEN_FAIL: "Authentication token fail",
    NO_TOKEN_PROVIDED: "no token provided",
    TOKEN_EXPIRED: "Token expired! Please login again",
    TOKEN_VERIFIED: "Token verified!",
    PASSWORD_UPDATED_SUCCESSFULLY: "Password updated successfully",
    PASSWORDS_DO_NOT_MATCH: "Passwords do not match",
    ERROR_OCCURRED: "Some error occurred while retrieving data",
    ERROR_OCCURRED_SENDING: "Some error occurred while Sending Message",
    CAMPAIGN_EXIST_ERROR: "Campaign with this name already exists, Please use another name",
    ERROR_IMPORTING: "Error while importing data",
    INVALID_SCHEDULE_TIME: "Invalid Schedule time!",
    NO_SCHEDULE_FOUND: "No schedules found for today and the current slot!",
    ROLE_NOT_FOUND: "Role not found, Please enter valid one",
    PROFILE_NOT_UPDATE: "Profile picture not updated!",
    PROFILE_UPDATE: "Profile picture updated successfully!",
    COMPANY_PROFILE_UPDATE: "Company Profile picture updated successfully!",
    RATE_ERROR: "Rate must be a number between 0 to 5",
    FILE_UPLOAD_ERROR: "File not uploaded",
    USER_ID_NOT_FOUND: "User id not found",
    ATTACHMENT_OR_MESSAGE: "Attachment or message ",
    INVALID_REASON:
      "Please enter valid reason eg.Fraudulent or Requested by customer or Abandoned !.",
    PAYMENT_ALREADY_DONE: "Payment already done successfully!!.",
    PUSH_NOTIFICATION_SENT: "Push notification sent succesfully!",
    POST_ALREADY_IN_WISHLIST: "Post already added in wishlist!",
    PARCEL_DETAIL_NEEDED:
      "Parcel detail is needed, so height, width, weight and depth is missing.",
    TRAVELER_DETAIL_NEEDED:
      "Traveler detail is needed, so name, gender, age and other detail is missing.",
    MM_DD_YYYY_FORMAT: "should be in mm-dd-yyyy format",
    FILE_UPLOAD_TYPE_VALIDATION_MESSAGE:
      "Only .png, .jpg, .jpeg, .svg and .heic files are allowed!",
    WEBHOOK_SUCCESS: "Webhook processed successfully"
  },
  COLLECTION: {
    USER: "User ",
    CLIENT: "Client ",
    GROUP: "Group ",
    VARIABLE: "Variable ",
    MESSAGE_SCHEDULE: "Message Schedule ",
    TEMPLATE: "Template ",
    CAMPAIGN: "Campaign "
  },
  COMMON: {
    SUPER_ADMIN: "super_admin",
    ADMIN: "admin",
    USER: "user",
    STAFF: "Staff",
    NAME: "Name ",
    EMAIL: "Email ",
    PHONE_NO: "Phone number ",
    PASSWORD: "Password ",
    OTP: "Otp ",
    SECRET_CODE: "Secret code ",
    NEW_PASSWORD: "New password ",
    CONFIRM_PASSWORD: "Confirm password ",
    DEVICE_TOKEN: "Device token ",
    DEVICE_TYPE: "Device type ",
    ROLE: "Role ",
    MODE: "Mode ",
    STATUS: "Status",
    MANUAL: "manual",
    GOOGLE: "google",
    FACEBOOK: "facebook",
    APPLE: "apple",
    ANDROID: "android",
    IOS: "ios",
    TYPE: "Type",
    DESC: "desc",
    ASC: "asc",
    UPDATED_AT: "updatedAt",
    CREATED_AT: "createdAt",
    BUMP_DETAIL: "bump_detail.startDate",
    BUMP_END: "bump_detail.endDate",
    VISIBLE_TIME: "visibleTime",
    START_FROM: "startFrom",
    END_AT: "endAt",
    CUSTOMER: "customer",
    MSG_CUSTOMER: "Customer",
    CLOSED: "closed",
    URL: "url",
    FILE_NAME: "filename",
    REVIEW: "Review ",
    APP: "app",

    CARD_DATA: "Card data ",
    DATA: "Data ",
    REASON: "Reason ",
    ID: "id ",
    OR: "or ",
    FINISH: "finish",
    REVIEW: "Review ",
    AMOUNT: "amount ",
    TITLE: "Title ",
    SERVICE_TAX: 5,
    GST_TAX: 3,
    BUMP_TRANSACTION: "bumpTransaction",
  },
  FIELD: {
    DOCUMENT: "document",
    CARD_SML: "card",
    BANK_SML: "bank",
    NAME: "name",
    FROM: "From ",
    TO: "To ",
    DATE_TYPE: "Date type ",
    TYPE: "Type ",
    SUB_TYPE: "Sub type ",
    CATEGORY: "Category ",
    TITLE: "Title ",
    MONTH: "Month ",
    TRAVEL_DATE: "Travel date ",
    MEET_LOCATION: "Meet location ",
    MORE_DETAIL: "More detail ",
    NOTES: "Notes ",
    FLEXIBLE_DATE_NOTES: "Flexible date notes ",
    ASSISTANT_CONTAIN: "Assistant contain ",
    PARCEL_CONTAIN: "Parcel contain ",
    WEIGHT: "Weight ",
    PARCELS: "Parcels ",
    TRAVELER_DETAIL: "Traveler detail ",
    CARRY_PARCEL: "carryParcel",
    TRAVEL_PARTNER: "travelPartner",
    ATTACHMENT: "attachment",
    PROFILE_PICTURE: "profile_picture",
    COMPANY_PROFILE_PICTURE: "company_profile_picture",
    TEMPLATE: "template",
    TEMPLATE_IMAGE: "templateImages",
    TEMPLATE_FORMAT: "templateFormat",
    RATE: "Rate ",
    TITLE: "Title ",
    DESCRIPTION: "Description ",
    CUSTOMER: "Customer ",
    POST: "Post ",
    CARD: "Card ",
    BANK: "Bank ",
    AMOUNT: "Amount ",
    CARD_TOKEN: "Card token ",
    PAYMENT_TYPE: "Payment type ",
    PAYMENT_METHOD: "Payment method ",
    ADDRESS_LINE_ONE: "Address line one ",
    ADDRESS_LINE_TWO: "Address line two ",
    ZIP_CODE: "Postal code ",
    POSTAL_CODE: "Zip code ",
    CITY: "City ",
    STATE: "State ",
    COUNTRY: "Country ",
    CURRENCY: "Currency ",
    EXP_MONTH: "Expiry month ",
    EXP_YEAR: "Expiry year ",
    ACCOUNT_HOLDER_NAME: "Account holder name ",
    ACCOUNT_HOLDER_TYPE: "Account holder type ",
    ACCOUNT_TYPE: "Account type ",
    ACCOUNT_NUMBER: "Account number ",
    ROUTING_NUMBER: "Routing number ",
    PAYMENT: "Payment ",
    FAQS: "FAQ's",
    ROLE_ACCESS: "Role Access",
    ANSWER: "Answer",
    BUMP: "Bump",
    COUPON: "Coupon",
    ROLE_KEY: "roleKey",
  },
  API: {
    OAUTH_TOKEN: "/oauth/token",
  },
  RESET_UI_URL: "/reset-password",
  USER_PHOTO: "userPhoto",

  UPLOAD_DOC_PATH: {
    GROUP_IMAGES: "./public/group_images",
    SCHEDULE_MARKETING: "./public/schedule_marketing",
    SCHEDULE_UTILITY: "./public/schedule_utility",
    SCHEDULE_UTILITY_EDITED: "./public/schedule_utility/edited",
    PROFILE_PIC_PATH: "./public/profile_picture",
    COMPANY_PROFILE_PIC_PATH: "./public/company_profile_picture",
    TEMPLATES_PATH: "./public/templates",
    TEMPLATE_IMAGES_PATH: "./public/template-images",
    TEMPLATE_FORMAT_PATH: "./public/template-format",
    TEMPLATE_REFERENCE_FORMAT_PATH: "./public/template-reference-format",
    CHAT: "./public/chat",
  },

  //GREYPIX TEMPLATES
  // TEMPLATE_NAME: {
  //   FOR_UTILITY: "schedule_msg_wt_utility_new",
  //   FOR_VIDEO: "schedule_msg_wt_vdo",
  //   FOR_DOCUMENT: "schedule_msg_wt_doc",
  //   FOR_ONLY_TEXT: "wt_only_text"
  // }

  //DSA TEMPLATES
  TEMPLATE_NAME: {
    FOR_UTILITY: "schedule_msg_wt_image_utility",
    FOR_VIDEO: "schedule_msg_wt_vdo",
    FOR_DOCUMENT: "schedule_msg_wt_doc",
    FOR_ONLY_TEXT: "wt_only_text_utilty"
  }
});
