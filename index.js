// パッケージ読み込み
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var jwt = require('jsonwebtoken');
var morgan = require('morgan');
var cors = require('cors');
var config = require('./config');
var VerifyToken = require('./app/middlewares/VerifyToken');

var port = process.env.PORT || 8080;

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors());
const { check, validationResult } = require('express-validator/check');

var apiRoutes = express.Router();
app.use('/api', apiRoutes);

apiRoutes.get('/healthcheck', function(req, res){
  res.send('hello world!');
});

apiRoutes.post('/authenticate', [
  check('name').isLength({min: 1}),
  check('password').isLength({ min: 5 })
], function(req, res) {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const users = require('./userDB');
  const result = users.filter(user => user.name == req.body.name);
  if(result[0] == undefined) {
    return res.status(404).send('指定された名前のユーザは存在しません。');
  }
  const user = result[0];
  if(user.password != req.body.password) {
    return res.status(403).send('名前またはパスワードが違います。');
  } else {
    const payload = {
      name: user.name,
      nickname: user.nickname
    }
    var token = jwt.sign(payload, config.secret);
    res.json({
      success: true,
      token: token
    });
  }
});

apiRoutes.get('/me', VerifyToken, function(req, res, next) {
  const users = require('./userDB');
  const user = users.filter(user => user.name == req.decoded.name);

  if (user[0] == undefined) return res.status(404).send("ユーザが見つかりません。");
  const u = user[0];
  const payload = {
    id: u.id,
    name: u.name,
    nickname: u.nickname
  }
  res.status(200).send(payload);
});

app.listen(port);
console.log('サーバを起動しました。http://localhost:' + port);
