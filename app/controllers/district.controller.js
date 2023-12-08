const { District, Cty_Province } = require("../models/index.model.js");
const createError = require("http-errors");
const { encrypt, decrypt } = require("../config/crypto.js");

exports.create = async (req, res, next) => {
  if (Object.keys(req.body).length >= 2) {
    const name = encrypt(req.body.name);
    const dep = await District.findOne({
      where: {
        name: name,
        ctyProvinceId: req.body.ctyProvinceId,
      },
    });
    if (dep) {
      return res.send({
        error: true,
        msg: `Đã tồn tại quận, huyện ${decrypt(name)}.`,
      });
    }
    try {
      const document = await District.create({
        ctyProvinceId: req.body.ctyProvinceId,
        name: req.body.name,
      });

      return res.send({
        error: false,
        msg: `Bạn đã tạo thành công quận, huyện ${document.name} `,
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
    const documents = await District.findAll({});
    return res.send(
      documents.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    );
  } catch (error) {
    // console.log(error);
    return next(createError(400, "Error finding Districts !"));
  }
};

exports.findOne = async (req, res, next) => {
  try {
    const documents = await District.findOne({
      where: {
        _id: req.params.id,
      },
      include: [
        {
          model: Cty_Province,
        },
      ],
    });
    return res.send(documents);
  } catch (error) {
    return next(createError(400, "Error finding District !"));
  }
};
//
exports.findAllDepOfACty = async (req, res, next) => {
  try {
    const documents = await District.findAll({
      where: {
        ctyProvinceId: req.params.ctyId,
      },
    });
    return res.send(documents);
  } catch (error) {
    return next(createError(400, "Error finding District !"));
  }
};
exports.deleteOne = async (req, res, next) => {
  try {
    const dep = await District.findOne({
      where: {
        _id: req.params.id,
      },
    });
    const documents = await District.destroy({
      where: { _id: req.params.id },
    });
    return res.send({
      msg: `Đã xoá thành công quận, huyện ${dep.name} `,
      document: dep,
    });
  } catch (error) {
    return next(createError(400, "Error delete District !"));
  }
};

exports.deleteAll = async (req, res, next) => {
  try {
    const documents = await District.destroy({ where: {} });
    return res.send(`Đã xóa ${documents} bản ghi.`);
  } catch (error) {
    return next(createError(400, "Error delete District !"));
  }
};

exports.update = async (req, res, next) => {
  try {
    let dep = await District.findOne({
      where: {
        _id: req.params.id,
      },
    });
    if (
      dep.name !== req.body.name ||
      dep.ctyProvinceId !== req.body.ctyProvinceId
    ) {
      const documents = await District.update(
        { name: req.body.name, ctyProvinceId: req.body.ctyProvinceId },
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
    return next(createError(400, "Error update District !"));
  }
};

exports.findDistrictIdByName = async (req, res, next) => {
  try {
    const { DistrictName, idCty } = req.body;
    const encryptedName = encrypt(DistrictName);

    const district = await District.findOne({
      where: {
        name: encryptedName,
        ctyProvinceId: idCty,
      },
    });

    if (district) {
      return res.send({ id: district._id });
    } else {
      return res.send({ id: null, msg: `District with name '${DistrictName}' not found for Cty with ID '${idCty}'` });
    }
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: `Error finding District by name: ${error.message}` });
  }
};

