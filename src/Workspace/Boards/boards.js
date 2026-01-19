// ===== AUTH GUARD (PALING ATAS) =====
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "../../Auth/Login/login.html";
}

// ===== TUNGGU HTML SIAP =====
document.addEventListener("DOMContentLoaded", () => {

    const btnCreate = document.getElementById("btnCreate");
    const boardNameInput = document.getElementById("boardName");
    const boardError = document.getElementById("boardError");

    btnCreate.addEventListener("click", () => {
        const name = boardNameInput.value.trim();

        if (name === "") {
        boardError.innerText = "Nama board wajib diisi";
        return;
        }

        boardError.innerText = "";
        createBoardAPI(name);
    });

    boardNameInput.addEventListener("input", () => {
        boardError.innerText = "";
    });

    async function createBoardAPI(name) {
        try {
        const response = await fetch(
            "http://localhost:3000/api/v1/workspace/create-board",
            {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ name }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Gagal membuat board");
            return;
        }

        renderBoard(data.data.name);

        boardNameInput.value = "";
        alert("Membuat board berhasil");

        bootstrap.Modal
            .getInstance(document.getElementById("createBoardModal"))
            .hide();

        } catch (err) {
        alert("Server error, silakan coba lagi nanti");
        console.error(err);
        }
    }

    function renderBoard(name) {
        const boardGrid = document.getElementById("boardGrid");

        const boardHTML = `
        <div class="col-lg-3 col-md-4 col-sm-6">
            <div class="card shadow-sm h-100">
            <div class="card-body d-flex align-items-center justify-content-center py-5">
                <h5 class="mb-0">${name}</h5>
            </div>
            </div>
        </div>
        `;

        boardGrid.insertAdjacentHTML("beforeend", boardHTML);
    }

});
