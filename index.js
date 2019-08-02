// @flow
import type { FieldNode } from "graphql";
import { GraphQLError } from "graphql";

type Context = {
  reportError: Function
};

type Whitelist = string[];

const checkWhitelist = (whitelist: Whitelist, node: FieldNode) =>
  whitelist.some(
    item =>
      node.arguments &&
      node.arguments.some(
        ({ value }) => value && value.value && value.value === item
      )
  );

const IntrospectionWhiteList = (
  whitelist: Whitelist,
  isEnabled: boolean = true
) => (context: Context) => ({
  Field(node: FieldNode) {
    if (isEnabled) {
      if (node.name.value === "__schema" || node.name.value === "__type") {
        const isWhiteListed = checkWhitelist(whitelist, node);

        if (!isWhiteListed) {
          context.reportError(
            new GraphQLError(
              "GraphQL introspection is not allowed, but the query contained __schema or __type",
              [node]
            )
          );
        }
      }
    }
  }
});

export default IntrospectionWhiteList;
