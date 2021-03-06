"use strict";

const WEEKS_IN_YEAR = 52;
const DAYS_IN_WEEK = 7;

new fullpage("#fullpage", {
  anchors: ["start", "life-grid", "inspiration", "faq", "footer"],
  sectionsColor: ["#f8f8f8", "#f0f0f0", "#fcfcfc", "#f0f0f0", "#303030"],
  scrollBar: true,
  recordHistory: false,
  autoScrolling: true,
  fitToSection: true,

  onLeave: function (origin, destination, direction) {
    // index=2 denotes inspiration section
    if (origin.index <= 2 && destination.index > 2) {
      // When moving from inspiration section or before to a section after it,
      // disable autoScrolling so that long content can scroll normally
      fullpage_api.setAutoScrolling(false);
      // also disable fitToSection otherwise it won't allow to move down
      fullpage_api.setFitToSection(false);
    } else if (origin.index > 2 && destination.index <= 2) {
      // When moving from a section after inspiration section to it or before,
      // re-enable autoScrolling and fitToSection like it was before
      fullpage_api.setAutoScrolling(true);
      fullpage_api.setFitToSection(true);
    }
  },
});

class WeekStats {
  constructor() {
    // Save all nodes where data needs to be updated
    this.selectedWeekNum = document.querySelector(".js-selected-box__week-num");
    this.selectedWeekOrdSuffix = document.querySelector(
      ".js-selected-box__ordinal-suffix"
    );
    this.selectedAgeNum = document.querySelector(".js-selected-box__age-num");
    this.selectedAgeUnit = document.querySelector(".js-selected-box__age-unit");
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
    this.selectedWeekNum.textContent = weekBoxData.weekInYear;
    this.selectedWeekOrdSuffix.textContent = ordinalSuffixOf(
      weekBoxData.weekInYear
    );
    this.selectedAgeNum.textContent = weekBoxData.ageYear;
    this.selectedAgeUnit.textContent =
      weekBoxData.ageYear <= 1 ? "year" : "years";

    const formattedWeekStartDate = weekBoxData.weekStartDate.replace(
        /(\w+)\s(\w+)\s(\d+)\s(\w+)/g,
        "$1, $2 $3, $4"
      ),
      formattedWeekEndDate = weekBoxData.weekEndDate.replace(
        /(\w+)\s(\w+)\s(\d+)\s(\w+)/g,
        "$1, $2 $3, $4"
      );
    this.dateRange.textContent = `${formattedWeekStartDate} — ${formattedWeekEndDate}`;
    this.weekCount.textContent = weekBoxData.weekCount;

    const [percentInteger, percentFraction] = weekBoxData.lifePercent.split(
      "."
    );
    this.lifePercentInteger.textContent = percentInteger;
    this.lifePercentFraction.textContent = "." + percentFraction;

    const progress = -parseFloat(weekBoxData.lifePercent) / 100;
    this.lifeProgressBar.animate(progress);

    this.extraInfo.textContent = weekBoxData.extraInfo;
  }
}
const weekStats = new WeekStats();

const lifeGrid = document.querySelector(".js-life-grid__inner");

// Calculate the maximum dimensions of lifeGrid & save them as data attributes
const lifeGridCardStyle = getComputedStyle(
  document.querySelector(".js-life-grid-card")
);
const weekLabelStyle = getComputedStyle(
  document.querySelector(".life-grid__week-label")
);
const ageLabelStyle = getComputedStyle(
  document.querySelector(".life-grid__age-label")
);

const usedHeight =
  parseFloat(lifeGridCardStyle.paddingTop) +
  parseFloat(lifeGridCardStyle.paddingBottom) +
  parseFloat(weekLabelStyle.height);
lifeGrid.dataset.maxHeight =
  parseFloat(lifeGridCardStyle.maxHeight) - usedHeight;

const usedWidth =
  parseFloat(lifeGridCardStyle.paddingLeft) +
  parseFloat(lifeGridCardStyle.paddingRight) +
  parseFloat(ageLabelStyle.width);
lifeGrid.dataset.maxWidth = parseFloat(lifeGridCardStyle.maxWidth) - usedWidth;

// Populate the grid ----------------------------------------------------------
function genLifeGrid(dob, lifeExpectancy) {
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
  let birthday = new Date(dob);
  let daysInAgeYear,
    weeksInAgeYear,
    birthdayWeekDay,
    remDaysOverAgeYears = 0,
    totalWeeksOverYears = 0;
  const dateNow = new Date();

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

    let weekBox, weekEndDate, weekCount;
    for (let week = 1; week <= weeksInAgeYear; week++) {
      weekBox = document.createElement("div");
      weekBox.classList.add("life-grid__box");

      if (week === 1) {
        weekBox.classList.add("life-grid__box--row-start");
      }

      // Add weeks stats as data attribute to the box ---------------------
      weekBox.dataset.weekInYear = week;
      weekBox.dataset.ageYear = ageYear;

      weekBox.dataset.weekStartDate = weekStartDate.toDateString();

      weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + DAYS_IN_WEEK - 1);
      weekBox.dataset.weekEndDate = weekEndDate.toDateString();

      weekCount = totalWeeksOverYears + week;
      weekBox.dataset.weekCount = weekCount;

      // Set extra info as data attribute to the box
      if (week == 1 && ageYear == 0) {
        // 1st week of life
        weekBox.dataset.extraInfo = "Welcome to the land of living! 👶";
      } else if (week == 1) {
        // birthday week
        birthdayWeekDay = birthday.toLocaleString("en-us", { weekday: "long" });
        weekBox.dataset.extraInfo = `Yay! It's your Birthday this week's ${birthdayWeekDay} 🎉`;
      } else if (week == weeksInAgeYear && ageYear == lifeExpectancy - 1) {
        // last week of life
        weekBox.dataset.extraInfo = "Phew! time to take a break from living 👻";
      } else {
        // ordinary week
        weekBox.dataset.extraInfo =
          "One step closer to the ultimate DEADline! ⏳";
      }
      // ------------------------------------------------------------------

      // Fill the boxes based on current date
      if (compareDatesOnly(weekEndDate, dateNow) == -1) {
        // weekEndDate < dateNow
        weekBox.classList.add("life-grid__box--filled");
      } else {
        weekBox.classList.add("js-life-grid__box--unfilled");
      }
      weekStartDate.setDate(weekStartDate.getDate() + DAYS_IN_WEEK);

      lifeGrid.appendChild(weekBox);
    }

    // Increment birthday by an year
    birthday.setFullYear(birthday.getFullYear() + 1);

    // Keep adding weeks in each age year
    totalWeeksOverYears += weeksInAgeYear;
  }

  // Add life percentage to all week boxes
  const weekBoxes = document.querySelectorAll(".life-grid__box");
  for (let weekBox of weekBoxes) {
    weekBox.dataset.lifePercent = calculate_percent(
      weekBox.dataset.weekCount,
      totalWeeksOverYears
    );
  }

  // Set total weeks count in weekStats and save it as data attribute of lifeGrid
  weekStats.totalCount.textContent = totalWeeksOverYears;
  lifeGrid.dataset.totalWeeks = totalWeeksOverYears;

  const currentWeekBox = document.querySelector(".js-life-grid__box--unfilled");
  currentWeekBox.dataset.extraInfo = "Make best use of the PRESENT of Life 🎁";

  // Simulate click on the current week to initialize week stats
  currentWeekBox.classList.add("life-grid__box--clicked");
  weekStats.update(currentWeekBox.dataset);
}

lifeGrid.addEventListener("mouseover", (e) => {
  const target = e.target;
  // Handle event only when target is a box
  if (target.classList.contains("life-grid__box")) {
    // If exists, clear hover style from the box that was previously hovered
    const lastHoveredBox = document.querySelector(".life-grid__box--hovered");
    if (lastHoveredBox) {
      lastHoveredBox.classList.remove("life-grid__box--hovered");
    }

    // Style target box to be hovered unless it is also clicked
    if (!target.classList.contains("life-grid__box--clicked")) {
      target.classList.add("life-grid__box--hovered");
    }

    weekStats.update(target.dataset);
    // TODO: should there be a transition delay?
  }
});

lifeGrid.addEventListener("click", (e) => {
  const target = e.target;
  // Handle event only when target is a box
  if (target.classList.contains("life-grid__box")) {
    // If exists, clear click style from the box that was previously clicked
    const lastClickedBox = document.querySelector(".life-grid__box--clicked");
    if (lastClickedBox) {
      lastClickedBox.classList.remove("life-grid__box--clicked");
    }

    // Before adding click style, remove hover style that was added by mouseover
    if (target.classList.contains("life-grid__box--hovered")) {
      target.classList.remove("life-grid__box--hovered");
    }
    target.classList.add("life-grid__box--clicked");
  }
});

lifeGrid.addEventListener("mouseout", (e) => {
  const target = e.target;
  // Handle event only when the mouse left a box, but not for another box
  if (
    target.classList.contains("life-grid__box") &&
    !e.relatedTarget.classList.contains("life-grid__box")
  ) {
    // If exists, clear hover style from the box that was previously hovered
    const lastHoveredBox = document.querySelector(".life-grid__box--hovered");
    if (lastHoveredBox) {
      lastHoveredBox.classList.remove("life-grid__box--hovered");
    }

    // Update week stats data with the currently clicked box
    const lastClickedBox = document.querySelector(".life-grid__box--clicked");
    weekStats.update(lastClickedBox.dataset);
  }
});

function ordinalSuffixOf(num) {
  const j = num % 10,
    k = num % 100;
  if (j == 1 && k != 11) {
    return "st";
  }
  if (j == 2 && k != 12) {
    return "nd";
  }
  if (j == 3 && k != 13) {
    return "rd";
  }
  return "th";
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

  const appURL = window.location.href;
  const totalWeeksCount = lifeGrid.dataset.totalWeeks;

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

    eventSummary = `Week-${weekBox.dataset.weekInYear} of \
${weekBox.dataset.ageYear} years Age`;

    eventDescription = `By the end of this week, you'll use \
${weekBox.dataset.lifePercent}% of your Life by spending \
${weekBox.dataset.weekCount} out of ${totalWeeksCount} weeks. Make this \
week count by staying aware of the <a href="${appURL}">\
Limit of your Life</a>!`;

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

const dobInput = document.querySelector(".js-input-form__dob");
const lifeExpectancyInput = document.querySelector(".js-input-form__life-exp");

function showOutput() {
  genLifeGrid(dobInput.value, lifeExpectancyInput.valueAsNumber);
  setTimeout(createDownloadBtn, 0, generateICSText(), "limit-of-life.ics");
}

function calculateBoxSize(numCol, numRow) {
  // Calculate the ideal box height & width based on max height & width available
  const idealBoxHeight = Math.floor(
    parseFloat(lifeGrid.dataset.maxHeight) / numRow
  );
  const idealBoxWidth = Math.floor(
    parseFloat(lifeGrid.dataset.maxWidth) / numCol
  );
  console.log("h: " + idealBoxHeight + ", w: " + idealBoxWidth);

  // Choose minimum of them so that total height and total width of all boxes
  // remains at most lifeGrid's height and width, respectively
  const boxSize =
    idealBoxHeight <= idealBoxWidth ? idealBoxHeight : idealBoxWidth;
  return boxSize;
}

// Handle form submission on client-side only
document.querySelector(".js-input-form").addEventListener("submit", (e) => {
  // Prevent form from submitting on enter or button click and show output
  e.preventDefault();

  // Hide life-grid empty prompt and show the main life-grid section
  document.querySelector(".js-life-grid-empty").style.display = "none";
  document.querySelector(".js-life-grid-section").style.visibility = "visible";

  // Scroll-down to life-grid section
  fullpage_api.moveTo("life-grid");

  // Add parameters to current url as query string without reloading page
  // This will update all href to include user-specific parameters
  const url = new URL(window.location);
  url.searchParams.set(dobInput.name, dobInput.value);
  url.searchParams.set(lifeExpectancyInput.name, lifeExpectancyInput.value);
  window.history.pushState({}, "", url);

  // Update life grid, week stats and calendar cards (core app logic)
  showOutput();
});

// Custom validation for edge cases in Life Expectancy Input
lifeExpectancyInput.addEventListener("input", (e) => {
  if (
    dobInput.validity.valid && // DOB is necessary for validating life expectancy
    !lifeExpectancyInput.validity.rangeUnderflow && // to show default message when < 1
    !lifeExpectancyInput.validity.stepMismatch // to show default message when float value
  ) {
    const dob = dobInput.valueAsDate,
      lifeExpectancy = lifeExpectancyInput.valueAsNumber,
      age = calculateAge(dob);
    if (lifeExpectancy <= age) {
      // life expectancy should be > Age (calculated from DOB)
      lifeExpectancyInput.setCustomValidity(
        "Whoa! Are you a Ghost? Life expectancy should be at least 1 year more than your age."
      );
    } else if (lifeExpectancy > 100) {
      // life expectancy should be <= 100 so that week boxes don't look too small
      lifeExpectancyInput.setCustomValidity(
        "Let's be honest! Life expectancy can be at most 100 years."
      );
    } else {
      // Clear validation message
      lifeExpectancyInput.setCustomValidity("");
    }
  }
});

// Custom validation in DOB Input when date is in future
dobInput.addEventListener("input", (e) => {
  if (
    !dobInput.validity.valueMissing && // to show default msg when not entered
    !dobInput.validity.rangeUnderflow // to show default msg when underflow
  ) {
    const dob = dobInput.valueAsDate,
      dateNow = new Date();

    if (compareDatesOnly(dob, dateNow) == 1) {
      // dob > dateNow
      dobInput.setCustomValidity(
        "Welcome to the past time-traveler! DOB cannot be a date in future."
      );
    } else {
      dobInput.setCustomValidity("");
    }
  }
});

function calculateAge(dob) {
  const dateNow = new Date();

  const birthdayThisYear = new Date(dob);
  birthdayThisYear.setFullYear(dateNow.getFullYear());

  if (compareDatesOnly(birthdayThisYear, dateNow) < 1) {
    // birthdayThisYear <= dateNow
    return dateNow.getFullYear() - dob.getFullYear();
  } else {
    return dateNow.getFullYear() - dob.getFullYear() - 1;
  }
}

function compareDatesOnly(date1, date2) {
  // Discard time information when comparing Dates
  const utcDate1 = Date.UTC(
    date1.getFullYear(),
    date1.getMonth(),
    date1.getDate()
  );
  const utcDate2 = Date.UTC(
    date2.getFullYear(),
    date2.getMonth(),
    date2.getDate()
  );
  if (utcDate1 > utcDate2) {
    return 1;
  } else if (utcDate1 == utcDate2) {
    return 0;
  } else {
    return -1;
  }
}

// Open how to use calendar FAQ when clicking help btn on calendar card
document.querySelector(".js-cal-help-btn").addEventListener("click", (e) => {
  fullpage_api.moveTo("faq");

  const accordionToggle = document.querySelector(".js-cal-file-accordion");
  if (!accordionToggle.classList.contains("accordion__toggle--expanded")) {
    accordionToggle.click();
  }
});

// Alert user to use computer if using smaller device (<=1000px)
document.addEventListener("DOMContentLoaded", (e) => {
  if (window.matchMedia("only screen and (max-width: 1000px)").matches) {
    alert(`Sorry, this web application is not yet designed for smaller devices.\n
Please open this on your computer for best experience!`);
  }
});

// Use parameters in url (if valid) to auto-submit form to directly open life-grid
document.addEventListener("DOMContentLoaded", (e) => {
  const url = new URL(window.location);
  const dobValue = url.searchParams.get("DOB");
  const lifeExpectancyValue = url.searchParams.get("lifeExpectancy");

  // If both values are not null (since both are required)
  if (dobValue && lifeExpectancyValue) {
    window.location.hash = ""; // to stay on starting section if invalid values

    // input them in corresponding form controls
    dobInput.value = dobValue;
    dobInput.dispatchEvent(new Event("input")); // to trigger validation
    lifeExpectancyInput.value = lifeExpectancyValue;
    lifeExpectancyInput.dispatchEvent(new Event("input")); // to trigger validation

    // Click btn to validate form final time before triggering submit event on it
    document.querySelector(".js-input-form__btn").click();
  }
});

// Sidebar Control -----------------------------------------------------------
const sidebar = document.querySelector(".js-sidebar");
sidebar.dataset.openBtnClicked = "false"; // to track if sidebar btn was clicked

document
  .querySelector(".js-sidebar-open-btn")
  .addEventListener("click", (e) => {
    sidebar.style.display = "flex"; // open sidebar
    sidebar.dataset.openBtnClicked = "true";
  });

document
  .querySelector(".js-sidebar__close-btn")
  .addEventListener("click", (e) => {
    sidebar.style.display = "none"; // close sidebar
  });

document.addEventListener("click", (e) => {
  if (sidebar.dataset.openBtnClicked === "true") {
    // Prevent executing this listener just after clicking sidebar btn
    // because event will bubble upto here
    sidebar.dataset.openBtnClicked = "false";
    return;
  }

  if (
    getComputedStyle(sidebar).display === "flex" && // sidebar is open
    !sidebar.contains(e.target) // click was not within sidebar
  )
    sidebar.style.display = "none"; // close sidebar
});

// FAQ Accordions control ------------------------------------------------
document.querySelector(".js-faq").addEventListener("click", (e) => {
  const accordionToggle = e.target.closest(".js-accordion__toggle");

  // Click was not inside an accordion toggle btn
  if (!accordionToggle) return;

  if (accordionToggle.classList.contains("accordion__toggle--expanded")) {
    // Clicked accordion was already expanded, so collapse it
    collapseAccordion(accordionToggle);
  } else {
    // Find the current expanded accordion
    const activeAccordionToggle = e.currentTarget.querySelector(
      ".accordion__toggle--expanded"
    );
    // If exists, collapse it
    if (activeAccordionToggle) collapseAccordion(activeAccordionToggle);

    // Expand the clicked accordion
    expandAccordion(accordionToggle);
  }
});

function expandAccordion(accordionToggle) {
  accordionToggle.classList.add("accordion__toggle--expanded");

  const accordionStateIcon = accordionToggle.querySelector(
    ".js-accordion__state-icon"
  );
  accordionStateIcon.classList.remove("fa-plus");
  accordionStateIcon.classList.add("fa-minus");

  const accordionPanel = accordionToggle.nextElementSibling;
  accordionPanel.style.maxHeight = accordionPanel.scrollHeight + "px";
}

function collapseAccordion(accordionToggle) {
  accordionToggle.classList.remove("accordion__toggle--expanded");

  const accordionStateIcon = accordionToggle.querySelector(
    ".js-accordion__state-icon"
  );
  accordionStateIcon.classList.remove("fa-minus");
  accordionStateIcon.classList.add("fa-plus");

  const accordionPanel = accordionToggle.nextElementSibling;
  accordionPanel.style.maxHeight = null;
}
