// AUTH GUARD
const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "../../Auth/Login/login.html";
}


// DOM READY
document.addEventListener("DOMContentLoaded", () => {

    const btnSubmitCreateKanban = document.getElementById("btnSubmitCreateKanban");

    const container = document.getElementById("kanbanContainer");
    let draggedItem = null;

    const btnSaveTask = document.getElementById("btnSaveTask");
    let currentKanbanId = null;

    let checklistChanges = {};


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
                        <h5>No Kanban Yet</h5>
                        <p>Create your first Kanban to get started.</p>
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


    async function saveTask(){
        try{
            const content = document.getElementById("taskContent").value;
            const kanbanId = currentKanbanId;

            const response = await fetch("http://localhost:3000/api/v1/workspace/save-task", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`, 
                },
                body: JSON.stringify({
                    kanbanId,
                    content,
                }),
            });
            if(response.status === 401){
                localStorage.removeItem("token");
                window.location.href = "../../Auth/Login/login.html";
                return;
            }


            const data = await response.json();

        if (!response.ok) {
            Swal.fire({
                icon: "error",
                title: "Gagal menyimpan task",
                text: data.errors?.general || data.errors?.content || "Terjadi kesalahan",
            });
            return;
        }

        await saveChecklistStatus();

        const modalElement = document.getElementById("taskModal");
        const modal = bootstrap.Modal.getInstance(modalElement);

        modal.hide();

        Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: data.message,
        });

        }catch (error){
            console.error(error);

            Swal.fire({
                icon: "error",
                title: "Server Error",
                text: "Terjadi kesalahan saat menyimpan task",
            });
        }
    }


    async function loadTasks(kanbanId){
        try{
            const response = await fetch(`http://localhost:3000/api/v1/workspace/get-tasks/${kanbanId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "../../Auth/Login/login.html";
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                Swal.fire({
                    icon: "error",
                    title: "Gagal memuat task",
                    text: data.errors?.general || "Terjadi kesalahan",
                });
                return;
            }

            const tasks = data.data;

            const textarea = document.getElementById("taskContent");
            if(tasks.length > 0){
                textarea.value = tasks[0].content;
            }else{
                textarea.value = "";
            }

        }catch(error){
            console.error(error);

            Swal.fire({
                icon: "error",
                title:"Server error",
                text: "Terjadi kesalahan saat memuat task",
            });
        }
    }

    async function loadChecklists(kanbanId){
        try{
            const response = await fetch(`http://localhost:3000/api/v1/workspace/get-checklists/${kanbanId}`, {
                headers:{
                    Authorization: `Bearer ${token}`,
                },
            });

            if(response.status === 401){
                localStorage.removeItem("token");
                window.location.href="../../Auth/Login/Login.html";
                return;
            }

            const data = await response.json();

            if(!response.ok){
                Swal.fire({
                    icon:"error",
                    title:"Gagal memuat checklist",
                    text:data.errors?.general || "Terjadi kesalahan",
                });
                return;
            }

            const checklists = data.data;
            const checklistContainer = document.getElementById("checklistContainer");

            checklistContainer.innerHTML = "";

            checklists.forEach((checklist) => {

                const div = document.createElement("div");

                div.className = "d-flex justify-content-between align-items-center mb-2";

                div.innerHTML = `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" data-id="${checklist._id}" ${checklist.isDone ? "checked" : ""}>
                        <label class="form-check-label">${checklist.title}</label>
                    </div>

                    <button class="btn btn-sm btn-outline-danger btnDeleteChecklist" data-id="${checklist._id}">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                `;

                checklistContainer.appendChild(div);
            });

            attachDeleteEvent();

            attachCheckboxEvent();

            updateProgress();

        }catch(error){
            console.error(error);

            Swal.fire({
                icon:"error",
                title:"Server Error",
                text:"Terjadi kesalahan saat memuat checklist",
            });
        }
    }


    //Render Kanban
    function renderKanban(kanban) {
        const container = document.getElementById("kanbanContainer");

        const html = `
            <div class="kanban-item d-flex flex-column" draggable="true" data-id="${kanban._id}" style="flex: 0 0 calc((100% - 3rem) / 4); height: 75vh;">
                <div class="card shadow-sm d-flex flex-column kanban-card" style="min-height: 220px;">
                    <!-- HEADER -->
                        <div class="card-header fw-bold">
                            ${kanban.name}
                        </div>
                        
                    <!-- BODY -->
                        <div class="card-body flex-grow-1 overflow-auto p-2">
                            <div class="ticket-container">
                            </div>
                        </div>
                </div>
            </div>
        `

        container.insertAdjacentHTML("beforeend", html)

        const cards = container.querySelectorAll(".kanban-card");
        
        const lastCard = cards[cards.length - 1];
        
        lastCard.addEventListener("click", () => {
            currentKanbanId = kanban._id;
            document.getElementById("taskModalTitle").textContent = kanban.name;

            loadTasks(currentKanbanId);
            loadChecklists(currentKanbanId);

            const modal = new bootstrap.Modal(document.getElementById("taskModal"));
            modal.show();
        });
    }

    container.addEventListener("dragstart", (e) => {
        draggedItem = e.target.closest(".kanban-item")
    });

    container.addEventListener("dragover", (e) => {
        e.preventDefault()

        const target = e.target.closest(".kanban-item")

        if (!target || target === draggedItem) return

        const rect = target.getBoundingClientRect()
        const isAfter = (e.clientX - rect.left) > rect.width / 2

        container.insertBefore(
            draggedItem,
            isAfter ? target.nextSibling : target
        )
    })

    container.addEventListener("drop", () => {
        const items = document.querySelectorAll(".kanban-item")

        const newOrder = []

        items.forEach((el, index) => {
            newOrder.push({
                id: el.dataset.id,
                order: index + 1
            })
        })

        console.log("NEW ORDER:", newOrder)
    })

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

    btnSaveTask.addEventListener("click", () => {
        saveTask();
    });

    btnBack.addEventListener("click", () => {
        window.location.href = "../Boards/boards.html";
    });



    function showChecklistInput(){

        const inputContainer = document.getElementById("checklistInputContainer");

        const existingInput = inputContainer.querySelector("#checklistInput");

        if(existingInput){
            existingInput.focus();
            return;
        }

        btnAddChecklist.style.display = "none";

        inputContainer.innerHTML = `
            <input id="checklistInput" class="form-control" placeholder="Input checklist...">

            <div class="mt-2 d-flex gap-2">
                <button id="btnSubmitChecklist" class="btn btn-primary btn-sm">Add</button>
                <button id="btnCancelChecklist" class="btn btn-secondary btn-sm">Cancel</button>
            </div>
        `;

        document.getElementById("checklistInput").focus();

        document.getElementById("btnCancelChecklist").addEventListener("click", cancelChecklistInput);

        document.getElementById("btnSubmitChecklist").addEventListener("click", submitChecklist);

    }

    function updateProgress(){
        const checkboxes = document.querySelectorAll("#checklistContainer .form-check-input");

        const total = checkboxes.length;

        const completed = [...checkboxes].filter((checkbox) => checkbox.checked).length;

        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        const progressBar = document.getElementById("progressBar");
        const progressText = document.getElementById("progressText");

        progressBar.style.width = `${percentage}%`;
        progressBar.textContent = `${percentage}%`;

        progressText.textContent = `${completed} of ${total} Tasks Completed`;

    }

    function attachCheckboxEvent(){

        const checkboxes = document.querySelectorAll("#checklistContainer .form-check-input");

        checkboxes.forEach((checkbox) => {

            checkbox.addEventListener("change", () => {
                const checklistId = checkbox.dataset.id;

                checklistChanges[checklistId] = checkbox.checked;
                console.log(checklistChanges);
                updateProgress();

            });

        });

    }

    async function saveChecklistStatus(){
        const checklists = Object.entries(checklistChanges).map(([checklistId, isDone]) => ({
            checklistId,
            isDone,
        }));

        if(checklists.length === 0){
            return;
        }

        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:3000/api/v1/workspace/update-checklist-status", {
            method: "PATCH",
            headers:{
                "Content-Type":"application/json",
                "Authorization":`Bearer ${token}`,
            },
            body:JSON.stringify({
                checklists,
            }),
        }) 

        if(response.status === 401){
            localStorage.removeItem("token");
            window.location.href = "../../Auth/Login/login.html";
            return;
        }

        const data = await response.json(); 

        if(!response.ok){
            throw new Error(
                data.errors?.general || "Failed to update checklist status."
            );
        }
        checklistChanges = {};
    }


    function cancelChecklistInput(){
        document.getElementById("checklistInputContainer").innerHTML = "";
        btnAddChecklist.style.display = "inline-block";
    }

    async function submitChecklist(){

        const checklistInput = document.getElementById("checklistInput");
        const title = checklistInput.value.trim();

        if(title === ""){
            Swal.fire({
                icon:"warning",
                title:"Checklist kosong",
                text:"Masukkan nama checklist.",
            });
            checklistInput.focus();
            return;
        }

        try{
            const response = await fetch("http://localhost:3000/api/v1/workspace/add-checklist",{
                method:"POST",
                headers:{
                    "Content-Type":"application/json",
                    Authorization:`Bearer ${token}`,
                },
                body:JSON.stringify({
                    kanbanId: currentKanbanId,
                    title,
                }),
            });

            const data = await response.json();

            if(!response.ok){
                Swal.fire({
                    icon:"error",
                    title:"Gagal",
                    text:data.errors?.general || "Terjadi kesalahan",
                });

                return;
            }

            cancelChecklistInput();

            await loadChecklists(currentKanbanId);

        }catch(error){

            console.error(error);

            Swal.fire({
                icon:"error",
                title:"Server Error",
                text:"Terjadi kesalahan server",
            });

        }

    }

    btnAddChecklist.addEventListener("click", showChecklistInput);

    function attachDeleteEvent(){
        const deleteButtons = document.querySelectorAll(".btnDeleteChecklist");

        deleteButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const checklistId = button.dataset.id;
                deleteChecklist(checklistId);
            });
        });
    }

    async function deleteChecklist(checklistId){
        try{
            const result = await Swal.fire({
                title: "Delete Checklist?",
                text: "This checklist will be permanently deleted.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Delete",
                cancelButtonText: "Cancel",
            });

            if(!result.isConfirmed){
                return;
            }

            const response = await fetch(`http://localhost:3000/api/v1/workspace/delete-checklist/${checklistId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if(!response.ok){
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: data.errors?.general || "Something went wrong.",
                });
                return;
            }

            Swal.fire({
                icon: "success",
                title: "Success",
                text: data.message,
                timer: 1500,
                showConfirmButton: false,
            });

            await loadChecklists(currentKanbanId);

        }catch(error){
            console.error(error);

            Swal.fire({
                icon: "error",
                title: "Server Error",
                text: "Something went wrong.",
            });
        }
    }


    const taskModal = document.getElementById("taskModal");

    taskModal.addEventListener("hidden.bs.modal", () => {
        checklistChanges = {};
        document.getElementById("checklistContainer").innerHTML = "";
        updateProgress();
    });


    loadProjectName();
    loadKanbans();



});
