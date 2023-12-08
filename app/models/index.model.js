const { sequelize } = require("../config/index");

// * Define models

const cty_provinceModel = require('./cty_province.model')
const districtModel = require('./district.model')
const wardModel = require('./ward.model')
const hamletModel = require('./hamlet.model')
const partycellModel = require('./partycell.model')
const positionModel = require('./position.model')
const roleModel = require('./role.model')
const permissionModel = require('./permission.model')
const permission_typesModel = require('./permission_type.model')
const partymemberModel = require('./partymember.model')
const accountModel = require('./account.model')
const recommendationModel = require('./recommendation.model')
const detailed_recommendationModel = require('./detailed_recommendation.model')
const opinionModel = require('./opinion.model')
const criterionModel = require('./criterion.model')
const criterion_evaluationModel = require('./criterion_evaluation.model')
const commentModel = require('./comment.model')
const detailed_commentModel = require('./detailed_comment.model')

const Cty_Province = cty_provinceModel(sequelize)
const District = districtModel(sequelize)
const Ward = wardModel(sequelize)
const Hamlet = hamletModel(sequelize)
const PartyCell = partycellModel(sequelize)
const Position = positionModel(sequelize)
const Role = roleModel(sequelize)
const Role_Permission = sequelize.define("Role_Permission", {});
const Permission = permissionModel(sequelize)
const Permission_Types = permission_typesModel(sequelize)
const PartyMember = partymemberModel(sequelize)
const Account = accountModel(sequelize)
const Recommendation = recommendationModel(sequelize)
const Detailed_Recommendation = detailed_recommendationModel(sequelize)
const Opinion = opinionModel(sequelize)
const Criterion = criterionModel(sequelize)
const Criterion_Evaluation = criterion_evaluationModel(sequelize)
const Comment = commentModel(sequelize)
const Detailed_Comment = detailed_commentModel(sequelize)

// * Define relationships

PartyCell.hasMany(PartyMember, {
  foreignKey: "partycellId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
PartyMember.belongsTo(PartyCell, {
  foreignKey: "partycellId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

PartyMember.hasMany(Comment, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})
Comment.belongsTo(PartyMember, {
  foreignKey: "commentedBy",
  as: "CommentedBy",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})

PartyMember.hasMany(Comment, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})
Comment.belongsTo(PartyMember, {
  foreignKey: "signedBy",
  as: "SignedBy",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})

PartyMember.hasMany(Opinion, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
Opinion.belongsTo(PartyMember, {
  foreignKey: "sentBy",
  as: "SentBy",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

PartyMember.hasMany(Opinion, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
Opinion.belongsTo(PartyMember, {
  foreignKey: "buildBy",
  as: "BuildBy",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

PartyMember.hasMany(Recommendation, {
  foreignKey: "partymemberId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Recommendation.belongsTo(PartyMember, {
  foreignKey: "partymemberId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

PartyMember.hasMany(Recommendation, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Recommendation.belongsTo(PartyMember, {
  foreignKey: "createdBy",
  as: "CreatedBy",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

PartyMember.hasMany(Recommendation, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Recommendation.belongsTo(PartyMember, {
  foreignKey: "confirmedBy",
  as: "ConfirmedBy",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

PartyMember.hasMany(Recommendation, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Recommendation.belongsTo(PartyMember, {
  foreignKey: "acceptedBy",
  as: "AcceptedBy",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Recommendation.hasOne(Detailed_Recommendation, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Detailed_Recommendation.belongsTo(Recommendation, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Recommendation.hasOne(Opinion, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Opinion.belongsTo(Recommendation, {
  foreignKey: "recommendationId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Opinion.hasOne(Comment, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})
Comment.belongsTo(Opinion, {
  foreignKey: "opinionId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})

Criterion.hasMany(Criterion_Evaluation, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})
Criterion_Evaluation.belongsTo(Criterion, {
  foreignKey: "criterionId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})

Comment.belongsToMany(Criterion_Evaluation, {
  through: Detailed_Comment,
  foreignKey: "commentId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Criterion_Evaluation.belongsToMany(Comment, {
  through: Detailed_Comment,
  foreignKey: "criterion_evaluationId",
  // as: "Criterion_Evaluation",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Comment.hasMany(Detailed_Comment, {
  foreignKey: 'commentId',
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})
Detailed_Comment.belongsTo(Comment, {
  foreignKey: 'commentId',
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})
Criterion_Evaluation.hasMany(Detailed_Comment, {
  foreignKey: "criterion_evaluationId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})
Detailed_Comment.belongsTo(Criterion_Evaluation, {
  foreignKey: "criterion_evaluationId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})

Hamlet.hasMany(Detailed_Recommendation, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})
Detailed_Recommendation.belongsTo(Hamlet, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})

//one-to-many relationships
Position.hasMany(PartyMember, {
  foreignKey: "positionId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
PartyMember.belongsTo(Position, {
  foreignKey: "positionId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Hamlet.hasMany(PartyMember, {
  foreignKey: "hamletId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
PartyMember.belongsTo(Hamlet, {
  foreignKey: "hamletId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Ward.hasMany(Hamlet, {
  foreignKey: "wardId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Hamlet.belongsTo(Ward, {
  foreignKey: "wardId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

District.hasMany(Ward, {
  foreignKey: "districtId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Ward.belongsTo(District, {
  foreignKey: "districtId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Cty_Province.hasMany(District, {
  foreignKey: "ctyProvinceId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
District.belongsTo(Cty_Province, {
  foreignKey: "ctyProvinceId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Role.hasMany(Account, {
  foreignKey: "roleId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Account.belongsTo(Role, {
  foreignKey: "roleId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Permission_Types.hasMany(Permission, {
  foreignKey: "permissionTypesId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Permission.belongsTo(Permission_Types, {
  foreignKey: "permissionTypesId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Role.belongsToMany(Permission, {
  through: Role_Permission,
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Permission.belongsToMany(Role, {
  through: Role_Permission,
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

PartyMember.hasOne(Account, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Account.belongsTo(PartyMember, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

//* Sync

Position.sync();
Cty_Province.sync();
District.sync();
Ward.sync();
Hamlet.sync();
Permission_Types.sync();
Permission.sync();
Role.sync();
PartyCell.sync();
PartyMember.sync();
Account.sync();
Role_Permission.sync();
Recommendation.sync();
Detailed_Recommendation.sync();
Opinion.sync();
Criterion.sync();
Criterion_Evaluation.sync();
Comment.sync();
Detailed_Comment.sync();

module.exports = {
  Position,
  Cty_Province,
  District,
  Ward,
  Criterion,
  Criterion_Evaluation,
  Permission,
  Role,
  PartyMember,
  Account,
  Role_Permission,
  Permission_Types,
  Recommendation,
  Detailed_Recommendation,
  Opinion,
  Comment,
  Detailed_Comment,
  Hamlet,
  PartyCell
};
