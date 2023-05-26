
const Chat = require('../models/chat');
const User = require('../models/user');
const Group = require('../models/group');
const Groupmembers = require('../models/gmember');
const jwt = require('jsonwebtoken');
const s3 = require('../services/S3services');
const formidable = require('formidable');
const path = require('path');
const fs = require('fs');

exports.getMessage = async (req,res,next)=>{
    try{
    const {id} = req.user;
    const lastId = +req.query.lastId || 0;
    const gId = +req.query.gId;

    let mesg = await Chat.findAll({offset: lastId,include: [
        {
          model: User,
          attributes: ['id', 'name']
        }
    ], where: {
       groupId: gId
    }});
    res.status(200).json({mesg});
    } catch(error) {
        console.log(error);
        res.status(500).json({error,success: false});
    }
}

exports.postMessage = async (req,res,next)=>{
    try{
    const {id,name} = req.user;
    const {message} = req.body;
    const gId = req.query.gId;

    const mesg = await Chat.create( {message, userId:id, groupId:gId});
    res.status(200).json({mesg, name});
    } catch(error) {
        console.log(error);
        res.status(500).json({error,success: false});
    }
}

exports.postGroup = async (req,res,next)=>{
    try{
        const { gName } = req.body;
        const { id } = req.user;

        const newGroup = await Group.create({gName,userId:id});
        const nGId =  newGroup.dataValues.id;
        const groupmem = await Groupmembers.create({userId:id, groupId:nGId, isAdmin:true});
        res.status(200).json({newGroup,groupmem,success:true});
    }catch(error){
        console.log(error);
        res.status(500).json({error,success:false});
    }
}

exports.getAllG = async(req,res,next) => {
    try {
        const reqId = req.user.id;
        let allGroup = await Groupmembers.findAll({
            include: [{
                model: Group,
                attributes: ['gName']
            }]
            ,where: {
                userId: reqId
            }
        });
        res.status(200).json({allGroup});
    } catch (error) {
        console.log(error);
        res.status(500).json({error,success:false});
    }
}

function generateAccessToken(id){
    return jwt.sign({id},process.env.TOKEN_SECRET);
}

exports.getInvite = async(req,res,next) => {
    const gId = req.query.gId;
    
    res.status(200).json({
        secretToken: generateAccessToken(gId)
        
    });
}

exports.getJoinGroup = async(req,res,next) => {
    const gId = req.query.gId;
    const uId = req.user.id;
    const groupmem = await Groupmembers.create({userId:uId, groupId:gId,isAdmin:false});
    res.status(200).json({groupmem,success:true});
}

exports.getAddUser = async (req,res,next) => {
    try{
        const by = req.query.by;
        const value = req.query.value;
        const gId = req.query.gId;
        const {id} = req.user;
        const isAdm = await Groupmembers.findOne({where:{userId:id,groupId:gId},attributes:['isAdmin']});
        if(!isAdm.dataValues.isAdmin){
            return res.status(401).json({success:false,error:'Is not admin'});
        } 
        
        let userDetails = null;
        
        if(by=='name'){
            userDetails = await User.findOne({where:{name:value},attributes:['id']});
        } else if(by=='number'){
            userDetails = await User.findOne({where:{number:value},attributes:['id']});
        } else if(by=='email'){
            userDetails = await User.findOne({where:{email:value},attributes:['id']});
        }
   
  
        const uId = userDetails.dataValues.id;
        const groupmem = await Groupmembers.create({userId:uId, groupId:gId,isAdmin:false})
        res.status(201).json({ message: 'User added successfully', groupmem, success:true});

    }
    catch(error){
        console.error(error)
        res.status(500).json({ error: "User doesNot exist", success: false });
       // res.status(200).json({ err: "you are not admin of this group" })
    }
}

exports.getAllU = async (req,res,next)=> {
    try{
        const gId = req.query.gId;
        const allUsers = await Groupmembers.findAll({
            include: [{
                model: User,
                attributes: ['name']
            }],
            where: {groupId:gId},
            attributes: ['userId','isAdmin']
        });
        const uId = req.user.id;
        const reqUserAdmin = await Groupmembers.findOne({
            where: { userId: uId, groupId:gId },
            attributes: ['isAdmin']
        });
        res.status(200).json({allUsers,reqUserAdmin,success:true});
    }catch(error){
        console.log(error);
        res.status(500).json({success:false,error});
    }
}

exports.getRemU = async(req,res,next)=>{
    try{
        const uId = req.query.id;
        const gId = req.query.gId;
        const id = req.user.id;
        const isAdm = await Groupmembers.findOne({where:{userId:id,groupId:gId},attributes:['isAdmin']});
        if(!isAdm.dataValues.isAdmin){
            return res.status(401).json({success:false,error:'Is not admin'});
        }

        const remU = await Groupmembers.destroy({
            where:{groupId:gId,userId:uId}
        });
        res.status(200).json({removed:remU,success:true});
    }catch(error){
        console.log(error);
        res.status(500).json({error,success:false});
    }
}

exports.getMakeA = async(req,res,next)=>{
    try{
        const uId = req.query.id;
        const gId = req.query.gId;
        const id = req.user.id;
        const isAdm = await Groupmembers.findOne({where:{userId:id,groupId:gId},attributes:['isAdmin']});
        if(!isAdm.dataValues.isAdmin){
            return res.status(401).json({success:false,error:'Is not admin'});
        }

        const isAdmi = await Groupmembers.update({isAdmin:true},{
            where:{groupId:gId,userId:uId}
        })
        res.status(200).json({admin:isAdmi,success:true});
    }catch(error){
        console.log(error);
        res.status(500).json({error,success:false});
    }
}

exports.postSaveFile = async(req,res,next)=>{
    try{
        const gId = req.header('groupId');
        const {id,name} = req.user;
        const pathup = path.join(__dirname, '../uploads');
        const form = formidable({ multiples: false,uploadDir : pathup,allowEmptyFiles :false,keepExtensions :true });
        form.parse(req, async(err, fields, files) => {
            if (err) {
                console.log(err);
                return;
            }
            const fileName = `${gId}!File${req.user.id}!File${files.files.originalFilename}`;
            const rawdata = fs.readFileSync(files.files.filepath);
            const fileURL = await s3.uploadToS3(rawdata, fileName);
            const mesg = await Chat.create({
                message:fileURL,
                userId: id,
                groupId: gId
            });
            res.status(200).json({mesg,name,success:true,fileName});
        });

    }catch(error){
        console.error(error);
        res.status(500).json({success:false,error:error.message});
    }
}