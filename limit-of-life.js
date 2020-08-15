"use strict";

const WEEKS_IN_YEAR = 52;
const DAYS_IN_WEEK = 7;

// Populate the grid
function genLifeGrid(dob, lifeExpectancy) {
  const weekStats = document.querySelector(".js-week-stats");
  const weekStatsDefaultHTML = weekStats.innerHTML;

  const lifeGrid = document.querySelector(".js-life-grid");
  lifeGrid.innerHTML = ""; // Clear all child nodes

  // Set number of row and columns of the grid
  lifeGrid.style.setProperty("--num-col", WEEKS_IN_YEAR + 1);
  lifeGrid.style.setProperty("--num-row", lifeExpectancy);

  let weekStartDate = new Date(dob);
  let daysInAgeYear,
    weeksInAgeYear,
    remDaysOverAgeYears = 0,
    totalWeeksOverYears = 0;

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

    let weekBox, nextWeekStartDate, weekEndDate, weekNumber;
    for (let week = 1; week <= weeksInAgeYear; week++) {
      weekBox = document.createElement("div");
      weekBox.classList.add("life-grid__box");

      if (week === 1) {
        weekBox.classList.add("life-grid__box--row-start");
      }

      // Find the next week starting date
      nextWeekStartDate = new Date(weekStartDate);
      nextWeekStartDate.setDate(nextWeekStartDate.getDate() + DAYS_IN_WEEK);

      //Add weeks stats as data attribute to the box
      weekBox.dataset.weekStartDate = weekStartDate.toDateString();

      weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + DAYS_IN_WEEK - 1);
      weekBox.dataset.weekEndDate = weekEndDate.toDateString();

      weekNumber = totalWeeksOverYears + week;
      weekBox.dataset.weekNumber = weekNumber;

      // Fill the boxes based on current date
      if (weekStartDate < Date.now() && nextWeekStartDate <= Date.now()) {
        weekBox.classList.add("life-grid__box--filled");
      }
      weekStartDate = nextWeekStartDate;

      // Add event listeners for hovering over the box
      weekBox.addEventListener("mouseover", (e) => {
        e.target.classList.add("life-grid__box--hovered");
        weekStats.innerHTML = getWeekStats(e.target.dataset);
      });
      weekBox.addEventListener("mouseout", (e) => {
        e.target.classList.remove("life-grid__box--hovered");
        weekStats.innerHTML = weekStatsDefaultHTML;
      });

      lifeGrid.appendChild(weekBox);
    }

    totalWeeksOverYears += weeksInAgeYear;
  }

  lifeGrid.dataset.totalWeeks = totalWeeksOverYears;
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

function getWeekStats(weekBoxData) {
  return `<p> Week no. (How much weeks you have used!): ${
    weekBoxData.weekNumber
  }</p>
  <p>Week Date: ${weekBoxData.weekStartDate} - ${weekBoxData.weekEndDate}</p>
  <p>Percent of Life spent: ${(
    (Number(weekBoxData.weekNumber) * 100) /
    Number(document.querySelector(".js-life-grid").dataset.totalWeeks)
  ).toFixed(2)}%`;
}

function showOutput() {
  const dob = document.querySelector(".js-dob");
  const lifeExpectancy = document.querySelector(".js-life-expectancy");

  genLifeGrid(dob.value, lifeExpectancy.valueAsNumber);
}

// Listen on user details form's button
const showBtn = document.querySelector(".js-btn");
showBtn.addEventListener("click", showOutput);

// Prevent form from submitting on enter or button click
document.querySelector(".js-input-form").addEventListener("submit", (event) => {
  event.preventDefault();
});
