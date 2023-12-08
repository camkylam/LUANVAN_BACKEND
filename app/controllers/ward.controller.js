const { Ward, District, Cty_Province } = require("../models/index.model.js");
const createError = require("http-errors");
const { encrypt, decrypt } = require("../config/crypto.js");

const wardIncludeAllModels = {
  model: Ward,
  attributes: ["name", "_id"],
  include: [{
    model: District,
    attributes: ["name", "_id"],
    include: [{
      model: Cty_Province,
      attributes: ["name", "_id"]
    }]
  }],
}

exports.wardIncludeAllModels = wardIncludeAllModels

exports.create = async (req, res, next) => {
  if (Object.keys(req.body).length >= 2) {
    const name = encrypt(req.body.name);
    const ward = await Ward.findOne({
      where: {
        name: name,
        districtId: req.body.districtId,
      },
    });
    if (ward) {
      return res.send({
        error: true,
        msg: `Đã tồn tại  ${decrypt(name)}.`,
      });
    }
    try {
      const document = await Ward.create({
        districtId: req.body.districtId,
        name: req.body.name,
      });

      return res.send({
        error: false,
        msg: `Bạn đã tạo thành công  ${document.name} `,
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
    const documents = await Ward.findAll({});
    return res.send(
      documents.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    );
  } catch (error) {
    // console.log(error);
    return next(createError(400, "Error finding Wards !"));
  }
};

exports.findOne = async (req, res, next) => {
  try {
    const documents = await Ward.findOne({
      where: {
        _id: req.params.id,
      },
      include: [
        {
          model: District,
          attributes: ["name"],
          include: [
            {
              model: Cty_Province,
              attributes: ["name", "_id"],
            },
          ],
        },
      ],
    });
    return res.send(documents);
  } catch (error) {
    return next(createError(400, "Error finding Ward !"));
  }
};
//
exports.findAllWardOfADep = async (req, res, next) => {
  try {
    const documents = await Ward.findAll({
      where: {
        districtId: req.params.depId,
      },
    });
    return res.send(documents);
  } catch (error) {
    return next(createError(400, "Error finding Wards of a district !"));
  }
};
exports.deleteOne = async (req, res, next) => {
  try {
    const ward = await Ward.findOne({
      where: {
        _id: req.params.id,
      },
    });
    const documents = await Ward.destroy({
      where: { _id: req.params.id },
    });
    return res.send({
      msg: `Đã xoá thành công  ${ward.name} `,
      document: ward,
    });
  } catch (error) {
    return next(createError(400, "Error delete Ward !"));
  }
};

exports.deleteAll = async (req, res, next) => {
  try {
    const documents = await Ward.destroy({ where: {} });
    return res.send(`Đã xóa ${documents} bản ghi.`);
  } catch (error) {
    return next(createError(400, "Error delete Ward !"));
  }
};

exports.update = async (req, res, next) => {
  try {
    let ward = await Ward.findOne({
      where: {
        _id: req.params.id,
      },
    });

    if (
      ward.name !== req.body.name ||
      ward.districtId !== req.body.districtId
    ) {
      const documents = await Ward.update(
        { name: req.body.name, districtId: req.body.districtId },
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
    return next(createError(400, "Error update district !"));
  }
};


exports.findWardIdByName = async (req, res, next) => {
  try {
    const { WardName, idCty, idDis } = req.body;
    const encryptedName = encrypt(WardName);

    const ward = await Ward.findOne({
      where: {
        name: encryptedName,
        districtId: idDis,
      },
      include: [
        {
          model: District,
          attributes: [],
          where: {
            ctyProvinceId: idCty,
          },
        },
      ],
    });

    if (ward) {
      return res.send({ id: ward._id });
    } else {
      return res.send({ id: null, msg: `Ward with name '${WardName}' not found for Cty with ID '${idCty}' and District with ID '${idDis}'` });
    }
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: `Error finding Ward by name: ${error.message}` });
  }
};


