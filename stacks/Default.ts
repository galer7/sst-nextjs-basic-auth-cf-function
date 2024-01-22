import { NextjsSite, StackContext } from "sst/constructs";

export function Default({ stack, app }: StackContext) {
  const site = new NextjsSite(stack, "Site", {
    path: "packages/web",
    timeout: 60,
  });

  stack.addOutputs({
    SiteUrl: site.url,
  });

  return {
    site,
  };
}
