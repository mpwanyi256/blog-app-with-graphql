const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.get('Authorization');

    if (!token) {
        req.isAuth = false;
        return next();
    }

    let decordedToken;

    try {
        decordedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch(err) {
        req.isAuth = false;
        return next();
    }

    if (!decordedToken) {
        req.isAuth = false;
        return next();
    }
    req.userId = decordedToken.userId;
    req.email = decordedToken.email;
    req.isAuth = true;

    next();
};
