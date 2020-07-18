const matrixContainer = document.querySelector("#matrix");

const expectedAge = 100;

function genMatrix(dob) {
  matrixContainer.innerHTML = "";
  let row;
  for (let i = 0; i <= expectedAge; i++) {
    // TODO: Find right way to declare row
    row = document.createElement("div");
    row.classList.add("row");

    let box;
    for (let j = 1; j <= 52; j++) {
      box = document.createElement("div");
      box.classList.add("box");
      row.appendChild(box);
    }

    matrixContainer.appendChild(row);
  }

  alert("you entered: " + dob);
  //TODO: Fill boxes based on passed dob string
}

// TODO: Populate matrix div with a grid
function showMatrix() {
  const dob = document.querySelector("#dob");
  genMatrix(dob.value);
}

// TODO: Listen on DOB entered (button for now)
const showBtn = document.querySelector("#btn");
showBtn.addEventListener("click", showMatrix);
