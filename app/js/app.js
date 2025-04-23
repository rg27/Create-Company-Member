document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("submit_button_id").addEventListener("click", create_record);
    const roleInput = document.getElementById("role-input");
    const optionsList = document.getElementById("options-list");
    const selectedOptions = document.getElementById("selected-options");
  
    const roleValuesInput = document.getElementById("role-values");
  
    let selectedRoles = [];
  
    roleInput.addEventListener("click", () => {
      updateDropdownOptions();
      optionsList.style.display = optionsList.style.display === "block" ? "none" : "block";
    });
  
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".custom-multiselect")) {
        optionsList.style.display = "none";
      }
    });
  
    optionsList.addEventListener("click", (e) => {
      const option = e.target.closest("div[data-value]");
      if (option) {
        const value = option.dataset.value;
  
        if (!selectedRoles.includes(value)) {
          selectedRoles.push(value);
          updateSelectedRolesUI();
          toggleSharesField();
        }
  
        optionsList.style.display = "none";
      }
    });
  
    selectedOptions.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove")) {
        const value = e.target.dataset.value;
        selectedRoles = selectedRoles.filter(role => role !== value);
        updateSelectedRolesUI();
        toggleSharesField();
      }
    });
  
    function updateSelectedRolesUI() {
      selectedOptions.innerHTML = "";
  
      selectedRoles.forEach(role => {
        const tag = document.createElement("div");
        tag.className = "tag";
  
        tag.innerHTML = `
          ${role}
          <span class="remove" data-value="${role}">&times;</span>
        `;
  
        selectedOptions.appendChild(tag);
      });
  
      roleValuesInput.value = selectedRoles.join(",");
    }
  
    function updateDropdownOptions() {
      const allOptions = Array.from(optionsList.querySelectorAll("div[data-value]"));
      allOptions.forEach(option => {
        const value = option.dataset.value;
        option.style.display = selectedRoles.includes(value) ? "none" : "block";
      });
    }
  
    function toggleSharesField() {
      const roles = selectedRoles;
      const sharesContainer = document.getElementById("shares-container");
  
      sharesContainer.style.display = roles.includes("Shareholder") ? "block" : "none";
    }
  });
  
  // Define global variables
  let application_name, application_id, contact_id, account_id, deal_id, cm_id;
  let stakeholderRecord = {};
  
  // Function to display a popup
  function showPopup(message, type = "restricted") {
    const popup = document.getElementById("popup");
    const popupMessage = document.getElementById("popupMessage");
    const popupTitle = document.getElementById("popupTitle");
  
    popupMessage.textContent = message;
  
    if (type === "success") {
      popup.classList.add("success");
      popup.classList.remove("restricted");
      popupTitle.textContent = "";
    } else {
      popup.classList.add("restricted");
      popup.classList.remove("success");
      popupTitle.textContent = "Action Restricted";
    }
  
    popup.classList.remove("hidden");
  }
  
  ZOHO.embeddedApp.on("PageLoad", async (entity) => {
    try {
      const entity_id = entity.EntityId[0];
      const newLicenseResponse = await ZOHO.CRM.API.getRecord({
        Entity: "New_License_Forms",
        approved: "both",
        RecordID: entity_id,
      });
  
      const newLicenseData = newLicenseResponse.data[0];
      application_id = newLicenseData.New_License_Application.id;
      application_name = newLicenseData.New_License_Application.name;
  
      const applicationResponse = await ZOHO.CRM.API.getRecord({
        Entity: "Applications1",
        approved: "both",
        RecordID: application_id,
      });
  
      const applicationData = applicationResponse.data[0];
      deal_id = applicationData.Deal_Name.id;
      account_id = applicationData.Account_Name.id;
  
      const accountResponse = await ZOHO.CRM.API.getRecord({
        Entity: "Accounts",
        approved: "both",
        RecordID: account_id,
      });
      const accountData = accountResponse.data[0];
      contact_id = accountData.Primary_Contact.id;
  
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  });
  
  function getSelectedRoles() {
    const selectedRoles = document.getElementById("role-values").value.split(",").filter(r => r.trim() !== "");
    console.log("Selected Roles:", selectedRoles);
    return selectedRoles;
  }
  
  function getFullName() {
    const stakeholder_type = document.getElementById("stake-holder-type").value;
    let full_name = "";
    if (stakeholder_type === "Natural Person") {
      const first_name = document.getElementById("first-name").value;
      const middle_name = document.getElementById("middle-name").value;
      const last_name = document.getElementById("last-name").value;
      full_name = `${first_name} ${middle_name} ${last_name}`.trim();
    } else {
      full_name = document.getElementById("registered-name").value;
    }
    return full_name;
  }
  
  async function create_record(event) {
    event.preventDefault();
      if (!application_id) {
        alert("Application ID is not available. Please try again.");
        return;
      }
  
    // Populate stakeholderRecord from form fields
    stakeholderRecord = {
        Application_No: application_id,
        Layout: "3769920000261136001",
        Title: document.getElementById("title").value,
        First_Name: document.getElementById("first-name").value,
        Middle_Name: document.getElementById("middle-name").value,
        Last_Name: document.getElementById("last-name").value,
        Roles_s: document.getElementById("stake-holder-type").value == "Legal Person" ? ["Shareholder"] : getSelectedRoles(),
        Email: document.getElementById("email-address").value,
        Number_of_Shares: document.getElementById("number-of-shares").value || document.getElementById("legal-number-of-shares").value,
        Shareholder_Type: document.getElementById("stake-holder-type").value,
        Name: document.getElementById("registered-name").value || document.getElementById("first-name").value + " " + document.getElementById("last-name").value,
        JP_Company_Brand_Name: document.getElementById("registered-name").value,
        JP_Email_Address:  document.getElementById("legal-email-address").value,
        Account: account_id,
        Full_Name: document.getElementById("registered-name").value || document.getElementById("first-name").value + " " + document.getElementById("last-name").value 
    };
  
    try {
        console.log("Attempting to create record: ", stakeholderRecord);
        const response = await ZOHO.CRM.API.insertRecord({
            Entity: "Company_Members",
            APIData: stakeholderRecord,
            Trigger: ["workflow"],
        });
        cm_id = response.data[0].details.id;
        console.log("CREATED COMPANY MEMBER ID: " + cm_id);
        console.log("Response from API: ", response);
        if (response.data[0].code === "SUCCESS") {
            console.log("Record created successfully!");
  
            const message = "Company Member created successfully!";
            showPopup(message, "success");
            
            //REDIRECT TO THE NEWLY CREATED COMPANY MEMBER RECORD
            const company_member_url = "https://crm.zoho.com/crm/org682300086/tab/CustomModule32/" + cm_id;
            window.open(company_member_url, '_blank').focus();
  
            // Clear the stakeholder record data after successful submission
            stakeholderRecord = {};
        } else {
            const message = "Please Contact Support regarding this issue. " + response.data[0].message;
            showPopup(message);
            console.log("ERROR CREATING COMPANY MEMBERS, PLEASE CONTACT SUPPORT TEAM");
        }
    } catch (error) {
        console.error("API Error during record creation:", error);
        alert("API Error during record creation: " + error.message);
    }
  }
  
  function setFieldRequired(isRequired, formElement) {
    const fields = formElement.querySelectorAll("[required]");
    fields.forEach((field) => field.required = isRequired);
  }
  
  function toggleForms() {
    const type = document.getElementById("stake-holder-type").value;
    const naturalForm = document.getElementById("natural-person-form");
    const legalForm = document.getElementById("legal-person-form");
  
    naturalForm.style.display = type === "Natural Person" ? "block" : "none";
    legalForm.style.display = type === "Legal Person" ? "block" : "none";
  
    setFieldRequired(type === "Natural Person", naturalForm);
    setFieldRequired(type === "Legal Person", legalForm);
  }
  
  function toggleSharesField() {
    const roles = getSelectedRoles();
    const shareholderContainer = document.getElementById("shareholder-container");
    const sharesContainer = document.getElementById("shares-container");
  
    roles.forEach(role => {
      const roleBox = document.createElement("div");
      roleBox.className = "role-box";
  
      const roleText = document.createElement("span");
      roleText.textContent = role;
  
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-role";
      removeBtn.innerHTML = "&times;";
      removeBtn.onclick = () => {
        const currentRoles = document.getElementById("role-values").value.split(",");
        const updated = currentRoles.filter(r => r !== role);
        document.getElementById("role-values").value = updated.join(",");
        updateCustomDropdown(updated);
        toggleSharesField();
      };
  
      roleBox.appendChild(roleText);
      roleBox.appendChild(removeBtn);
      shareholderContainer.appendChild(roleBox);
    });
  
    sharesContainer.style.display = roles.includes("Shareholder") ? "block" : "none";
  }
  
  // Custom Multi-select Initialization
  function initCustomStakeholderDropdown() {
    const input = document.getElementById("role-input");
    const optionsList = document.getElementById("options-list");
    const selectedContainer = document.getElementById("selected-options");
    const hiddenInput = document.getElementById("role-values");
  
    let selectedValues = [];
  
    input.addEventListener("focus", () => {
      optionsList.style.display = "block";
    });
  
    input.addEventListener("blur", () => {
      setTimeout(() => optionsList.style.display = "none", 200);
    });
  
    optionsList.addEventListener("click", (e) => {
      const value = e.target.getAttribute("data-value");
      if (value && !selectedValues.includes(value)) {
        selectedValues.push(value);
        updateCustomDropdown(selectedValues);
        toggleSharesField();
      }
    });
  
    function updateCustomDropdown(values) {
      selectedValues = values;
      selectedContainer.innerHTML = "";
  
      selectedValues.forEach(val => {
        const tag = document.createElement("div");
        tag.className = "tag";
  
        const span = document.createElement("span");
        span.textContent = val;
  
        const remove = document.createElement("div");
        remove.className = "remove";
        remove.innerHTML = "&times;";
        remove.onclick = () => {
          const updated = selectedValues.filter(v => v !== val);
          document.getElementById("role-values").value = updated.join(",");
          updateCustomDropdown(updated);
          toggleSharesField();
        };
  
        tag.appendChild(span);
        tag.appendChild(remove);
        selectedContainer.appendChild(tag);
      });
  
      hiddenInput.value = selectedValues.join(",");
    }
  }
  // Function to close the pop-up messages
  function hidePopup() {
    ZOHO.CRM.UI.Popup.close();
  }
  
  // Function to show the stakeholder
  function showStakeholderForm() {
    document.getElementById("stakeholder-form").style.display = "block";
  }
  
  
  ZOHO.embeddedApp.init();
  