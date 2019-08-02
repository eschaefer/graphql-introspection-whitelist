import * as graphql from "graphql";
import express from "express";
import request from "supertest";
import bodyParser from "body-parser";
import { ApolloServer } from "apollo-server-express";

import introspectionWhitelist from "./index";

const schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType({
    name: "Query",
    fields: {
      hello: {
        type: graphql.GraphQLString,
        resolve() {
          return Promise.resolve("world");
        }
      }
    }
  })
});

describe("introspectionWhitelist validation rule", function() {
  it("by default, disallows queries with __schema", function() {
    const query = graphql.parse("{ __schema { queryType { name } } }");
    const validationErrors = graphql.validate(schema, query, [
      introspectionWhitelist([])
    ]);
    return expect(validationErrors[0].message).toMatch(
      /introspection is not allowed/
    );
  });

  it("by default, disallows queries with __type", function() {
    const query = graphql.parse('{ __type(name: "Query"){ name } }');
    const validationErrors = graphql.validate(schema, query, [
      introspectionWhitelist([])
    ]);
    return expect(validationErrors[0].message).toMatch(
      /introspection is not allowed/
    );
  });

  it("allows valid queries that do not contain __schema or __type", function() {
    const query = graphql.parse("{ hello }");
    const validationErrors = graphql.validate(schema, query, [
      introspectionWhitelist([])
    ]);
    return expect(validationErrors.length).toEqual(0);
  });

  it("allows whitelisted query", function() {
    const query = graphql.parse('{ __type(name: "Another"){ name } }');

    let validationErrors = graphql.validate(schema, query, [
      introspectionWhitelist(["Special", "Another"])
    ]);

    return expect(validationErrors.length).toEqual(0);
  });

  it("fails if actual query is not a whitelisted one", function() {
    const query = graphql.parse('{ __type(name: "Bad"){ name } }');

    let validationErrors = graphql.validate(schema, query, [
      introspectionWhitelist(["Special", "Another", "Good"])
    ]);

    return expect(validationErrors[0].message).toMatch(
      /introspection is not allowed/
    );
  });

  describe("works with Apollo Server", function() {
    const app = express();
    const server = new ApolloServer({
      schema: schema,
      validationRules: [introspectionWhitelist([])]
    });

    app.use("/graphql", bodyParser.json());

    server.applyMiddleware({ app });

    it("disables introspection using __schema", function() {
      const req = request(app)
        .post("/graphql")
        .send({
          query: "{ __schema { queryType { name } } }"
        });

      return req.then(function(result) {
        return expect(result.body.errors[0].message).toMatch(
          /introspection is not allowed/
        );
      });
    });

    it("disables introspection using __type", function() {
      const req = request(app)
        .post("/graphql")
        .send({
          query: '{ __type(name: "Query") { name } }'
        });

      return req.then(function(result) {
        return expect(result.body.errors[0].message).toMatch(
          /introspection is not allowed/
        );
      });
    });

    it("allows other valid queries through", function() {
      const req = request(app)
        .post("/graphql")
        .send({
          query: "{ hello }"
        });

      return req.then(function(result) {
        return expect(result.body).toEqual({ data: { hello: "world" } });
      });
    });
  });
});
