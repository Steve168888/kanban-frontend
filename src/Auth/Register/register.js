const submitBtn = document.getElementById("submitBtn");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const nameError = document.getElementById("nameError");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");

nameInput.addEventListener("input", () => {
	nameError.innerHTML = "";
});

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
	const name = nameInput.value.trim();
	const email = emailInput.value.trim();
	const password = passwordInput.value.trim();

	let isValid = true;

	if (name === "") {
		nameError.innerHTML = "Nama wajib diisi";
		isValid = false;
	}

	if (email === "") {
		emailError.innerHTML = "Email wajib diisi";
		isValid = false;
	}else if (!email.endsWith("@gmail.com")) {
		emailError.innerHTML = "Email harus menggunakan @gmail.com";
		isValid = false;
	}else if (email === "@gmail.com"){
		emailError.innerHTML = "Email tidak boleh hanya @gmail.com"
		isValid = false;
	}

	if (password === "") {
		passwordError.innerHTML = "Password wajib diisi";
		isValid = false;
	}else if (password.length < 5) {
		passwordError.innerHTML = "Password minimal 5 karakter";
		isValid = false;
	}


	  if (!isValid) return;

	registerAPI(name, email, password);
});

async function registerAPI(name, email, password) {
    try {
        const response = await fetch("http://localhost:3000/api/v1/account/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

		const data = await response.json();

		if (!response.ok) {
			if (data.errors?.name) nameError.innerHTML = data.errors.name;
			if (data.errors?.email) emailError.innerHTML = data.errors.email;
			if (data.errors?.password) passwordError.innerHTML = data.errors.password;
			return;
		}

		nameInput.value = "";
		emailInput.value = "";
		passwordInput.value = "";

		nameError.innerHTML = "";
		emailError.innerHTML = "";
		passwordError.innerHTML = "";

		alert("Register berhasil");

    } catch (err) {
        alert("Server error, silakan coba lagi nanti");
        console.error(err);
    }
}
