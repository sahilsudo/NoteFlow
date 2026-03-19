
// search
// setting 
// profile
const addbtn = document.querySelector(".add-btn");
const content = document.querySelector(".content");
const navlink = document.querySelectorAll(".navlink");
const tabs = document.querySelectorAll(".tab");

addbtn.addEventListener("click", function () {
    let notetitle = document.querySelector(".note-title").value;
    let notetext = document.querySelector(".note-text").value;
    localStorage.setItem(notetitle, notetext);
    console.log(notetitle, notetext)
    let data = localStorage.getItem(notetitle);
    console.log(data);
    contentchange(notetitle, notetext)
});

// nav bar nav-links
navlink.forEach(link => {
    link.addEventListener("click" , function() {
        navlink.forEach(l => l.classList.remove("active"));
        link.classList.add("active");

    })
});

// tabs
tabs.forEach(tab => {
    tab.addEventListener("click" , function() {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
    })
});

// DOMcontentloaded
document.addEventListener("DOMContentLoaded", function(){

    let notes = JSON.parse(localStorage.getItem("notetitle")) || [];

    notes.forEach(note => {
        createNote(note.title, note.text);
    });

});

// note box
function contentchange(notetitle, notetext) {
    // console.log("heppen")
    // console.log(notetitle)
    // console.log(notetext)
    const notebox = document.createElement("div");
    notebox.classList.add("notes-container");

    if(notetitle == "" && notetext == "" ) {
        alert("Write something first!");
        return;
    }
    
    // create note box
    notebox.innerHTML = `
    
    <div class="note-box">
    <div class="note-header">
    <h3 class="note-title">${notetitle}</h3>
    <button class="delete-btn">🗑</button>
    </div>
    
    <p class="note-text short">
    Discuss project timeline, assign tasks to team members and finalize UI design...
    </p>
    
    <p class="note-text full">
    ${notetext}
    </p>
    
    <button class="read-btn">Read Full Note</button>
    
    `;

    content.appendChild(notebox)
    
    // note full content
    const readBtn = document.querySelector(".read-btn");
    const fullNote = document.querySelector(".full");

    readBtn.addEventListener("click", function () {

        fullNote.classList.toggle("active");

        if (fullNote.classList.contains("active")) {
            readBtn.textContent = "Show Less";
        } else {
            readBtn.textContent = "Read Full Note";
        }

    });
}
// vew div
// const noteDiv = document.createElement('div');
//     noteDiv.className = 'note-item';
//     noteDiv.innerText = notetext;
    
//     document.getElementsByClassName('content').appendChild(noteDiv);