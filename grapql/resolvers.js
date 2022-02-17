const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');

module.exports = {
    createUser: async ({ userInput }, req) => {
        const errors = []
        if (!validator.isEmail(userInput.email)) {
            errors.push({ message: 'Invalid email' })
        }

        if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 5 })) {
            errors.push({ message: 'Password too short' })
        }

        if (errors.length) {
            const error = new Error('Invalid input');
            error.data = errors;
            error.code = 422;
            throw error;
        }

        const existingUser = await User.findOne({ email: userInput.email });
        if (existingUser) {
            const error = new Error('User already exists!');
            throw error;
        }
        const hashedPW = await bcrypt.hash(userInput.password, 12);
        const user = new User({
            email: userInput.email,
            name: userInput.name,
            password: hashedPW,
        });

        const createdUser = await user.save();
        return {
            ...createdUser._doc,
            _id: createdUser._id.toString()
        }
    },

    login: async ({ email, password }) => {
        const user = await User.findOne({ email });

        if (!user) {
            const error = new Error('Invalid username or password');
            error.code = 401;
            throw error;
        }
        const isaMatch = await bcrypt.compare(password, user.password);
        if (!isaMatch) {
            const error = new Error('Invalid username or password');
            error.code = 401;
            throw error;
        }

        const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email
            }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' }
        );

        return {
            token,
            userId: user._id.toString()
        }
    },

    createPost: async ({ postInput }, req) => {
        if (!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        const errors = []
        if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 3 })) {
            errors.push({ message: 'Title must be atleast 3 characters long' })
        }
        if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 })) {
            errors.push({ message: 'Post content must be atleast 5 characters long' })
        }
        if (errors.length) {
            const error = new Error('Invalid input');
            error.data = errors;
            error.code = 422;
            throw error;
        }

        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('Invalid user');
            error.data = errors;
            error.code = 401;
            throw error;
        }

        const post = new Post({
            title: postInput.title,
            content: postInput.content,
            imageUrl: postInput.imageUrl,
            creator: user
        });

        const createdPost = await post.save();

        return {
            ...createdPost._doc,
            _id: createdPost._id,
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString(),
        }
    },

    getPosts: async ({ page }) => {
        const currentPage = page || 1,
          itemsPerPage = 3;
        let totalItems = 0;

        try {
            totalItems = await Post.find().countDocuments();
            const Posts = await Post.find()
                            .sort({ createdAt: -1 })
                            .populate('creator')
                            .skip((currentPage - 1) * itemsPerPage)
                            .limit(itemsPerPage);

            return {
                posts: Posts,
                total_items: totalItems
            }
        } catch (e) {
            const error = new Error(e.message);
            error.code = 401;
            throw error;
        }
        
    },

    getPost: async ({ id }) => {
        const post = await Post.findById(id).populate('creator');
        if (!post) {
            const error = new Error('Post not found');
            error.code = 401;
            throw error;
        }
        return {
            ...post._doc,
            _id: post._id.toString(),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString()
        }
    },

    updatePost({ id, updateData }) {
        let postFound;
        return Post.findById(id).populate('creator')
            .then(post => {
                if (!post) {
                    const error = new Error('Post update failed');
                    error.code = 401;
                    throw error;
                }
                post.title = updateData.title;
                post.content = updateData.content;

                if (updateData.imageUrl && (post.imageUrl !== updateData.imageUrl)) {
                    post.imageUrl = updateData.imageUrl;
                }
                postFound = post;
                return post.save()
            })
            .then(res => {
                return {
                    ...post._doc,
                    _id: post._id.toString(),
                    createdAt: post.createdAt.toISOString(),
                    updatedAt: post.updatedAt.toISOString()
                }
            })
            .catch(e => {
                const error = new Error('Post update failed');
                error.code = 401;
                throw error;
            });
    }
};
