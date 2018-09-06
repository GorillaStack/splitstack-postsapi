const jsonwebtoken = require('jsonwebtoken');

const parseArn = arn => {
  const [left, right] = arn.split('/', 2);
  const [,, service, region, accountId, apiId] = left.split(':');
  const [stage, method, resourcePath] = right.split('/');
  return {
    service, region, accountId, apiId, stage, method, resourcePath,
  };
};

module.exports.handler = async event => {
  const token = event.authorizationToken.split(' ')[1];
  
  try {
    const decodedToken = jsonwebtoken.verify(token, process.env.SECRET);
    const { service, region, accountId, apiId, stage } = parseArn(event.methodArn);
    const userId = decodedToken.sub;
    return {
      principalId: userId,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Resource: `arn:aws:${service}:${region}:${accountId}:${apiId}/${stage}/*`,
            Action: ['execute-api:Invoke'],
          },
        ],
      }
    };
  } catch (err) {
    console.error('error validating token', err);
    return {
      principalId: 'unknown',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Deny',
            Resource: '*',
            Action: [],
          },
        ],
      }
    };
  }
};