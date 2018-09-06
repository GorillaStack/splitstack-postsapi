const AWS = require('aws-sdk');

module.exports.handler = async event => {
  const dc = new AWS.DynamoDB.DocumentClient();
  let nextToken;
  let items = [];
  do {
    const result = await dc.scan({
      TableName: process.env.POSTS_TABLE,
      ExclusiveStartKey: nextToken,
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
