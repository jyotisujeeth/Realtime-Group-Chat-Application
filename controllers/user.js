const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.postUser = async (req, res, next) => {
    try {
        const {name,email,password,number} = req.body;

        let userExist = await User.findAll({where: {email}});
        if(!userExist.length){
            userExist = await User.findAll({where: {number}});
        }
        
        if(userExist && userExist.length){
            res.status(207).json({ message: 'User already exist, Please Login' });
        } else {
            bcrypt.hash(password, 10, async (err, hash) => {
                if(err) console.log(err);
                await User.create({ name, email, number, password: hash });
                return res.status(201).json({ message: 'User Signup successful' });
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err });
    }
};

function generateAccessToken(id,name){
    return jwt.sign({id,name},process.env.TOKEN_SECRET);
}

exports.postLogin = async (req, res, next) => {
    try {
        const email = req.body.email;
        const loginPassword = req.body.password;

        const userExist = await User.findOne({ where: { email } });
        
        if (userExist) {
            bcrypt.compare(loginPassword, userExist.dataValues.password, (err, result) => {
                if (err) {
                    throw new Error('Something went wrong');
                }
                if (result) {
                    res.status(200).json({ message: 'User logged in successfully', 
                    success: true, 
                    token: generateAccessToken(userExist.dataValues.id, userExist.dataValues.name),
                    userId:userExist.dataValues.id
                    })
                } else {
                    res.status(401).json({ error: "User not authorized. Wrong password", success: false });
                }
            })
        } else {
            res.status(404).json({ error: "User doesnot exist. Try with different email", success: false });
        }
    } catch (err) {
        res.status(500).json({ error: err, success: false })
    }
}