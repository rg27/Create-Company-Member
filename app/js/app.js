//Live - /widget.html
//Development - //https://127.0.0.1:5000/app/widget.html
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("submit_button_id").addEventListener("click", create_record);
    document.getElementById("stake-holder-type").addEventListener("change", toggleForms);
});

// Define global variables
let application_name, application_id, contact_id, account_id, deal_id, cm_id;
let stakeholderRecord = {};

// Function to display a popup with a custom message
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

// Load Zoho CRM Data on Page Load
ZOHO.embeddedApp.on("PageLoad", async (entity) => {
    try {
        const entity_id = entity.EntityId[0];

        // Fetch New License Form data
        const newLicenseResponse = await ZOHO.CRM.API.getRecord({
            Entity: "New_License_Forms",
            approved: "both",
            RecordID: entity_id,
        });

        const newLicenseData = newLicenseResponse.data[0];
        application_id = newLicenseData.New_License_Application.id;
        application_name = newLicenseData.New_License_Application.name;

        // Fetch Application data
        const applicationResponse = await ZOHO.CRM.API.getRecord({
            Entity: "Applications1",
            approved: "both",
            RecordID: application_id,
        });

        const applicationData = applicationResponse.data[0];
        deal_id = applicationData.Deal_Name.id;
        account_id = applicationData.Account_Name.id;

        console.log("DEAL ID:", deal_id);

        // Fetch Accounts data
        const accountResponse = await ZOHO.CRM.API.getRecord({
            Entity: "Accounts",
            approved: "both",
            RecordID: account_id,
        });
        const accountData = accountResponse.data[0];
        contact_id = accountData.Primary_Contact.id;
        console.log(contact_id);

    } catch (error) {
        console.error("Error fetching data:", error);
    }
});

// Function to get the selected stakeholder roles
function getSelectedRoles() {
    const stakeholderType = document.getElementById("stake-holder-type").value;
    let stakeholderRoles = [];
    
    if (stakeholderType === "Natural Person") {
        const naturalRoleElement = document.getElementById("natural-stakeholder-role");
        if (naturalRoleElement) {
            const selectedOptions = Array.from(naturalRoleElement.selectedOptions);
            stakeholderRoles = selectedOptions.map(option => option.value);
        }
    } else if (stakeholderType === "Legal Person") {
        const legalRoleElement = document.getElementById("legal-stakeholder-role");
        if (legalRoleElement) {
            const selectedOptions = Array.from(legalRoleElement.selectedOptions);
            stakeholderRoles = selectedOptions.map(option => option.value);
        }
    }
    console.log(stakeholderRoles);
    return stakeholderRoles;
}

// Function to get the Full Name for Compliance Record
function getFullName(){
    const stakeholder_type = document.getElementById("stake-holder-type").value;
    let full_name = "";

    if(stakeholder_type === "Natural Person"){
        const first_name = document.getElementById("first-name").value;
        const middle_name = document.getElementById("middle-name").value;
        const last_name = document.getElementById("last-name").value;
        full_name = `${first_name} ${middle_name} ${last_name}`.trim();
    } else if(stakeholder_type === "Legal Person"){
        const registered_name = document.getElementById("registered-name").value;
        full_name = registered_name;
    }
    return full_name;
}

// Updated create_record function
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
        Roles_s: getSelectedRoles(),
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

    complianceRecord = {
        Account_Name: account_id,
        Contact_Name: contact_id,
        Company_Member_Record: cm_id,
        Layout: "3769920000233312114",
        Application_Record: application_id,
        Fullname_Company_Name: getFullName(),
        Title: document.getElementById("title").value,
        First_Name: document.getElementById("first-name").value,
        Middle_Name: document.getElementById("middle-name").value,
        Last_Name: document.getElementById("last-name").value,
        Record_Type: document.getElementById("stake-holder-type").value,
        Name: document.getElementById("registered-name").value || document.getElementById("first-name").value + " " + document.getElementById("middle-name").value  +  " " + document.getElementById("last-name").value,
    };

    try {
        console.log("Attempting to create record: ", complianceRecord);
        const response = await ZOHO.CRM.API.insertRecord({
            Entity: "AML_Compliances",
            APIData: complianceRecord,
            Trigger: ["workflow"],
        });

        console.log("Compliance response from API: ", response);
        if (response.data[0].code === "SUCCESS") {
            console.log("Compliance record created successfully!");
            // Clear the stakeholder record data after successful submission
            complianceRecord = {};
        } else {
            console.log("ERROR CREATING COMPLIANCE RECORD, PLEASE CONTACT SUPPORT TEAM ERROR: " + response.data[0].message);
        }
    } catch (error) {
        console.error("API Error during compliance record creation:", error);
        alert("API Error during compliance record creation: " + error.message);
    }
}

// Utility function to add or remove required attributes
function setFieldRequired(isRequired, formElement) {
    const fields = formElement.querySelectorAll("[required]");
    fields.forEach((field) => (field.required = isRequired));
}

// Function to toggle between forms based on stakeholder type
function toggleForms() {
    const stakeholderType = document.getElementById("stake-holder-type").value;
    const naturalPersonForm = document.getElementById("natural-person-form");
    const legalPersonForm = document.getElementById("legal-person-form");

    console.log("Stakeholder Type:", stakeholderType);
    console.log("Natural Person Form:", naturalPersonForm);
    console.log("Legal Person Form:", legalPersonForm);

    naturalPersonForm.style.display = stakeholderType === "Natural Person" ? "block" : "none";
    legalPersonForm.style.display = stakeholderType === "Legal Person" ? "block" : "none";

    setFieldRequired(stakeholderType === "Natural Person", naturalPersonForm);
    setFieldRequired(stakeholderType === "Legal Person", legalPersonForm);
}

function toggleSharesField() {
    const naturalStakeholderRole = document.getElementById("natural-stakeholder-role");
    const legalStakeholderRole = document.getElementById("legal-stakeholder-role");
    const sharesContainer = document.getElementById("shares-container");

    console.log("Natural Stakeholder Role:", naturalStakeholderRole ? naturalStakeholderRole.value : null);
    console.log("Legal Stakeholder Role:", legalStakeholderRole ? legalStakeholderRole.value : null);
    console.log("Shares Container:", sharesContainer);

    const naturalSelectedRoles = Array.from(naturalStakeholderRole ? naturalStakeholderRole.selectedOptions : []).map(option => option.value);
    const legalSelectedRoles = Array.from(legalStakeholderRole ? legalStakeholderRole.selectedOptions : []).map(option => option.value);

    const hasShareholderRole = naturalSelectedRoles.includes("Shareholder") || legalSelectedRoles.includes("Shareholder");

    if (sharesContainer) {
        if (hasShareholderRole) {
            sharesContainer.style.display = "block";
            document.getElementById("number-of-shares").required = true;
            document.getElementById("legal-number-of-shares").required = true;
        } else {
            sharesContainer.style.display = "none";
            document.getElementById("number-of-shares").required = false;
            document.getElementById("legal-number-of-shares").required = false;
        }
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

// Initialize Zoho Embedded App
ZOHO.embeddedApp.init();