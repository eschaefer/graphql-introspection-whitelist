// @flow
import type { FieldNode } from "graphql";
import { GraphQLError } from "graphql";

type Context = {
  reportError: Function
};

const IntrospectionWhiteList = (
  whitelist: string[],
  isEnabled: boolean = true
) => (context: Context) => ({
  Field(node: FieldNode) {
    if (isEnabled) {
      if (node.name.value === "__schema" || node.name.value === "__type") {
        const isWhiteListed = whitelist.some(
          item =>
            node.arguments &&
            node.arguments.some(
              ({ value }) => value && value.value && value.value === item
            )
        );

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
