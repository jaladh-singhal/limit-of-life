"use strict";

const WEEKS_IN_YEAR = 52;
const DAYS_IN_WEEK = 7;

// Populate the grid
function genLifeGrid(dob, lifeExpectancy) {
  const lifeGrid = document.querySelector("#life-grid");
  lifeGrid.innerHTML = ""; // Clear all child nodes

  // Set number of row and columns of the grid
  lifeGrid.style.setProperty("--num-col", WEEKS_IN_YEAR + 1);
  lifeGrid.style.setProperty("--num-row", lifeExpectancy);

  let weekStartDate = new Date(dob);
  let daysInAgeYear,
    weeksInAgeYear,
    remDaysOverAgeYears = 0;

  for (let ageYear = 0; ageYear < lifeExpectancy; ageYear++) {
    // Find week remainder days in age year
    daysInAgeYear = getDaysInAgeYear(ageYear, dob);
    remDaysOverAgeYears += daysInAgeYear % DAYS_IN_WEEK;

    // Determine if it's a leap week or not
    if (remDaysOverAgeYears >= DAYS_IN_WEEK) {
      remDaysOverAgeYears -= DAYS_IN_WEEK;
      weeksInAgeYear = WEEKS_IN_YEAR + 1;
    } else {
      weeksInAgeYear = WEEKS_IN_YEAR;
    }

    let weekBox, nextWeekStartDate;
    for (let week = 1; week <= weeksInAgeYear; week++) {
      weekBox = document.createElement("div");
      weekBox.classList.add("box");

      if (week === 1) {
        weekBox.classList.add("box--row-start");
      }

      //Add box starting date (+week no: total & in age year) to debug
      weekBox.setAttribute("title", weekStartDate.toDateString());

      // Find the next week starting date
      nextWeekStartDate = new Date(weekStartDate);
      nextWeekStartDate.setDate(nextWeekStartDate.getDate() + DAYS_IN_WEEK);

      // Fill the boxes based on current date
      if (weekStartDate < Date.now() && nextWeekStartDate <= Date.now()) {
        weekBox.classList.add("box--filled");
      }
      weekStartDate = nextWeekStartDate;

      lifeGrid.appendChild(weekBox);
    }
  }
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

function genLifeStats() {}

function showOutput() {
  const dob = document.querySelector("#dob");
  const lifeExpectancy = document.querySelector("#life-expectancy");

  genLifeStats();
  genLifeGrid(dob.value, lifeExpectancy.valueAsNumber);
}

// Listen on user details form's button
const showBtn = document.querySelector("#btn");
showBtn.addEventListener("click", showOutput);

// Prevent form from submitting on enter or button click
document.querySelector("#user-details").addEventListener("submit", (event) => {
  event.preventDefault();
});
