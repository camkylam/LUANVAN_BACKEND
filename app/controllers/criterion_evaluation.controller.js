const { Criterion, Criterion_Evaluation } = require("../models/index.model.js");
const createError = require("http-errors");
const { sequelize } = require("../config/index");
const { apiLogger } = require("../../logger.js");

exports.create = async (req, res, next) => {
  const { criterionId, name } = req.body;
  if (!criterionId) {
    apiLogger(req, res, '400! Bad request!', 'error')
    return res.send({
      error: true,
      msg: 'Missing params'
    })
  }

  try {
    // Check if exist criterion
    const criterion = await Criterion.findOne({
      where: { _id: criterionId }
    })

    if (!criterion) {
      apiLogger(req, res, '404! Criterion not found!', 'error')
      return res.send({
        error: true,
        msg: `Không tìm được tiêu chí`
      })
    }

    const newEvaluation = await Criterion_Evaluation.create({
      name: name,
      criterionId: criterionId
    })

    return res.send({
      error: false,
      msg: `Bạn đã tạo thành công tiêu chí đánh giá`,
      document: newEvaluation
    });
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return res.send({
      error: true,
      msg: `Không thể tạo tiêu chí đánh giá.`,
    });
  }
}

exports.findAll = async (req, res, next) => {
  try {
    const evaluations = await Criterion_Evaluation.findAll()

    apiLogger(req, res, evaluations.length + ' results')
    return res.send({
      error: false,
      document: evaluations
    })
  }
  catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return next(createError(400, `Error finding evaluations!`));
  }
};

exports.update = async (req, res, next) => {
  const evaluationId = req.params.id
  const { name, criterionId } = req.body
  if (!evaluationId || (!name && criterionId)) {
    apiLogger(req, res, '400! Bad request!', 'error')
    return res.send({
      error: true,
      msg: 'Missing params'
    })
  }

  try {
    const evaluation = await Criterion_Evaluation.findOne({
      where: { _id: evaluationId }
    })
    if (!evaluation) {
      apiLogger(req, res, 'Error! Evaluation not found!', 'error')
      return res.send({
        error: true,
        msg: 'Không tìm được tiêu chí đánh giá'
      })
    }

    if (criterionId) {
      const criterion = await Criterion.findOne({
        where: { _id: criterionId }
      })
      if (!criterion) {
        apiLogger(req, res, 'Error! Criterion not found!', 'error')
        return res.send({
          error: true,
          msg: 'Không tìm được tiêu chí'
        })
      }
    }

    await Criterion_Evaluation.update(
      {
        name: name ? name : evaluation.name,
        criterionId: criterionId ? criterionId : evaluation.criterionId
      },
      { where: { _id: evaluationId }, }
    )

    const newEvaluation = await Criterion_Evaluation.findOne({
      where: { _id: evaluationId },
      attributes: ['_id', 'name'],
      include: {
        model: Criterion,
        attributes: ['_id', 'name']
      }
    })

    apiLogger(req, res, 'Update evaluation successfully')
    return res.send({
      error: false,
      document: newEvaluation
    })
  }
  catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return res.send({
      error: true,
      msg: `Không thể cập nhật tiêu chí đánh giá`
    })
  }
}

exports.delete = async (req, res, next) => {
  const evaluationId = req.params.id
  if (!evaluationId) {
    apiLogger(req, res, '400! Bad request!', 'error')
    return res.send({
      error: true,
      msg: 'Missing params'
    })
  }

  try {
    const result = await Criterion_Evaluation.destroy({
      where: { _id: evaluationId }
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
      msg: `Không thể xóa tiêu chí đánh giá.`
    })
  }
}

exports.deleteAll = async (req, res, next) => {
  try {
    const t = await sequelize.transaction()
    const result = await Criterion_Evaluation.destroy({}, { transaction: t })
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
      msg: `Không thể xóa toàn bộ tiêu chí đánh giá`
    })
  }
}