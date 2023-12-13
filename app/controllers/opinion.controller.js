const { Opinion, Recommendation, Detailed_Recommendation, PartyMember, Hamlet, PartyCell, Position } = require("../models/index.model.js");
const createError = require("http-errors");
const { sequelize } = require("../config/index");
const { apiLogger } = require("../../logger.js");
const { hamletIncludeAllModels } = require('./hamlet.controller.js');
const { wardIncludeAllModels } = require("./ward.controller.js");

exports.create = async (req, res, next) => {
  const { buildBy, recommendationId } = req.body;
  if (!buildBy || !recommendationId) {
    apiLogger(req, res, '400! Bad request!', 'error')
    return res.send({
      error: true,
      msg: 'Missing params'
    })
  }

  const t = await sequelize.transaction()
  try {
    // Check if partymember existed
    const partymember = await PartyMember.findOne({
      where: {
        _id: buildBy
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

    // Check if hamlet existed
    const recommendation = await Recommendation.findOne({
      where: {
        _id: recommendationId
      }
    })
    if (!recommendation) {
      apiLogger(req, res, '404! Recommendation not found!', 'error')
      return res.send({
        error: true,
        msg: `Không tìm được thư giới thiệu`
      })
    }

    // Add data
    const newOpinion = await Opinion.create({
      recommendationId: recommendationId,
      buildBy: buildBy,
    }, { transaction: t })

    await t.commit();

    return res.send({
      error: false,
      msg: `Bạn đã tạo thành công phiếu xin ý kiến`,
      document: newOpinion
    });
  } catch (error) {
    await t.rollback()
    apiLogger(req, res, error, 'error')
    return res.send({
      error: true,
      msg: `Không thể tạo phiếu xin ý kiến.`,
    });
  }
}


exports.update = async (req, res, next) => {
  const { opinionId, sentBy } = req.body;

  if (!opinionId) {
    apiLogger(req, res, '400! Bad request!', 'error');
    return res.send({
      error: true,
      msg: 'Missing params'
    });
  }

  const t = await sequelize.transaction();

  try {
    // Check if commentId exists
    const opinion = await Opinion.findOne({
      where: { _id: opinionId },
      attributes: ['_id', 'buildBy', 'sentBy']
    });

    if (!opinion) {
      apiLogger(req, res, '404! Comment not found!', 'error');
      return res.send({
        error: true,
        msg: `Không tìm thấy phiếu xin ý kiến`
      });
    }

    // Check if partymember exists
    if (sentBy) {
      const partymember = await PartyMember.findOne({
        where: {
          _id: sentBy
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
    const updatedOpinion = await Opinion.update(
      {
        sentBy: sentBy || opinion.sentBy
      },
      { where: { _id: opinionId } },
      { transaction: t }
    );

    await t.commit();
    apiLogger(req, res, 'Update recommendation successfully');
    return res.send({
      error: false,
      msg: 'Bạn đã cập nhật phiếu xin ý kiến',
      document: updatedOpinion  // Fix this line to use updatedOpinion instead of updatedComment
    });
  } catch (error) {
    await t.rollback();
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error');
    return next(createError(400, `Error updating comments`));
  }
}


// * Tìm kiếm thư xin ý kiến về partymemberId
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

    // Find opinion
    const opinions = await Opinion.findAll({
      where: {
        '$Recommendation.PartyMember._id$': partymemberId
      },
      attributes: ['_id', 'createdAt'],
      include: [
        { model: PartyMember, as: 'SentBy', attributes: ['_id', 'name'] },
        { model: PartyMember, as: 'BuildBy', attributes: ['_id', 'name'] },
        {
          model: Recommendation,
          attributes: { exclude: ['partymemberId', 'PartyMemberId', 'updatedAt'] },
          include: [
            {
              model: PartyMember,
              attributes: ['_id', 'name', 'birthday', 'phone', 'gender', 'code','dateJoin', 'dateOfficial', 'exemption'],
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
        }
      ],
      order: [['createdAt', 'DESC'],]
    })

    if (!opinions || opinions.length == 0) {
      apiLogger(req, res, `No opinion for ${partymemberId} - ${partymember?.name}`, 'error')
      return res.send({
        error: true,
        msg: `Không tìm được phiếu xin ý kiến về đảng viên ${partymemberId} - ${partymember?.name}`
      })
    }

    apiLogger(req, res, opinions.length + ' results')
    return res.send({
      error: false,
      document: opinions
    })
  }
  catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return next(createError(400, `Error finding opinion of partymember ${partymemberId}!`));
  }
};

exports.delete = async (req, res, next) => {
  const opinionId = req.params.id
  if (!opinionId) {
    apiLogger(req, res, '400! Bad request!', 'error')
    return res.send({
      error: true,
      msg: 'Missing params'
    })
  }

  try {
    const result = await Opinion.destroy({
      where: { _id: opinionId }
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
      msg: `Không thể xóa phiếu xin ý kiến`
    })
  }
}

exports.deleteAll = async (req, res, next) => {
  try {
    const t = await sequelize.transaction()
    const result = await Opinion.destroy({}, { transaction: t })
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
      msg: `Không thể xóa toàn bộ phiếu xin ý kiến`
    })
  }
}



exports.findById = async (req, res, next) => {
  const opinionId = req.params.id;

  if (!opinionId) {
    apiLogger(req, res, '400! Bad request!', 'error');
    return res.send({
      error: true,
      msg: 'Missing params'
    });
  }

  try {
    // Find opinion by ID
    const opinion = await Opinion.findOne({
      where: { _id: opinionId },
      attributes: ['_id', 'createdAt'],
      include: [
        { model: PartyMember, as: 'SentBy', attributes: ['_id', 'name'] },
        { model: PartyMember, as: 'BuildBy', attributes: ['_id', 'name'] },
        {
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
        }
      ],
    });

    if (!opinion) {
      apiLogger(req, res, '404! Opinion not found!', 'error');
      return res.send({
        error: true,
        msg: `Không tìm thấy phiếu xin ý kiến với ID ${opinionId}`
      });
    }

    apiLogger(req, res, `Found opinion with ID ${opinionId}`);
    return res.send({
      error: false,
      document: opinion
    });
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error');
    return next(createError(400, `Error finding opinion with ID ${opinionId}`));
  }
};



// Tìm kiếm tất cả phiếu nhận xét theo id thư giới thiệu
exports.findAllOpinionsByRecommendation = async (req, res, next) => {
  const recommendationId = req.body.recommendationId;  // Assuming recommendationId is in the request body

  if (!recommendationId) {
    apiLogger(req, res, '400! Bad request!', 'error');
    return res.send({
      error: true,
      msg: 'Missing params'
    });
  }

  try {
    // Check if recommendation exists
    const recommendation = await Recommendation.findOne({
      where: { _id: recommendationId }
    });

    if (!recommendation) {
      apiLogger(req, res, '404! Recommendation not found!', 'error');
      return res.send({
        error: true,
        msg: `Không tìm được thư giới thiệu ${recommendationId}`
      });
    }

    // Find all opinions for the specified recommendation
    const opinions = await Opinion.findAll({
      where: { recommendationId: recommendationId },
      attributes: ['_id', 'createdAt'],
      include: [
        { model: PartyMember, as: 'SentBy', attributes: ['_id', 'name'] },
        {
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
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!opinions || opinions.length === 0) {
      apiLogger(req, res, `No opinions found for recommendation ${recommendationId}`, 'error');
      return res.send({
        error: true,
        msg: `Không tìm được phiếu nhận xét cho thư giới thiệu ${recommendationId}`
      });
    }

    // Modify the response to include the additional models and attributes
    const modifiedOpinions = opinions.map(opinion => {
      const modifiedRecommendation = opinion.Recommendation.toJSON();
      // Include additional models and attributes here
      return {
        ...opinion.toJSON(),
        Recommendation: modifiedRecommendation,
      };
    });

    apiLogger(req, res, `${modifiedOpinions.length} results`);
    return res.send({
      error: false,
      document: modifiedOpinions
    });
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error');
    return next(createError(400, `Error finding opinions for recommendation ${recommendationId}!`));
  }
};


