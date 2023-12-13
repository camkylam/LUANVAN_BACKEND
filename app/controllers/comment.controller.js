const { Comment, Opinion, Recommendation, Detailed_Recommendation, PartyMember, Hamlet, PartyCell, Position, Criterion_Evaluation, Criterion, Detailed_Comment } = require("../models/index.model.js");
const createError = require("http-errors");
const { sequelize } = require("../config/index");
const { apiLogger } = require("../../logger.js");
const { hamletIncludeAllModels } = require('./hamlet.controller.js');
const { wardIncludeAllModels } = require("./ward.controller.js");
const { encrypt } = require("../config/crypto.js");
const { Op } = require('sequelize')

exports.create = async (req, res, next) => {
  const { opinionId, commentedBy, evaluations, note } = req.body;
  if (!opinionId || !commentedBy || !evaluations) {
    apiLogger(req, res, '400! Bad request!', 'error')
    return res.send({
      error: true,
      msg: 'Missing params'
    })
  }

  let newCommentId = ''
  const t = await sequelize.transaction()
  try {
    const partymember = await PartyMember.findOne({
      where: {
        _id: commentedBy
      },
      attributes: ['name']
    })
    if (!partymember) {
      apiLogger(req, res, '404! Partymember not found!', 'error')
      return res.send({
        error: true,
        msg: `Không tìm được đảng viên`
      })
    }
    const opinion = await Opinion.findOne({
      where: { _id: opinionId },
      attributes: ['_id']
    })
    if (!opinion) {
      apiLogger(req, res, '404! Opinion not found!', 'error')
      return res.send({
        error: true,
        msg: `Không tìm được phiếu xin ý kiến`
      })
    }

    // Check if opinion already have comment
    const comment = await Comment.findOne({
      where: { opinionId: opinionId },
      attributes: ['_id']
    })
    if (comment) {
      apiLogger(req, res, '404! Comment for opinion already existed', 'error')
      return res.send({
        error: true,
        msg: `Đã tồn tại nhận xét cho thư xin ý kiến`
      })
    }

    // Add data
    // * State 1 - Add Comment
    const newComment = await Comment.create({
      opinionId: opinionId,
      commentedBy: commentedBy,
      note: note
    })

    // * State 2 - Add Comment Details
    newCommentId = newComment._id
    for (const evaluationId of evaluations) {
      await Detailed_Comment.create({
        commentId: newCommentId,
        criterion_evaluationId: evaluationId
      }, { transaction: t })
    }

    await t.commit()

    const document = await Comment.findOne({
      where: { _id: newCommentId },
      attributes: ['_id', 'opinionId', 'note'],
      include: [
        {
          model: PartyMember,
          as: "CommentedBy",
          attributes: ['_id', "name"]
        },
        {
          model: Criterion_Evaluation,
          attributes: ['_id', 'name'],
          include: {
            model: Criterion,
            attributes: ['_id', 'name']
          }
        }
      ]
    })

    return res.send({
      error: false,
      msg: `Bạn đã tạo thành công phiếu nhận xét`,
      document: document
    });
  } catch (error) {
    if (!t.finished) await t.rollback()
    if (newCommentId) {
      await Comment.destroy({ where: { _id: newCommentId } })
    }
    apiLogger(req, res, error, 'error')
    return res.send({
      error: true,
      msg: `Không thể tạo phiếu nhận xét. Lôi ở bước ${newCommentId ? "2" : "1"}.`,
    });
  }
}

// * Tìm kiếm thư nhận xét của member
exports.findByPartymember = async (req, res, next) => {
  const partymemberId = req.params.id
  if (!partymemberId) {
    apiLogger(req, res, '400! Bad request!', 'error')
    return res.send({
      error: true,
      msg: 'Missing params'
    })
  }

  try {
    // Check if partymember existed
    const partymember = await PartyMember.findOne({
      where: { _id: partymemberId },
      attributes: ['name']
    })
    if (!partymember) {
      apiLogger(req, res, '404! Partymember not found!', 'error')
      return res.send({
        error: true,
        msg: `Không tìm được đảng viên ${partymemberId}`
      })
    }

    // Find comments
    const comments = await Comment.findAll({
      where: {
        '$Opinion.Recommendation.PartyMember._id$': partymemberId
      },
      attributes: ['_id', 'createdAt', 'note'],
      include: [
        { model: PartyMember, as: 'CommentedBy', attributes: ['_id', 'name'] },
        { model: PartyMember, as: 'SignedBy', attributes: ['_id', 'name'] },
        {
          model: Opinion,
          attributes: ['_id', 'createdAt'],
          include: {
            model: Recommendation,
            attributes: { exclude: ['partymemberId', 'PartyMemberId', 'updatedAt'] },
            include: [
              {
                model: PartyMember,
                attributes: ['_id', 'name', 'birthday', 'phone', 'gender', 'code', 'dateJoin', 'dateOfficial', 'exemption'],
                include: [
                  { model: PartyCell, attributes: ['_id', 'name'] },
                  { model: Position, attributes: ['_id', 'name'] },
                  hamletIncludeAllModels
                ]
              },
              { model: PartyMember, as: 'CreatedBy', attributes: ['_id', 'name'] },
              { model: PartyMember, as: 'ConfirmedBy', attributes: ['_id', 'name'] },
              { model: PartyMember, as: 'AcceptedBy', attributes: ['_id', 'name'] },
              {
                model: Detailed_Recommendation,
                attributes: { exclude: ['HamletId'] },
                include: {
                  model: Hamlet,
                  include: wardIncludeAllModels
                }
              }
            ]
          },
        },
        {
          model: Criterion_Evaluation,
          attributes: ['_id', 'name'],
          include: {
            model: Criterion,
            attributes: ['_id', 'name']
          }
        }
      ],
      order: [['createdAt', 'DESC'],]
    })

    if (!comments || comments.length == 0) {
      apiLogger(req, res, `No comment for ${partymemberId} - ${partymember?.name}`, 'error')
      return res.send({
        error: true,
        msg: `Không tìm được phiếu nhận xét về đảng viên ${partymemberId} - ${partymember?.name}`
      })
    }

    apiLogger(req, res, JSON.stringify(comments))
    return res.send({
      error: false,
      document: comments
    })
  }
  catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return next(createError(400, `Error finding opinion of partymember ${partymemberId}!`));
  }
};

// * Tìm kiếm toàn bộ thư nhận xét theo năm
exports.findByYear = async (req, res, next) => {
  const year = req.params.year

  try {
    // Find comments
    const comments = await Comment.findAll({
      where: {
        '$Comment.createdAt$': sequelize.where(sequelize.fn('year', sequelize.col('Comment.createdAt')), year)
      },
      attributes: ['_id', 'note', 'createdAt'],
      include: [
        { model: PartyMember, as: 'CommentedBy', attributes: ['_id', 'name'] },
        { model: PartyMember, as: 'SignedBy', attributes: ['_id', 'name'] },
        {
          model: Opinion,
          attributes: ['_id', 'createdAt'],
          include: {
            model: Recommendation,
            attributes: { exclude: ['partymemberId', 'PartyMemberId', 'updatedAt', 'createdAt'] },
            include: [
              {
                model: PartyMember,
                attributes: ['_id', 'name', 'birthday', 'phone', 'gender', 'code', 'dateJoin', 'dateOfficial', 'exemption'],
                include: [
                  { model: PartyCell, attributes: ['_id', 'name'] },
                  { model: Position, attributes: ['_id', 'name'] },
                  hamletIncludeAllModels
                ]
              },
              { model: PartyMember, as: 'CreatedBy', attributes: ['_id', 'name'] },
              { model: PartyMember, as: 'ConfirmedBy', attributes: ['_id', 'name'] },
              { model: PartyMember, as: 'AcceptedBy', attributes: ['_id', 'name'] },
              {
                model: Detailed_Recommendation,
                attributes: { exclude: ['HamletId', 'createdAt'] },
                include: {
                  model: Hamlet,
                  attributes: ['_id', 'name'],
                  include: wardIncludeAllModels
                }
              }
            ]
          },
        },
        {
          model: Criterion_Evaluation,
          attributes: ['_id', 'name'],
          include: {
            model: Criterion,
            attributes: ['_id', 'name']
          }
        }
      ],
    })

    if (!comments || comments.length == 0) {
      apiLogger(req, res, `No comment in ${year}`, 'error')
      return res.send({
        error: true,
        msg: `Không tìm được phiếu nhận xét năm ${year}`
      })
    }

    apiLogger(req, res, JSON.stringify(comments))
    return res.send({
      error: false,
      document: comments
    })
  }
  catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return next(createError(400, `Error finding comments`));
  }
};

exports.update = async (req, res, next) => {
  const { commentId, signedBy } = req.body;

  if (!commentId) {
    apiLogger(req, res, '400! Bad request!', 'error');
    return res.send({
      error: true,
      msg: 'Missing params'
    });
  }

  const t = await sequelize.transaction();

  try {
    // Check if commentId exists
    const comment = await Comment.findOne({
      where: { _id: commentId },
      attributes: ['_id', 'note', 'signedBy', 'commentedBy']
    });

    if (!comment) {
      apiLogger(req, res, '404! Comment not found!', 'error');
      return res.send({
        error: true,
        msg: `Không tìm thấy phiếu nhận xét`
      });
    }

    // Check if partymember exists
    if (signedBy) {
      const partymember = await PartyMember.findOne({
        where: {
          _id: signedBy
        },
        attributes: ['name']
      });

      if (!partymember) {
        apiLogger(req, res, '404! Partymember not found!', 'error');
        return res.send({
          error: true,
          msg: `Không tìm thấy đảng viên`
        });
      }
    }

    // Update data
    await Comment.update(
      {
        signedBy: signedBy || comment.signedBy
      },
      { where: { _id: commentId } },
      { transaction: t }
    );

    await t.commit();

    const updatedComment = await Comment.findOne({
      where: { _id: commentId },
      attributes: ['_id', 'opinionId', 'note'],
      include: [
        {
          model: PartyMember,
          as: "CommentedBy",
          attributes: ['_id', 'name']
        },
        {
          model: PartyMember,
          as: "SignedBy",
          attributes: ['_id', 'name']
        },
        {
          model: Criterion_Evaluation,
          attributes: ['_id', 'name'],
          include: {
            model: Criterion,
            attributes: ['_id', 'name']
          }
        }
      ]
    });

    apiLogger(req, res, 'Update recommendation successfully');
    return res.send({
      error: false,
      msg: 'Bạn đã cập nhật thành công phiếu nhận xét',
      document: updatedComment
    });
  } catch (error) {
    await t.rollback();
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error');
    return next(createError(400, `Error updating comments`));
  }
}


exports.delete = async (req, res, next) => {
  const commentId = req.params.id
  if (!commentId) {
    apiLogger(req, res, '400! Bad request!', 'error')
    return res.send({
      error: true,
      msg: 'Missing params'
    })
  }

  let deletedRows = 0
  try {
    // const result = await Detailed_Comment.destroy({})
    const result = await Comment.destroy({
      where: { _id: commentId }
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
      msg: `Không thể xóa phiếu nhận xét`
    })
  }
}

exports.findById = async (req, res, next) => {
  const commentId = req.params.id;

  if (!commentId) {
    apiLogger(req, res, '400! Bad request!', 'error');
    return res.send({
      error: true,
      msg: 'Missing params'
    });
  }

  try {
    // Find comment by ID
    const comment = await Comment.findOne({
      where: { _id: commentId },
      attributes: ['_id', 'opinionId', 'note', 'createdAt'],
      include: [
        {
          model: PartyMember,
          as: "CommentedBy",
          attributes: ['_id', "name"]
        },
        {
          model: PartyMember,
          as: "SignedBy",
          attributes: ['_id', "name"]
        },
        {
          model: Criterion_Evaluation,
          attributes: ['_id', 'name'],
          include: {
            model: Criterion,
            attributes: ['_id', 'priority', 'name']
          }
        }
      ]
    });

    if (!comment) {
      apiLogger(req, res, '404! Comment not found!', 'error');
      return res.send({
        error: true,
        msg: `Không tìm thấy phiếu nhận xét với ID ${commentId}`
      });
    }

    apiLogger(req, res, `Found comment with ID ${commentId}`);
    return res.send({
      error: false,
      document: comment
    });
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error');
    return next(createError(400, `Error finding comment with ID ${commentId}`));
  }
};

exports.findByOpinionId = async (req, res, next) => {
  const { opinionId } = req.body;

  if (!opinionId) {
    apiLogger(req, res, '400! Bad request!', 'error');
    return res.send({
      error: true,
      msg: 'Missing opinionId in the request body'
    });
  }

  try {
    // Find comment by Opinion ID
    const comment = await Comment.findOne({
      where: { opinionId: opinionId },
      attributes: ['_id', 'opinionId', 'note', 'createdAt'],
      include: [
        {
          model: PartyMember,
          as: "CommentedBy",
          attributes: ['_id', "name"]
        },
        {
          model: PartyMember,
          as: "SignedBy",
          attributes: ['_id', "name"]
        },
        {
          model: Criterion_Evaluation,
          attributes: ['_id', 'name'],
          include: {
            model: Criterion,
            attributes: ['_id', 'priority', 'name']
          }
        },
        {
          model: Opinion,
          attributes: ['_id', 'createdAt'],
          include: {
            model: Recommendation,
            attributes: { exclude: ['partymemberId', 'PartyMemberId', 'updatedAt', 'createdAt'] },
            include: [
              {
                model: PartyMember,
                attributes: ['_id', 'name', 'birthday', 'phone', 'gender', 'code', 'dateJoin', 'dateOfficial', 'exemption'],
                include: [
                  { model: PartyCell, attributes: ['_id', 'name'] },
                  { model: Position, attributes: ['_id', 'name'] },
                  hamletIncludeAllModels
                ]
              },
              { model: PartyMember, as: 'CreatedBy', attributes: ['_id', 'name'] },
              { model: PartyMember, as: 'ConfirmedBy', attributes: ['_id', 'name'] },
              { model: PartyMember, as: 'AcceptedBy', attributes: ['_id', 'name'] },
              {
                model: Detailed_Recommendation,
                attributes: { exclude: ['HamletId', 'createdAt'] },
                include: {
                  model: Hamlet,
                  attributes: ['_id', 'name'],
                  include: wardIncludeAllModels
                }
              }
            ]
          },
        },
      ]
    });

    if (!comment) {
      apiLogger(req, res, `404! Comment not found for Opinion ID ${opinionId}`, 'error');
      return res.send({
        error: true,
        msg: `Không tìm thấy phiếu nhận xét cho phiếu xin ý kiến có ID ${opinionId}`
      });
    }

    apiLogger(req, res, `Found comment for Opinion ID ${opinionId}`);
    return res.send({
      error: false,
      document: comment
    });
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error');
    return next(createError(400, `Error finding comment for Opinion ID ${opinionId}`));
  }
};

exports.findByYearAndPartyCell = async (req, res, next) => {
  const { year, partyCellIds } = req.body;

  if (!year || !partyCellIds || !Array.isArray(partyCellIds) || partyCellIds.length === 0) {
    apiLogger(req, res, '400! Bad request!', 'error');
    return res.send({
      error: true,
      msg: 'Tham số không hợp lệ hoặc bị thiếu'
    });
  }

  try {
    const comments = await Comment.findAll({
      where: {
        '$Comment.createdAt$': sequelize.where(sequelize.fn('year', sequelize.col('Comment.createdAt')), year),
        '$Comment.signedBy$': { [Op.not]: null },
        '$Opinion.Recommendation.PartyMember.PartyCell._id$': { [Op.in]: partyCellIds },
        // '$Opinion.Recommendation.PartyMember.exemption$': false, // Thêm điều kiện này
      },
      attributes: ['_id', 'note', 'createdAt'],
      include: [
        { model: PartyMember, as: 'CommentedBy', attributes: ['_id', 'name'] },
        { model: PartyMember, as: 'SignedBy', attributes: ['_id', 'name'] },
        {
          model: Opinion,
          attributes: ['_id', 'createdAt'],
          include: {
            model: Recommendation,
            attributes: { exclude: ['partymemberId', 'PartyMemberId', 'updatedAt', 'createdAt'] },
            include: [
              {
                model: PartyMember,
                attributes: ['_id', 'name', 'birthday', 'phone', 'gender', 'code', 'dateJoin', 'dateOfficial', 'exemption'],
                include: [
                  { model: PartyCell, attributes: ['_id', 'name'] },
                  { model: Position, attributes: ['_id', 'name'] },
                  hamletIncludeAllModels
                ]
              },
              { model: PartyMember, as: 'CreatedBy', attributes: ['_id', 'name'] },
              { model: PartyMember, as: 'ConfirmedBy', attributes: ['_id', 'name'] },
              { model: PartyMember, as: 'AcceptedBy', attributes: ['_id', 'name'] },
              {
                model: Detailed_Recommendation,
                attributes: { exclude: ['HamletId', 'createdAt'] },
                include: {
                  model: Hamlet,
                  attributes: ['_id', 'name'],
                  include: wardIncludeAllModels
                }
              }
            ]
          },
        },
        {
          model: Criterion_Evaluation,
          attributes: ['_id', 'name'],
          include: {
            model: Criterion,
            attributes: ['_id', 'name']
          }
        },
      ],
    });

    if (!comments || comments.length === 0) {
      apiLogger(req, res, `Không có phiếu nhận xét cho năm ${year} và các chi bộ ${partyCellIds.join(', ')}`, 'error');
      return res.send({
        error: true,
        msg: `Không tìm thấy phiếu nhận xét cho năm ${year} và các chi bộ ${partyCellIds.join(', ')}`
      });
    }

    // Count occurrences of each criterion_evaluation name
    const criterionEvaluationNameCounts = {};
    comments.forEach(comment => {
      comment.Criterion_Evaluations.forEach(criterionEvaluation => {
        const criterionEvaluationName = criterionEvaluation.name;
        criterionEvaluationNameCounts[criterionEvaluationName] = (criterionEvaluationNameCounts[criterionEvaluationName] || 0) + 1;
      });
    });
    const criterionCountsArray = Object.entries(criterionEvaluationNameCounts).map(([name, count]) => ({ name, count }));

apiLogger(req, res, JSON.stringify(comments));

return res.send({
  error: false,
  document: comments,
  criterionEvaluationNameCounts: criterionCountsArray
});

  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error');
    return next(createError(400, `Lỗi khi tìm kiếm phiếu nhận xét`));
  }
};


exports.findByYearAndPartyCellExemptionTrue = async (req, res, next) => {
  const { yeartrue, partyCellIds } = req.body;

  if (!yeartrue || !partyCellIds || !Array.isArray(partyCellIds) || partyCellIds.length === 0) {
    apiLogger(req, res, '400! Bad request!', 'error');
    return res.send({
      error: true,
      msg: 'Tham số không hợp lệ hoặc bị thiếu'
    });
  }

  try {
    const comments = await Comment.findAll({
      where: {
        '$Comment.createdAt$': sequelize.where(sequelize.fn('year', sequelize.col('Comment.createdAt')), yeartrue),
        '$Comment.signedBy$': { [Op.not]: null },
        '$Opinion.Recommendation.PartyMember.PartyCell._id$': { [Op.in]: partyCellIds },
        '$Opinion.Recommendation.PartyMember.exemption$': encrypt('true', 'exemption', {}),
      },
      attributes: ['_id', 'note', 'createdAt'],
      include: [
        { model: PartyMember, as: 'CommentedBy', attributes: ['_id', 'name'] },
        { model: PartyMember, as: 'SignedBy', attributes: ['_id', 'name'] },
        {
          model: Opinion,
          attributes: ['_id', 'createdAt'],
          include: {
            model: Recommendation,
            attributes: { exclude: ['partymemberId', 'PartyMemberId', 'updatedAt', 'createdAt'] },
            include: [
              {
                model: PartyMember,
                attributes: ['_id', 'name', 'birthday', 'phone', 'gender', 'code', 'dateJoin', 'dateOfficial', 'exemption'],
                include: [
                  { model: PartyCell, attributes: ['_id', 'name'] },
                  { model: Position, attributes: ['_id', 'name'] },
                  hamletIncludeAllModels
                ]
              },
              { model: PartyMember, as: 'CreatedBy', attributes: ['_id', 'name'] },
              { model: PartyMember, as: 'ConfirmedBy', attributes: ['_id', 'name'] },
              { model: PartyMember, as: 'AcceptedBy', attributes: ['_id', 'name'] },
              {
                model: Detailed_Recommendation,
                attributes: { exclude: ['HamletId', 'createdAt'] },
                include: {
                  model: Hamlet,
                  attributes: ['_id', 'name'],
                  include: wardIncludeAllModels
                }
              }
            ]
          },
        },
        {
          model: Criterion_Evaluation,
          attributes: ['_id', 'name'],
          include: {
            model: Criterion,
            attributes: ['_id', 'name'],
          },
        },
      ],
    });

    if (!comments || comments.length === 0) {
      apiLogger(req, res, `Không có phiếu nhận xét cho năm ${yeartrue} và các chi bộ ${partyCellIds.join(', ')}`, 'error');
      return res.send({
        error: true,
        msg: `Không tìm thấy phiếu nhận xét cho năm ${yeartrue} và các chi bộ ${partyCellIds.join(', ')}`
      });
    }
    const criterionEvaluationCountsByCriterion = {};

    // Collect names of Criterion_Evaluations for each Criterion
    comments.forEach(comment => {
      comment.Criterion_Evaluations.forEach(criterionEvaluation => {
        const criterionId = criterionEvaluation.Criterion._id;
        const criterionEvaluationName = criterionEvaluation.name;
    
        // If the criterionId is not in the object, initialize it with an object
        if (!criterionEvaluationCountsByCriterion[criterionId]) {
          criterionEvaluationCountsByCriterion[criterionId] = {};
        }
    
        // If the criterionEvaluationName is not in the object, initialize it with a count of 1
        if (!criterionEvaluationCountsByCriterion[criterionId][criterionEvaluationName]) {
          criterionEvaluationCountsByCriterion[criterionId][criterionEvaluationName] = 1;
        } else {
          // Increment the count if the criterionEvaluationName already exists
          criterionEvaluationCountsByCriterion[criterionId][criterionEvaluationName]++;
        }
      });
    });
    
    // Convert the object to an array
    const criterionEvaluationCountsArray = Object.entries(criterionEvaluationCountsByCriterion).map(([criterionId, countsObj]) => ({
      criterionId,
      criterionName: comments.find(comment => comment.Criterion_Evaluations[0]?.Criterion._id === criterionId)?.Criterion_Evaluations[0]?.Criterion.name || '',
      criterionEvaluationCounts: Object.entries(countsObj).map(([name, count]) => ({
        name,
        count,
      })),
    }));
    
    apiLogger(req, res, JSON.stringify(comments));
    
    return res.send({
      error: false,
      document: comments,
      criterionEvaluationCountsByCriterion: criterionEvaluationCountsArray,
    });
  } catch (error) {
    console.error(error); // In lỗi ra console
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error');
    return next(createError(400, `Lỗi khi tìm kiếm phiếu nhận xét: ${error.message}`));
  }
};



exports.findByYearAndPartyCellExemptionFalse = async (req, res, next) => {
  const { yearfalse, partyCellIds } = req.body;

  if (!yearfalse || !partyCellIds || !Array.isArray(partyCellIds) || partyCellIds.length === 0) {
    apiLogger(req, res, '400! Bad request!', 'error');
    return res.send({
      error: true,
      msg: 'Tham số không hợp lệ hoặc bị thiếu'
    });
  }

  try {
    const comments = await Comment.findAll({
      where: {
        '$Comment.createdAt$': sequelize.where(sequelize.fn('year', sequelize.col('Comment.createdAt')), yearfalse),
        '$Comment.signedBy$': { [Op.not]: null },
        '$Opinion.Recommendation.PartyMember.PartyCell._id$': { [Op.in]: partyCellIds },
        '$Opinion.Recommendation.PartyMember.exemption$': false, // Thêm điều kiện này
      },
      attributes: ['_id', 'note', 'createdAt'],
      include: [
        { model: PartyMember, as: 'CommentedBy', attributes: ['_id', 'name'] },
        { model: PartyMember, as: 'SignedBy', attributes: ['_id', 'name'] },
        {
          model: Opinion,
          attributes: ['_id', 'createdAt'],
          include: {
            model: Recommendation,
            attributes: { exclude: ['partymemberId', 'PartyMemberId', 'updatedAt', 'createdAt'] },
            include: [
              {
                model: PartyMember,
                attributes: ['_id', 'name', 'birthday', 'phone', 'gender', 'code', 'dateJoin', 'dateOfficial', 'exemption'],
                include: [
                  { model: PartyCell, attributes: ['_id', 'name'] },
                  { model: Position, attributes: ['_id', 'name'] },
                  hamletIncludeAllModels
                ]
              },
              { model: PartyMember, as: 'CreatedBy', attributes: ['_id', 'name'] },
              { model: PartyMember, as: 'ConfirmedBy', attributes: ['_id', 'name'] },
              { model: PartyMember, as: 'AcceptedBy', attributes: ['_id', 'name'] },
              {
                model: Detailed_Recommendation,
                attributes: { exclude: ['HamletId', 'createdAt'] },
                include: {
                  model: Hamlet,
                  attributes: ['_id', 'name'],
                  include: wardIncludeAllModels
                }
              }
            ]
          },
        },
        {
          model: Criterion_Evaluation,
          attributes: ['_id', 'name'],
          include: {
            model: Criterion,
            attributes: ['_id', 'name']
          }
        },
      ],
    });

    if (!comments || comments.length === 0) {
      apiLogger(req, res, `Không có phiếu nhận xét cho năm ${yearfalse} và các chi bộ ${partyCellIds.join(', ')}`, 'error');
      return res.send({
        error: true,
        msg: `Không tìm thấy phiếu nhận xét cho năm ${yearfalse} và các chi bộ ${partyCellIds.join(', ')}`
      });
    }

    // Count occurrences of each criterion_evaluation name
    const criterionEvaluationNameCounts = {};
    comments.forEach(comment => {
      comment.Criterion_Evaluations.forEach(criterionEvaluation => {
        const criterionEvaluationName = criterionEvaluation.name;
        criterionEvaluationNameCounts[criterionEvaluationName] = (criterionEvaluationNameCounts[criterionEvaluationName] || 0) + 1;
      });
    });
    const criterionCountsArray = Object.entries(criterionEvaluationNameCounts).map(([name, count]) => ({ name, count }));

apiLogger(req, res, JSON.stringify(comments));

return res.send({
  error: false,
  document: comments,
  criterionEvaluationNameCounts: criterionCountsArray
});

  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error');
    return next(createError(400, `Lỗi khi tìm kiếm phiếu nhận xét`));
  }
};


exports.findByYearAndPartyCellAndMeet = async (req, res, next) => {
  const { yearmeet, partyCellIds } = req.body;

  if (!yearmeet || !partyCellIds || !Array.isArray(partyCellIds) || partyCellIds.length === 0) {
    apiLogger(req, res, '400! Bad request!', 'error');
    return res.send({
      error: true,
      msg: 'Tham số không hợp lệ hoặc bị thiếu'
    });
  }

  try {
    const comments = await Comment.findAll({
      where: {
        '$Comment.createdAt$': sequelize.where(sequelize.fn('year', sequelize.col('Comment.createdAt')), yearmeet),
        '$Comment.signedBy$': { [Op.not]: null },
        '$Opinion.Recommendation.PartyMember.PartyCell._id$': { [Op.in]: partyCellIds },
        // '$Opinion.Recommendation.PartyMember.exemption$': false, // Thêm điều kiện này
      },
      attributes: ['_id', 'note', 'createdAt'],
      include: [
        { model: PartyMember, as: 'CommentedBy', attributes: ['_id', 'name'] },
        { model: PartyMember, as: 'SignedBy', attributes: ['_id', 'name'] },
        {
          model: Opinion,
          attributes: ['_id', 'createdAt'],
          include: {
            model: Recommendation,
            attributes: { exclude: ['partymemberId', 'PartyMemberId', 'updatedAt', 'createdAt'] },
            include: [
              {
                model: PartyMember,
                attributes: ['_id', 'name', 'birthday', 'phone', 'gender', 'code', 'dateJoin', 'dateOfficial', 'exemption'],
                include: [
                  { model: PartyCell, attributes: ['_id', 'name'] },
                  { model: Position, attributes: ['_id', 'name'] },
                  hamletIncludeAllModels
                ]
              },
              { model: PartyMember, as: 'CreatedBy', attributes: ['_id', 'name'] },
              { model: PartyMember, as: 'ConfirmedBy', attributes: ['_id', 'name'] },
              { model: PartyMember, as: 'AcceptedBy', attributes: ['_id', 'name'] },
              {
                model: Detailed_Recommendation,
                attributes: { exclude: ['HamletId', 'createdAt'] },
                include: {
                  model: Hamlet,
                  attributes: ['_id', 'name'],
                  include: wardIncludeAllModels
                }
              }
            ]
          },
        },
        {
          model: Criterion_Evaluation,
          attributes: ['_id', 'name'],
          include: {
            model: Criterion,
            attributes: ['_id', 'name']
          }
        },
      ],
    });

    if (!comments || comments.length === 0) {
      apiLogger(req, res, `Không có phiếu nhận xét cho năm ${year} và các chi bộ ${partyCellIds.join(', ')}`, 'error');
      return res.send({
        error: true,
        msg: `Không tìm thấy phiếu nhận xét cho năm ${year} và các chi bộ ${partyCellIds.join(', ')}`
      });
    }

    const filteredComments = comments.filter(comment => {
      const hasKhongThamGia = comment.Criterion_Evaluations.some(
        evaluation => evaluation.name === 'không tham gia'
      );
      return hasKhongThamGia;
    });

    const criterionEvaluationNameCounts = {};
    filteredComments.forEach(comment => {
      comment.Criterion_Evaluations.forEach(criterionEvaluation => {
        const criterionId = criterionEvaluation.Criterion._id;
        if (!criterionEvaluationNameCounts[criterionId]) {
          criterionEvaluationNameCounts[criterionId] = {
            name: criterionEvaluation.name,
            count: 1,
          };
        } else {
          criterionEvaluationNameCounts[criterionId].count += 1;
        }
      });
    });

    const criterionCountsArray = Object.values(criterionEvaluationNameCounts);

    apiLogger(req, res, JSON.stringify(filteredComments));

    return res.send({
      error: false,
      document: filteredComments,
      criterionEvaluationNameCounts: criterionCountsArray
    });

  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error');
    return next(createError(400, `Lỗi khi tìm kiếm phiếu nhận xét`));
  }
};






