const multer = require("multer");
const { mkdirp } = require("mkdirp");

const uploadFilePdf = (type) => {
  const made = mkdirp.sync(`./app/public/file/${type}`);
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, `./app/public/file/${type}`);
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  });

  const upload = multer({
    storage: storage,
  });
  return upload.single(type);
};

module.exports = {
  uploadFilePdf,
};
