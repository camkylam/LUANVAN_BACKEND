const { Role, Permission } = require("../models/index.model.js");
const createError = require("http-errors");
const { v4: uuidv4 } = require("uuid");
const { sequelize } = require("../config/index");
const { encrypt, decrypt } = require('../config/crypto.js')

exports.create = async (req, res, next) => {
  if (Object.keys(req.body).length === 1) {
    const { name } = req.body;
    const roles = await Role.findAll();
    for (let value of roles) {
      if (value.name == name) {
        return res.send({
          error: true,
          msg: `Đã tồn tại chức vụ ${value.name}.`,
        });
      }
    }
    try {
      const document = await Role.create({
        name: req.body.name,
      });
      return res.send({
        error: false,
        msg: `Bạn đã tạo thành công chức vụ ${document.name}`,
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
    });
  }
};

exports.findAll = async (req, res, next) => {
  try {
    const documents = await Role.findAll({
      include: Permission,
    });
    return res.send(
      documents.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    );
  } catch (error) {
    // console.log(error);
    return next(createError(400, "Error finding all role!"));
  }
};

exports.findOne = async (req, res, next) => {
  try {
    const documents = await Role.findOne({
      where: {
        _id: req.params.id,
      },
    });
    return res.send(documents);
  } catch (error) {
    return next(createError(400, "Error finding role !"));
  }
};

exports.deleteOne = async (req, res, next) => {
  try {
    const role = await Role.findOne({
      where: {
        _id: req.params.id,
      },
    });
    const result = await Role.destroy({
      where: {
        _id: req.params.id,
      },
    });

    if (result === 0) {
      // If no records were deleted, return an error
      return next(createError(404, "Role not found"));
    }
    return res.send({
      msg: `Đã xoá thành công chức vụ ${role.name}`,
      document: role,
    });
  } catch (error) {
    // console.log(error);
    return next(createError(400, "Error deleting role"));
  }
};

exports.deleteAll = async (req, res, next) => {
  try {
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    const result = await Role.destroy({
      where: {},
      truncate: true, // Truncate the table to remove all records
    });

    if (result === 0) {
      return res.sendStatus(204);
    }
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  } catch (error) {
    // console.log(error);
    return next(createError(400, "Error deleting accounts"));
  }
};

exports.update = async (req, res, next) => {

  const { name } = req.body;

  // Kiểm tra xem dữ liệu cần thiết có bị thiếu không
  try {
  
    let roles = [
      await Role.findOne({
        where: {
          _id: req.params.id,
        },
      }),
    ];
   
    roles = roles.filter((value, index) => {
      return value.name == name;
    });

    if (roles.length == 0) {
      const document = await Role.update(
        {
          name: req.body.name,
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


exports.findRoleIdByName = async (req, res, next) => {
  try {
    const { RoleName } = req.body;
    const encryptedName = encrypt(RoleName);

    const role = await Role.findOne({
      where: {
        name: encryptedName,
      },
    });

    if (role) {
      return res.send({ roleId: role._id });
    } else {
      return res.send({ roleId: null, msg: `Role with name '${RoleName}' not found` });
    }
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: `Error finding Role by name: ${error.message}` });
  }
};
