const { Recommendation, Detailed_Recommendation, PartyMember, Ward, Hamlet, PartyCell, Position, District, Cty_Province } = require("../models/index.model.js");
const createError = require("http-errors");
const { sequelize } = require("../config/index");
const { apiLogger } = require("../../logger.js");
const moment = require('moment');
const { hamletIncludeAllModels } = require('./hamlet.controller.js');
const { wardIncludeAllModels } = require("./ward.controller.js");
const { Op } = require("sequelize");

const optionNotNull = {
  [Op.not]: null
}
const optionIsNull = {
  [Op.is]: null
}

exports.create = async (req, res, next) => {
  const { partymemberId, createdBy, hamletId, exemption } = req.body;
  if (!partymemberId || !createdBy || !hamletId || !exemption) {
    apiLogger(req, res, '400! Bad request!', 'error')
    return res.send({
      error: true,
      msg: 'Missing params'
    })
  }

  let newRecommendationId = ''
  const t = await sequelize.transaction()
  try {
    // Check if partymember existed
    const partymember = await PartyMember.findOne({
      where: {
        _id: partymemberId
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
    const hamlet = await Hamlet.findOne({
      where: {
        _id: hamletId
      }
    })
    if (!hamlet) {
      apiLogger(req, res, '404! Hamlet not found!', 'error')
      return res.send({
        error: true,
        msg: `Không tìm được khu vực/ấp`
      })
    }
    // Add data
    // * State 1
    const newRecommendation = await Recommendation.create({
      partymemberId: partymemberId,
      createdBy: createdBy,
    }, { transaction: t })

    // * State 2
    newRecommendationId = newRecommendation._id
    const details = await Detailed_Recommendation.create({
      RecommendationId: newRecommendationId,
      HamletId: hamletId,
      exemption: exemption || false
    }, { transaction: t })

    await t.commit();

    return res.send({
      error: false,
      msg: `Bạn đã tạo thành công thư giới thiệu`,
      document: {
        recommendation: newRecommendation,
        details: details
      }
    });
  } catch (error) {
    await t.rollback()
    apiLogger(req, res, error, 'error')
    return res.send({
      error: true,
      msg: `Không thể tạo thư giới thiệu. Lối ở bước ${(newRecommendationId !== '') ? '2' : '1'}.`,
    });
  }
}

exports.findOneByPartymember = async (req, res, next) => {
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
      where: { _id: partymemberId }
    })
    if (!partymember) {
      apiLogger(req, res, '404! Partymember not found!', 'error')
      return res.send({
        error: true,
        msg: `Không tìm được đảng viên`
      })
    }

    // Find recommendation
    const recommendation = await Recommendation.findOne({
      where: { partymemberId: partymemberId },
      attributes: { exclude: ['partymemberId', 'PartyMemberId'] },
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
      ],
      order: [
        ['createdAt', 'DESC'],
      ]
    });

    if (!recommendation) {
      apiLogger(req, res, `No recommendation for ${partymemberId} - ${partymember?.name}`, 'error')
      return res.send({
        error: true,
        msg: `No recommendation for ${partymemberId} - ${partymember?.name}`
      })
    }
    else {
      const recommendationStatus = (recommendation.acceptedAt) ? 'accepted' : ((recommendation.confirmedAt) ? 'confirmed' : 'created')
      apiLogger(req, res, JSON.stringify(recommendation))
      return res.send({
        error: false,
        document: recommendation,
        recommendationStatus
      })
    }
  } catch (error) {
    apiLogger(req, res, error, 'error')
    return next(createError(400, `Error finding recommendation of partymember ${partymemberId}!`));
  }
};

exports.findAllByPartymember = async (req, res, next) => {
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
      where: {
        _id: partymemberId
      }
    })
    if (!partymember) {
      apiLogger(req, res, '404! Partymember not found!', 'error')
      return res.send({
        error: true,
        msg: `Không tìm được đảng viên`
      })
    }

    // Find all recommendations
    const recommendations = await Recommendation.findAll({
      where: { partymemberId: partymemberId },
      attributes: { exclude: ['partymemberId', 'PartyMemberId'] },
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
          include: { model: Hamlet, attributes: ['_id', 'name'], include: wardIncludeAllModels }
        }
      ],
      order: [
        ['createdAt', 'DESC']
      ]
    });

    if (!recommendations) {
      apiLogger(req, res, `No recommendation for ${partymemberId} - ${partymember?.name}`)
      return res.send({
        error: false,
        msg: `No recommendation for ${partymemberId} - ${partymember?.name}`
      })
    }
    else {
      apiLogger(req, res, JSON.stringify(recommendations))
      return res.send({
        error: false,
        document: recommendations
      })
    }
  } catch (error) {
    apiLogger(req, res, error, 'error')
    return next(createError(400, `Error finding recommendations of partymember ${partymemberId}!`));
  }
};

exports.findAllByStatus = async (req, res, next) => {
  const { status, wardId, hamletId } = req.body;
  if (!status || (!wardId && !hamletId)) {
    apiLogger(req, res, '400! Bad request!', 'error')
    return res.send({
      error: true,
      msg: 'Missing params'
    })
  }

  let statusOptions = []
  if (status.includes('accepted'))
    statusOptions.push({ [Op.and]: { acceptedBy: optionNotNull, confirmedBy: optionNotNull } })
  if (status.includes('confirmed'))
    statusOptions.push({ [Op.and]: { acceptedBy: optionIsNull, confirmedBy: optionNotNull } })
  if (status.includes('created'))
    statusOptions.push({ [Op.and]: { acceptedBy: optionIsNull, confirmedBy: optionIsNull } })

  let whereOption = {}
  if (hamletId)
    whereOption = {
      [Op.and]: {
        [Op.or]: statusOptions,
        '$Detailed_Recommendation.Hamlet._id$': hamletId
      }
    }
  else
    whereOption = {
      [Op.and]: {
        [Op.or]: statusOptions,
        '$Detailed_Recommendation.Hamlet.Ward._id$': wardId
      }
    }

  try {
    const recommendations = await Recommendation.findAll({
      where: whereOption,
      attributes: { exclude: ['PartyMemberId', 'partymemberId'] },
      include: [
        {
          model: PartyMember,
          attributes: ['_id', 'name', 'email', 'gender', 'code', 'birthday', 'address', 'phone', 'dateJoin', 'dateOfficial', 'exemption'],
          include: [
            {
              model: PartyCell,
              attributes: ['_id', 'name'],
            },
            {
              model: Hamlet,
              attributes: ['_id', 'name'],
              include: wardIncludeAllModels
            },
          ]
        },
        {
          model: Detailed_Recommendation,
          include: hamletIncludeAllModels
        }
      ]
    })

    return res.send({
      error: false,
      document: recommendations
    })
  }
  catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return res.send({
      error: true,
      msg: error
    })
  }
}

exports.update = async (req, res, next) => {
  const { recommendationId, confirmedBy, acceptedBy, hamletId } = req.body;
  if (!recommendationId) {
    apiLogger(req, res, '400! Bad request!', 'error')
    return res.send({
      error: true,
      msg: 'Missing params'
    })
  }
  if (!confirmedBy && !acceptedBy && !reception) {
    apiLogger(req, res, '400! Bad request, nothing to update.', 'error')
    return res.send({
      error: true,
      msg: 'Missing params'
    })
  }

  const t = await sequelize.transaction()
  try {
    // Check if recommendation existed
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
    else {
      // Update data
      state = '1'
      const confirmedAt = (!confirmedBy) ? undefined : moment().format("YYYY-MM-DD HH:mm:ss", moment.now).toString()
      const acceptedAt = (!acceptedBy) ? undefined : moment().format("YYYY-MM-DD HH:mm:ss", moment.now).toString()
      await Recommendation.update(
        {
          confirmedBy: undefined || confirmedBy,
          confirmedAt: confirmedAt,
          acceptedBy: undefined || acceptedBy,
          acceptedAt: acceptedAt
        },
        {
          where: {
            _id: recommendationId,
          },
        },
        { transaction: t }
      )

      const document = await Recommendation.findOne({
        where: {
          _id: recommendationId
        },
        include: [
          {
            model: PartyMember,
            as: 'CreatedBy',
            attributes: ['_id', 'name']
          },
          {
            model: PartyMember,
            as: 'ConfirmedBy',
            attributes: ['_id', 'name']
          },
          {
            model: PartyMember,
            as: 'AcceptedBy',
            attributes: ['_id', 'name']
          },
          {
            model: Detailed_Recommendation
          }
        ]
      })

      await t.commit()

      apiLogger(req, res, 'Update recommendation successfully')
      return res.send({
        error: false,
        msg: `Bạn đã cập nhật thành công thư giới thiệu`,
        document: document
      })
    }
  }
  catch (error) {
    await t.rollback()
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error')
    return res.send({
      error: true,
      msg: `Không thể cập nhật thư giới thiệu.`,
    });
  }
};


exports.findById = async (req, res, next) => {
  const recommendationId = req.params.id;

  if (!recommendationId) {
    apiLogger(req, res, '400! Bad request!', 'error');
    return res.send({
      error: true,
      msg: 'Missing params',
    });
  }

  try {
    // Check if recommendation exists
    const recommendation = await Recommendation.findOne({
      where: {
        _id: recommendationId,
      },
      include: [
        {
          model: PartyMember,
          attributes: ['_id', 'name', 'birthday', 'phone', 'gender','code', 'dateJoin', 'dateOfficial', 'exemption'],
          include: [
            { model: PartyCell, attributes: ['_id', 'name'] },
            { model: Position, attributes: ['_id', 'name'] },
            hamletIncludeAllModels
          ]
        },
        {
          model: PartyMember,
          as: 'CreatedBy',
          attributes: ['_id', 'name'],
        },
        {
          model: PartyMember,
          as: 'ConfirmedBy',
          attributes: ['_id', 'name'],
        },
        {
          model: PartyMember,
          as: 'AcceptedBy',
          attributes: ['_id', 'name'],
        },
        {
          model: Detailed_Recommendation,
          include: {
            model: Hamlet,
            include: wardIncludeAllModels,
          },
        },
      ],
    });

    if (!recommendation) {
      apiLogger(req, res, `No recommendation found for ID: ${recommendationId}`, 'error');
      return res.send({
        error: true,
        msg: `No recommendation found for ID: ${recommendationId}`,
      });
    } else {
      const recommendationStatus = recommendation.acceptedAt
        ? 'accepted'
        : recommendation.confirmedAt
        ? 'confirmed'
        : 'created';
      apiLogger(req, res, JSON.stringify(recommendation));
      return res.send({
        error: false,
        document: recommendation,
        recommendationStatus,
      });
    }
  } catch (error) {
    apiLogger(req, res, error, 'error');
    return next(createError(400, `Error finding recommendation with ID: ${recommendationId}!`));
  }
};


exports.findPartyMembersWithoutRecommendationByPartyCell = async (req, res, next) => {
  try {
    const { partyCellIds } = req.body;

    if (!partyCellIds || !Array.isArray(partyCellIds) || partyCellIds.length === 0) {
      apiLogger(req, res, '400! Bad request! Missing or invalid partyCellIds', 'error');
      return res.status(400).send({
        error: true,
        msg: 'Missing or invalid partyCellIds',
      });
    }

    // Find all party members in the specified PartyCells
    const partyMembers = await PartyMember.findAll({
      attributes: ['_id', 'name', 'email','birthday', 'phone', 'gender', 'code', 'dateJoin', 'dateOfficial', 'exemption'],
      include: [
        { model: PartyCell, attributes: ['_id', 'name'], where: { _id: partyCellIds } },
        { model: Position, attributes: ['_id', 'name'] },
        hamletIncludeAllModels,
        {
          model: Recommendation,
          attributes: ['_id'],
          required: false, // Use 'required: false' for a left join
        },
      ],
    });

    // Filter party members without recommendations
    const partyMembersWithoutRecommendation = partyMembers.filter((partyMember) => {
      return !partyMember.Recommendations || partyMember.Recommendations.length === 0;
    });

    return res.send({
      error: false,
      document: partyMembersWithoutRecommendation,
    });
  } catch (error) {
    apiLogger(req, res, error, 'error');
    return next(createError(500, 'Error finding party members without recommendation by PartyCell!'));
  }
};

///////Tìm thư giới thiệu chưa được chấp nhận theo chi bộ và theo trạng thái (truyền mảng)
exports.findAllByStatusWithPartycell = async (req, res, next) => {
  const { status, partyCellId } = req.body;
  if (!status || !partyCellId) {
    apiLogger(req, res, '400! Bad request!', 'error');
    return res.send({
      error: true,
      msg: 'Missing params',
    });
  }

  let statusOptions = [];
  if (status.includes('accepted'))
    statusOptions.push({ [Op.and]: { acceptedBy: { [Op.not]: null }, confirmedBy: { [Op.not]: null } } });
  if (status.includes('confirmed'))
    statusOptions.push({ [Op.and]: { acceptedBy: { [Op.is]: null }, confirmedBy: { [Op.not]: null } } });
  if (status.includes('created'))
    statusOptions.push({ [Op.and]: { acceptedBy: { [Op.is]: null }, confirmedBy: { [Op.is]: null } } });

  try {
    const recommendations = await Recommendation.findAll({
      where: {
        [Op.and]: [
          { [Op.or]: statusOptions },
          { '$PartyMember.PartyCell._id$': { [Op.in]: partyCellId } },
        ],
      },
      attributes: { exclude: ['PartyMemberId', 'partymemberId'] },
      include: [
        {
          model: PartyMember,
          attributes: ['_id', 'name', 'gender', 'code', 'birthday', 'address', 'phone', 'dateJoin', 'dateOfficial', 'exemption'],
          include: [
            {
              model: PartyCell,
              attributes: ['_id', 'name'],
            },
            {
              model: Hamlet,
              attributes: ['_id', 'name'],
              include: wardIncludeAllModels,
            },
          ],
        },
        {
          model: Detailed_Recommendation,
          include: hamletIncludeAllModels,
        },
      ],
    });

    return res.send({
      error: false,
      document: recommendations,
    });
  } catch (error) {
    apiLogger(req, res, `${JSON.stringify(error)}`, 'error');
    return res.send({
      error: true,
      msg: error,
    });
  }
};






