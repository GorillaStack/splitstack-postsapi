# Split serverless stack - postsapi example

This repository provides an example of using the [serverless framework](https://serverless.com) with split stacks
i.e. splitting the endpoints across multiple stacks.

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
# (optional) set the AWS_PROFILE variable as per the setup of your ~/.aws/credentials file. This file is
# set with a default profile when you run `aws configure` and specify your access key id/secret key

```bash
serverless deploy --stage dev
# you can optionally specify a region with --region <regionname>
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
