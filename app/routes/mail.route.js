const express = require("express");
const mail = require("../controllers/mail.controller");
const { uploadFilePdf } = require("../middlewares/uploads/upload-pdf");
const {
  uploadFileMultiple,
} = require("../middlewares/uploads/upload-multi-file");
const router = express.Router();

router.route("/").post(mail.sendEmail);

router.route("/send-mail").post(uploadFilePdf("filePdf"), mail.sendEmailReport);

router
  .route("/send-mail-muliple")
  .post(uploadFileMultiple("file_multiple"), mail.sendEmailMutilFile);

module.exports = router;
