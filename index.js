// @flow
import type { FieldNode, ValidationContext, ASTVisitor } from "graphql";
import { GraphQLError } from "graphql";

type Whitelist = string[];

const checkWhitelist = (whitelist: Whitelist, node: FieldNode) =>
  whitelist.some(
    item =>
      node.arguments &&
      node.arguments.some(
        ({ value }) => value && value.value && value.value === item
      )
  );

/**
 *  @param {String[]} whitelist, query names to be whitelisted
 *  @returns {Function}
 */
const IntrospectionWhiteList = (whitelist: Whitelist): Function => (
  context: ValidationContext
): ASTVisitor => ({
  Field(node: FieldNode) {
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
});

export default IntrospectionWhiteList;
