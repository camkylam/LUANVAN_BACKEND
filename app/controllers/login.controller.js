
const { apiLogger } = require('../../logger')
const { Account } = require('../models/index.model');
const crypto = require('crypto');

const encryptionKey = '12345678912345678901234567890121';
const iv = '0123456789abcdef';

const setEncrypt = (value) => {
  if (value.length === 0) {
    return '';
  } else {
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
};

exports.login = async (req, res) => {
  const { user_name, password } = req.body;

  try {
    const encryptedUserName = setEncrypt(user_name);
    const encryptedPassword = setEncrypt(password);

    const account = await Account.findOne({
      where: {
        user_name: encryptedUserName,
        password: encryptedPassword
      },
      include: [
        {
          model: Role,
          attributes: ["name", "_id"],
        },
      ],
    });

    apiLogger(req, res, 'Account ' + JSON.stringify(account))

    if (account) {
      // Đăng nhập thành công
      const token = account._id
      apiLogger(req, res, 'Login successfully')
      res.json({ success: true, message: 'Login successful', token });
    } else {
      // Sai tên người dùng hoặc mật khẩu
      apiLogger(req, res, 'Login fail. 404', 'error')
      res.json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    apiLogger(req, res, error, 'error')
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
