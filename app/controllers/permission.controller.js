const { Permission, Permission_Types } = require("../models/index.model.js");
const createError = require("http-errors");
const { v4: uuidv4 } = require("uuid");
const { sequelize } = require("../config/index");

exports.create = async (req, res, next) => {
  if (Object.keys(req.body).length === 2) {
    const { name, permissionTypesId } = req.body;
    const permissions = await Permission.findAll();
    for (let value of permissions) {
      if (value.name == name && value.permissionTypesId == permissionTypesId) {
        return res.send({
          error: true,
          msg: `Đã tồn tại quyền ${value.name}.`,
        });
      }
    }
    try {
      const document = await Permission.create({
        name: req.body.name,
        permissionTypesId: permissionTypesId,
      });
      return res.send({
        error: false,
        msg: `Bạn đã tạo thành công quyền ${document.name}`,
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
    const documents = await Permission.findAll({
      include: Permission_Types,
    });
    return res.send(
      documents.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    );
  } catch (error) {
    // console.log(error);
    return next(createError(400, "Error finding all permissions!"));
  }
};

exports.findOne = async (req, res, next) => {
  try {
    const documents = await Permission.findOne({
      where: {
        _id: req.params.id,
      },
    });
    return res.send(documents);
  } catch (error) {
    return next(createError(400, "Error finding permission !"));
  }
};

exports.deleteOne = async (req, res, next) => {
  try {
    const permission = await Permission.findOne({
      where: {
        _id: req.params.id,
      },
    });
    const result = await Permission.destroy({
      where: {
        _id: req.params.id,
      },
    });

    if (result === 0) {
      // If no records were deleted, return an error
      return next(createError(404, "Permission not found"));
    }
    return res.send({
      msg: `Đã xoá thành công quyền ${permission.name}`,
      document: permission,
    });
  } catch (error) {
    // console.log(error);
    return next(createError(400, "Error deleting permission"));
  }
};

exports.deleteAll = async (req, res, next) => {
  try {
    // Tắt ràng buộc khóa ngoại
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

    const result = await Permission.destroy({
      where: {},
      truncate: true, // Truncate the table to remove all records
    });

    if (result === 0) {
      return res.sendStatus(204);
    }

    // Kích hoạt lại ràng buộc khóa ngoại
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  } catch (error) {
    // console.log(error);
    return next(createError(400, "Error deleting permission"));
  }
};

exports.update = async (req, res, next) => {
  const { name } = req.body;
  // Kiểm tra xem dữ liệu cần thiết có bị thiếu không
  if (!name) {
    return res.send({
      error: true,
      msg: "Vui lòng điền đầy đủ thông tin.",
    });
  }
  try {
    let permissions = [
      await Permission.findOne({
        where: {
          _id: req.params.id,
        },
      }),
    ];

    permissions = permissions.filter((value, index) => {
      return value.name == name;
    });

    if (permissions.length == 0) {
      const document = await Permission.update(
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
