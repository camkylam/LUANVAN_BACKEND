const { Role_Permission } = require("../models/index.model.js");
const createError = require("http-errors");

exports.create = async (req, res, next) => {
  if (Object.keys(req.body).length === 2) {
    const { RoleId, PermissionId } = req.body;
    const permissions = await Role_Permission.findAll();
    for (let value of permissions) {
      if (value.RoleId == RoleId && value.PermissionId == PermissionId) {
        return res.send({
          error: true,
          msg: `Đã tồn tại quyền ${value.name}.`,
        });
      }
    }
    try {
      const document = await Role_Permission.create({
        RoleId: RoleId,
        PermissionId: PermissionId,
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
    const documents = await Role_Permission.findAll({
      include: [],
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
    const documents = await Role_Permission.findOne({
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
    const result = await Role_Permission.destroy({
      where: {
        RoleId: req.body.RoleId,
        PermissionId: req.body.PermissionId,
      },
    });

    if (result === 0) {
      // If no records were deleted, return an error
      return next(createError(404, "Role not found"));
    }
    return res.send({
      document: result,
    });
  } catch (error) {
    // console.log(error);
    return next(createError(400, "Error deleting role"));
  }
};
