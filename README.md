# Split serverless stack - postsapi example

This repository provides an example of using the [serverless framework](https://serverless.com) with split stacks
i.e. splitting the CloudFormation resources across multiple stacks.

It is the accompaniment for the [blog post found here](https://www.gorillastack.com/news/splitting-your-serverless-framework-api-on-aws) explaining how to split serverless stacks.

## Layout

 - `/serverless.yaml` - the base stack (contains API Gateway, authoriser, IAM role and shared path resources)
 - `/api/users/serverless.yaml` - the stack for users management
 - `/api/posts/serverless.yaml` - the stack for posts management

## Deploying

You will need:
 - [nodejs 12](https://nodejs.org) or higher
 - an AWS account
 - [the awscli tool](https://aws.amazon.com/cli/)
 - serverless CLI tool (either installed globally i.e. `npm install -g serverless` or locally)

_NOTE:_ It is not recommended to use this example in production - the storage of the JWT encryption secret is
in plaintext, which is not secure. As an exercise, consider re-implementing using AWS Systems Manager Parameter Store to store the secret and then retrieving it upon startup :-)

Steps:
1. First change the secret in `config.yaml` that is used to sign and verify the token so it is a random string.
2. Install the npm modules

```bash
npm install
```

3. Deploy the base stack

```bash
# (optional) set the AWS_PROFILE variable as per the setup of your ~/.aws/credentials file. 
# This file is set with a default profile when you previously run `aws configure` and specified 
# your access key id and secret key
export AWS_PROFILE=myprofile # or 'Set-Item env:AWS_PROFILE myprofile' in Powershell

serverless deploy --stage dev

# you can also run `npm bin`/serverless in bash/zsh to pick up the locally installed copy
```

4. Change into the subdirectories and deploy the other stacks (using the same
   stage name):

```bash
cd api/users
serverless deploy --stage dev

cd ../../

cd api/posts
serverless deploy --stage dev
```

## Usage

(Not all the endpoints from the blog post are implemented, but a basic flow is possible.)

Once you've deployed the API, you should get the endpoints printed to the console by serverless e.g.:

```
.......................................
Serverless: Stack update finished...
Service Information
service: postsapi-users
stage: test
region: us-east-1
stack: postsapi-users-test
api keys:
  None
endpoints:
  POST - https://2398u2d9oa.execute-api.us-east-1.amazonaws.com/test/token
  POST - https://2398u2d9oa.execute-api.us-east-1.amazonaws.com/test/users
functions:
  token: postsapi-users-test-token
  usersCreate: postsapi-users-test-usersCreate
```

Replace the endpoint in the following examples (all are using [curl](https://curl.haxx.se/docs/manpage.html), but [Postman](https://www.getpostman.com/) or a similar API testing tool is recommended).

__Create User__

```
> curl -XPOST -d '{ "name": "Chris", "password": "TeSTPassWOrd" }' https://2398u2d9oa.execute-api.us-east-1.amazonaws.com/test/users`

{"userId":"d861a56e-802e-472b-8daf-3005bb2092f3","name":"Chris"}
```

__Get Token__

```
> curl -XPOST -d '{ "userId": "d861a56e-802e-472b-8daf-3005bb2092f3", "password": "TeSTPassWOrd" }' https://2398u2d9oa.execute-api.us-east-1.amazonaws.com/test/token

{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkODYxYTU2ZS04MDJlLTQ3MmItOGRhZi0zMDA1YmIyMDkyZjMiLCJpYXQiOjE1MzYyMTg3ODAsImV4cCI6MTUzNjgyMzU4MH0.j7exIrL-Y88KnhRn9WA7AWGMRPna8Ib3t42jEpSN7T4"}
```

__Write Post__

```
> curl -XPOST -d '{ "text": "This is my extra interesting and short blog post." }' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkODYxYTU2ZS04MDJlLTQ3MmItOGRhZi0zMDA1YmIyMDkyZjMiLCJpYXQiOjE1MzYyMTg3ODAsImV4cCI6MTUzNjgyMzU4MH0.j7exIrL-Y88KnhRn9WA7AWGMRPna8Ib3t42jEpSN7T4' https://2398u2d9oa.execute-api.us-east-1.amazonaws.com/test/posts

{"postId":"b47f126a-5a1c-4a3e-b1be-dcafaaaac7f6","userId":"d861a56e-802e-472b-8daf-3005bb2092f3","text":"This is my extra interesting and short blog post."}
```

__List Posts__

(try creating another user and adding posts as them first - the API should
filter them out)

```
> curl -XGET https://2398u2d9oa.execute-api.ap-southeast-2.amazonaws.com/test/posts

[{"postId":"b47f126a-5a1c-4a3e-b1be-dcafaaaac7f6","text":"This is my extra interesting and short blog post."}]
```

__List posts by user__

```
> curl -XGET -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkODYxYTU2ZS04MDJlLTQ3MmItOGRhZi0zMDA1YmIyMDkyZjMiLCJpYXQiOjE1MzYyMTg3ODAsImV4cCI6MTUzNjgyMzU4MH0.j7exIrL-Y88KnhRn9WA7AWGMRPna8Ib3t42jEpSN7T4' https://2398u2d9oa.execute-api.us-east-1.amazonaws.com/test/users/me/posts

[{"postId":"b47f126a-5a1c-4a3e-b1be-dcafaaaac7f6","userId":"d861a56e-802e-472b-8daf-3005bb2092f3","text":"This is my extra interesting and short blog post."}]
```

## Writing code

We've used the [serverless-webpack](https://github.com/serverless-heaven/serverless-webpack) plugin to package code 
before deploying it. This permits us to store our node modules in the root directory and not require a package.json
per child-stack. An additional benefit is that only the node modules we require in the code will 
be deployed by the child stacks (no dev dependencies are deployed unless they are require'd through the lambda
entry points!).

We've also configured it externalise the node modules so they don't get
included in the webpack bundle, but instead are copied 'as is'. It
excludes the aws-sdk module, which is added automatically by AWS Lambda.

NodeJS 12 is used, so its possible to use async/await along with destructuring and other fancy ES6 features. A side effect of using serverless-webpack too is that it is possible to use the babel-loader with webpack to bring in experimental features
or newer JavaScript syntax. See the [serverless webpack website](https://github.com/serverless-heaven/serverless-webpack)
for more details.

