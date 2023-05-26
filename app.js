const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');

const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/user');
const Chat = require('./models/chat');
const Group = require('./models/group');
const Groupmembers = require('./models/gmember');

const userRoutes = require('./routes/user.js');
const messageRoutes = require('./routes/message');

const sequelize = require('./util/database');

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' }
);

const app = express();
const httpServer = require("http").createServer(app);
const socketio = require("socket.io")
const io = socketio(httpServer);

app.use(cors({
    origin : '*',
    // methods: ['GET', 'POST']
}));
app.use(helmet());
app.use(morgan('combined', { stream: accessLogStream }));
app.use(bodyParser.json());

app.use('/user', userRoutes);
app.use('/message', messageRoutes);

app.use((req, res) => {
    console.log("urlll", req.url);
    res.sendFile(path.join(__dirname, `public/${req.url}`));
});

io.on('connection',socket=>{
    console.log('user connected');
    socket.on('send-chat-message', message => {
        socket.broadcast.emit('chat-message', message)
    });
});
io.on('disconnect', function(){
    console.log('user disconnected');
  });

User.hasMany(Chat);
Chat.belongsTo(User);

User.hasMany(Group);
Group.belongsTo(User);

Group.hasMany(Chat);
Chat.belongsTo(Group);

User.hasMany(Groupmembers);
Groupmembers.belongsTo(User);

Group.hasMany(Groupmembers);
Groupmembers.belongsTo(Group);


sequelize
    .sync()
    // .sync({ force: true })
    .then(res => {
        app.listen(process.env.PORT_DEFAULT, (err) => {
            if (err) console.log(err);
            console.log(`server is listing to :${process.env.PORT}`)
        });
    })
    .catch(err => {
        console.log(err);
    });