// AUTH GUARD
const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "../../Auth/Login/login.html";
}

// DOM READY
document.addEventListener("DOMContentLoaded", () => {

    // GLOBAL STATE
    let selectedBoardId = null;

    // DOM ELEMENTS
    const boardGrid = document.getElementById("boardGrid");

    // create board
    const btnCreate = document.getElementById("btnCreate");
    const boardNameInput = document.getElementById("boardName");
    const boardError = document.getElementById("boardError");

    // edit board
    const editBoardModalEl = document.getElementById("editBoardModal");
    const editBoardNameInput = document.getElementById("editBoardName");
    const editBoardError = document.getElementById("editBoardError");
    const btnUpdateBoard = document.getElementById("btnUpdateBoard");

    // USER INFO
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
        document.querySelector("#userName").innerText = user.name;
    }



    // API FUNCTIONS
    async function loadBoards() {
        try {
        boardGrid.innerHTML = "";

        const response = await fetch(
            "http://localhost:3000/api/v1/workspace/get-allboard",
            {
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            }
        );

        const data = await response.json();
        if (!response.ok) {
            Swal.fire({
                icon: "error",
                title: "Gagal memuat board",
                text: data.message || "Tidak dapat mengambil data board",
            });
            return;
        }

        data.data.forEach(board => {
            renderBoard(board._id, board.name);
        });

        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Server error",
                text: "Terjadi kesalahan saat memuat board",
            });
        }
    }

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
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: data.message || "Gagal membuat board",
            });
            return;
        }

        renderBoard(data.data._id, data.data.name, "top");
        boardNameInput.value = "";

        bootstrap.Modal
            .getInstance(document.getElementById("createBoardModal"))
            .hide();
        
        Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: "Board berhasil dibuat",
            timer: 1500,
            showConfirmButton: false,
        });

        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Terjadi kesalahan server",
            });
        }
    }

    async function updateBoard() {
        const newName = editBoardNameInput.value.trim();
        if (!newName) {
        editBoardError.innerText = "Nama board wajib diisi";
        return;
        }

        try {
            const response = await fetch(
                `http://localhost:3000/api/v1/workspace/update-board/${selectedBoardId}`,
                {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ name: newName }),
                }
            );

            if (!response.ok) {
                Swal.fire({
                    icon: "error",
                    title: "Gagal",
                    text: "Board gagal diupdate",
                });
                return;
            }

            const card = document.querySelector(
                `.card[data-id="${selectedBoardId}"]`
            );
            card.querySelector(".board-name").innerText = newName;

            bootstrap.Modal.getInstance(editBoardModalEl).hide();

            Swal.fire({
                icon: "success",
                title: "Berhasil",
                text: "Board berhasil diupdate",
                timer: 1500,
                showConfirmButton: false,
            });

        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Terjadi kesalahan server",
            });
        }
    }

    async function deleteBoard(boardId, cardEl) {
        try {
            const response = await fetch(
                `http://localhost:3000/api/v1/workspace/delete-board/${boardId}`,
                {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                }
            );

            if (!response.ok) {
                Swal.fire({
                    icon: "error",
                    title: "Gagal",
                    text: "Board gagal dihapus",
                });
                return;
                }

                cardEl.closest(".col-lg-3").remove();

            Swal.fire({
                icon: "success",
                title: "Berhasil",
                text: "Board berhasil dihapus",
                timer: 1500,
                showConfirmButton: false,
            });

        } catch (err) {
            Swal.fire({
            icon: "error",
            title: "Error",
            text: "Terjadi kesalahan server",
            });
        }
    }

    // RENDER FUNCTIONS
    function renderBoard(id, name, position = "bottom") {
        const html = `
            <div class="col-lg-3 col-md-4 col-sm-6">
                <div class="card shadow-sm h-100" data-id="${id}">
                <div class="card-body position-relative">

                    <div class="dropdown position-absolute top-0 end-0 m-2">
                    <button class="btn btn-sm" data-bs-toggle="dropdown">⋮</button>
                    <ul class="dropdown-menu">
                        <li><button class="dropdown-item btn-update">Update</button></li>
                        <li><button class="dropdown-item btn-delete text-danger">Delete</button></li>
                    </ul>
                    </div>

                    <div class="d-flex justify-content-center py-5">
                    <h5 class="board-name">${name}</h5>
                    </div>

                </div>
                </div>
            </div>
            `;
        if (position === "top") {
            boardGrid.insertAdjacentHTML("afterbegin", html);
        } else {
            boardGrid.insertAdjacentHTML("beforeend", html);
        }
    }


    // EVENT LISTENERS
    btnCreate.addEventListener("click", () => {
        const name = boardNameInput.value.trim();
        if (!name) {
        boardError.innerText = "Nama board wajib diisi";
        return;
        }
        boardError.innerText = "";
        createBoardAPI(name);
    });

    btnUpdateBoard.addEventListener("click", () => {
    Swal.fire({
        title: "Yakin update board?",
        icon: "question",
        showCancelButton: true
    }).then((res) => {
            if (res.isConfirmed) {
            updateBoard();
            }
        });
    });

    boardGrid.addEventListener("click", (e) => {
        const updateBtn = e.target.closest(".btn-update");
        const deleteBtn = e.target.closest(".btn-delete");

        if (updateBtn) {
        const card = updateBtn.closest(".card");
        selectedBoardId = card.dataset.id;

        editBoardNameInput.value =
            card.querySelector(".board-name").innerText;

        editBoardError.innerText = "";
        new bootstrap.Modal(editBoardModalEl).show();
        }

         if (deleteBtn) {
            const card = deleteBtn.closest(".card");
            const boardId = card.dataset.id;

            Swal.fire({
                title: "Yakin mau hapus board?",
                text: "Board yang dihapus tidak bisa dikembalikan",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Ya, hapus",
                cancelButtonText: "Batal"
            }).then((result) => {
                if (result.isConfirmed) {
                    deleteBoard(boardId, card);
                }
            });
        }
    });

    btnLogout.addEventListener("click", () => {
        Swal.fire({
            title: "Logout?",
            text: "Kamu akan keluar dari aplikasi",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Ya, logout",
            cancelButtonText: "Batal",
        }).then((result) => {
            if (result.isConfirmed) {

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            Swal.fire({
                icon: "success",
                title: "Berhasil logout",
                text: "Sampai jumpa",
                timer: 1200,
                showConfirmButton: false,
            }).then(() => {
                window.location.href = "../../Auth/Login/login.html";
            });
            }
        });
    });

    
    loadBoards();

});
