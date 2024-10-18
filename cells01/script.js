import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";
import { getDatabase, ref, set, get, push, onValue, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
import { firebaseConf, apiUrl } from './config.js';

const url = apiUrl;

let name;
let db;
let app;
let myDBID;
let appName = "collaborative-grid-01";
let userColor = generateRandomColor();

const firebaseConfig = firebaseConf;

init(); 

function init() {
    console.log("init");
    app = initializeApp(firebaseConfig);
    db = getDatabase();
    const analytics = getAnalytics(app);
    // connectToFirebaseAuth();
}

function generateRandomColor(){
    let randomColor = "#000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);});
    return randomColor;
}

function subscribeToUsers() {
    const commentsRef = ref(db, appName + '/users/');
    onChildAdded(commentsRef, (data) => {

    });
    onChildChanged(commentsRef, (data) => {
        let container = document.getElementById(data.key);
        if (!container) {
            container = addDiv(data.key, data);
        }
    });

    onChildRemoved(commentsRef, (data) => {
        console.log("removed", data.key, data.val());
    });
}

//____________________________________________________________________________________
//GRID STUFF
const gridContainer = document.getElementById("grid-container");
const blurSlider = document.getElementById("blur-slider");
const scaleSlider = document.getElementById("scale-slider");

document.addEventListener("DOMContentLoaded", () => {
    createGrid(7, 7);
    let cells = Array.from(document.getElementsByClassName("cell"));

    cells.forEach(cell => {
        cell.addEventListener("click", () => {
            console.log("clicked", cell.id);
            const cellRef = ref(db, `${appName}/cells/${cell.id}`);
            get(cellRef).then((snapshot) => {
                if (snapshot.exists()) {
                    let cellData = snapshot.val();
                    if (cellData.currentColor === "white") {
                        cell.style.backgroundColor = "rgb(0, 0, 0)";
                        cellData.currentColor = "black";
                        cellData.whiteCount -= 1;
                        cellData.blackCount += 1;
                    } else {
                        cell.style.backgroundColor = "rgb(255, 255, 255)";
                        cellData.currentColor = "white";
                        cellData.blackCount -= 1;
                        cellData.whiteCount += 1;
                    }
                    set(cellRef, cellData);
                }
            });
        });
    });

    blurSlider.value = blurSlider.defaultValue;
    gridContainer.style.filter = `blur(${blurSlider.value}px)`;

    blurSlider.addEventListener("input", (event) => {
        const blurValue = event.target.value;
        gridContainer.style.filter = `blur(${blurValue}px)`;
    });

    scaleSlider.addEventListener("input", (event) => {
        const scaleValue = event.target.value;
        gridContainer.style.transform = `scale(${scaleValue})`;
    });
});

function createGrid(x, y) {
    gridContainer.style.gridTemplateColumns = `repeat(${x}, 48px)`;
    gridContainer.style.gridTemplateRows = `repeat(${y}, 48px)`;

    for (let i = 0; i < x; i++) {
        for (let j = 0; j < y; j++) {
            const div = document.createElement("div");
            div.classList.add("cell");
            div.id = i + "-" + j;
            gridContainer.appendChild(div);

            const cellRef = ref(db, `${appName}/cells/${div.id}`);
            get(cellRef).then((snapshot) => {
                if (snapshot.exists()) {
                    let cellData = snapshot.val();
                    console.log(`Cell ${div.id} data:`, cellData); // Debugging log

                    // Add a count to the current color
                    if (cellData.currentColor === "black") {
                        cellData.blackCount += 1;
                    } else {
                        cellData.whiteCount += 1;
                    }

                    // Set the cell color based on the counts
                    if (cellData.blackCount > cellData.whiteCount) {
                        div.style.backgroundColor = "rgb(0, 0, 0)";
                        cellData.currentColor = "black";
                    } else {
                        div.style.backgroundColor = "rgb(255, 255, 255)";
                        cellData.currentColor = "white";
                    }

                    set(cellRef, cellData);
                } else {
                    const randomColor = Math.random() < 0.5 ? "black" : "white";
                    div.style.backgroundColor = randomColor === "black" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
                    const newCellData = {
                        blackCount: randomColor === "black" ? 1 : 0,
                        whiteCount: randomColor === "white" ? 1 : 0,
                        currentColor: randomColor
                    };
                    console.log(`New cell ${div.id} data:`, newCellData); // Debugging log
                    set(cellRef, newCellData);
                }
            }).catch((error) => {
                console.error(`Error fetching data for cell ${div.id}:`, error); // Debugging log
            });
        }
    }
}