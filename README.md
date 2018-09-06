# Split serverless stack - postsapi example

This repository provides an example of using the [serverless framework](https://serverless.com) with split stacks
i.e. splitting the endpoints across multiple stacks.

## Layout

 - `/serverless.yaml` - the base stack (contains API Gateway, authoriser, IAM role and shared path resources)
 - `/api/users/serverless.yaml` - the stack for users management
 - `/api/posts/serverless.yaml` - the stack for posts management

## Deploying

You will need:
 - [nodejs 8.10](https://nodejs.org) or higher
 - an AWS account
 - [the awscli tool](https://aws.amazon.com/cli/)
 - serverless CLI tool installed globally i.e. `npm install -g serverless`

_NOTE:_ It is not recommended to use this example in production - the storage of the JWT encryption secret is
in plaintext, which is not secure.

1. First change the secret in `config.yaml` that is used to sign and verify the token so it is a random string.
2. Install the npm modules

```bash

export AWS_PROFILE=myprofile

npm install
```

3. Deploy the base stack

```bash
# (optional) set the AWS_PROFILE variable as per the setup of your ~/.aws/credentials file. 
# This file is set with a default profile when you run `aws configure` 
# and specify your access key id/secret key

serverless deploy --stage dev
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

## Writing code

We've used the `serverless-webpack` plugin to package code before deploying it. This allows us to store our node modules in the root directory, and only the
ones we require will be deployed by the child stacks. 

We've also configured it externalise the node modules so they don't get
included in the webpack bundle, but instead are copied 'as is'. It also
excludes the aws-sdk module, which is added automatically by AWS Lambda.