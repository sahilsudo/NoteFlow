
// search
// setting 
// profile
const openNote = document.querySelector(".openNote");
const openarchive = document.querySelector(".openarchive");
const opentrash = document.querySelector(".opentrash");
const mynotes = document.querySelector(".mynotes");
const archive = document.querySelector(".archive");
const trash = document.querySelector(".trash");
const addbtn = document.querySelector(".add-btn");
const content = document.querySelector(".content");
const navlink = document.querySelectorAll(".navlink");
const tabs = document.querySelectorAll(".tab");
const openwork = document.querySelector(".openwork");
const openpersonal = document.querySelector(".openpersonal");
const allnotes = document.querySelector(".allnotes");
const personalsection = document.querySelector(".personal");
const worksection = document.querySelector(".work");
const noteCard = document.querySelector(".note-card");
// const notebox = document.createElement("div");

// nav bar nav-links
navlink.forEach(link => {
    link.addEventListener("click" , function() {
        navlink.forEach(l => l.classList.remove("active"));
        link.classList.add("active");

    })
});

openNote.addEventListener("click", function () {
    mynotes.style.display = "block";
    archive.style.display = "none";
    trash.style.display = "none";
});
openarchive.addEventListener("click", function () {
    mynotes.style.display = "none";
    archive.style.display = "block";
    trash.style.display = "none";
});

opentrash.addEventListener("click", function () {
    console.log("Trash clicked");
    mynotes.style.display = "none";
    archive.style.display = "none";
    trash.style.display = "block";
});

// tabs
allnotes.addEventListener("click", function () {
    content.style.display = "block";
    worksection.style.display = "none";
    personalsection.style.display = "none";
});

openwork.addEventListener("click", function () {
    content.style.display = "none";
    worksection.style.display = "block";
    personalsection.style.display = "none";
});

openpersonal.addEventListener("click", function () {
    content.style.display = "none";
    worksection.style.display = "none";
    personalsection.style.display = "block";
});

const notes = JSON.parse(localStorage.getItem("notes")) || [];

notes.forEach(note => {
    contentchange(note.title, note.text);
});

function saveNote() {
    const title = document.querySelector(".note-title").value;
    const text = document.querySelector(".note-text").value;

    if(title == "" && text == "" ) {
        alert("Write something first!");
        return;
    }
    
    const note = {
        title,
        text
    };

    const notes = JSON.parse(localStorage.getItem("notes")) || [];

    notes.push(note);

    localStorage.setItem("notes", JSON.stringify(notes));
    contentchange(title, text);
}


addbtn.addEventListener("click", function () {
        saveNote();
        location.reload();
});



// tabs
tabs.forEach(tab => {
    tab.addEventListener("click" , function() {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
    })
});

// create note box


function contentbox(notetitle, notetext) {

    const shortText =
    notetext.length > 100
    ? notetext.slice(0, 100) + "..."
    : notetext;

    const notebox = document.createElement("div");
    notebox.classList.add("notes-container");

    // create note box
    notebox.innerHTML = `
    
    <div class="note-box">
    <div class="note-header">
    <h3 class="note-title">${notetitle}</h3>
    <button class="delete-btn"><i class="fa-solid fa-trash-can"></i> </button>
    <button class="menu-btn"><i class="fa-solid fa-ellipsis-vertical"></i></button>
    </div>
    
    <p class="note-text short">${shortText}</p>
    
    <p class="note-text full">
    ${notetext}
    </p>
    
    <button class="read-btn">Read Full Note</button>
    
    `;

    const readBtn = notebox.querySelector(".read-btn");
    const shortNote = notebox.querySelector(".short");
    const fullNote = notebox.querySelector(".full");

    // Add click event to this specific button
    readBtn.addEventListener("click", () => {
        fullNote.classList.toggle("active");


        if (fullNote.classList.contains("active")) {
            readBtn.textContent = "Show Less";
            shortNote.style.display = "none";
        } else {
            readBtn.textContent = "Read Full Note";
            shortNote.style.display = "block"; // Or "inline", depending on your layout
        }

            
    });

    // content.appendChild(notebox);
    content.prepend(notebox);  
}

function deleteNote(notetitle) {
    const deleteBtn = document.querySelector(".delete-btn");

    deleteBtn.addEventListener("click", function () {
        console.log("Delete button clicked");
        console.log(notetitle);
        localStorage.removeItem(notetitle);
        
    });
}

// note card contentchange
function contentchange(notetitle, notetext) {
    
    contentbox(notetitle, notetext);
    // not properly working
    deleteNote(notetitle);
}