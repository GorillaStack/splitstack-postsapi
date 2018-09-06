const AWS = require('aws-sdk');
const uuid = require('uuid');
const crypto = require('crypto');

module.exports.handler = async event => {
  const dynamo = new AWS.DynamoDB.DocumentClient();
  const userId = uuid.v4();
  const body = JSON.parse(event.body);

  const salt = crypto.randomBytes(16);
  const password = crypto.pbkdf2Sync(body.password, salt, 100000, 64, 'sha512')
  const item = Object.assign({}, {
    userId,
    name: body.name || 'Test User',
    secret: {
      password,
      salt,
    }
  });
  const result = await dynamo.put({
    Item: item,
    TableName: process.env.USERS_TABLE,
  }).promise();
  delete item.secret;
  return {
    statusCode: 200,
    body: JSON.stringify(item),
  }
};