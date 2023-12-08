const { Cty_Province, Ward, District, Hamlet } = require("../models/index.model.js");
const createError = require("http-errors");
const { encrypt, decrypt } = require('../config/crypto.js')

exports.create = async (req, res, next) => {
  if (Object.keys(req.body).length >= 1) {
    const name = encrypt(req.body.name);
    const cty = await Cty_Province.findOne({
      where: {
        name: name,
      },
    });
    if (cty) {
      return res.send({
        error: true,
        msg: `Đã tồn tại tỉnh, thành phố ${decrypt(name)}.`,
      });
    }
    try {
      const document = await Cty_Province.create({
        name: req.body.name,
      });

      return res.send({
        error: false,
        msg: `Bạn đã tạo thành công tỉnh, thành phố ${document.name} `,
        document: document,
      });
    } catch (error) {
      // console.log(error);
      return res.send({
        error: true,
        msg: error.errors[0].message,
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
    const documents = await Cty_Province.findAll({});
    return res.send(
      documents.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    );
  } catch (error) {
    // console.log(error);
    return next(createError(400, "Error findAll Cty_Province !"));
  }
};

exports.findAllInclude = async (req, res, next) => {
  try {
    const documents = await Cty_Province.findAll({
      attributes: ['_id', 'name'],
      include: [
        {
          model: District,
          attributes: ['_id', 'name'],
          include: [
            {
              model: Ward,
              attributes: ['_id', 'name'],
              include: [
                {
                  model: Hamlet,
                  attributes: ['_id', 'name']
                }
              ]
            }
          ]
        }
      ]
    });
    return res.send(
      documents
    );
  } catch (error) {
    apiLogger(req, res, error, 'error')
    return next(createError(400, "Error findAllInclude Cty_Province !"));
  }
};

exports.findOne = async (req, res, next) => {
  try {
    const documents = await Cty_Province.findOne({
      where: {
        _id: req.params.id,
      },
    });
    return res.send(documents);
  } catch (error) {
    return next(createError(400, "Error finding Cty_Province !"));
  }
};

exports.deleteOne = async (req, res, next) => {
  try {
    const cty = await Cty_Province.findOne({
      where: {
        _id: req.params.id,
      },
    });
    const documents = await Cty_Province.destroy({
      where: { _id: req.params.id },
    });
    return res.send({
      msg: `Đã xoá thành công tỉnh, thành phố ${cty.name} `,
      document: cty,
    });
  } catch (error) {
    return next(createError(400, "Error deleteOne Cty_Province !"));
  }
};

exports.deleteAll = async (req, res, next) => {
  try {
    const documents = await Cty_Province.destroy({ where: {} });
    return res.send(`Đã xóa ${documents} bản ghi.`);
  } catch (error) {
    return next(createError(400, "Error delete Cty_Province !"));
  }
};

exports.update = async (req, res, next) => {
  try {
    let cty = await Cty_Province.findOne({
      where: {
        _id: req.params.id,
      },
    });
    if (cty.name !== req.body.name) {
      const documents = await Cty_Province.update(
        { name: req.body.name },
        { where: { _id: req.params.id } }
      );
      return res.send({
        error: false,
        msg: "Dữ liệu đã được thay đổi thành công.",
      });
    } else {
      return res.send({
        error: true,
        msg: "Dữ liệu chưa được thay đổi.",
      });
    }
  } catch (error) {
    return next(createError(400, "Error update Cty_Province !"));
  }
};


exports.findCtyProvinceIdByName = async (req, res, next) => {
  try {
    const { CtyName } = req.body;
    const encryptedName = encrypt(CtyName);

    const ctyProvince = await Cty_Province.findOne({
      where: {
        name: encryptedName,
      },
    });

    if (ctyProvince) {
      return res.send({ id: ctyProvince._id });
    } else {
      return res.send({ id: null, msg: `Cty_Province with name '${CtyName}' not found` });
    }
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: `Error finding Cty_Province by name: ${error.message}` });
  }
};


