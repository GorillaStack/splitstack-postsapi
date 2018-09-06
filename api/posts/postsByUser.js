const AWS = require('aws-sdk');

module.exports.handler = async event => {
  const dc = new AWS.DynamoDB.DocumentClient();
  let nextToken;
  let items = [];
  do {
    const result = await dc.query({
      TableName: process.env.POSTS_TABLE,
      ExclusiveStartKey: nextToken,
      IndexName: 'userId',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': event.requestContext.authorizer.principalId,
      },
    }).promise();
    nextToken = result.LastEvaluatedKey;
    const retrieved = result.Items.map(item => ({
      postId: item.postId,
      text: item.text,
    }));
    items = items.concat(retrieved);
  } while (nextToken);

  return {
    statusCode: 200,
    body: JSON.stringify(items),
  };
};
