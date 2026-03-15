 
const API_URL = "http://localhost:5000";

const params = new URLSearchParams(window.location.search);
const editId = params.get("id");


// ---------------- EDIT MODE ----------------
if (editId && document.getElementById("jobForm")) {

  document.getElementById("formTitle").innerText = "Edit Application";
  document.getElementById("submitBtn").innerText = "Update Application";

  fetch(`${API_URL}/applications/${editId}`)
    .then(res => res.json())
    .then(data => {

      if (!data || !data.length) return;

      const app = data[0];

      document.querySelector("[name='company_name']").value = app.company_name;
      document.querySelector("[name='role']").value = app.role;
      document.querySelector("[name='status']").value = app.status;

      if (document.getElementById("datePicker")) {
        setTimeout(() => {
          document.getElementById("datePicker")._flatpickr.setDate(app.applied_date);
        }, 100);
      }

    });

}


// ---------------- LOAD APPLICATIONS ----------------
async function loadApplications() {

  const table = document.querySelector("#applicationsTable");
  if (!table) return;

  const tableBody = table.querySelector("tbody");
  tableBody.innerHTML = "";

  const response = await fetch(`${API_URL}/applications`);
  const data = await response.json();

  data.forEach(app => {

    const formattedDate = new Date(app.applied_date).toLocaleDateString("en-IN");

    const row = `
      <tr>
        <td>${app.company_name}</td>
        <td>${app.role}</td>

        <td>
          <span class="status ${app.status.toLowerCase()}">
            ${app.status}
          </span>
        </td>

        <td>${formattedDate}</td>

        <td>
          <button onclick="editApplication(${app.id})" class="edit-btn">
            <i class="fa-solid fa-pen"></i>
          </button>

          <button onclick="deleteApplication(${app.id})" class="delete-btn">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;

    tableBody.innerHTML += row;

  });

}


// ---------------- STATUS COUNTS ----------------
async function loadStatusCounts() {

  const interviewElement = document.getElementById("interviews");
  const rejectedElement = document.getElementById("rejected");

  if (!interviewElement || !rejectedElement) return;

  const response = await fetch(`${API_URL}/stats/statusCounts`);
  const data = await response.json();

  interviewElement.innerText = data.Interview || 0;
  rejectedElement.innerText = data.Rejected || 0;

}


// ---------------- TOTAL COUNT ----------------
async function loadStats() {

  const totalElement = document.getElementById("totalCount");
  if (!totalElement) return;

  const response = await fetch(`${API_URL}/stats/total`);
  const data = await response.json();

  totalElement.innerText = data.total || 0;

}


// ---------------- TODAY COUNT ----------------
async function loadTodayStats() {

  const todayElement = document.getElementById("todayApps");
  if (!todayElement) return;

  const response = await fetch(`${API_URL}/stats/today`);
  const data = await response.json();

  todayElement.innerText = data.today || 0;

}


// ---------------- ADD / UPDATE APPLICATION ----------------
const form = document.getElementById("jobForm");

if (form) {

  form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const submitBtn = document.getElementById("submitBtn");

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    const url = editId
      ? `${API_URL}/applications/${editId}`
      : `${API_URL}/addApplication`;

    const method = editId ? "PUT" : "POST";

    submitBtn.innerHTML = "Saving...";
    submitBtn.disabled = true;

    await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    submitBtn.innerText = editId ? "Update Application" : "Add Application";
    submitBtn.disabled = false;

    form.reset();

    loadApplications();
    loadStats();
    loadTodayStats();

  });

}


// ---------------- DELETE APPLICATION ----------------
async function deleteApplication(id) {

  if (!confirm("Are you sure you want to delete this application?")) return;

  await fetch(`${API_URL}/applications/${id}`, {
    method: "DELETE"
  });

  loadApplications();
  loadStats();
  loadTodayStats();

}


// ---------------- EDIT REDIRECT ----------------
function editApplication(id) {

  window.location.href = `index.html?id=${id}`;

}


// ---------------- STATUS CHART ----------------
async function loadStatusChart() {

  const canvas = document.getElementById("applicationsChart");
  if (!canvas) return;

  const response = await fetch(`${API_URL}/stats/status`);
  const data = await response.json();

  const labels = data.map(item => item.status);
  const counts = data.map(item => Number(item.count));

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: counts,
        backgroundColor: [
          "#3b82f6",
          "#ef4444",
          "#10b981",
          "#f59e0b"
        ]
      }]
    }
  });

}


// ---------------- COMPANY AUTOCOMPLETE ----------------

const companyInput = document.querySelector("[name='company_name']");
const suggestionsBox = document.getElementById("companySuggestions");

if (companyInput) {

  companyInput.addEventListener("input", async function () {

    const query = this.value.trim();

    if (query.length < 2) {
      suggestionsBox.innerHTML = "";
      return;
    }

    const response = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${query}`
    );

    const companies = await response.json();

    suggestionsBox.innerHTML = "";

    companies.forEach(company => {

      const div = document.createElement("div");
      div.classList.add("suggestion-item");

      div.innerText = company.name;

      div.onclick = () => {
        companyInput.value = company.name;
        suggestionsBox.innerHTML = "";
      };

      suggestionsBox.appendChild(div);

    });

  });

}

// ---------------- KEYBOARD ACCESSIBILITY ----------------

let selectedIndex = -1;

const input = document.getElementById("companyInput");

if (input) {

  input.addEventListener("keydown", function (e) {

    const items = suggestionsBox.querySelectorAll("div");

    if (!items.length) return;

    if (e.key === "ArrowDown") {
      selectedIndex++;
    }

    if (e.key === "ArrowUp") {
      selectedIndex--;
    }

    if (e.key === "Enter" && selectedIndex > -1) {
      e.preventDefault();
      items[selectedIndex].click();
    }

    items.forEach(item => item.classList.remove("suggestion-active"));

    if (selectedIndex >= items.length) selectedIndex = 0;
    if (selectedIndex < 0) selectedIndex = items.length - 1;

    items[selectedIndex].classList.add("suggestion-active");

  });

}
//---------------- DATE PICKER ----------------
const dateInput = document.getElementById("datePicker");

if (dateInput) {
  flatpickr("#datePicker", {
    dateFormat: "d/m/Y",
    allowInput: true,
    clickOpens: true,
    position:"below"
  });
}
//---------SEARCH BUTTON----------

const searchInput = document.getElementById("searchInput");

if (searchInput) {

  searchInput.addEventListener("keyup", function () {

    const filter = this.value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " "); // converts multiple spaces → single space

    const rows = document.querySelectorAll("#applicationsTable tbody tr");

    rows.forEach(row => {

      const company = row.children[0].textContent
        .toLowerCase()
        .replace(/\s+/g, " ");

      const role = row.children[1].textContent
        .toLowerCase()
        .replace(/\s+/g, " ");

      if (company.includes(filter) || role.includes(filter)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }

    });

  });

}


function filterStatus(status) {

  const rows = document.querySelectorAll("#applicationsTable tbody tr");

  rows.forEach(row => {

    const rowStatus = row.children[2].innerText.trim();

    if (status === "all" || rowStatus.toLowerCase() === status.toLowerCase()) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }

  });

}

// ---------------- INITIAL LOAD ----------------
loadApplications();
loadStats();
loadTodayStats();
loadStatusChart();
loadStatusCounts();
 
