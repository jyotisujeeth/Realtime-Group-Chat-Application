const inputSend = document.getElementById('input-send');
const token = localStorage.getItem('token');
const sendMsg = document.getElementById('send-msg');
const messagesUl = document.getElementById('messages-list');
const box11 = document.getElementById('box11');
let totalMsg = null;
let activeGroup = null;
let setIntId = null;
const inviteBtn = document.getElementById('invite-btn');
const addUserBtn = document.getElementById('add-user-btn');
const usersList = document.getElementById('users-list');
const usersBox = document.getElementById('users-box');

const socket = io('http://13.51.72.83:5000');
socket.on('connect',()=>{
    console.log(socket.id);
});

socket.on('chat-message', data => {
    getAllMsg(data);
});

inputSend.addEventListener('submit',(e)=>{
    e.preventDefault();

    let inputSendObj = { message: sendMsg.value }

    axios.post(`http://13.51.72.83:5000/message?gId=${activeGroup}`,inputSendObj, { headers: {'Authorization': token}} )
    .then((response) => {
        socket.emit('send-chat-message', activeGroup);
        addNewLineElement(response.data.mesg,response.data.name,response.data.mesg.userId);
        sendMsg.value = '';
    }).catch((err) => {
        console.error(err);
    });

});

function addNewLineElement(data,nameParam,idParam) {
    const li = document.createElement('h4');
    const loginId = localStorage.getItem('userId');
    if(idParam==loginId){
        li.className = 'msg-right';
    } else {
        li.className = 'msg-left';
    }

    li.appendChild(
        document.createTextNode( nameParam + ': ' + data.message + ' ')
    );
    messagesUl.appendChild(li);
}

async function getAllMsg(gId){
    try{
        const allM = await axios.get(`http://13.51.72.83:5000/message?lastId=${totalMsg}&gId=${gId}`, { headers: {'Authorization': token}} );
        const arr = allM.data.mesg;
        if(arr.length>0){
            totalMsg = totalMsg + arr.length;
            arr.forEach(element => {
                addNewLineElement(element, element.user.name, element.userId);
            });
        }
    }catch(err){
        console.error(err);
    }
}

window.addEventListener('DOMContentLoaded', async()=>{
    try{
        const allG = await axios.get('http://13.51.72.83:5000/message/allGroup', { headers: {'Authorization': token}} );
        const arrG = allG.data.allGroup;
        const allGDiv = document.getElementById('all-groups');
        arrG.forEach(ele=>{

            const li = document.createElement('input');
            li.type = 'button';
            li.value = `${ele.group.gName}`;
            li.addEventListener('click',async()=>{
                inviteBtn.setAttribute('hidden','hidden');
                addUserBtn.setAttribute('hidden','hidden');
                activeGroup = ele.groupId;
                box11.removeAttribute('hidden');
                usersBox.removeAttribute('hidden');
                if(ele.isAdmin){
                    inviteBtn.removeAttribute('hidden');
                    addUserBtn.removeAttribute('hidden');
                }
                messagesUl.innerHTML='';
                // clearInterval(setIntId);
                const allM = await axios.get(`http://13.51.72.83:5000/message?gId=${activeGroup}`, { headers: {'Authorization': token}} );
                const arr = allM.data.mesg;
                totalMsg = arr.length;
                arr.forEach(element => {
                    addNewLineElement(element, element.user.name, element.userId);
                });
                const allU = await axios.get(`http://13.51.72.83:5000/message/allUsers?gId=${activeGroup}`, { headers: {'Authorization': token}});
                const arr2 = allU.data.allUsers;
                usersList.innerHTML='';
                arr2.forEach(elem=>{
                    addNewUserElement(elem,allU.data.reqUserAdmin.isAdmin,ele.userId);
                })
                // setIntId = setInterval(getAllMsg, 2000);
            })
            allGDiv.appendChild(li);
        })

    }catch(err){
        console.error(err);
    }
});

const cGroupBtn = document.getElementById('create-group-btn');
const cGroupForm = document.getElementById('create-Group-Form');
const cGroupDiv = document.getElementById('create-Group-Div');
cGroupBtn.onclick = function(){
    cGroupDiv.removeAttribute('hidden');

}

cGroupForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const gName = document.getElementById('new-Group-Name');
   
    let gNameObj = { gName:gName.value };

    axios.post('http://13.51.72.83:5000/message/createGroup', gNameObj, { headers: {'Authorization': token}})
    .then((response) => {
        window.location.reload();
    }).catch((err) => {
        console.error(err);
    });
});

inviteBtn.addEventListener('click', async()=>{
    const inputInvite = document.getElementById('invite-link')
    inputInvite.removeAttribute('hidden');
    const inviteLink = await axios.get(`http://13.51.72.83:5000/message/getInvite?gId=${activeGroup}`, { headers: {'Authorization': token}});
    const secretToken = inviteLink.data.secretToken;
    inputInvite.value = `${secretToken}`;
});

const joinGroupBtn = document.getElementById('join-group-btn');
joinGroupBtn.addEventListener('click',()=>{
    const joinGroupDiv = document.getElementById('join-group-div');
    joinGroupDiv.removeAttribute('hidden');
});

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

const joinGroupFrom = document.getElementById('join-group-form');
joinGroupFrom.addEventListener('submit',async(e)=>{
    e.preventDefault();
    const tokenInput = document.getElementById('join-group-input');
    const decodeToken = parseJwt(tokenInput.value);
    const id = +decodeToken.id;
    const joinRes = await axios.get(`http://13.51.72.83:5000/message/joinGroup?gId=${id}`, { headers: {'Authorization': token}});
    if(joinRes.status==200) window.location.reload();
});

addUserBtn.addEventListener('click', ()=>{
    document.getElementById('add-user-div').removeAttribute('hidden');
});

const addUserForm = document.getElementById('add-user-form');
addUserForm.addEventListener('submit',async (e)=>{
    e.preventDefault();
    const addUserBy = document.getElementById('add-user-by').value;
    const addUserValue = document.getElementById('add-user-value').value;
    const addUserRes = await axios.get(`http://13.51.72.83:5000/message/addUser?by=${addUserBy}&value=${addUserValue}&gId=${activeGroup}`, { headers: {'Authorization': token}});
});

function addNewUserElement(ele,isAd,presentUId){
    const li = document.createElement('h4');
    li.appendChild(document.createTextNode(ele.user.name));
    if(isAd){

        if(presentUId !== ele.userId){
            const remBtn = document.createElement('button');
            remBtn.innerHTML = 'X';
            remBtn.title = 'Remove User';
            remBtn.addEventListener('click', async () => {
                console.log('remBtn>>',ele.userId);
                const removed = await axios.get(`http://13.51.72.83:5000/message/removeU?id=${ele.userId}&gId=${activeGroup}`, { headers: {'Authorization': token}});
                window.location.reload();
            })
            li.appendChild(remBtn);
        }
        if(ele.isAdmin){
            const alreadyAdmin = document.createElement('h6').appendChild(document.createTextNode('is Admin'));
            li.appendChild(alreadyAdmin);
        } else {
            const makeAdmin = document.createElement('button');
            makeAdmin.innerHTML = 'Make Admin';
            makeAdmin.addEventListener('click', async ()=>{
                console.log('makeAdmin',ele.userId);
                const admined = await axios.get(`http://13.51.72.83:5000/message/makeA?id=${ele.userId}&gId=${activeGroup}`, { headers: {'Authorization': token}});
                window.location.reload();
            })
            li.appendChild(makeAdmin);
        }
    }
    usersList.appendChild(li);
}

const fileInput = document.getElementById('send-file-form');
fileInput.addEventListener('submit',async(e)=>{
    e.preventDefault();
    console.log('clicked');
    const selectedFile = document.getElementById('send-file');

    const formData = new FormData();
    for(let i =0; i < selectedFile.files.length; i++) {
        formData.append("files", selectedFile.files[i]);
    }

    fetch("http://13.51.72.83:5000/message/saveFile", {
        method: 'POST',
        body: formData,
        headers: {
          "Authorization":token,
          "groupId": activeGroup
        }
    })
    .then(response=>{
        socket.emit('send-chat-message',activeGroup);
        addNewLineElement(response.data.mesg,response.data.name,response.data.mesg.userId);
    }).catch(err=>{
        console.error(err);
    });
});
