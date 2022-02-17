const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const { graphqlHTTP } = require('express-graphql');

const graphQlSchema = require('./grapql/schema');
const graphQlResolver = require('./grapql/resolvers');
const auth = require('./middleware/isAuthenticated');

require('dotenv').config({ path: './.env' })

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, `${new Date().toISOString()}-${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (['image/png', 'image/jpg', 'image/jpeg'].includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const app = express();
app.use(bodyParser.json());

app.use((req, res, next) => {
    // HANDLE CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
    multer({ storage: fileStorage, fileFilter })
    .single('image')
);

app.use(auth);

app.use('/graphql', graphqlHTTP({
    schema: graphQlSchema,
    rootValue: graphQlResolver,
    graphiql: true,
    customFormatErrorFn(err) {
        if (!err.originalError) {
            return err;
        }
        const data = err.originalError.data,
              message = err.message || 'An error occured',
              code = err.code || 500;

        return { message, status: code, data }
    }
}));

mongoose
    .connect(
        `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@restapiwithmongo.spews.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
    )
    .then(client => {
        app.listen(8080);
    })
    .catch(e => {
        console.log('Failed to connect to server', e);
    });
