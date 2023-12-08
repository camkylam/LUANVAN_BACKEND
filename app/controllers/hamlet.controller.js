const { Hamlet, Ward, District, Cty_Province } = require("../models/index.model.js");
const createError = require("http-errors");
const { encrypt, decrypt } = require('../config/crypto.js')
const { wardIncludeAllModels } = require('./ward.controller.js')

const hamletIncludeAllModels = {
  model: Hamlet,
  attributes: ['_id', 'name'],
  include: {
    model: Ward,
    attributes: ["name", "_id"],
    include: {
      model: District,
      attributes: ["name", "_id"],
      include: {
        model: Cty_Province,
        attributes: ["name", "_id"]
      }
    }
  }
}

exports.hamletIncludeAllModels = hamletIncludeAllModels

exports.create = async (req, res, next) => {
  if (Object.keys(req.body).length >= 2) {
    const name = encrypt(req.body.name);
    const hamlet = await Hamlet.findOne({
      where: {
        name: name,
        wardId: req.body.wardId,
      },
    });
    if (hamlet) {
      return res.send({
        error: true,
        msg: `Đã tồn tại ấp/khu vực ${decrypt(name)}.`,
      });
    }
    try {
      const document = await Hamlet.create({
        wardId: req.body.wardId,
        name: req.body.name,
      });

      return res.send({
        error: false,
        msg: `Bạn đã tạo thành công ấp/khu vực ${document.name} `,
        document: document,
      });
    } catch (error) {
      // console.log(error);
      return res.send({
        error: true,
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
    const documents = await Hamlet.findAll({
      attributes: ['_id', 'name'],
      include: wardIncludeAllModels
    });
    return res.send(
      documents.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    );
  } catch (error) {
    // console.log(error);
    return next(createError(400, "Error finding Hamlets !"));
  }
};

exports.findOne = async (req, res, next) => {
  try {
    const documents = await Hamlet.findOne({
      where: {
        _id: req.params.id,
      },
      include: [{
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
      }],
    });
    return res.send(documents);
  } catch (error) {
    return next(createError(400, "Error finding Hamlet !"));
  }
};
//
exports.findAllHamletOfWard = async (req, res, next) => {
  try {
    const documents = await Hamlet.findAll({
      where: {
        wardId: req.params.wardId,
      },
    });
    return res.send(documents);
  } catch (error) {
    return next(createError(400, "Error finding Hamlet of a Ward !"));
  }
};
exports.deleteOne = async (req, res, next) => {
  try {
    const hamlet = await Hamlet.findOne({
      where: {
        _id: req.params.id,
      },
    });
    const documents = await Hamlet.destroy({
      where: { _id: req.params.id },
    });
    return res.send({
      msg: `Đã xoá thành công  ${hamlet.name} `,
      document: hamlet,
    });
  } catch (error) {
    return next(createError(400, "Error delete Ward !"));
  }
};

exports.deleteAll = async (req, res, next) => {
  try {
    const documents = await Hamlet.destroy({ where: {} });
    return res.send(`Đã xóa ${documents} bản ghi.`);
  } catch (error) {
    return next(createError(400, "Error delete Ward !"));
  }
};

exports.update = async (req, res, next) => {
  try {
    let hamlet = await Hamlet.findOne({
      where: {
        _id: req.params.id,
      },
    });

    if (
      hamlet.name !== req.body.name ||
      hamlet.wardId !== req.body.wardId
    ) {
      const documents = await Hamlet.update(
        { name: req.body.name, wardId: req.body.wardId },
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
    return next(createError(400, "Error update hamlet !"));
  }
};


// exports.findHamletIdByName = async (req, res, next) => {
//   try {
//     const { HamletName, idCty, idWard, idDis } = req.body;
//     const encryptedName = encrypt(HamletName);

//     const hamlet = await Hamlet.findOne({
//       where: {
//         name: encryptedName,
//         wardId: idWard,
//       },
//       include: [
//         {
//           model: Ward,
//           attributes: [],
//           where: {
//             districtId: idDis,
//           },
//           include: [
//             {
//               model: District,
//               attributes: [],
//               where: {
//                 ctyProvinceId: idCty,
//               },
//             },
//           ],
//         },
//       ],
//     });

//     if (hamlet) {
//       return res.send({ hamletId: hamlet._id });
//     } else {
//       return res.send({ hamletId: null, msg: `Hamlet with name '${HamletName}' not found for Cty with ID '${idCty}', Ward with ID '${idWard}', and District with ID '${idDis}'` });
//     }
//   } catch (error) {
//     console.error('Error:', error.message);
//     return res.status(500).json({ error: `Error finding Hamlet by name: ${error.message}` });
//   }
// };


exports.findHamletIdByName = async (req, res, next) => {
  try {
    const { HamletName, DistrictName, WardName, CtyProvinceName } = req.body;
    const encryptedHamletName = encrypt(HamletName);
    const encryptedDistrictName = encrypt(DistrictName);
    const encryptedWardName = encrypt(WardName);
    const encryptedCtyProvinceName = encrypt(CtyProvinceName);

    const hamlet = await Hamlet.findOne({
      where: {
        name: encryptedHamletName,
      },
      include: [
        {
          model: Ward,
          attributes: ["_id"],
          where: {
            name: encryptedWardName,
          },
          include: [
            {
              model: District,
              attributes: ["_id"],
              where: {
                name: encryptedDistrictName,
              },
              include: [
                {
                  model: Cty_Province,
                  attributes: ["_id"],
                  where: {
                    name: encryptedCtyProvinceName,
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    if (hamlet) {
      return res.send({ idHamlet: hamlet._id });
    } else {
      return res.send({ idHamlet: null, msg: `Hamlet with name '${HamletName}' not found in District '${DistrictName}', Ward '${WardName}', and Cty_Province '${CtyProvinceName}'` });
    }
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: `Error finding Hamlet by name and location: ${error.message}` });
  }
};






