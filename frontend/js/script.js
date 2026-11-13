import { sign } from "node:crypto";

const signupForm=document.getElementById("signupForm");

const message=document.getElementById("message");

signupForm.addEventListener("submit",async(e)=>{
    e.preventDefault();

    const username=document.getElementById("username").value.trim();
    const email=document.getElementById("email").value.trim();
    const password=document.getElementById("password").value.trim();
    const confirmPassword=document.getElementById("confirmPassword").value.trim();

    if(!username|| !email||!password||!confirmPassword){
        showMessage("All fileds are required","red");
        return ;
    }

    if(password.length<8){
        showMessage("the password length should be Min 0f 8","red");

        return ;
    }

    if(password!==confirmPassword){
        showMessage("password doesn;t match","red");
        return;
    }
    const userData={
        username,
        email,
        password
    };

    try {
        const response=await axios.post("http://localhost:5000/api/auth/signup",userData);

        console.log(response.data);
        showMessage(response.data.message,"green");
        signupForm.reset();

    } catch (error) {
        console.log(error);

        showMessage(
            error.response?.data?.message||"something went wrong","red"
        )
    }
    



})

function showMessage(text,color){
    message.textContent=text;
    message.style.color=color;
}