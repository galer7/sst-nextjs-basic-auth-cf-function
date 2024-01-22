import { NextjsSite, StackContext } from "sst/constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";

const basicAuthFunctionCode = `function handler(event) {
  // do not block OPTIONS requests
  if (event.request.method === 'OPTIONS') {
    return event.request;
  }
  var authHeaders = event.request.headers.authorization;
  // TODO: Read from secrets
  // echo -n 'user:pass' | base64
  var expected = 'Basic dXNlcjpwYXNz';
  if (authHeaders && authHeaders.value === expected) {
    return event.request;
  }
  var response = {
    statusCode: 401,
    statusDescription: 'Unauthorized',
    headers: {
      'www-authenticate': {
        value: 'Basic realm="Credentials, please"',
      },
    },
  };
  return response;
}`;

export function Default({ stack, app }: StackContext) {
  const BASIC_AUTH_FN_NAME = `basicAuth-${app.stage}`;

  const basicAuth = new cloudfront.CfnFunction(stack, BASIC_AUTH_FN_NAME, {
    name: BASIC_AUTH_FN_NAME,
    functionCode: basicAuthFunctionCode,
    functionConfig: {
      comment: "basic comment",
      runtime: "cloudfront-js-1.0",
    },
    autoPublish: true,
  });

  const basicAuthFn = cloudfront.Function.fromFunctionAttributes(
    stack,
    `${BASIC_AUTH_FN_NAME}Ref`,
    {
      functionArn: basicAuth.attrFunctionArn,
      functionName: BASIC_AUTH_FN_NAME,
    }
  );

  const site = new NextjsSite(stack, "Site", {
    path: "packages/web",
    timeout: 60,
    cdk: {
      distribution: {
        defaultBehavior: {
          functionAssociations: [
            {
              eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
              function: basicAuthFn,
            },
          ],
        },
      },
    },
  });

  stack.addOutputs({
    SiteUrl: site.url,
  });

  return {
    site,
  };
}
