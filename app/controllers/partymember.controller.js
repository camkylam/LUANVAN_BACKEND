const { PartyMember, Position, PartyCell, Account, Role } = require("../models/index.model.js");
const createError = require("http-errors");
const { apiLogger } = require("../../logger.js");
const { Op } = require('sequelize')
const { encrypt, decrypt } = require("../config/crypto.js");
const { hamletIncludeAllModels } = require("./hamlet.controller.js");

exports.create = async (req, res, next) => {
  const { name, birthday, address, phone, email, gender, dateJoin, dateOfficial, positionId, partycellId, hamletId, code, exemption } =
    req.body;

  if (!name || !birthday || !address || !phone || !email || !gender || !dateJoin || !code || !positionId || !partycellId || !hamletId) {
    apiLogger(req, res, '400! Bad request!', 'error')
    return res.send({
      error: true,
      msg: 'Missing params'
    })
  }

  try {
    const partymembers = await PartyMember.findAll({
      where: {
        [Op.or]: [
          {
            phone: encrypt(phone)
          },
          {
            email: encrypt(email)
          }
        ]
      }
    });

    if (partymembers?.length > 0)
      return res.send({
        error: true,
        msg: `Số điện thoại và email đã được đăng ký trước đó.`,
      });

    const document = await PartyMember.create({
      name: name,
      birthday: birthday,
      address: address,
      phone: phone,
      email: email,
      gender: gender,
      dateJoin: dateJoin,
      //dateOfficial: dateOfficial || undefined,
      code: code,
      positionId: positionId,
      partycellId: partycellId,
      hamletId: hamletId,
      exemption: exemption || 'False'
    });

    return res.send({
      error: false,
      msg: `Bạn đã tạo thành công đảng viên ${document.name}`,
      document: document,
    });
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return res.send({
      error: true,
      msg: error.message,
    });
  }
};

exports.findAllByCell = async (req, res, next) => {
  const { cellIds } = req.body // cellIds = ['cell1', 'cell2']
  if (!cellIds) {
    apiLogger(req, res, '400! Bad request!', 'error')
    return res.send({
      error: true,
      msg: 'Missing params'
    })
  }

  let cellOptions = {}
  if (cellIds.length == 1) {
    cellOptions = { '$PartyCell._id$': cellIds[0] }
  }
  else {
    let orOptions = []
    cellIds.forEach((value, index) => {
      orOptions.push({ '$PartyCell._id$': value })
    })

    cellOptions = { [Op.or]: orOptions }
  }
  try {
    const documents = await PartyMember.findAll({
      where: cellOptions,
      attributes: ['_id', 'name', 'birthday', 'address', 'phone', 'email', 'code', 'gender', 'dateJoin', 'dateOfficial', 'exemption'],
      include: [
        {
          model: Position,
          attributes: ["_id", "name"],
        },
        {
          model: PartyCell,
          attributes: ["_id", "name"],
        },
        hamletIncludeAllModels,
      ],
    });

    return res.send(
      documents.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      // TODO: by name
    );
  }
  catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return next(createError(400, "Error finding PartyMembers by cells !"));
  }
};

exports.findAll = async (req, res, next) => {
  try {
    const documents = await PartyMember.findAll({
      attributes: ['_id', 'name', 'birthday', 'address', 'phone', 'email', 'code', 'gender', 'dateJoin', 'dateOfficial', 'exemption'],
      include: [
        {
          model: Position,
          attributes: ["_id", "name"],
        },
        {
          model: PartyCell,
          attributes: ["_id", "name"],
        },
        hamletIncludeAllModels,
      ],
    });
    return res.send(
      documents.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      // TODO: by name
    );
  } catch (error) {
    apiLogger(req, res, error.message, 'error')
    return next(createError(400, "Error finding PartyMembers !"));
  }
};

exports.findOne = async (req, res, next) => {
  try {
    const documents = await PartyMember.findOne({
      where: {
        _id: req.params.id,
      },
      include: [
        {
          model: Position,
          attributes: ["_id", "name"],
        },
        {
          model: PartyCell,
          attributes: ["_id", "name"],
        },
        hamletIncludeAllModels,
      ],
    });

    if (!documents) {
      apiLogger(req, res, '400! Bad request', 'error')
      return res.send({
        error: 'true',
        msg: `Not found member ${req.params.id}`
      })
    }

    apiLogger(req, res, JSON.stringify(documents))
    return res.send(documents);
  }
  catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return next(createError(400, "Error finding PartyMember !"))
  }
};

exports.deleteOne = async (req, res, next) => {
  try {
    const partymember = await PartyMember.findOne({
      where: {
        _id: req.params.id,
      },
    });
    const document = await PartyMember.destroy({
      where: {
        _id: req.params.id,
      },
      returning: true,
    });

    return res.send({
      msg: ` Đã xoá thành công đảng viên ${partymember.name}`,
      document: partymember,
    });
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return next(createError(400, "Error deleteOne Partymember"))
  }
};

exports.deleteAll = async (req, res, next) => {
  try {
    const documents = await PartyMember.destroy({ where: {} });
    return res.send(`Đã xóa.`);
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return next(createError(400, "Error deleteAll PartyMembers !"));
  }
};


exports.update = async (req, res, next) => {
  // console.log(req.body);
  const { name, birthday, address, phone, email, gender, dateJoin, dateOfficial, exemption } = req.body;
  const positionId = req.body.Position?._id;
  const partycellId = req.body.PartyCell?._id;
  const hamletId = req.body.Hamlet?._id;

  if (!name || !birthday || !address || !phone || !email || !gender || !dateJoin || !positionId || !partycellId || !hamletId) {
    apiLogger(req, res, '400! Bad request!', 'error');
    return res.send({
      error: false,
      msg: 'Missing params',
    });
  }

  try {
    const existingMember = await PartyMember.findOne({
      where: {
        _id: req.params.id,
      },
    });

    if (!existingMember) {
      return res.send({
        error: true,
        msg: "Not found member",
      });
    }

    const isDataUnchanged =
      existingMember.name === name &&
      existingMember.birthday === birthday &&
      existingMember.gender === gender &&
      existingMember.address === address &&
      existingMember.phone === phone &&
      existingMember.email === email &&
      existingMember.dateJoin === dateJoin &&
      existingMember.dateOfficial === dateOfficial &&
      existingMember.postionId === positionId &&
      existingMember.partycellId === partycellId &&
      existingMember.hamletId === hamletId &&
      existingMember.exemption === exemption;

    if (isDataUnchanged) {
      return res.send({
        error: true,
        msg: "Dữ liệu chưa được thay đổi.",
      });
    }

    const update = await PartyMember.update(
      {
        name: name,
        birthday: birthday,
        address: address,
        phone: phone,
        email: email,
        gender: gender,
        dateJoin: dateJoin,
        dateOfficial: dateOfficial || undefined,
        postionId: positionId,
        partycellId: partycellId,
        hamletId: hamletId,
        exemption: exemption || 'False',
      },
      { where: { _id: req.params.id }, returning: true }
    );

    return res.send({
      error: false,
      msg: "Dữ liệu đã được thay đổi thành công.",
    });
  } catch (error) {
    return next(createError(400, `Error updating PartyMember: ${error.message}`));
  }
};

exports.findOneFromBody = async (req, res, next) => {
  try {
    const { memberId } = req.body;

    if (!memberId) {
      apiLogger(req, res, '400! Bad request', 'error');
      return res.status(400).send({
        error: true,
        msg: 'Thiếu memberId trong nội dung yêu cầu',
      });
    }

    const documents = await PartyMember.findOne({
      where: {
        _id: memberId,
      },
      include: [
        {
          model: Position,
          attributes: ["_id", "name"],
        },
        {
          model: PartyCell,
          attributes: ["_id", "name"],
        },
        hamletIncludeAllModels,
      ],
    });

    if (!documents) {
      apiLogger(req, res, '400! Bad request', 'error');
      return res.status(400).send({
        error: true,
        msg: `Không tìm thấy đảng viên với ID ${memberId}`,
      });
    }

    apiLogger(req, res, JSON.stringify(documents));
    return res.send(documents);
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error');
    return next(createError(400, `Lỗi khi tìm đảng viên: ${error.message}`));
  }
};



