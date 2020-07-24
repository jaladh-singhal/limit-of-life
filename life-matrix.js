const matrixContainer = document.querySelector("#matrix");

const LIFE_EXPECTANCY = 100;
const WEEKS_IN_YEAR = 52;
const DAYS_IN_WEEK = 7;

function genMatrix(dob) {
  matrixContainer.innerHTML = "";
  const weekStartDate = new Date(dob);
  let row,
    daysInAgeYear,
    remDaysOverAgeYears = 0;

  for (let ageYear = 0; ageYear <= LIFE_EXPECTANCY; ageYear++) {
    row = document.createElement("div");
    row.classList.add("row");

    // Find week remainder days in age year
    daysInAgeYear = getDaysInAgeYear(ageYear, dob);
    remDaysOverAgeYears += daysInAgeYear % DAYS_IN_WEEK;

    // Add em in a var to determine if it's 7 -> leap week
    if (remDaysOverAgeYears >= DAYS_IN_WEEK) {
      remDaysOverAgeYears -= DAYS_IN_WEEK;
      weeksInAgeYear = WEEKS_IN_YEAR + 1;
      row.classList.add("row--leap-week");
    } else {
      weeksInAgeYear = WEEKS_IN_YEAR;
    }

    let weekBox;
    for (let week = 1; week <= weeksInAgeYear; week++) {
      weekBox = document.createElement("div");
      //Add box starting date (+week no: total & in ageyear) to debug
      //Keep adding 7 to each box since 0th bday to actually get correct numbers
      weekBox.classList.add("box");
      weekBox.setAttribute("title", weekStartDate.toDateString());
      //TODO: if weekStartDate < today fill the box by setAttribute
      weekStartDate.setDate(weekStartDate.getDate() + DAYS_IN_WEEK);
      row.appendChild(weekBox);
    }

    matrixContainer.appendChild(row);
  }

  alert("you entered: " + dob);
  //TODO: Fill boxes based on passed dob string
}

function getDaysInAgeYear(ageYear, dobStr) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const dob = new Date(dobStr);

  // Discard the time and time-zone information.
  const curBday = Date.UTC(
    dob.getFullYear() + ageYear,
    dob.getMonth(),
    dob.getDate()
  );
  const nextBday = Date.UTC(
    dob.getFullYear() + ageYear + 1,
    dob.getMonth(),
    dob.getDate()
  );

  return Math.floor((nextBday - curBday) / MS_PER_DAY);
}

// TODO: Populate matrix div with a grid
function showMatrix() {
  const dob = document.querySelector("#dob");
  genMatrix(dob.value);
}

// TODO: Listen on DOB entered (button for now)
const showBtn = document.querySelector("#btn");
showBtn.addEventListener("click", showMatrix);
