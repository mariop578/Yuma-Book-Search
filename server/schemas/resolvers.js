const { User } = require("../models");
const { AuthenticationError } = require("apollo-server-errors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const secret = "we live in a simulation";
const expiration = "2h";

const resolvers = {
  Query: {
    me: async (_, args, context) => {
      if (context.user) {
        return User.findById(context.user._id);
      }
      throw new Error("You need to be logged in!");
    },
  },
  Mutation: {
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new Error("No user found!");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new Error("Incorrect password!");
      }

      const token = jwt.sign({ email, _id: user._id }, secret, {
        expiresIn: expiration,
      });

      return { token, user };
    },

    addUser: async (_, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = jwt.sign({ email, _id: user._id }, secret, {
        expiresIn: expiration,
      });
      return { token, user };
    },

    saveBook: async (_, { book }, context) => {
      if (!context.user) {
        // throw new AuthenticationError("Not logged in!");
        console.log();
      }
      const updatedUser = await User.findOneAndUpdate(
        { _id: context.user._id },
        { $addToSet: { savedBooks: book } },
        { new: true, runValidators: true }
      );
      return updatedUser;
    },

    removeBook: async (_, { bookId }, context) => {
      if (context.user) {
        return User.findByIdAndUpdate(
          context.user._id,
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        );
      }
      throw new Error("Not logged in!");
    },
  },
};

module.exports = resolvers;
