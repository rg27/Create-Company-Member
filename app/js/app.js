// Constants
const SELECTORS = {
  stakeholderType: "stake-holder-type",
  naturalForm: "natural-person-form",
  legalForm: "legal-person-form",
  sharesContainer: "shares-container",
  shareholderContainer: "shareholder-container",
  submitButton: "submit_button_id",
  popup: "popup",
  popupTitle: "popupTitle",
  popupMessage: "popupMessage",
  form: "record-form",
};

// Global
let selectedRoles = [];
let stakeholderRecord = {};
let application_id, application_name, contact_id, account_id, deal_id, cm_id;

// Utility to get role-based selectors
function getRoleSelectors() {
  const type = document.getElementById(SELECTORS.stakeholderType).value;
  const isLegal = type === "Legal Person";
  return {
    input: document.getElementById(isLegal ? "legal-role-input" : "role-input"),
    optionsList: document.getElementById(isLegal ? "legal-options-list" : "options-list"),
    selectedContainer: document.getElementById(isLegal ? "legal-selected-options" : "selected-options"),
    hiddenInput: document.getElementById(isLegal ? "legal-role-values" : "role-values"),
  };
}

// Popup Display
function showPopup(message, type = "restricted") {
  const popup = document.getElementById(SELECTORS.popup);
  popup.classList.remove("hidden");
  popup.classList.toggle("success", type === "success");
  popup.classList.toggle("restricted", type !== "success");
  document.getElementById(SELECTORS.popupTitle).textContent = "Action Status";
  document.getElementById(SELECTORS.popupMessage).innerHTML = message;
}

function hidePopup() {
  ZOHO.CRM.UI.Popup.close();
}

// Show/hide Natural vs Legal Forms
function toggleForms() {
  const type = document.getElementById(SELECTORS.stakeholderType).value;
  const isNatural = type === "Natural Person";

  document.getElementById(SELECTORS.naturalForm).style.display = isNatural ? "block" : "none";
  document.getElementById(SELECTORS.legalForm).style.display = isNatural ? "none" : "block";

  // Reset selected roles
  const { hiddenInput } = getRoleSelectors();
  selectedRoles = [];
  hiddenInput.value = "";
  updateSelectedRolesUI([]);
}

// Role dropdown logic
function updateDropdownOptions() {
  const { optionsList } = getRoleSelectors();
  optionsList.querySelectorAll("div[data-value]").forEach(opt => {
    opt.style.display = selectedRoles.includes(opt.dataset.value) ? "none" : "block";
  });
}

function updateSelectedRolesUI(presetRoles = selectedRoles) {
  const { selectedContainer, hiddenInput } = getRoleSelectors();
  selectedContainer.innerHTML = "";
  presetRoles.forEach(role => {
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.innerHTML = `${role}<span class="remove" data-value="${role}">&times;</span>`;
    selectedContainer.appendChild(tag);
  });
  hiddenInput.value = presetRoles.join(",");
  selectedRoles = presetRoles;
}

// Handle dropdown + removal
function handleRoleClickEvents() {
  document.addEventListener("click", (e) => {
    const { input, optionsList, selectedContainer } = getRoleSelectors();

    // Toggle dropdown
    if (e.target === input) {
      updateDropdownOptions();
      optionsList.style.display = optionsList.style.display === "block" ? "none" : "block";
    }

    // Hide dropdown if clicking outside
    if (!e.target.closest(".custom-multiselect")) {
      optionsList.style.display = "none";
    }

    // Add role
    const option = e.target.closest("div[data-value]");
    if (option && optionsList.contains(option)) {
      const value = option.dataset.value;
      if (!selectedRoles.includes(value)) {
        selectedRoles.push(value);
        updateSelectedRolesUI();
        toggleSharesField();
      }
      optionsList.style.display = "none";
    }

    // Remove role
    if (e.target.classList.contains("remove") && selectedContainer.contains(e.target)) {
      const value = e.target.dataset.value;
      selectedRoles = selectedRoles.filter(role => role !== value);
      updateSelectedRolesUI();
      toggleSharesField();
    }
  });
}

function toggleSharesField() {
  const sharesContainer = document.getElementById(SELECTORS.sharesContainer);
  sharesContainer.style.display = selectedRoles.includes("Shareholder") ? "block" : "none";
}

function getSelectedRoles() {
  const { hiddenInput } = getRoleSelectors();
  console.log(hiddenInput.value);
  return hiddenInput.value.split(",").filter(r => r.trim());
}

function getFullName() {
  const type = document.getElementById(SELECTORS.stakeholderType).value;
  if (type === "Natural Person") {
    return `${document.getElementById("first-name").value} ${document.getElementById("middle-name").value} ${document.getElementById("last-name").value}`.trim();
  }
  return document.getElementById("registered-name").value;
}

async function create_record(event) {
   event.preventDefault();

  const submitBtn = document.getElementById(SELECTORS.submitButton);
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  if (!application_id) {
    alert("Application ID not found.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
    return;
  }

  const type = document.getElementById(SELECTORS.stakeholderType).value;
  stakeholderRecord = {
    Application_No: application_id,
    Layout: "3769920000261136001",
    Title: document.getElementById("title")?.value,
    First_Name: document.getElementById("first-name")?.value,
    Middle_Name: document.getElementById("middle-name")?.value,
    Last_Name: document.getElementById("last-name")?.value,
    Roles_s: getSelectedRoles(),
    Email: document.getElementById("email-address")?.value,
    Number_of_Shares: document.getElementById("number-of-shares")?.value || document.getElementById("legal-number-of-shares")?.value,
    Shareholder_Type: type,
    Name: getFullName(),
    JP_Company_Brand_Name: document.getElementById("registered-name")?.value,
    JP_Email_Address: document.getElementById("legal-email-address")?.value,
    Account: account_id,
    Full_Name: getFullName(),
  };

  try {
    const response = await ZOHO.CRM.API.insertRecord({
      Entity: "Company_Members",
      APIData: stakeholderRecord,
      Trigger: ["workflow"],
    });

    const result = response.data[0];
    if (result.code === "SUCCESS") {
      cm_id = result.details.id;
      showPopup("Company Member created successfully!", "success");
      window.open(`https://crm.zoho.com/crm/org682300086/tab/CustomModule32/${cm_id}`, "_blank").focus();
      stakeholderRecord = {};
    } else {
      showPopup("Please contact support: " + result.message);
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
  } catch (error) {
    console.error("Error creating record:", error);
    alert("Creation error: " + error.message);
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
}

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  ZOHO.embeddedApp.init();
  document.getElementById(SELECTORS.submitButton).addEventListener("click", create_record);
  handleRoleClickEvents();
});

// PageLoad handler
ZOHO.embeddedApp.on("PageLoad", async (entity) => {
  try {
    const entity_id = entity.EntityId[0];

    const newLicenseRes = await ZOHO.CRM.API.getRecord({
      Entity: "New_License_Forms",
      approved: "both",
      RecordID: entity_id,
    });

    const newLicenseData = newLicenseRes.data[0];
    application_id = newLicenseData.New_License_Application.id;
    application_name = newLicenseData.New_License_Application.name;
    const company_formation_type = newLicenseData.Legal_Type;

    // Fetch Applications1 record
    const applicationRes = await ZOHO.CRM.API.getRecord({
      Entity: "Applications1",
      approved: "both",
      RecordID: application_id,
    });

    const applicationData = applicationRes.data[0];
    deal_id = applicationData.Deal_Name.id;
    account_id = applicationData.Account_Name.id;

    // Fetch related Company Members under the application
    const companyMembersRes = await ZOHO.CRM.API.getRelatedRecords({
      Entity: "Applications1",
      RecordID: application_id,
      RelatedList: "Company_Members",
      page: 1,
      per_page: 200,
    });
    console.log(companyMembersRes);

    const existingMember = Array.isArray(companyMembersRes.data)
  ? companyMembersRes.data.find(cm => cm.Shareholder_Type === "Natural Person")
  : null;

    // Validation logic
    if (existingMember && company_formation_type === "General Freelance") {
      const message = "A <strong>Natural Person</strong> Stakeholder already exists under this application. You cannot create another Company Member.";
      showPopup(message);

      // Disable submit button
      const submitBtn = document.getElementById(SELECTORS.submitButton);
      submitBtn.disabled = true;
      submitBtn.textContent = "Restricted";
      return;
    }

    // Fetch Account -> Contact
    const accountRes = await ZOHO.CRM.API.getRecord({
      Entity: "Accounts",
      approved: "both",
      RecordID: account_id,
    });

    const accountData = accountRes.data[0];
    contact_id = accountData.Primary_Contact.id;

  } catch (error) {
    console.error("PageLoad error:", error);
    showPopup("Error loading application data.");
    document.getElementById(SELECTORS.submitButton).disabled = true;
  }
});