const login = document.getElementById('login');
login.addEventListener('submit', onSubmit);
const email = document.getElementById('email');
const password = document.getElementById('password');

function onSubmit(e) {
    e.preventDefault();

    const loginObject = {
        email: email.value,
        password: password.value
    }
    console.log(loginObject)
    axios.post('http://13.51.72.83:5000/user/login', loginObject)
        .then((response) => {
            console.log(response)
            alert(response.data.message);
            localStorage.setItem('token',response.data.token);
            localStorage.setItem('userId',response.data.userId);
            window.location.href='../html/chatApp.html';
        })
        .catch((err) => {
            console.log(err);
            alert("Email Does Not Exist")
            document.body.innerHTML += `<div style="color:red;">${err.message} <div>`;
            document.body.innerHTML += err + `<button onclick="window.location.href = '../html/login.html'">Reload</button>`
        });
}