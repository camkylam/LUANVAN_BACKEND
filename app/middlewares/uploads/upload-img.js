const multer = require("multer");
const { mkdirp } = require("mkdirp");

const uploadImages = (type) => {
  const made = mkdirp.sync(`./app/public/images/${type}`);
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, `./app/public/images/${type}`);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });

  const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
      const extensionsImagesList = [".png", ".jpg", "jpeg"];
      const extensions = file.originalname.slice(-4);
      const check = extensionsImagesList.includes(extensions);
      if (check) {
        cb(null, true);
      } else {
        cb(new Error("extensions invalid"));
      }
    },
  });
  return upload.single(type);
};

module.exports = {
  uploadImages,
};