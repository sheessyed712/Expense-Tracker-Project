const signupForm=document.getElementById("signupForm");

const message=document.getElementById("message");

signupForm.addEventListener("submit",(e)=>{
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

    showMessage("Registration successfull","green");

    console.log({
        username,
        email,
        password
    });



})

function showMessage(text,color){
    message.textContent=text;
    message.style.color=color;
}