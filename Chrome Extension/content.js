function createPopup(question, targetEl, sendCallback) {
  const existing = document.getElementById("moderator-popup");
  if (existing) existing.remove();

  const popup = document.createElement("div");
  popup.id = "moderator-popup";
  Object.assign(popup.style, {
    position: "absolute",
    background: "#fff",
    border: "2px solid red",
    padding: "10px",
    borderRadius: "8px",
    zIndex: 999999,
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    maxWidth: "280px",
    fontFamily: "sans-serif",
    fontSize: "14px",
  });

  const rect = targetEl.getBoundingClientRect();
  popup.style.top = `${rect.top + window.scrollY - 70}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;

  const text = document.createElement("div");
  text.innerText = question;
  text.style.marginBottom = "8px";
  popup.appendChild(text);

  const btnContainer = document.createElement("div");
  btnContainer.style.display = "flex";
  btnContainer.style.gap = "8px";

  const yesBtn = document.createElement("button");
  yesBtn.innerText = "Yes";
  yesBtn.style.cssText =
    "flex:1;padding:4px 8px;background:green;color:white;border:none;border-radius:4px;cursor:pointer;";
  yesBtn.onclick = () => sendCallback("yes", popup);
  btnContainer.appendChild(yesBtn);

  const noBtn = document.createElement("button");
  noBtn.innerText = "No";
  noBtn.style.cssText =
    "flex:1;padding:4px 8px;background:red;color:white;border:none;border-radius:4px;cursor:pointer;";
  noBtn.onclick = () => sendCallback("no", popup);
  btnContainer.appendChild(noBtn);

  popup.appendChild(btnContainer);
  document.body.appendChild(popup);
}

function attachListener(input) {
  if (input.dataset.moderatorAttached) return;
  input.dataset.moderatorAttached = "true";

  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = input.value || input.innerText; // textarea or contenteditable

      try {
        const res = await fetch("http://localhost:8000/api/analyze/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        const data = await res.json();

        if (data.type === "reflective") {
          createPopup(data.response, input, async (answer, popup) => {
            popup.remove();

            try {
              const responseRes = await fetch(
                "http://localhost:8000/api/respond/",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    original_text: text,
                    reflective_question: data.response,
                    user_answer: answer,
                  }),
                }
              );
              const responseData = await responseRes.json();
              alert(responseData.response);
            } catch (err) {
              console.error("Reflection API error:", err);
            }

            // Find Instagram post button and click it
            const sendButton =
              input.closest("form")?.querySelector("button") ||
              document.querySelector('button[type="submit"], div[role="button"]');
            if (sendButton) sendButton.click();
          });
        } else {
          const sendButton =
            input.closest("form")?.querySelector("button") ||
            document.querySelector('button[type="submit"], div[role="button"]');
          if (sendButton) sendButton.click();
        }
      } catch (err) {
        console.error("Analyze API Error:", err);
        const sendButton =
          input.closest("form")?.querySelector("button") ||
          document.querySelector('button[type="submit"], div[role="button"]');
        if (sendButton) sendButton.click();
      }
    }
  });
}

// MutationObserver to detect new comment boxes
const observer = new MutationObserver(() => {
  const inputs = document.querySelectorAll(
    'textarea, input[type="text"], div[contenteditable="true"]'
  );
  inputs.forEach(attachListener);
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Attach immediately for already-loaded inputs
document
  .querySelectorAll('textarea, input[type="text"], div[contenteditable="true"]')
  .forEach(attachListener);
