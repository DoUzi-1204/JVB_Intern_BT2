// --------Khởi tạo biến--------------
const monthView = document.getElementById("month-view");
const yearView = document.getElementById("year-view");
const decadeView = document.getElementById("decade-view");
const headerTitle = document.getElementById("header-title");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const fullDateSpan = document.getElementById("full-date");
const weekdayHeader = document.getElementById("weekday-header");

let currentDate = new Date();
let selectedDate = new Date();
let currentView = "month";
const today = new Date();

// Variables for infinite scrolling
let weeks = [];
let currentWeekIndex = 0;
let isScrolling = false;
let scrollStartDate = new Date();

function isSameDay(d1, d2) {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

function updateFullDate(date = selectedDate) {
  fullDateSpan.innerText = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function addWeeks(date, weeks) {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

function generateWeekData(startDate) {
  const week = [];
  const weekStart = getWeekStart(startDate);

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);

    const isToday = isSameDay(date, today);
    const isSelected = isSameDay(date, selectedDate);
    const isCurrentMonth = date.getMonth() === currentDate.getMonth();

    let classes = [];
    if (isToday) classes.push("today");
    if (isSelected) classes.push("selected");
    if (!isCurrentMonth) classes.push("dimmed");

    week.push({
      date: new Date(date),
      day: date.getDate(),
      classes: classes,
    });
  }

  return week;
}

function createWeekElement(weekData, weekIndex) {
  const weekRow = document.createElement("div");
  weekRow.classList.add("week-row");
  weekRow.dataset.weekIndex = weekIndex;

  weekData.forEach((dayData) => {
    const cell = document.createElement("div");
    cell.classList.add("calendar-cell");

    dayData.classes.forEach((cls) => {
      if (cls.trim()) cell.classList.add(cls.trim());
    });

    cell.innerText = dayData.day;

    cell.onclick = () => {
      document
        .querySelectorAll(".calendar-cell")
        .forEach((c) => c.classList.remove("selected"));

      selectedDate = new Date(dayData.date);
      cell.classList.add("selected");

      // updateFullDate(selectedDate);
    };

    weekRow.appendChild(cell);
  });

  return weekRow;
}

function updateHeader() {
  headerTitle.innerText = `${currentDate.toLocaleString("en-US", {
    month: "long",
  })} ${currentDate.getFullYear()}`;
}

function initializeInfiniteScroll() {
  weeks = [];
  monthView.innerHTML = "";

  // Start from current month's first week
  scrollStartDate = getWeekStart(currentDate);

  // Generate initial weeks with larger buffer for unlimited scroll
  const totalWeeks = 30; // Initial buffer
  const middleIndex = Math.floor(totalWeeks / 2);

  for (let i = -middleIndex; i < totalWeeks - middleIndex; i++) {
    const weekStartDate = addWeeks(scrollStartDate, i);
    const weekData = generateWeekData(weekStartDate);
    weeks.push(weekData);

    const weekElement = createWeekElement(weekData, i + middleIndex);
    monthView.appendChild(weekElement);
  }

  currentWeekIndex = middleIndex;

  // Scroll to current week
  const currentWeekElement = monthView.querySelector(
    `[data-week-index="${currentWeekIndex}"]`
  );
  if (currentWeekElement) {
    currentWeekElement.scrollIntoView({ behavior: "instant", block: "center" });
  }
}

function addWeekToTop() {
  const firstWeekDate = weeks[0][0].date;
  const newWeekStartDate = addWeeks(firstWeekDate, -1);
  const newWeekData = generateWeekData(newWeekStartDate);

  weeks.unshift(newWeekData);

  const newWeekElement = createWeekElement(newWeekData, 0);
  monthView.insertBefore(newWeekElement, monthView.firstChild);

  // Update week indices
  Array.from(monthView.children).forEach((child, index) => {
    child.dataset.weekIndex = index;
  });

  currentWeekIndex++;
}

function addWeekToBottom() {
  const lastWeekDate = weeks[weeks.length - 1][0].date;
  const newWeekStartDate = addWeeks(lastWeekDate, 1);
  const newWeekData = generateWeekData(newWeekStartDate);

  weeks.push(newWeekData);

  const newWeekElement = createWeekElement(newWeekData, weeks.length - 1);
  monthView.appendChild(newWeekElement);

  // Update week indices
  Array.from(monthView.children).forEach((child, index) => {
    child.dataset.weekIndex = index;
  });
}

function removeExcessWeeks() {
  // Keep a larger buffer to prevent scroll limitations
  const maxWeeks = 60; // Increased buffer

  if (weeks.length > maxWeeks) {
    const excess = weeks.length - maxWeeks;
    const excessTop = Math.floor(excess / 2);
    const excessBottom = excess - excessTop;

    // Only remove if we have too many weeks
    if (excessTop > 0) {
      for (let i = 0; i < excessTop; i++) {
        weeks.shift();
        monthView.removeChild(monthView.firstChild);
        currentWeekIndex--;
      }
    }

    if (excessBottom > 0) {
      for (let i = 0; i < excessBottom; i++) {
        weeks.pop();
        monthView.removeChild(monthView.lastChild);
      }
    }

    // Update week indices
    Array.from(monthView.children).forEach((child, index) => {
      child.dataset.weekIndex = index;
    });
  }
}

// Windows Date Picker style month determination
function determineDisplayMonth() {
  const monthCount = {};
  const viewTop = monthView.scrollTop;
  const viewBottom = viewTop + monthView.clientHeight;

  // Duyệt qua từng tuần đang hiển thị
  const visibleWeekElements = Array.from(monthView.children).filter(
    (weekElement) => {
      const weekTop = weekElement.offsetTop;
      const weekBottom = weekTop + weekElement.offsetHeight;
      return weekBottom > viewTop && weekTop < viewBottom;
    }
  );

  visibleWeekElements.forEach((weekElement) => {
    const cells = Array.from(weekElement.querySelectorAll(".calendar-cell"));

    cells.forEach((cell, index) => {
      const rect = cell.getBoundingClientRect();
      const parentRect = monthView.getBoundingClientRect();

      const fullyVisible =
        rect.top >= parentRect.top && rect.bottom <= parentRect.bottom;

      if (fullyVisible) {
        const weekIndex = parseInt(weekElement.dataset.weekIndex);
        const dayData = weeks[weekIndex][index];
        const monthKey = `${dayData.date.getFullYear()}-${dayData.date.getMonth()}`;
        monthCount[monthKey] = (monthCount[monthKey] || 0) + 1;
      }
    });
  });

  // Tìm tháng có nhiều ngày hiển thị đầy đủ nhất
  let maxCount = 0;
  let dominantMonth = null;

  for (const monthKey in monthCount) {
    if (monthCount[monthKey] > maxCount) {
      maxCount = monthCount[monthKey];
      dominantMonth = monthKey;
    }
  }

  if (dominantMonth) {
    const [year, month] = dominantMonth.split("-").map(Number);
    return new Date(year, month, 1);
  }

  return currentDate;
}

// --------Hiển thị giao diện tháng với scroll vô hạn-------
function renderMonthView(date) {
  currentDate = new Date(date);
  updateHeader();
  initializeInfiniteScroll();

  // Setup scroll event listener
  monthView.removeEventListener("scroll", handleScroll);
  monthView.addEventListener("scroll", handleScroll);
}

function handleScroll() {
  if (isScrolling) return;

  const scrollTop = monthView.scrollTop;
  const scrollHeight = monthView.scrollHeight;
  const clientHeight = monthView.clientHeight;

  // Add weeks when approaching edges
  if (scrollTop < clientHeight * 2) {
    for (let i = 0; i < 3; i++) addWeekToTop();
  }

  if (scrollTop + clientHeight > scrollHeight - clientHeight * 2) {
    for (let i = 0; i < 3; i++) addWeekToBottom();
  }

  // Remove excess weeks
  removeExcessWeeks();

  // Update header title based on Windows Date Picker logic
  const newDisplayMonth = determineDisplayMonth();
  if (
    newDisplayMonth.getFullYear() !== currentDate.getFullYear() ||
    newDisplayMonth.getMonth() !== currentDate.getMonth()
  ) {
    currentDate = newDisplayMonth;
    updateHeader();
  }
  // Cập nhật màu mờ/sáng dựa trên tháng hiển thị hiện tại
  document.querySelectorAll(".week-row").forEach((weekEl, weekIndex) => {
    const cells = weekEl.querySelectorAll(".calendar-cell");
    cells.forEach((cell, i) => {
      const dayData = weeks[weekIndex][i];
      const isSameMonth =
        dayData.date.getMonth() === currentDate.getMonth() &&
        dayData.date.getFullYear() === currentDate.getFullYear();

      if (isSameMonth) {
        cell.classList.remove("dimmed");
      } else {
        cell.classList.add("dimmed");
      }
    });
  });
}

// ----------Hiển thị giao diện năm----------
let yearRows = [];
let isYearScrolling = false;

function generateYearRow(baseYear, offset) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const row = document.createElement("div");
  row.classList.add("year-row");

  for (let i = 0; i < 4; i++) {
    const index = i + offset * 4;
    const realMonth = ((index % 12) + 12) % 12;
    const realYear = baseYear + Math.floor(index / 12);

    const cell = document.createElement("div");
    cell.classList.add("calendar-cell");
    cell.innerText = months[realMonth];

    if (realYear !== baseYear) cell.classList.add("dimmed");
    if (realYear === today.getFullYear() && realMonth === today.getMonth())
      cell.classList.add("today");
    if (
      realYear === selectedDate.getFullYear() &&
      realMonth === selectedDate.getMonth()
    )
      cell.classList.add("selected");

    cell.onclick = () => {
      currentDate = new Date(realYear, realMonth, 1);
      switchView("month");
    };

    row.appendChild(cell);
  }

  return row;
}

function renderYearView(date) {
  yearView.innerHTML = "";
  const baseYear = date.getFullYear();
  headerTitle.innerText = baseYear;
  yearRows = [];

  const totalRows = 30;
  const middle = Math.floor(totalRows / 2);

  for (let i = -middle; i <= middle; i++) {
    const row = generateYearRow(baseYear, i);
    yearRows.push({ row, offset: i });
    yearView.appendChild(row);
  }

  setTimeout(() => {
    const middleRow = yearView.querySelectorAll(".year-row")[middle];
    if (middleRow) {
      middleRow.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, 0);

  yearView.removeEventListener("scroll", handleYearScroll);
  yearView.addEventListener("scroll", handleYearScroll);
  updateYearHeader();
}

function handleYearScroll() {
  if (isYearScrolling) return;
  isYearScrolling = true;

  setTimeout(() => {
    const scrollTop = yearView.scrollTop;
    const clientHeight = yearView.clientHeight;
    const scrollHeight = yearView.scrollHeight;

    if (scrollTop < clientHeight * 2) {
      prependYearRows();
    }
    if (scrollTop + clientHeight > scrollHeight - clientHeight * 2) {
      appendYearRows();
    }

    updateYearHeader();
    isYearScrolling = false;
  }, 50);
}

function prependYearRows() {
  const firstVisibleRow = yearView.firstElementChild;
  const offsetBefore = firstVisibleRow?.getBoundingClientRect().top;

  const firstOffset = yearRows[0].offset;

  for (let i = 1; i <= 5; i++) {
    const row = generateYearRow(currentDate.getFullYear(), firstOffset - i);
    yearRows.unshift({ row, offset: firstOffset - i });
    yearView.insertBefore(row, yearView.firstChild);
  }

  if (offsetBefore !== undefined) {
    const offsetAfter = firstVisibleRow.getBoundingClientRect().top;
    yearView.scrollTop += offsetAfter - offsetBefore;
  }
}

function appendYearRows() {
  const lastOffset = yearRows[yearRows.length - 1].offset;

  for (let i = 1; i <= 5; i++) {
    const row = generateYearRow(currentDate.getFullYear(), lastOffset + i);
    yearRows.push({ row, offset: lastOffset + i });
    yearView.appendChild(row);
  }
}

function updateYearHeader() {
  const rows = Array.from(yearView.querySelectorAll(".year-row"));
  const viewTop = yearView.scrollTop;
  const viewBottom = viewTop + yearView.clientHeight;

  const visibleMonths = {};

  rows.forEach((row, rowIndex) => {
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;

    if (bottom > viewTop && top < viewBottom) {
      const cells = row.querySelectorAll(".calendar-cell");
      const rowData = yearRows[rowIndex];
      if (rowData) {
        const offset = rowData.offset;
        const baseYear = currentDate.getFullYear();

        cells.forEach((cell, cellIndex) => {
          const index = cellIndex + offset * 4;
          const realYear = baseYear + Math.floor(index / 12);
          visibleMonths[realYear] = (visibleMonths[realYear] || 0) + 1;
        });
      }
    }
  });

  let maxYear = currentDate.getFullYear();
  let maxCount = 0;
  for (const year in visibleMonths) {
    if (visibleMonths[year] > maxCount) {
      maxCount = visibleMonths[year];
      maxYear = parseInt(year);
    }
  }

  headerTitle.innerText = maxYear;

  rows.forEach((row, rowIndex) => {
    const rowData = yearRows[rowIndex];
    if (rowData) {
      const offset = rowData.offset;
      const cells = row.querySelectorAll(".calendar-cell");

      cells.forEach((cell, cellIndex) => {
        const index = cellIndex + offset * 4;
        const realMonth = ((index % 12) + 12) % 12;
        const realYear = currentDate.getFullYear() + Math.floor(index / 12);

        if (realYear === maxYear) {
          cell.classList.remove("dimmed");
        } else {
          cell.classList.add("dimmed");
        }
      });
    }
  });
}

// ---------Hiển thị giao diện thập kỷ----------
function renderDecadeView(date) {
  decadeView.innerHTML = "";
  const start = Math.floor(date.getFullYear() / 10) * 10;
  headerTitle.innerText = `${start} - ${start + 9}`;

  for (let i = -1; i < 15; i++) {
    const year = start + i;
    const cell = document.createElement("div");
    cell.classList.add("calendar-cell");

    if (i < 0 || i > 9) {
      cell.classList.add("dimmed");
    }

    if (year === today.getFullYear()) {
      cell.classList.add("today");
    }

    if (year === selectedDate.getFullYear()) {
      cell.classList.add("selected");
    }

    cell.innerText = year;
    cell.onclick = () => {
      currentDate.setFullYear(year);
      switchView("year");
    };

    decadeView.appendChild(cell);
  }
}

// -----------Chuyển view-----------
function switchView(view) {
  currentView = view;
  monthView.classList.add("hidden");
  yearView.classList.add("hidden");
  decadeView.classList.add("hidden");

  if (view === "month") {
    renderMonthView(currentDate);
    monthView.classList.remove("hidden");
    weekdayHeader.style.display = "flex";
  } else if (view === "year") {
    renderYearView(currentDate);
    yearView.classList.remove("hidden");
    weekdayHeader.style.display = "none";
  } else if (view === "decade") {
    renderDecadeView(currentDate);
    decadeView.classList.remove("hidden");
    weekdayHeader.style.display = "none";
  }
}

// --------------Click tiêu đề để đổi view-------------
headerTitle.addEventListener("click", () => {
  if (currentView === "month") {
    switchView("year");
  } else if (currentView === "year") {
    switchView("decade");
  }
});

// ---------------Nút prev/next----------------
prevBtn.onclick = () => {
  if (currentView === "month") {
    const target = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    scrollToMonth(target); // currentDate sẽ được cập nhật trong scrollToMonth
  } else if (currentView === "year") {
    currentDate.setFullYear(currentDate.getFullYear() - 1);
    switchView("year");
  } else if (currentView === "decade") {
    const start = Math.floor(currentDate.getFullYear() / 10) * 10;
    currentDate.setFullYear(start - 10);
    switchView("decade");
  }
};

nextBtn.onclick = () => {
  if (currentView === "month") {
    const target = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    scrollToMonth(target); // currentDate sẽ được cập nhật trong scrollToMonth
  } else if (currentView === "year") {
    currentDate.setFullYear(currentDate.getFullYear() + 1);
    switchView("year");
  } else if (currentView === "decade") {
    const start = Math.floor(currentDate.getFullYear() / 10) * 10;
    currentDate.setFullYear(start + 10);
    switchView("decade");
  }
};

function scrollToMonth(targetDate) {
  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();

  // Tìm ngày đầu và cuối của tháng
  const firstDay = new Date(targetYear, targetMonth, 1);
  const lastDay = new Date(targetYear, targetMonth + 1, 0);

  const startWeekDate = getWeekStart(firstDay);
  const endWeekDate = getWeekStart(lastDay);

  // Sinh thêm tuần nếu chưa đủ
  while (weeks.length === 0 || weeks[0][0].date > startWeekDate) {
    addWeekToTop();
  }
  while (weeks[weeks.length - 1][0].date < endWeekDate) {
    addWeekToBottom();
  }

  //  Cập nhật lại toàn bộ data-week-index để đảm bảo khớp
  Array.from(monthView.children).forEach((child, index) => {
    child.dataset.weekIndex = index;
  });

  // 🔍 Tìm tuần đầu tiên chứa ngày 1 của tháng
  const firstWeekIndex = weeks.findIndex((week) =>
    week.some(
      (day) =>
        day.date.getDate() === 1 &&
        day.date.getMonth() === targetMonth &&
        day.date.getFullYear() === targetYear
    )
  );

  if (firstWeekIndex !== -1) {
    //  Cuộn dòng đầu tiên của tháng lên đầu khung
    const weekElements = Array.from(monthView.children);
    const firstWeekEl = weekElements[firstWeekIndex];
    if (firstWeekEl) {
      firstWeekEl.scrollIntoView({ behavior: "instant", block: "start" });

      currentDate = new Date(targetYear, targetMonth, 1);
      updateHeader();

      // Cập nhật lại màu sáng/mờ cho các ngày
      setTimeout(() => {
        document.querySelectorAll(".week-row").forEach((weekEl, weekIndex) => {
          const cells = weekEl.querySelectorAll(".calendar-cell");
          cells.forEach((cell, i) => {
            const dayData = weeks[weekIndex][i];
            const isSameMonth =
              dayData.date.getMonth() === currentDate.getMonth() &&
              dayData.date.getFullYear() === currentDate.getFullYear();

            if (isSameMonth) {
              cell.classList.remove("dimmed");
            } else {
              cell.classList.add("dimmed");
            }
          });
        });
      }, 50); // nhỏ hơn để đảm bảo DOM đã cập nhật
    }
  }
}

// ----------Khởi tạo ban đầu----------
selectedDate = new Date();
currentDate = new Date(selectedDate);
updateFullDate(selectedDate);
switchView("month");
scrollToMonth(currentDate);

// focus

let duration = 30 * 60; // 30 phút ban đầu (tính bằng giây)
let remainingTime = duration;
let focusStarted = false;
let timerInterval = null;
let isPaused = false;

const countdownDisplay = document.getElementById("countdown-display");
const minusBtn = document.getElementById("minus-btn");
const plusBtn = document.getElementById("plus-btn");
const focusBtn = document.getElementById("focus-btn");
const focusRunning = document.getElementById("focus-running");
const resetBtn = document.getElementById("reset-btn");
const pauseBtn = document.getElementById("pause-btn");

// Hàm định dạng hiển thị
function formatDisplayTime(seconds) {
  if (focusStarted) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  } else {
    const mins = Math.floor(seconds / 60);
    return `${mins} mins`;
  }
}

// Cập nhật giao diện hiển thị thời gian
function updateCountdownDisplay() {
  countdownDisplay.textContent = formatDisplayTime(remainingTime);
}

// Tăng/giảm thời gian khi chưa bắt đầu
minusBtn.addEventListener("click", () => {
  if (!focusStarted && remainingTime > 60) {
    remainingTime -= 60;
    updateCountdownDisplay();
  }
});

plusBtn.addEventListener("click", () => {
  if (!focusStarted) {
    remainingTime += 60;
    updateCountdownDisplay();
  }
});

// Bắt đầu đếm ngược
focusBtn.addEventListener("click", () => {
  if (focusStarted) return;

  focusStarted = true;
  isPaused = false;

  focusBtn.classList.add("hidden");
  focusRunning.classList.remove("hidden");

  startCountdown();
});

// Bắt đầu đếm ngược
function startCountdown() {
  updateCountdownDisplay();

  timerInterval = setInterval(() => {
    if (!isPaused) {
      remainingTime--;
      updateCountdownDisplay();

      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        alert("Time's up!");
        resetCountdown();
      }
    }
  }, 1000);
}

// Reset toàn bộ
resetBtn.addEventListener("click", resetCountdown);

function resetCountdown() {
  clearInterval(timerInterval);
  focusStarted = false;
  isPaused = false;
  remainingTime = duration;

  focusRunning.classList.add("hidden");
  focusBtn.classList.remove("hidden");
  updateCountdownDisplay();
}

// Pause / Continue
pauseBtn.addEventListener("click", () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "▶" : "∥";
});

updateCountdownDisplay();
