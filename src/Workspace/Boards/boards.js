    // AUTH GUARD
    const token = localStorage.getItem("token");
    if (!token) {
    window.location.href = "../../Auth/Login/login.html";
    }

    // DOM READY
    document.addEventListener("DOMContentLoaded", () => {


    // STATE
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

    // API FUNCTIONS
    async function loadBoards() {
        try {
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
            alert("Gagal mengambil board");
            return;
        }

        data.data.forEach(board => {
            renderBoard(board._id, board.name);
        });

        } catch (err) {
        alert("Server error saat load board");
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
            alert(data.message || "Gagal membuat board");
            return;
        }

        renderBoard(data.data._id, data.data.name);
        boardNameInput.value = "";

        bootstrap.Modal
            .getInstance(document.getElementById("createBoardModal"))
            .hide();

        } catch (err) {
        alert("Server error");
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
            alert("Gagal update board");
            return;
        }

        const card = document.querySelector(
            `.card[data-id="${selectedBoardId}"]`
        );
        card.querySelector(".board-name").innerText = newName;

        bootstrap.Modal.getInstance(editBoardModalEl).hide();

        } catch (err) {
        alert("Server error");
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
            alert("Gagal menghapus board");
            return;
        }

        cardEl.closest(".col-lg-3").remove();

        } catch (err) {
        alert("Server error");
        }
    }

    // RENDER
    function renderBoard(id, name) {
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
        boardGrid.insertAdjacentHTML("beforeend", html);
    }


    // EVENTS
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
        updateBoard();
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
        if (confirm("Yakin mau hapus board ini?")) {
            deleteBoard(card.dataset.id, card);
        }
        }
    });

    // INIT
    loadBoards();

    });
