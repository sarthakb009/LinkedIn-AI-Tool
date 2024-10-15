// Import icons for the extension's user interface
import editIcon from "~/assets/edit.svg";
import insertIcon from "~/assets/insert.svg";
import generateIcon from "~/assets/generate.svg";
import regenerateIcon from "~/assets/regenerate.svg";

// Define the main content script for LinkedIn pages
export default defineContentScript({
  matches: ["*://*.linkedin.com/*"], // Target LinkedIn URLs
  main() {
    // Template for the modal to be injected into the page
    const modalTemplate = `
      <div id="custom-modal" style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: none; justify-content: center; align-items: center; z-index: 4000;">
        <div id="modal-content" style="background: white; border-radius: 8px; width: 100%; max-width: 570px; padding: 20px;">
          <div id="message-container" style="margin-top: 10px; max-height: 200px; overflow-y: auto; padding: 10px; display: flex; flex-direction: column;"></div>
          <div style="margin-bottom: 10px;">
            <input id="prompt-input" type="text" placeholder="Enter your prompt..." style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"/>
          </div>
          <div style="text-align: right; margin-top: 12px;">
            <button id="insert-button" style="background: #fff; color: #666D80; padding: 8px 16px; border: 2px solid #666D80; border-radius: 4px; cursor: pointer; display: none; margin-right: 10px;">
              <img src="${insertIcon}" alt="Insert" style="vertical-align: middle; margin-right: 5px; width: 14px; height: 14px;"> 
              <b>Insert</b>
            </button>
            <button id="generate-button" style="background: #007bff; color: white; padding: 8px 16px; border: 2px solid #007bff; border-radius: 4px; cursor: pointer;">
              <img src="${generateIcon}" alt="Generate" style="vertical-align: middle; margin-right: 5px; width: 14px; height: 14px"> 
              <b>Generate</b>
            </button>
          </div>
        </div>
      </div>
    `;

    // Add the modal to the document body
    document.body.insertAdjacentHTML("beforeend", modalTemplate);

    // Cache modal elements for later use
    const modal = document.getElementById("custom-modal") as HTMLDivElement;
    const generateButton = document.getElementById("generate-button") as HTMLButtonElement;
    const insertButton = document.getElementById("insert-button") as HTMLButtonElement;
    const promptInput = document.getElementById("prompt-input") as HTMLInputElement;
    const messageContainer = document.getElementById("message-container") as HTMLDivElement;

    // Variables to store the last generated message and the message input area
    let recentMessage = "";
    let messageInputArea: HTMLElement | null = null;

    // Listen for clicks on LinkedIn message input areas
    document.addEventListener("click", (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if the clicked element is a message input area
      if (target.matches(".msg-form__contenteditable") || target.closest(".msg-form__contenteditable")) {
        // Store the parent container of the message input area
        messageInputArea = target.closest(".msg-form__container") || target.closest(".msg-form__contenteditable");

        const contentContainer = messageInputArea?.closest(".msg-form_msg-content-container");

        // Ensure the message form is active and focused
        if (messageInputArea && contentContainer) {
          contentContainer.classList.add("msg-form_msg-content-container--is-active");
          messageInputArea.setAttribute("data-artdeco-is-focused", "true");
        }

        // Inject the edit icon if it hasn't been added yet
        if (messageInputArea && !messageInputArea.querySelector(".edit-icon")) {
          messageInputArea.style.position = "relative";

          const icon = document.createElement("img");
          icon.className = "edit-icon";
          icon.src = editIcon;
          icon.alt = "Custom Icon";
          icon.style.position = "absolute";
          icon.style.bottom = "5px";
          icon.style.right = "5px";
          icon.style.width = "30px";
          icon.style.height = "30px";
          icon.style.cursor = "pointer";
          icon.style.zIndex = "1000";
          messageInputArea.appendChild(icon);

          // Open the modal when the edit icon is clicked
          icon.addEventListener("click", (e) => {
            e.stopPropagation();
            modal.style.display = "flex";
          });
        }
      }
    });

    // Function to create a default message
    const createDefaultMessage = () => {
      const messages = [
        "Thank you for the opportunity! If you have any more questions or if there's anything else I can help you with, feel free to ask.",
      ];
      return messages[0]; // Return a fixed generated message
    };

    // Event listener for the 'Generate' button
    generateButton.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent event from bubbling up

      // Get the user input
      const inputValue = promptInput.value.trim();
      if (!inputValue) return; // Exit if input is empty

      // Display the user's message in the message container
      const userMessageDiv = document.createElement("div");
      userMessageDiv.textContent = inputValue;
      Object.assign(userMessageDiv.style, {
        backgroundColor: "#DFE1E7",
        color: "#666D80",
        borderRadius: "12px",
        padding: "10px",
        marginBottom: "5px",
        textAlign: "right",
        maxWidth: "80%",
        alignSelf: "flex-end",
        marginLeft: "auto",
      });
      messageContainer.appendChild(userMessageDiv);

      // Disable the generate button and show loading state
      generateButton.disabled = true;
      generateButton.textContent = "Loading...";
      generateButton.style.backgroundColor = "#666D80";

      // Simulate an API call with a timeout to generate a message
      setTimeout(() => {
        recentMessage = createDefaultMessage(); // Get the generated message
        const generatedMessageDiv = document.createElement("div");
        generatedMessageDiv.textContent = recentMessage;
        Object.assign(generatedMessageDiv.style, {
          backgroundColor: "#DBEAFE",
          color: "#666D80",
          borderRadius: "12px",
          padding: "10px",
          marginBottom: "5px",
          textAlign: "left",
          maxWidth: "80%",
          alignSelf: "flex-start",
          marginRight: "auto",
        });

        // Add generated message to the message container
        messageContainer.appendChild(generatedMessageDiv);
        messageContainer.scrollTop = messageContainer.scrollHeight; // Scroll to the bottom

        // Enable the generate button and change text to 'Regenerate'
        generateButton.disabled = false;
        generateButton.style.backgroundColor = "#007bff";
        generateButton.style.color = "white";
        generateButton.innerHTML = `<img src="${regenerateIcon}" alt="Regenerate" style="vertical-align: middle; margin-right: 5px; width: 16px; height: 16px"> <b>Regenerate</b>`;

        // Reset input field and show the insert button
        promptInput.value = "";
        insertButton.style.display = "inline-block";
      }, 500);
    });

    // Event listener for the 'Insert' button to insert the generated message into the message input area
    insertButton.addEventListener("click", () => {
      if (recentMessage && messageInputArea) {
        // Remove aria-label to avoid any screen reader issues
        messageInputArea.removeAttribute("aria-label");

        // Remove the 'msg-form__placeholder' class
        const placeholderDiv = messageInputArea.querySelector('.msg-form__placeholder');
        if (placeholderDiv) {
          placeholderDiv.classList.remove('msg-form__placeholder');
        } else {
          // Fallback: remove the class from the messageInputArea
          messageInputArea.classList.remove('msg-form__placeholder');
        }

        // Find or create a <p> tag inside the contenteditable area
        let existingParagraph = messageInputArea.querySelector("p");

        if (!existingParagraph) {
          existingParagraph = document.createElement("p");
          messageInputArea.appendChild(existingParagraph);
        }

        // Clear and insert the new message
        existingParagraph.textContent = recentMessage;

        // Hide the insert button and close the modal
        insertButton.style.display = "none";
        modal.style.display = "none";
      }
    });

    // Ensure focus is maintained on the message input area while interacting with the modal inputs
    const inputElements = [promptInput, generateButton, insertButton];
    inputElements.forEach((element) => {
      element.addEventListener("focus", () => {
        if (messageInputArea) {
          messageInputArea.setAttribute("data-artdeco-is-focused", "true");
        }
      });
    });

    // Close the modal if the user clicks outside of it
    document.addEventListener("click", (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        modal.style.display === "flex" &&
        !modal.contains(target) &&
        !target.classList.contains("edit-icon")
      ) {
        modal.style.display = "none";
      }
    });
  },
});
