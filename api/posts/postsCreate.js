const uuid = require('uuid');
const AWS = require('aws-sdk');

const errorResponse = (statusCode, message) => ({
  statusCode,
  body: JSON.stringify({
    message,
  })
});

module.exports.handler = async event => {
  let body;
  try {
    body = JSON.parse(event.body)
  } catch (err) { return errorResponse(400, 'bad body'); }

  if (!body.text) {
    return errorResponse(400, 'expected text')
  }

  const item = {
    postId: uuid.v4(),
    userId: event.requestContext.authorizer.principalId,
    text: body.text,
  };

  const dc = new AWS.DynamoDB.DocumentClient();
  await dc.put({
    Item: item,
    TableName: process.env.POSTS_TABLE,
  }).promise();
  return {
    statusCode: 200,
    body: JSON.stringify(item),
  }
};