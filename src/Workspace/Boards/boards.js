// AUTH GUARD
const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "../../Auth/Login/login.html";
}

// DOM READY
document.addEventListener("DOMContentLoaded", () => {

    // GLOBAL STATE
    let activeTab = localStorage.getItem("activeTab") || "my";
    let selectedBoardId = null;
    let myBoards = [];
    let teamBoards = [];
    let originalBoardName = "";
    let selectedMembers = [];


    // DOM ELEMENTS
    const boardGrid = document.getElementById("boardGrid");

    // Tabs
    const tabMyBoards = document.getElementById("tabMyBoards");
    const tabTeamBoards = document.getElementById("tabTeamBoards");

    // create board
    const btnCreate = document.getElementById("btnCreate");
    const btnSubmitCreateBoard = document.getElementById("btnSubmitCreateBoard");
    const boardNameInput = document.getElementById("boardName");
    const boardError = document.getElementById("boardError");

    // edit board
    const editBoardModalEl = document.getElementById("editBoardModal");
    const editBoardNameInput = document.getElementById("editBoardName");
    const editBoardError = document.getElementById("editBoardError");
    const btnUpdateBoard = document.getElementById("btnUpdateBoard");


    // show team modal
    const createBoardModalEl = document.getElementById("createBoardModal");
    const memberField = document.getElementById("memberField");
    const createBoardTitle = document.getElementById("createBoardTitle");

    // search 
    const memberSearchInput = document.getElementById("memberSearchInput");
    const memberSearchResult = document.getElementById("memberSearchResult");
    const selectedMembersContainer = document.getElementById("selectedMembersContainer");

    // USER INFO
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
        document.querySelector("#userName").innerText = user.name;
    }


    function updateTabUI(){
        if(activeTab === "my"){
                tabMyBoards.classList.add("fw-semibold", "border-bottom", "border-primary", "text-primary");
                tabMyBoards.classList.remove("text-muted");

                tabTeamBoards.classList.remove("fw-semibold", "border-bottom", "border-primary", "text-primary");
                tabTeamBoards.classList.add("text-muted");
        } else {
                tabTeamBoards.classList.add("fw-semibold", "border-bottom", "border-primary", "text-primary");
                tabTeamBoards.classList.remove("text-muted");

                tabMyBoards.classList.remove("fw-semibold", "border-bottom", "border-primary", "text-primary");
                tabMyBoards.classList.add("text-muted");
        }
        
    }


    function renderContentByTab() {
        if (activeTab === "my") {
            loadMyBoards();
        } else if(activeTab === "team"){
            loadTeamBoards();
        }
    }


    function renderSearchResults(users) {
        memberSearchResult.innerHTML = "";

        if(users.length === 0) {
            memberSearchResult.innerHTML = `
                <div class="list-group-item text-muted small">
                    User tidak ditemukan
                </div>
            `;
            memberSearchResult.classList.remove("d-none");
            return;
        }

        users.forEach(user => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "list-group-item list-group-item-action";

            item.innerHTML = `
                <span class="small">${user.name}</span>
                <span class="text-muted small"> · ${user.email}</span>
            `;

            item.addEventListener("click", () => {
                addMember(user);
            });

            memberSearchResult.appendChild(item);
        });

        memberSearchResult.classList.remove("d-none");
    }

    function addMember(user) {
        if (selectedMembers.some(u => u._id === user._id)) return;
        selectedMembers.push(user);

        memberSearchInput.value = "";

        memberSearchResult.innerHTML = "";
        memberSearchResult.classList.add("d-none");

        renderSelectedMembers();
    }

    function renderSelectedMembers() {
        selectedMembersContainer.innerHTML = "";

        selectedMembers.forEach(user => {
            const chip = document.createElement("span");
            chip.className = "badge bg-primary d-inline-flex align-items-center gap-1 px-2 py-0 fs-6 fw-normal";

            chip.innerHTML = `<span>${user.name}</span>
                <button type="button" class="btn-close btn-close-white btn-sm" 
                    style="transform: scale(0.6);" aria-label="Remove">
                </button>`;

            chip.querySelector("span").onclick = () => {
            removeMember(user._id);
            };

            selectedMembersContainer.appendChild(chip);
        });
    }

    function removeMember(userId) {
        selectedMembers = selectedMembers.filter(u => u._id !== userId);
        renderSelectedMembers();
    }



    // API FUNCTIONS
    async function loadMyBoards() {
        try {
        boardGrid.innerHTML = "";

        const response = await fetch(
            "http://localhost:3000/api/v1/workspace/get-allmyboards",
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

        myBoards = data.data || [];
         if (myBoards.length === 0) {
             boardGrid.innerHTML = `
                <div class="col-12 text-center text-muted py-5">
                <h5>Belum ada Board</h5>
                <p>Buat board pertama kamu</p>
                </div>
            `;
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

    async function loadTeamBoards() {
        try{
            boardGrid.innerHTML = "";

            const response = await fetch(
            "http://localhost:3000/api/v1/workspace/get-allteamboards",
                {
                    headers: {
                    Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();
            if (!response.ok) {
                Swal.fire({
                    icon: "error",
                    title: "Gagal memuat team board",
                    text: data.message || "Tidak dapat mengambil data team board",
                });
                return;
            }

            teamBoards = data.data || [];

            if (teamBoards.length === 0) {
            boardGrid.innerHTML = `
                <div class="col-12 text-center text-muted py-5">
                <h5>Belum ada Team Board</h5>
                <p>Kamu belum tergabung di team manapun</p>
                </div>
            `;
            return;
            }

            teamBoards.forEach(board => {
            renderBoard(board._id, board.name, "team");
            });

        }catch (err) {
                Swal.fire({
                icon: "error",
                title: "Server error",
                text: "Terjadi kesalahan saat memuat team board",
                });
        }
    }


    async function createBoardAPI(name) {
        try{
            const payload = {
                name,
                type: activeTab,
                members: activeTab === "team" ? selectedMembers.map(u => u._id) : []       
            };

            const response = await fetch(
                "http://localhost:3000/api/v1/workspace/create-board",
                {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
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

            boardNameInput.value = "";
            boardError.innerText = "";
            selectedMembers = [];
            selectedMembersContainer.innerHTML = "";

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

        if(newName === originalBoardName){
            editBoardError.innerText = "Nama board tidak berubah"
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


    async function fetchSearchUsers(keyword) {
        try {
            const response = await fetch(
                `http://localhost:3000/api/v1/workspace/users-search?q=${encodeURIComponent(keyword)}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();
            return data.data || []; 

        } catch (error) {
            console.error("FETCH SEARCH USER ERROR:", error);
            return [];
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
        if (!name) return;

        createBoardAPI(name);
    })

    btnSubmitCreateBoard.addEventListener("click", () => {
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

        editBoardNameInput.value = card.querySelector(".board-name").innerText;

        originalBoardName = editBoardNameInput.value;

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

    createBoardModalEl.addEventListener("show.bs.modal", () => {

        memberField.classList.add("d-none");
        createBoardTitle.innerText = "Create Board";

        if (activeTab === "team") {
            memberField.classList.remove("d-none");
            createBoardTitle.innerText = "Create Team Board";
        }
    })


    memberSearchInput.addEventListener("input", async (e) => {
        const keyword = e.target.value.trim();

        if (keyword.length < 2) {
            memberSearchResult.classList.add("d-none");
            memberSearchResult.innerHTML = "";
            return;
        }

        const result = await fetchSearchUsers(keyword);

        memberSearchResult.classList.remove("d-none");

        renderSearchResults(result);
    });



    tabMyBoards.addEventListener("click", () => {
        if(activeTab === "my")
            return;
        activeTab = "my";
        localStorage.setItem("activeTab", "my");
        updateTabUI();
        renderContentByTab();
    });

    tabTeamBoards.addEventListener("click", () => {
        if(activeTab === "team")
            return;
        activeTab = "team";
        localStorage.setItem("activeTab", "team");
        updateTabUI();
        renderContentByTab();
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
            localStorage.removeItem("activeTab");

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

    
    updateTabUI();
    renderContentByTab();

});
