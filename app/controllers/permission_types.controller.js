const { Permission_Types, Permission } = require("../models/index.model.js");
const createError = require("http-errors");
const ID_CAN_NOT_DELETE = "705a7bc8-d6f3-4df9-a0bf-f3fc67c133e8";

exports.create = async (req, res, next) => {
  const customerType = await Permission_Types.findAll();
  const name = req.body.name;
  let isCheck = true;
  for (const each of customerType) {
    if (
      each &&
      name &&
      each.name &&
      each.name.toLowerCase() == name.toLowerCase()
    ) {
      isCheck = false;
    }
  }

  if (isCheck === true) {
    try {
      const document = await Permission_Types.create({
        name: req.body.name,
      });
      return res.status(200).json({
        error: false,
        msg: `Thêm thành công loại quyền ${document.name}`,
        document,
      });
    } catch (error) {
      return next(createError(500, error.message));
    }
  } else {
    return res.status(200).json({
      error: true,
      msg: `Tên loại quyền ${req.body.name} đã tồn tại không thể thêm!!`,
    });
  }
};

exports.findAll = async (req, res, next) => {
  try {
    const documents = await Permission_Types.findAll({
      include: Permission,
    });
    return res.status(200).json({
      msg:
        documents.length > 0 ? "Danh sách loại quyền" : "Không có loại quyền",
      error: documents.length > 0 ? false : true,
      documents: documents.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      ),
    });
  } catch (error) {
    // console.log(error);
    return next(createError(500, error.message));
  }
};

exports.findOne = async (req, res, next) => {
  try {
    const document = await Permission_Types.findOne({
      where: {
        _id: req.params.id,
      },
    });
    return res.status(200).json({
      msg: document,
      error: document ? false : true,
      document,
    });
  } catch (error) {
    return next(createError(400, "Error findOne"));
  }
};

exports.deleteOne = async (req, res, next) => {
  try {
    if (req.params.id === ID_CAN_NOT_DELETE) {
      return res.status(200).json({
        msg: "Loại quyền này không thể xóa",
        error: true,
      });
    }
    const customerType = await Permission_Types.destroy({
      where: {
        _id: req.params.id,
      },
    });

    return res.status(200).json({
      error: customerType ? false : true,
      msg: customerType
        ? "Bạn vừa xóa thành công loại quyền"
        : "Không thể tìm thấy loại quyền để xóa!!",
    });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

exports.update = async (req, res, next) => {
  const customerType = await Permission_Types.findAll();
  const name = req.body.name;
  let isCheck = true;
  for (const each of customerType) {
    if (each.name.toLowerCase() == name.toLowerCase()) {
      isCheck = false;
    }
  }

  if (isCheck === true) {
    try {
      const customerType = await Customer_Types.update(
        {
          name: req.body.name,
        },
        {
          where: {
            _id: req.params.id,
          },
        }
      );
      return res.status(200).json({
        error: customerType[0] ? false : true,
        msg: customerType[0]
          ? "Dử liệu thay đổi thành công"
          : "Không thể tìm thấy dử liệu để thay đổi!!",
        document: customerType,
      });
    } catch (error) {
      return next(createError(500, error.message));
    }
  } else {
    return res.status(200).json({
      error: true,
      msg: "Dữ liệu chùng nên chưa được thay đổi.",
    });
  }
};
