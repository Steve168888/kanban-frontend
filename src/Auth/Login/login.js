const submitBtn = document.getElementById("submitBtn");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");

emailInput.addEventListener("input", () => {
    emailError.innerHTML = "";

    if (/^\d/.test(emailInput.value)) {
		emailInput.value = emailInput.value.replace(/^\d+/, "");
	}
});

emailInput.addEventListener("keydown", (event) => {
    const isNumber = event.key >= "0" && event.key <= "9";
	const isFirstChar = emailInput.selectionStart === 0;

	if (isNumber && isFirstChar) {
		event.preventDefault();
	}
});

passwordInput.addEventListener("input", () => {
    passwordError.innerHTML = "";
});

submitBtn.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    let isValid = true;

    if(email === "") {
        emailError.innerHTML = "Email wajib diisi";
        isValid = false;
    }else if(!email.endsWith("@gmail.com")) {
        emailError.innerHTML = "Email invalid"
        isValid = false;
    }

    if(password === "") {
        passwordError.innerHTML = "Password wajib diisi";
        isValid = false;
    }

    if (!isValid) return;

    loginAPI(email, password);
})

async function loginAPI(email, password) {
    try {
        const response = await fetch("http://localhost:3000/api/v1/account/login", {
            method: "POST",
            headers: {"Content-Type": "application/json" },
            body: JSON.stringify({email, password}),
        });

        const data = await response.json();

        if(!response.ok){
            if(data.errors?.email) emailError.innerHTML = data.errors.email;
            if(data.errors?.password) passwordError.innerHTML = data.errors.password;
            return;
        }

        const token = data.token;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(data.data));

        emailInput.value = "";
        passwordInput.value = "";

        emailError.innerHTML = "";
        passwordError.innerHTML = "";

        Swal.fire({
            icon: "success",
            title: "Login berhasil",
            text: "Selamat datang!",
            confirmButtonText: "OK"
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = "../../Workspace/Boards/boards.html";
            }
        });

    }catch(err) {
        alert("Server error, silahkan coba lagi nanti");
    }
}