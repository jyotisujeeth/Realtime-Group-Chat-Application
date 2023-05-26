const express = require('express');

const messageController = require('../controllers/message');
const userAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', userAuth.authenticate, messageController.getMessage);

router.post('/', userAuth.authenticate,  messageController.postMessage);

router.post('/createGroup', userAuth.authenticate, messageController.postGroup);

router.get('/allGroup', userAuth.authenticate, messageController.getAllG);

router.get('/getInvite', userAuth.authenticate, messageController.getInvite);

router.get('/joinGroup', userAuth.authenticate, messageController.getJoinGroup);

router.get('/addUser',userAuth.authenticate, messageController.getAddUser);

router.get('/allUsers', userAuth.authenticate, messageController.getAllU);

router.get('/removeU', userAuth.authenticate, messageController.getRemU);

router.get('/makeA', userAuth.authenticate, messageController.getMakeA);

router.post('/saveFile', userAuth.authenticate, messageController.postSaveFile);

module.exports=router;
