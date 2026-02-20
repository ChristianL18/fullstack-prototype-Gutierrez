// STEP 1: SETUP VARIABLES

// This stores the current logged-in user (null = not logged in)
let currentUser = null;

// This is the key we use to save data in localStorage
const STORAGE_KEY = "ipt_demo_v2";

// This is our "database" - stored in browser's localStorage
window.db = {};

// STEP 2: LOAD DATA FROM STORAGE

// This runs when the page loads
// It loads saved data or creates default data
function loadFromStorage() {
  // Try to get saved data from localStorage
  const rawData = localStorage.getItem(STORAGE_KEY);
  
  if (rawData) {
    // If data exists, parse it from JSON string to object
    window.db = JSON.parse(rawData);
  } else {
    // If no data exists, create default data
    window.db = {
      // Default admin account
      accounts: [
        {
          firstName: "kingkoyAdmin",
          lastName: "tot",
          email: "kingkoy@example.com",
          password: "hello123!",
          role: "admin",
          verified: true
        }
      ],
      // Default departments
      departments: [
        { id: 1, name: "Engineering", description: "Software development team" },
        { id: 2, name: "HR", description: "Human resources team" }
      ],
      // Empty lists for employees and requests
      employees: [],
      requests: []
    };
    // Save the default data
    saveToStorage();
  }
}

// STEP 3: SAVE DATA TO STORAGE

// This saves our database to localStorage
function saveToStorage() {
  // Convert object to JSON string and save
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

// STEP 4: NAVIGATION (ROUTING)

// Change the URL hash to navigate to a page
function navigateTo(hash) {
  window.location.hash = hash;
}

// This function runs when URL hash changes
// It shows/hides pages based on the URL
function handleRouting() {
  // Get the current hash (default to "#/" if none)
  let hash = window.location.hash || "#/";
  
  // Hide all pages first
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  // Convert hash to page ID
  // Example: "#/login" becomes "login-page"
  const pageName = hash.replace("#/", "");
  const pageId = pageName + "-page";
  
  // Find the page element
  let page = document.getElementById(pageId);
  
  // If page not found, show home page
  if (!page) {
    page = document.getElementById("home-page");
  }

    if (pageName === "login" && !currentUser) {
    const verifiedMessage = document.getElementById("verified-message");
    if (verifiedMessage) {
      verifiedMessage.style.display = "none";
    }
  }

  // SECURITY: Check if user needs to be logged in
  const protectedPages = ["profile", "accounts", "employees", "department", "requests"];
  
  if (!currentUser && protectedPages.includes(pageName)) {
    // Not logged in - redirect to login
    navigateTo("#/login");
    return;
  }

  // SECURITY: Check if user needs admin role
  const adminOnlyPages = ["accounts", "employees", "department"];
  
  if (currentUser && currentUser.role !== "admin" && adminOnlyPages.includes(pageName)) {
    // Not admin - redirect to home
    navigateTo("#/");
    return;
  }

  // Show the page
  page.classList.add("active");
  
  // Call render functions based on page
  if (pageName === "profile") {
    renderProfile();
  }
  if (pageName === "accounts") {
    renderAccountsList();
  }
  if (pageName === "department") {
    renderDepartmentsList();
  }
  if (pageName === "employees") {
    renderEmployeesTable();
  }
  if (pageName === "requests") {
    renderRequestsTable();
  }
  
  // SPECIAL: Show email on verify-email page
  if (pageName === "verify-email") {
    const emailDisplay = document.getElementById("verify-email-display");
    const unverifiedEmail = localStorage.getItem("unverified_email");
    if (emailDisplay && unverifiedEmail) {
      emailDisplay.innerText = unverifiedEmail;
    }
  }
}

// Listen for URL hash changes
window.addEventListener("hashchange", handleRouting);

// STEP 5: AUTHENTICATION STATE

// This updates the UI based on login state
function setAuthState(isLoggedIn, user = null) {
  // Store the current user
  currentUser = user;

  // Update body classes for CSS styling
  document.body.classList.toggle("authenticated", isLoggedIn);
  document.body.classList.toggle("not-authenticated", !isLoggedIn);

  // Add admin class if user is admin
  if (user && user.role === "admin") {
    document.body.classList.add("is-admin");
  } else {
    document.body.classList.remove("is-admin");
  }

  // Update navigation to show username
  const navUsername = document.getElementById("nav-username");
  if (navUsername && user) {
    navUsername.innerText = user.firstName;
  }
}


// STEP 6: LOGIN FUNCTION

function handleLogin() {
  // Get input values
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  // Validate inputs
  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  // Find user in our database
  const user = window.db.accounts.find(account => 
    account.email === email && 
    account.password === password &&
    account.verified === true
  );

  if (user) {
    // Login successful!
    // Save a fake "auth token" (just the email)
    localStorage.setItem("auth_token", user.email);
    
    // Update the UI state
    setAuthState(true, user);
    
    // Navigate to profile page
    navigateTo("#/profile");
    
    alert("Login successful! Welcome, " + user.firstName);
  } else {
    // Login failed
    alert("Invalid email or password, or account not verified");
  }
}

// STEP 7: REGISTER FUNCTION

function handleRegister() {
  // Get input values
  const firstName = document.getElementById("reg-firstname").value;
  const lastName = document.getElementById("reg-lastname").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  // Validate inputs
  if (!firstName || !lastName || !email || !password) {
    alert("Please fill in all fields");
    return;
  }

  // Validate password length (min 6 chars)
  if (password.length < 6) {
    alert("Password must be at least 6 characters");
    return;
  }

  // Check if email already exists
  const existingUser = window.db.accounts.find(account => 
    account.email === email
  );

  if (existingUser) {
    alert("Email already registered");
    return;
  }

  // Create new user
  const newUser = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password,
    role: "user", // Default role is "user"
    verified: false // Needs verification
  };

  // Add to database
  window.db.accounts.push(newUser);
  saveToStorage();

  // Store email in localStorage for verification
  localStorage.setItem("unverified_email", email);

  // Show verification page
  alert("Registration successful! Please verify your email.");
  navigateTo("#/verify-email");
}

// STEP 8: EMAIL VERIFICATION FUNCTION

function handleVerify() {
  // In a real app, this would check a verification code
  // For this demo, we just mark the user as verified
  
  // Get the unverified email from localStorage
  const unverifiedEmail = localStorage.getItem("unverified_email");
  
  if (!unverifiedEmail) {
    alert("No pending verification. Please register first.");
    navigateTo("#/register");
    return;
  }
  
  // Find the account by email
  const user = window.db.accounts.find(account => 
    account.email === unverifiedEmail
  );
  
  if (user) {
    user.verified = true;
    saveToStorage();
    
    // Clear the unverified email from localStorage
    localStorage.removeItem("unverified_email");
    
    // Show the verified message on login page
    const verifiedMessage = document.getElementById("verified-message");
    if (verifiedMessage) {
      verifiedMessage.style.display = "block";
    }
    
    alert("Email verified! You can now login.");
    navigateTo("#/login");
  } else {
    alert("Account not found. Please register again.");
    navigateTo("#/register");
  }
}

// STEP 9: LOGOUT FUNCTION

function handleLogout() {
  // Clear the auth token
  localStorage.removeItem("auth_token");
  
  // Reset the UI state
  setAuthState(false, null);
  
  // Navigate to home
  navigateTo("#/");
  
  alert("You have been logged out");
}

// STEP 10: PAGE INITIALIZATION

// This runs when the page finishes loading
document.addEventListener("DOMContentLoaded", function() {
  // Load data from storage
  loadFromStorage();
  
  // Check if user is already logged in (has auth token)
  const savedToken = localStorage.getItem("auth_token");
  if (savedToken) {
    // Find the user by email
    const user = window.db.accounts.find(account => 
      account.email === savedToken
    );
    if (user) {
      setAuthState(true, user);
    }
  }
  
  // Setup routing
  handleRouting();
  
  // Add click handlers to buttons
  setupButtonHandlers();
});

// STEP 11: BUTTON HANDLERS

function setupButtonHandlers() {
  // Get Started button - goes to register page
  const getStartedBtn = document.querySelector(".getstarted-btn");
  if (getStartedBtn) {
    getStartedBtn.onclick = function() {
      navigateTo("#/register");
    };
  }

  // Login button
  const loginBtn = document.querySelector("#login-page .btn-primary");
  if (loginBtn) {
    loginBtn.onclick = handleLogin;
  }

  // Register button
  const registerBtn = document.querySelector("#register-page .btn-success");
  if (registerBtn) {
    registerBtn.onclick = handleRegister;
  }

  // Verify button
  const verifyBtn = document.querySelector("#verify-email-page .btn-success");
  if (verifyBtn) {
    verifyBtn.onclick = handleVerify;
  }

  // Logout link in dropdown
  const logoutLink = document.querySelector(".dropdown-item[href='#logout']");
  if (logoutLink) {
    logoutLink.onclick = function(e) {
      e.preventDefault();
      handleLogout();
    };
  }

  // Add Account button
  const addAccountBtn = document.querySelector("#accounts-page .btn-success");
  if (addAccountBtn) {
    addAccountBtn.onclick = function() {
      alert("Add Account - Use Register page to create new accounts");
    };
  }

  // Add Department button
  const addDeptBtn = document.querySelector("#department-page .btn-success");
  if (addDeptBtn) {
    addDeptBtn.onclick = addDepartment;
  }

  // Initialize request modal when opened
  const requestModalEl = document.getElementById("requestModal");
  if (requestModalEl) {
    requestModalEl.addEventListener("show.bs.modal", initRequestModal);
  }

  // Navigation links
  setupNavigationLinks();
}

// STEP 12: NAVIGATION LINKS

function setupNavigationLinks() {
  // Login link in nav
  const loginLink = document.querySelector('.links a[href="#login"]');
  if (loginLink) {
    loginLink.onclick = function(e) {
      e.preventDefault();
      navigateTo("#/login");
    };
  }

  // Register link in nav
  const registerLink = document.querySelector('.links a[href="#register"]');
  if (registerLink) {
    registerLink.onclick = function(e) {
      e.preventDefault();
      navigateTo("#/register");
    };
  }

  // Dropdown menu links
  const dropdownLinks = document.querySelectorAll(".dropdown-item");
  dropdownLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (href && href.startsWith("#") && href !== "#logout") {
      link.onclick = function(e) {
        e.preventDefault();
        const page = href.replace("#", "");
        navigateTo("#/" + page);
      };
    }
  });
}

// HELPER FUNCTIONS (can be called from HTML onclick)

// Go to register page - can be used with onclick="goToRegister()"
function goToRegister() {
  navigateTo("#/register");
}
// Go to login page - can be used with onclick="goToLogin()"
function goToLogin() {
  navigateTo("#/login");
}

// PHASE 5: PROFILE PAGE RENDERING


function renderProfile() {
  if (!currentUser) return;
  
  const profileSection = document.querySelector("#profile-page .insideprofile");
  if (profileSection) {
    profileSection.innerHTML = `
      <h3>${currentUser.firstName} ${currentUser.lastName}</h3>
      <p><strong>Email:</strong> <span>${currentUser.email}</span></p>
      <p><strong>Role:</strong> <span>${currentUser.role}</span></p>
      <button type="button" class="btn btn-outline-primary" onclick="alert('Edit Profile - Not implemented')">Edit Profile</button>
    `;
  }
}

// PHASE 6: ADMIN CRUD - ACCOUNTS

function renderAccountsList() {
  const tbody = document.querySelector("#accounts-page tbody");
  if (!tbody) return;
  
  tbody.innerHTML = "";
  
  window.db.accounts.forEach((account, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${account.firstName} ${account.lastName}</td>
      <td>${account.email}</td>
      <td>${account.role}</td>
      <td>${account.verified ? "✅" : "❌"}</td>
      <td>
        <button class="btn btn-outline-primary btn-sm" onclick="editAccount(${index})">Edit</button>
        <button class="btn btn-outline-warning btn-sm" onclick="resetPassword(${index})">Reset PW</button>
        <button class="btn btn-outline-danger btn-sm" onclick="deleteAccount(${index})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editAccount(index) {
  const account = window.db.accounts[index];
  const newFirstName = prompt("First Name:", account.firstName);
  const newLastName = prompt("Last Name:", account.lastName);
  const newRole = prompt("Role (admin/user):", account.role);
  
  if (newFirstName && newLastName && newRole) {
    account.firstName = newFirstName;
    account.lastName = newLastName;
    account.role = newRole;
    saveToStorage();
    renderAccountsList();
    alert("Account updated!");
  }
}

function resetPassword(index) {
  const newPassword = prompt("Enter new password (min 6 chars):");
  if (newPassword && newPassword.length >= 6) {
    window.db.accounts[index].password = newPassword;
    saveToStorage();
    alert("Password reset!");
  } else {
    alert("Password must be at least 6 characters");
  }
}

function deleteAccount(index) {
  const account = window.db.accounts[index];
  
  if (currentUser && account.email === currentUser.email) {
    alert("Cannot delete your own account!");
    return;
  }
  
  if (confirm(`Delete ${account.email}?`)) {
    window.db.accounts.splice(index, 1);
    saveToStorage();
    renderAccountsList();
    alert("Account deleted!");
  }
}

// PHASE 6: ADMIN CRUD - DEPARTMENTS
function renderDepartmentsList() {
  const tbody = document.querySelector("#department-page tbody");
  if (!tbody) return;
  
  tbody.innerHTML = "";
  
  window.db.departments.forEach((dept, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <th scope="row">${dept.id}</th>
      <td>${dept.name}</td>
      <td>${dept.description}</td>
      <td>
        <button class="btn btn-outline-primary btn-sm" onclick="editDepartment(${index})">Edit</button>
        <button class="btn btn-outline-danger btn-sm" onclick="deleteDepartment(${index})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function addDepartment() {
  alert("Not implemented");
}

function editDepartment(index) {
  const dept = window.db.departments[index];
  const newName = prompt("Name:", dept.name);
  const newDesc = prompt("Description:", dept.description);
  
  if (newName && newDesc) {
    dept.name = newName;
    dept.description = newDesc;
    saveToStorage();
    renderDepartmentsList();
    alert("Department updated!");
  }
}

function deleteDepartment(index) {
  if (confirm(`Delete ${window.db.departments[index].name}?`)) {
    window.db.departments.splice(index, 1);
    saveToStorage();
    renderDepartmentsList();
    alert("Department deleted!");
  }
}

// PHASE 6: ADMIN CRUD - EMPLOYEES
let editingEmployeeIndex = -1; // -1 means adding new, >= 0 means editing

function renderEmployeesTable() {
  const tbody = document.querySelector("#employees-page tbody");
  if (!tbody) return;
  
  tbody.innerHTML = "";
  
  window.db.employees.forEach((emp, index) => {
    const dept = window.db.departments.find(d => d.id === emp.departmentId);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <th scope="row">${emp.id}</th>
      <td>${emp.email}</td>
      <td>${emp.position}</td>
      <td>${dept ? dept.name : "N/A"}</td>
      <td>
        <button class="btn btn-outline-primary btn-sm" onclick="editEmployeeForm(${index})">Edit</button>
        <button class="btn btn-outline-danger btn-sm" onclick="deleteEmployee(${index})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function showEmployeeForm() {
  editingEmployeeIndex = -1;
  document.getElementById("emp-id").value = "";
  document.getElementById("emp-email").value = "";
  document.getElementById("emp-position").value = "";
  document.getElementById("employee-form-title").innerText = "Add Employee";
  populateDepartmentDropdown();
  document.getElementById("employee-form-container").style.display = "block";
}

function editEmployeeForm(index) {
  editingEmployeeIndex = index;
  const emp = window.db.employees[index];
  document.getElementById("emp-id").value = emp.id;
  document.getElementById("emp-email").value = emp.email;
  document.getElementById("emp-position").value = emp.position;
  document.getElementById("employee-form-title").innerText = "Edit Employee";
  populateDepartmentDropdown(emp.departmentId);
  document.getElementById("employee-form-container").style.display = "block";
}

function populateDepartmentDropdown(selectedId) {
  const select = document.getElementById("emp-department");
  select.innerHTML = "";
  
  window.db.departments.forEach(dept => {
    const option = document.createElement("option");
    option.value = dept.id;
    option.innerText = dept.name;
    if (dept.id === selectedId) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function saveEmployee() {
  const id = document.getElementById("emp-id").value;
  const email = document.getElementById("emp-email").value;
  const position = document.getElementById("emp-position").value;
  const deptId = document.getElementById("emp-department").value;
  
  if (!id || !email || !position || !deptId) {
    alert("Please fill in all fields");
    return;
  }
  
  const account = window.db.accounts.find(a => a.email === email);
  if (!account) {
    alert("Email not found in accounts!");
    return;
  }
  
  if (editingEmployeeIndex === -1) {
    // Adding new
    window.db.employees.push({
      id: id,
      email: email,
      position: position,
      departmentId: parseInt(deptId)
    });
    alert("Employee added!");
  } else {
    // Editing existing
    window.db.employees[editingEmployeeIndex].id = id;
    window.db.employees[editingEmployeeIndex].email = email;
    window.db.employees[editingEmployeeIndex].position = position;
    window.db.employees[editingEmployeeIndex].departmentId = parseInt(deptId);
    alert("Employee updated!");
  }
  
  saveToStorage();
  renderEmployeesTable();
  cancelEmployeeForm();
}

function cancelEmployeeForm() {
  document.getElementById("employee-form-container").style.display = "none";
  editingEmployeeIndex = -1;
}

function deleteEmployee(index) {
  if (confirm(`Delete employee ${window.db.employees[index].id}?`)) {
    window.db.employees.splice(index, 1);
    saveToStorage();
    renderEmployeesTable();
    alert("Employee deleted!");
  }
}

// PHASE 7: USER REQUESTS

// Render the requests table - shows only current user's requests
function renderRequestsTable() {
  const tbody = document.getElementById("requests-tbody");
  const noRequestsMsg = document.getElementById("no-requests-msg");
  
  if (!tbody) return;
  
  // Filter requests by current user's email
  const myRequests = window.db.requests.filter(
    req => req.employeeEmail === currentUser.email
  );
  
  tbody.innerHTML = "";
  
  if (myRequests.length === 0) {
    noRequestsMsg.style.display = "block";
    return;
  }
  
  noRequestsMsg.style.display = "none";
  
  myRequests.forEach(req => {
    const tr = document.createElement("tr");
    const itemsList = req.items.map(item => `${item.name} (${item.qty})`).join(", ");
    
    tr.innerHTML = `
      <th scope="row">${req.id}</th>
      <td>${req.type}</td>
      <td>${itemsList}</td>
      <td>${req.date}</td>
      <td>${getStatusBadge(req.status)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Get Bootstrap badge HTML based on status
function getStatusBadge(status) {
  const badges = {
    "Pending": '<span class="badge bg-warning text-dark">Pending</span>',
    "Approved": '<span class="badge bg-success">Approved</span>',
    "Rejected": '<span class="badge bg-danger">Rejected</span>'
  };
  return badges[status] || '<span class="badge bg-secondary">' + status + '</span>';
}

// Add a new item row in the modal
function addItemRow() {
  const container = document.getElementById("items-container");
  const row = document.createElement("div");
  row.className = "input-group mb-2";
  row.innerHTML = `
    <input type="text" class="form-control item-name" placeholder="Item name">
    <input type="number" class="form-control item-qty" value="1" min="1" style="max-width: 80px;">
    <button class="btn btn-outline-danger" type="button" onclick="removeItemRow(this)">×</button>
  `;
  container.appendChild(row);
}

// Remove an item row
function removeItemRow(btn) {
  const container = document.getElementById("items-container");
  if (container.children.length > 1) {
    btn.parentElement.remove();
  } else {
    alert("You need at least one item");
  }
}

// Submit the request
function submitRequest() {
  // Collect items from form
  const itemRows = document.querySelectorAll("#items-container .input-group");
  const items = [];
  
  itemRows.forEach(row => {
    const name = row.querySelector(".item-name").value.trim();
    const qty = parseInt(row.querySelector(".item-qty").value) || 1;
    
    if (name) {
      items.push({ name: name, qty: qty });
    }
  });
  
  // Validate: at least one item
  if (items.length === 0) {
    alert("Please add at least one item");
    return;
  }
  
  // Create request object
  const newRequest = {
    id: "REQ-" + Date.now(),
    type: document.getElementById("request-type").value,
    items: items,
    status: "Pending",
    date: new Date().toISOString().split('T')[0],
    employeeEmail: currentUser.email
  };
  
  // Save to database
  window.db.requests.push(newRequest);
  saveToStorage();
  
  // Close modal using Bootstrap
  const modalEl = document.getElementById("requestModal");
  const modal = bootstrap.Modal.getInstance(modalEl);
  modal.hide();
  
  // Refresh the table
  renderRequestsTable();
  
  alert("Request submitted successfully!");
}

// Initialize the request modal with one item row
function initRequestModal() {
  const container = document.getElementById("items-container");
  container.innerHTML = "";
  addItemRow();
}
