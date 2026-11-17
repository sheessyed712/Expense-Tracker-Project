const form=document.getElementById("forgotForm");
const message =document.getElementById("message")

form.addEventListener("submit",async(e)=>{
    e.preventDefault();

    try {
        
        const email=document.getElementById("email").value.trim();
        
        const response=await axios.post("http://localhost:5000/password/forgotpassword",{email})
        console.log(response.data.message);

        message.textContent=response.data.message||"reset email sent check you inbox ";

        message.style.color="green";

    } catch (error) {
        console.log(error);
        message.textContent=error.response?.data?.message||"failed to send the rest email ";
        message.style.color="red";
        
    }

})