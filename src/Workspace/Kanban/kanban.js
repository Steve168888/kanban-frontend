// AUTH GUARD
const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "../../Auth/Login/login.html";
}


// DOM READY
document.addEventListener("DOMContentLoaded", () => {

    const btnSubmitCreateKanban = document.getElementById("btnSubmitCreateKanban");

    async function loadProjectName() {
        const titleEl = document.getElementById("projectName")

        const params = new URLSearchParams(window.location.search)
        const boardId = params.get("id")

        try {
            const response = await fetch(`http://localhost:3000/api/v1/workspace/get-kanban/${boardId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const data = await response.json()

            if (!response.ok) {
                titleEl.textContent = "Gagal load project"
                return
            }

            titleEl.textContent = data.board.name

        } catch (err) {
            console.error(err)
            titleEl.textContent = "Error"
        }

    }


    async function createKanban(kanbanName) {
        const params = new URLSearchParams(window.location.search)
        const boardId = params.get("id")
        try {
            const response = await fetch(`http://localhost:3000/api/v1/workspace/create-kanban/${boardId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ name: kanbanName })
            });

            const data = await response.json()

            if (!response.ok) {
                Swal.fire({
                    icon: "error",
                    title: "Gagal",
                    text: "Kanban gagal dibuat",
                })
                return
            }

            console.log("SUCCESS:", data)

            // reset input
            document.getElementById("kanbanName").value = ""

            // tutup modal
            const modalEl = document.getElementById("createKanbanModal")
            const modal = bootstrap.Modal.getInstance(modalEl)
            modal.hide()

            Swal.fire({
                icon: "success",
                title: "Berhasil",
                text: "Kanban berhasil dibuat",
                timer: 1500,
                showConfirmButton: false,
            })

            await loadKanbans()

        } catch (err) {
            console.error("ERROR DETAIL:", err)
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Terjadi kesalahan server",
            })
        }
    }

    async function loadKanbans() {
        const container = document.getElementById("kanbanContainer")

        try {
            container.innerHTML = ""
            const params = new URLSearchParams(window.location.search)
            const boardId = params.get("id")

            const response = await fetch(`http://localhost:3000/api/v1/workspace/get-kanban/${boardId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (response.status === 401) {
                localStorage.removeItem("token")
                window.location.href = "../../Auth/Login/login.html"
                return
            }

            const data = await response.json()

            if (!response.ok) {
                Swal.fire({
                    icon: "error",
                    title: "Gagal memuat kanban",
                    text: data.message || "Tidak dapat mengambil data kanban",
                })
                return
            }

            const kanbans = data.data || []

            if (kanbans.length === 0) {
                container.innerHTML = `
                    <div class="col-12 text-center text-muted py-5">
                        <h5>Belum ada Kanban</h5>
                        <p>Silakan buat kanban pertama kamu</p>
                    </div>
                `
                return
            }

            kanbans.forEach(kanban => {
                renderKanban(kanban)
            })

        } catch (err) {
            console.error(err)
            Swal.fire({
                icon: "error",
                title: "Server error",
                text: "Terjadi kesalahan saat memuat kanban",
            })
        }
    }

    //Render Kanban
    function renderKanban(kanban) {
        const container = document.getElementById("kanbanContainer")

        const html = `
            <div class="col-3">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <h6 class="mb-0">${kanban.name}</h6>
                    </div>
                </div>
            </div>
        `

        container.insertAdjacentHTML("beforeend", html)
    }


    btnSubmitCreateKanban.addEventListener("click", () => {
        const kanbanName = document.getElementById("kanbanName").value
        const errorEl = document.getElementById("kanbanError")

        errorEl.textContent = ""

        if (!kanbanName) {
            errorEl.textContent = "Nama kanban wajib diisi"
            return
        }

        createKanban(kanbanName);
    })




    loadProjectName();
    loadKanbans();







});
