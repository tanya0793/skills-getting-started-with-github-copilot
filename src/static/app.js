document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        // Ensure participants is always an array
        const participants = Array.isArray(details.participants) ? details.participants : [];
        const spotsLeft = details.max_participants - participants.length;

        // Participants list HTML
        let participantsHTML = "";
        if (participants.length > 0) {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participants:</strong>
              <form class="remove-participants-form" data-activity="${name}">
                <ul class="participants-list no-bullets">
                  ${participants.map(p => `
                    <li>
                      <input type="checkbox" class="participant-checkbox" value="${p}" id="${name}-participant-${p}">
                      <label for="${name}-participant-${p}" class="participant-name">${p}</label>
                    </li>
                  `).join("")}
                </ul>
                <button type="submit" class="remove-selected-btn">Remove Selected</button>
              </form>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participants:</strong>
              <p class="no-participants">No one has signed up yet.</p>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners for remove selected buttons
      document.querySelectorAll('.remove-participants-form').forEach(form => {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const activity = form.getAttribute('data-activity');
          const checkedBoxes = form.querySelectorAll('.participant-checkbox:checked');
          if (checkedBoxes.length === 0) {
            messageDiv.textContent = 'Please select at least one participant to remove.';
            messageDiv.className = 'info';
            messageDiv.classList.remove('hidden');
            setTimeout(() => { messageDiv.classList.add('hidden'); }, 3000);
            return;
          }
          let successCount = 0;
          let errorCount = 0;
          for (const box of checkedBoxes) {
            const participant = box.value;
            try {
              const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(participant)}`, {
                method: 'POST',
              });
              if (response.ok) {
                successCount++;
              } else {
                errorCount++;
              }
            } catch {
              errorCount++;
            }
          }
          if (successCount > 0) {
            messageDiv.textContent = `Removed ${successCount} participant(s).`;
            messageDiv.className = 'success';
            fetchActivities();
          } else {
            messageDiv.textContent = 'Failed to remove selected participant(s).';
            messageDiv.className = 'error';
          }
          messageDiv.classList.remove('hidden');
          setTimeout(() => { messageDiv.classList.add('hidden'); }, 4000);
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
