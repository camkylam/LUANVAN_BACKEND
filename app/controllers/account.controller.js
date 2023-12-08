const { Account, Role, PartyMember, Permission, PartyCell, Position, Hamlet, Ward } = require("../models/index.model.js");
const createError = require("http-errors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { apiLogger } = require("../../logger.js");
const { encrypt } = require("../config/crypto.js");
const { Op, Sequelize } = require("sequelize")
const { hamletIncludeAllModels } = require('./hamlet.controller.js')
const { wardIncludeAllModels } = require("./ward.controller.js");


exports.create = async (req, res, next) => {
  const accounts = await Account.findAll();
  for (let value of accounts) {
    if (value.user_name == req.body.user_name) {
      return res.send({
        error: true,
        user_name: false,
        msg: `Đã tồn tại tài khoản ${value.user_name}.`,
      });
    }
  }

  if (Object.keys(req.body).length >= 4 && req.body.checkUser == false) {
    const { PartyMemberId, roleId, password, user_name } = req.body;
    const accounts = await Account.findAll();
    for (let value of accounts) {
      if (value.user_name == user_name) {
        return res.send({
          error: true,
          msg: `Đã tồn tại tài khoản ${value.user_name}.`,
        });
      }
    }
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const document = await Account.create({
        user_name: user_name,
        password: hashedPassword,
        roleId: roleId,
        PartyMemberId: PartyMemberId,
      });
      return res.send({
        error: false,
        msg: `Bạn đã tạo thành công tài khoản ${document.user_name}`,
        document,
      });
    } catch (error) {
      // console.log(error.message);
      return res.send({
        error: true,
        msg: error.message,
      });
    }
  } else {
    return res.send({
      error: true,
      msg: `Vui lòng nhập đủ thông tin.`,
      user_name: true,
    });
  }
};

exports.findAll = async (req, res, next) => {
  try {
    const documents = await Account.findAll({
      where: {
        user_name: { [Op.not]: encrypt('admin') }
      },
      include: [
        {
          model: Role,
          include: [{ model: Permission }],
        },
        {
          model: PartyMember,
        },
      ],
    });
    // TODO Sort by name
    return res.send(
      documents.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    );
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return next(createError(400, "Error finding all accounts!"));
  }
};

exports.findOne = async (req, res, next) => {
  try {
    const documents = await Account.findOne({
      where: {
        _id: req.params.id,
      },
    });
    return res.send(documents);
  } catch (error) {
    return next(createError(400, "Error finding account !"));
  }
};

exports.deleteOne = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      where: {
        _id: req.params.id,
      },
    });
    const result = await Account.destroy({
      where: {
        _id: req.params.id,
      },
    });

    if (result === 0) {
      return next(createError(404, "Account not found"));
    }
    return res.send({
      msg: `Đã xoá thành công tài khoản ${account.user_name}`,
      document: account,
    });
  } catch (error) {
    // console.log(error);
    return next(createError(400, "Error deleting account"));
  }
};

exports.deleteAll = async (req, res, next) => {
  try {
    const result = await Account.destroy({
      where: {},
      truncate: true, // Truncate the table to remove all records
    });

    if (result === 0) {
      // If no records were deleted, return an error
      // return next(createError(404, 'No accounts found'));
      return res.sendStatus(204); // Return 204 No Content if all records were deleted successfully
    }

    //   return res.sendStatus(204); // Return 204 No Content if all records were deleted successfully
  } catch (error) {
    // console.log(error);
    return next(createError(400, "Error deleting accounts"));
  }
};

exports.update = async (req, res, next) => {
  const { PartyMemberId, roleId, password, user_name } = req.body;
  // Kiểm tra xem dữ liệu cần thiết có bị thiếu không
  if (!user_name || !password || !roleId || !PartyMemberId) {
    return res.send({
      error: true,
      msg: "Vui lòng điền đầy đủ thông tin.",
    });
  }
  try {
    let accounts = [
      await Account.findOne({
        where: {
          _id: req.params.id,
        },
      }),
    ];

    accounts = accounts.filter((value, index) => {
      return (
        value.user_name == user_name &&
        value.password == password &&
        value.roleId == roleId &&
        value.PartyMemberId == PartyMemberId
      );
    });

    if (accounts.length == 0) {
      const document = await Account.update(
        {
          PartyMemberId: PartyMemberId,
          roleId: roleId,
          password: password,
          user_name: user_name,
        },
        { where: { _id: req.params.id }, returning: true }
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
    return next(createError(400, "Error update"));
  }
};

exports.login = async (req, res, next) => {
  try {
    const secretKey = "mysecretkey";
    const { user_name, password } = req.body;
    apiLogger(req, res, `${user_name} ${password}`)

    const account = await Account.findOne({
      where: { user_name: encrypt(user_name) },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [
        {
          model: Role,
          attributes: ['_id', 'name'],
          include: [{
            model: Permission,
            attributes: { exclude: ['createdAt', 'updatedAt'] }
          }],
        },
        {
          model: PartyMember,
          attributes: { exclude: ['createdAt', 'updatedAt'] },
          include: [
            { model: PartyCell, attributes: ['_id', 'name'] },
            { model: Position, attributes: ['_id', 'name'] },
            hamletIncludeAllModels,
          ]
        },
      ]
    })

    if (!account) {
      apiLogger(req, res, 'Login 404', 'error')
      return res.send({
        error: true,
        msg: "Tên tài khoản hoặc mật khẩu không hợp lệ!",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (isPasswordValid) {
      const token = jwt.sign({ userId: account._id }, secretKey);
      // * signed
      apiLogger(req, res, 'Login! ' + JSON.stringify(account))
      return res.send({
        error: false,
        token: token,
        document: account,
      });
    } else {
      apiLogger(req, res, 'Login 404', 'error')
      return res.send({
        error: true,
        msg: "Tên tài khoản hoặc mật khẩu không hợp lệ!",
      });
    }
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return res.send({
      error: true,
      msg: error.message
    })
  }
};

exports.findEmailFromRole = async (req, res, next) => {
  try {
    const { roleId } = req.body;

    const accounts = await Account.findAll({
      where: {
        user_name: { [Op.not]: encrypt('admin') },
        roleId: roleId, // Filter based on roleId if provided
      },
      include: [
        {
          model: PartyMember,
          attributes: ['email'],
        },
      ],
    });

    const emails = accounts.map(account => account.PartyMember.email);

    return res.send(emails);
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error');
    return next(createError(400, "Error finding accounts by role!"));
  }
};
exports.findEmailFromRoleAndHamlet = async (req, res, next) => {
  try {
    const { roleIdHamlet, hamletId } = req.body;

    const accounts = await Account.findAll({
      where: {
        user_name: { [Op.not]: encrypt('admin') },
        roleId: roleIdHamlet,
      },
      include: [
        {
          model: PartyMember,
          attributes: ['email'],
          include: [
            {
              model: Hamlet,
              attributes: [],
              where: hamletId ? { '_id': hamletId } : {},
            },
          ],
        },
      ],
    });

    const emails = accounts
      .map(account => account.PartyMember)
      .filter(partyMember => partyMember && partyMember.email)
      .map(partyMember => partyMember.email);

    return res.send(emails);
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error');
    return res.status(400).send({
      error: true,
      msg: "Error finding accounts by role and hamlet!",
      details: error.message,
    });
  }
};

exports.findEmailFromRoleAndWard = async (req, res, next) => {
  try {
    const { roleId, wardId } = req.body;

    const whereCondition = {
      user_name: { [Op.not]: encrypt('admin') },
      roleId: roleId,
    };

    // Áp dụng điều kiện nếu wardId tồn tại
    if (wardId) {
      whereCondition['$PartyMember.Hamlet.Ward._id$'] = wardId;
    }

    const accounts = await Account.findAll({
      where: whereCondition,
      include: [
        {
          model: PartyMember,
          attributes: ['email'],
          include: [
            {
              model: Hamlet,
              attributes: ['_id', 'name'],
              include: [
                {
                  model: Ward,
                  attributes: [],
                },
              ],
            },
          ],
        },
        {
          model: Role,
          attributes: [],
        },
      ],
    });

    // console.log(JSON.stringify(accounts, null, 2));

    const emails = accounts
      .map(account => account.PartyMember)
      .filter(partyMember => partyMember && partyMember.email)
      .map(partyMember => partyMember.email);

    return res.send(emails);
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error');
    return res.status(400).send({
      error: true,
      msg: "Error finding accounts by role and ward!",
      details: error.message,
    });
  }
};







exports.findEmailFromRoleAndPartyCell = async (req, res, next) => {
  try {
    const { roleId, partycellId } = req.body;

    const accounts = await Account.findAll({
      where: {
        user_name: { [Op.not]: encrypt('admin') },
        roleId: roleId,
      },
      include: [
        {
          model: PartyMember,
          attributes: ['email'],
          include: [
            {
              model: PartyCell,
              attributes: [],
              where: partycellId ? { '_id': partycellId } : {},
            },
          ],
        },
      ],
    });

    const emails = accounts
      .map(account => account.PartyMember)
      .filter(partyMember => partyMember && partyMember.email)
      .map(partyMember => partyMember.email);

    return res.send(emails);
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error');
    return res.status(400).send({
      error: true,
      msg: "Error finding accounts by role and party cell!",
      details: error.message,
    });
  }
};























