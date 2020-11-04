"use strict";

const WEEKS_IN_YEAR = 52;
const DAYS_IN_WEEK = 7;

class WeekStats {
  constructor() {
    // Save all nodes where data needs to be updated
    this.dateRange = document.querySelector(".js-week-stats__date-range");
    this.weekCount = document.querySelector(".js-week-stats__week-count");
    this.totalCount = document.querySelector(".js-week-stats__total-count");
    this.lifePercentInteger = document.querySelector(
      ".js-life-progress__percent--integer"
    );
    this.lifePercentFraction = document.querySelector(
      ".js-life-progress__percent--fraction"
    );
    this.extraInfo = document.querySelector(".js-week-stats__extra-info");

    // Use ProgressBar.js to create an object from SVG path of arc
    const progressArcPath = document.querySelector(".life-progress__arc");
    this.lifeProgressBar = new window.ProgressBar.Path(progressArcPath, {
      duration: 100, // <---- should match with hover delay?
    });
  }

  update(weekBoxData) {
    this.dateRange.textContent = `${weekBoxData.weekStartDate} — ${weekBoxData.weekEndDate}`;
    this.weekCount.textContent = weekBoxData.weekNumber;

    const [percentInteger, percentFraction] = weekBoxData.lifePercent.split(
      "."
    );
    this.lifePercentInteger.textContent = percentInteger;
    this.lifePercentFraction.textContent = "." + percentFraction;

    const progress = -parseFloat(weekBoxData.lifePercent) / 100;
    this.lifeProgressBar.animate(progress);
  }
}
const weekStats = new WeekStats();

// Populate the grid
function genLifeGrid(dob, lifeExpectancy) {
  const lifeGrid = document.querySelector(".js-life-grid__inner");
  lifeGrid.innerHTML = ""; // Clear all child nodes

  const numCol = WEEKS_IN_YEAR + 1 + 1; // + 1 for leap week box, + 1 for age marker
  const numRow = lifeExpectancy + 1; // + 1 for week marker

  // Set CSS properties dependent on number of rows and columns in grid
  lifeGrid.style.setProperty("--num-col", numCol);
  lifeGrid.style.setProperty("--num-row", numRow);
  lifeGrid.style.setProperty(
    "--box-size",
    calculateBoxSize(numCol, numRow) + "px"
  );

  // Show week markers
  let weekMarker;
  for (let weekNum = 1; weekNum <= WEEKS_IN_YEAR; weekNum += 3) {
    weekMarker = document.createElement("div");
    weekMarker.classList.add("life-grid__marker", "life-grid__marker--week");

    weekMarker.style.gridColumn = `${weekNum + 1} / ${weekNum + 2}`;
    weekMarker.textContent = weekNum;

    lifeGrid.appendChild(weekMarker);
  }

  // Show age markers
  let ageMarker;
  for (let ageYear = 0; ageYear < lifeExpectancy; ageYear += 5) {
    ageMarker = document.createElement("div");
    ageMarker.classList.add("life-grid__marker", "life-grid__marker--age");

    ageMarker.style.gridRow = `${ageYear + 2} / ${ageYear + 3}`;
    ageMarker.textContent = ageYear;

    lifeGrid.appendChild(ageMarker);
  }

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

    let weekBox, weekEndDate, weekNumber;
    for (let week = 1; week <= weeksInAgeYear; week++) {
      weekBox = document.createElement("div");
      weekBox.classList.add("life-grid__box");

      if (week === 1) {
        weekBox.classList.add("life-grid__box--row-start");
      }

      // Add weeks stats as data attribute to the box
      weekBox.dataset.weekStartDate = weekStartDate.toDateString();

      weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + DAYS_IN_WEEK - 1);
      weekBox.dataset.weekEndDate = weekEndDate.toDateString();

      weekNumber = totalWeeksOverYears + week;
      weekBox.dataset.weekNumber = weekNumber;

      // Fill the boxes based on current date
      if (weekEndDate < Date.now()) {
        weekBox.classList.add("life-grid__box--filled");
      } else {
        weekBox.classList.add("js-life-grid__box--unfilled");
      }
      weekStartDate.setDate(weekStartDate.getDate() + DAYS_IN_WEEK);

      // Add event listener for hovering over the box
      weekBox.addEventListener("mouseover", (e) => {
        // Clear last box that was styled to be hover
        document
          .querySelector(".life-grid__box--hovered")
          .classList.remove("life-grid__box--hovered");

        e.target.classList.add("life-grid__box--hovered");
        weekStats.update(e.target.dataset);
        // TODO: should there be a transition delay?
      });

      lifeGrid.appendChild(weekBox);
    }

    totalWeeksOverYears += weeksInAgeYear;
  }

  // Add life percentage to all week boxes
  const weekBoxes = document.querySelectorAll(".life-grid__box");
  for (let weekBox of weekBoxes) {
    weekBox.dataset.lifePercent = calculate_percent(
      weekBox.dataset.weekNumber,
      totalWeeksOverYears
    );
  }

  // Save total weeks count as lifeGrid data attribute
  lifeGrid.dataset.totalWeeks = totalWeeksOverYears;

  // Initialize Week Stats card with current week's data
  weekStats.totalCount.textContent = totalWeeksOverYears;
  const currentWeekBox = document.querySelector(".js-life-grid__box--unfilled");
  currentWeekBox.classList.add("life-grid__box--hovered");
  weekStats.update(currentWeekBox.dataset);
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

function generateICSText() {
  // <----- iterate over weekboxes starting from the unfilled one, then fetch data from it and create entries
  let calendarText = `BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0`;

  const dateNow = new Date();
  const eventDateStamp = dateNow
    .toISOString()
    .replaceAll(/-|:/g, "")
    .replace(/(.*)\..*(Z)$/g, "$1$2");

  const upcomingWeekBoxes = document.querySelectorAll(
    ".js-life-grid__box--unfilled"
  );

  const appURL = "https://github.com";

  let weekStartDate,
    eventStartDate,
    eventEndDate,
    eventUID,
    eventSummary,
    eventDescription,
    eventEntry;

  for (let weekBox of upcomingWeekBoxes) {
    weekStartDate = new Date(weekBox.dataset.weekStartDate);
    eventStartDate = getOnlyDateInISO(weekStartDate);

    weekStartDate.setDate(weekStartDate.getDate() + 1);
    eventEndDate = getOnlyDateInISO(weekStartDate);

    // not for now, since can generate
    // eventUID =

    eventSummary = `Week-${weekBox.dataset.weekNumber} of your Life!`;
    eventDescription = `By the end of this week, you'll use \
${weekBox.dataset.lifePercent}% of your Life. Make sure you are not trapped \
in the illusion of forever and are aware about the <a href="${appURL}">\
Limit of Your Life</a>.`;

    eventEntry = `
BEGIN:VEVENT
DTSTART;VALUE=DATE:${eventStartDate}
DTEND;VALUE=DATE:${eventEndDate}
DTSTAMP:${eventDateStamp}
DESCRIPTION:${eventDescription}
LOCATION:
STATUS:CONFIRMED
SUMMARY:${eventSummary}
END:VEVENT`;

    calendarText += eventEntry;
  }
  calendarText += "\nEND:VCALENDAR";
  return calendarText;
}

function createDownloadBtn(file_text, file_name) {
  const a = document.querySelector(".js-download-btn");
  const file = new Blob([file_text], { type: "text/calendar" });
  a.href = URL.createObjectURL(file);
  a.download = file_name;
}

function getOnlyDateInISO(date) {
  // Discard local time info and create a UTC date for exact same date
  // (that's why give time 00:00:00)
  const utcDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
  );
  // Now converting this to ISO will keep the date same
  return utcDate.toISOString().replaceAll(/-|T.*Z/g, "");
}

function calculate_percent(number, total) {
  return ((Number(number) * 100) / Number(total)).toFixed(2);
}

function showOutput() {
  const dob = document.querySelector(".js-dob");
  const lifeExpectancy = document.querySelector(".js-life-expectancy");

  genLifeGrid(dob.value, lifeExpectancy.valueAsNumber);
  setTimeout(createDownloadBtn, 0, generateICSText(), "limit-of-life.ics");
}

function calculateBoxSize(numCol, numRow) {
  // Calculate the size of box such that entire grid can fit in viewport height
  // while making sure that it never occupies more than 40% of viewport width
  const idealBoxHeight = Math.floor(
    (document.documentElement.clientHeight * 0.94) / numRow
  ); // 0.94 to accommodate week and age labels + grid padding
  const idealBoxWidth = Math.floor(
    (document.documentElement.clientWidth * 0.4) / numCol
  );

  console.log("h: " + idealBoxHeight + ", w: " + idealBoxWidth);
  const boxSize =
    idealBoxHeight <= idealBoxWidth ? idealBoxHeight : idealBoxWidth;
  return boxSize;
}

// Listen on user details form's button
const showBtn = document.querySelector(".js-btn");
showBtn.addEventListener("click", showOutput);

// Prevent form from submitting on enter or button click
document.querySelector(".js-input-form").addEventListener("submit", (event) => {
  event.preventDefault();
});

const howToAccordion = document.querySelector(".accordion");
const panel = document.querySelector(".panel");

howToAccordion.addEventListener("click", (e) => {
  e.target.classList.toggle("active");
  if (panel.style.maxHeight) {
    panel.style.maxHeight = null;
  } else {
    panel.style.maxHeight = panel.scrollHeight + "px";
  }
});
