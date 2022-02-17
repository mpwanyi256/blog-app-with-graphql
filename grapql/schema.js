const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type Post {
        _id: ID
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }

    type User {
        _id: ID!
        name: String!
        password: String
        status: String!
        posts: [Post!]
    }

    type AuthData {
        token: String!
        userId: String!
    }

    type PostsReturnData {
        posts: [Post]!
        total_items: Int!
    }

    input UserInputData {
        email: String!
        name: String!
        password: String!
    }

    input PostInputData {
        title: String!
        content: String!
        imageUrl: String
    }

    type rootQuery {
        login(email: String!, password: String!): AuthData!
        getPosts(page: Int!): PostsReturnData!
        getPost(id: ID): Post!
    }

    type rootMutation {
        createUser(userInput:UserInputData): User!
        createPost(postInput: PostInputData!): Post!
        updatePost(id: ID!, updateData: PostInputData!): Post!
    }

    schema {
        mutation: rootMutation
        query: rootQuery
    }
`);
