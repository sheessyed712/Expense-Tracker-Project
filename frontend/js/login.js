const loginForm=document.getElementById("loginForm");

const message=document.getElementById("message");

const loginButton=document.getElementById("loginButton");

loginForm.addEventListener("submit",async(e)=>{
    e.preventDefault();

    const email=document.getElementById("email").value.trim();
    const password=document.getElementById("password").value;

    if(!email||!password){
        showMessage("please enter the email and password","red")
        return;
    }

    const userData={
        email,
        password
    };

    try {
        const response=await axios.post("http://localhost:5000/api/auth/login",userData);

        console.log("Login res",response.data.message);

        showMessage(response.data.message,"green");
        localStorage.setItem("token", response.data.token); // Save the token in browser

        localStorage.setItem("isPremium", response.data.isPremium);//storing ispremium 
window.location.href = "./expense.html";


    } catch (error) {
        console.log(error);

        if(error.response){
            if(error.response.status===404){
                showMessage("login api not implemented yet","red");
                return ;
            }
            else{
                showMessage(error.response.data.message||"Login failed",
                    "red"
                )
            }

        }
        else{
            showMessage("unable to connect to the server ","red");

        }
    }



});

function showMessage(text,color){
    message.textContent=text;
    message.style.color=color;
}