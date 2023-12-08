const { PartyCell } = require("../models/index.model.js");
const createError = require("http-errors");
const { encrypt,decrypt } = require("../config/crypto.js");

exports.create = async (req, res, next) => {
  if (Object.keys(req.body).length === 1) {
    const { name } = req.body;
    const partycells = await PartyCell.findAll();
    for (let value of partycells) {
      if (value.name == name) {
        return res.send({
          error: true,
          msg: `Đã tồn tại chi bộ '${name}'`,
        });
      }
    }
    try {
      const document = await PartyCell.create({
        name: req.body.name,
      });
      return res.send({
        error: false,
        msg: `Bạn đã tạo thành công chi bộ '${document.name}'`,
        document: document,
      });
    } catch (error) {
      return res.send({
        error: true,
        msg: error.message,
      });
    }
  } else {
    return res.send({
      error: true,
      msg: `Vui lòng nhập đủ thông tin.`,
    });
  }
};

exports.findAll = async (req, res, next) => {
  try {
    const documents = await PartyCell.findAll();
    return res.send(
      documents.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    );
  } catch (error) {
    // console.log(error);
    return next(createError(400, "Error finding partycells !"));
  }
};

exports.findOne = async (req, res, next) => {
  try {
    const documents = await PartyCell.findOne({
      where: {
        _id: req.params.id,
      },
    });
    return res.send(documents);
  } catch (error) {
    return next(createError(400, `Xóa thành công chi bộ '${document.name}'`));
  }
};


exports.deleteOne = async (req, res, next) => {
  try {
    const document = await PartyCell.destroy({
      where: { _id: req.params.id },
    });
    return res.send({
      msg: `Đã xoá thành công chức vụ`,
      document: PartyCell,
    });
  } catch (error) {
    return next(createError(400, "Lỗi không xóa được chi bộ!"));
  }
};

exports.update = async (req, res, next) => { };

exports.findIdByName = async (req, res, next) => {
  try {
    const { PartycellName } = req.body; // Assuming the name is in the request body
    // console.log('Original PartyCell Name:', PartycellName);

    // Encrypt the search value
    const encryptedName = encrypt(PartycellName);

    const partyCell = await PartyCell.findOne({
      where: {
        name: encryptedName,
      },
    });

    if (partyCell) {
      return res.json({ id: partyCell._id });
    } else {
      return res.json({ id: null, msg: `PartyCell with name '${PartycellName}' not found` });
    }
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: `Error finding PartyCell by name: ${error.message}` });
  }
};
