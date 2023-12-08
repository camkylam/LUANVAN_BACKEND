const { Criterion, Criterion_Evaluation } = require("../models/index.model.js");
const createError = require("http-errors");
const { sequelize } = require("../config/index");
const { apiLogger } = require("../../logger.js");
const { encrypt } = require("../config/crypto.js");

exports.create = async (req, res, next) => {
  const { name, priority, exemption } = req.body;
  if (!name || !priority || !exemption) {
    apiLogger(req, res, '400! Bad request!', 'error')
    return res.send({
      error: true,
      msg: 'Missing params'
    })
  }

  try {
    const newCriterion = await Criterion.create({
      name: name,
      priority: priority,
      exemption: exemption
    })

    return res.send({
      error: false,
      msg: `Bạn đã tạo thành công tiêu chí`,
      document: newCriterion
    });
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return res.send({
      error: true,
      msg: `Không thể tạo tiêu chí.`,
    });
  }
}

exports.findAll = async (req, res, next) => {
  const exemption = req.params.exemption
  try {
    const criterions = await Criterion.findAll({
      where: (exemption)
        ? { exemption: encrypt(exemption) }
        : {},
      attributes: ['_id', 'priority', 'exemption', 'name'],
      include: {
        model: Criterion_Evaluation,
        attributes: ['_id', 'name']
      },
      order: [
        ['exemption'],
        ['priority'],
        [{ model: Criterion_Evaluation }, 'createdAt']
      ]
    })

    apiLogger(req, res, criterions.length + ' results')
    return res.send({
      error: false,
      document: criterions
    })
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return next(createError(400, `Error finding criterions!`));
  }
};

exports.update = async (req, res, next) => {
  const criterionId = req.params.id
  const { name, exemption, priority } = req.body
  if (!criterionId || (!name && !exemption && !priority)) {
    apiLogger(req, res, '400! Bad request!', 'error')
    return res.send({
      error: true,
      msg: 'Missing params'
    })
  }

  try {
    const criterion = await Criterion.findOne({
      where: { _id: criterionId }
    })

    if (!criterion) {
      apiLogger(req, res, 'Error! Criterion not found!')
      return res.send({
        error: true,
        msg: 'Không tìm thấy tiêu chí'
      })
    }

    await Criterion.update(
      {
        name: name ? name : criterion.name,
        exemption: exemption ? exemption : criterion.exemption,
        priority: priority ? priority : criterion.priority
      },
      { where: { _id: criterionId }, }
    )

    const newCriterion = await Criterion.findOne({
      where: { _id: criterionId }
    })

    apiLogger(req, res, 'Update Criterion successfully')
    return res.send({
      error: false,
      document: newCriterion
    })
  }
  catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return res.send({
      error: true,
      msg: `Không thể cập nhật tiêu chí`
    })
  }
}

exports.delete = async (req, res, next) => {
  const criterionId = req.params.id
  if (!criterionId) {
    apiLogger(req, res, '400! Bad request!', 'error')
    return res.send({
      error: true,
      msg: 'Missing params'
    })
  }

  try {
    const result = await Criterion.destroy({
      where: { _id: criterionId }
    })
    return res.send({
      error: false,
      msg: `Đã xóa ${result} bản ghi.`
    })
  }
  catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return res.send({
      error: true,
      msg: `Không thể xóa tiêu chí`
    })
  }
}

exports.deleteAll = async (req, res, next) => {
  try {
    const t = await sequelize.transaction()
    const result = await Criterion.destroy({}, { transaction: t })
    await t.commit()
    return res.send({
      error: false,
      msg: `Đã xóa ${result} bản ghi.`
    })
  }
  catch (error) {
    await t.rollback()
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return res.send({
      error: true,
      msg: `Không thể xóa toàn bộ tiêu chí`
    })
  }
}

exports.findAllByPriority= async (req, res, next) => {
  try {
    const criterions = await Criterion.findAll({
      where: {
        priority: {
          [sequelize.Op.between]: [1, 5]
        },
        exemption: false
      },
      attributes: ['_id', 'priority', 'exemption', 'name'],
      include: {
        model: Criterion_Evaluation,
        attributes: ['_id', 'name']
      },
      order: [
        ['exemption'],
        ['priority'],
        [{ model: Criterion_Evaluation }, 'createdAt']
      ]
    });

    apiLogger(req, res, criterions.length + ' results');
    return res.send({
      error: false,
      document: criterions
    });
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error');
    return next(createError(400, `Error finding criterions!`));
  }
};
