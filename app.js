//socket
/*const notification = require("./app/controllers/notification.controller");
const {
  Notification,
  Event,
  Customer_Event,
} = require("./app/models/index.model");*/

const createError = require("http-errors");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const bcrypt = require("bcryptjs");
const moment = require("moment"); //socket
const cron = require("node-cron"); //len lich
const nodemailer = require("nodemailer"); //
const { encrypt } = require("./app/config/crypto")
const { logger } = require('./logger')

require('dotenv').config();
const { Account, Role, PartyMember, Permission } = require("./app/models/index.model");

// initialize
const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

//socket
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

const sendMail = async (email, name, age) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "camkylam@gmail.com",
      pass: "leredylwvtxcphvx",
    },
  });
  await transporter.sendMail(mailOptions);
};

server.listen(3000, () => {
  console.log(`Server is listening on port`);
  logger.info('Server start')
});

// config path
const pathPublic = path.join(__dirname, "./app/public");
app.use("/public", express.static(pathPublic));

// simple route
app.get("/", (req, res, next) => {
  return res.send({
    message: "Chào mừng đến với hệ thống quản lý đảng viên sinh hoạt nơi cư trú",
  });
});

// handles before https methods
const convertToLowercase = (req, res, next) => {
  for (let key in req.body) {
    if (typeof req.body[key] === "string") {
      req.body[key] = req.body[key].toLowerCase();
    }
  }
  next();
};
app.use(convertToLowercase);

// create admin account
const createAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      where: {
        user_name: encrypt('admin')
      }
    })

    if (account == null) {
      logger.info('Create admin accounts')
      const username = 'admin'
      const password = 'admin'
      const hashedPassword = await bcrypt.hash(password, 10);
      await Account.create({
        user_name: username,
        password: hashedPassword,
      });
    }
    next();
  }
  catch (error) {
    logger.error(`${JSON.stringify(error)}`)
    next();
  }
};

app.use(createAccount);

// Add routes

const PositionRouter = require("./app/routes/position.route");
const Cty_ProvinceRouter = require("./app/routes/cty_Province.route");
const DistrictRouter = require("./app/routes/district.route");
const WardRouter = require("./app/routes/ward.route");
const HamletRouter = require("./app/routes/hamlet.route");
const CriterionRouter = require('./app/routes/criterion.route')
const CriterionEvaluationRouter = require('./app/routes/criterion_evaluation.route')
const PermissionRouter = require("./app/routes/permission.route");
const RoleRouter = require("./app/routes/role.route");
const PartyMemberRouter = require("./app/routes/partymember.route");
const AccountRouter = require("./app/routes/account.route");
const RecommendationRouter = require("./app/routes/recommendation.route")
const OpinionRouter = require("./app/routes/opinion.route")
const CommentRouter = require("./app/routes/comment.route")
const Role_PermissionRouter = require("./app/routes/role_permission.route");
const PartyCellRouter = require("./app/routes/partycell.route")
const MailRouter = require("./app/routes/mail.route");
const LoginRouter = require("./app/routes/login.route");
const permissionTypesRouter = require("./app/routes/permission_types.route");

app.use("/api/positions", PositionRouter);
app.use("/api/cty_provinces", Cty_ProvinceRouter);
app.use("/api/districts", DistrictRouter);
app.use("/api/wards", WardRouter);
app.use("/api/hamlets", HamletRouter)
app.use("/api/criterion", CriterionRouter)
app.use("/api/evaluation", CriterionEvaluationRouter)
app.use("/api/permissions", PermissionRouter);
app.use("/api/roles", RoleRouter);
app.use("/api/partymembers", PartyMemberRouter);
app.use("/api/accounts", AccountRouter);
app.use("/api/role_permissions", Role_PermissionRouter);
app.use("/api/recommendation", RecommendationRouter)
app.use("/api/opinion", OpinionRouter)
app.use("/api/comment", CommentRouter)
app.use("/api/mail", MailRouter);
app.use("/api/login", LoginRouter);
app.use("/api/permission_types", permissionTypesRouter);
app.use("/api/partycells", PartyCellRouter);

app.use((req, res, next) => {
  return next(createError(404, "Resource Not Found"));
});

app.use((err, req, res, next) => {
  return res.status(err.statusCode || 500).json({
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
