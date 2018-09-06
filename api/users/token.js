const jsonwebtoken = require('jsonwebtoken');
const AWS = require('aws-sdk');
const crypto = require('crypto');

const errorResponse = (statusCode, message) => ({
  statusCode,
  body: JSON.stringify({
    message,
  })
})

module.exports.handler = async event => {
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return errorResponse(400, 'bad body');
  }

  if (!body.userId || !body.password) {
    return errorResponse(400, 'missing userId or password');
  }

  const dc = new AWS.DynamoDB.DocumentClient();
  const result = await dc.get({
    TableName: process.env.USERS_TABLE,
    Key: {
      userId: body.userId,
    },
  }).promise();
  if (!result.Item) {
    return errorResponse('unknown user');
  }
  const { salt, password } = result.Item.secret;
  const verify = crypto.pbkdf2Sync(body.password, salt, 100000, 64, 'sha512');
  if (verify.equals(password)) {
    const token = jsonwebtoken.sign({ sub: body.userId }, process.env.SECRET, { expiresIn: '7 days' });
    return {
      statusCode: 200,
      body: JSON.stringify({
        token
      }),
    }
  } else {
    return errorResponse(401, 'bad password');
  }

};