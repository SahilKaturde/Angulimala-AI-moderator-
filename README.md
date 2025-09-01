# Angulimala AI Moderator 🕊️

**Our motive is to make a healthy virtual world.**  
Angulimala AI Moderator is a web application and Chrome extension designed to detect and mitigate **hate speech** and **toxic online content**, empowering users to reflect on their words before posting and encouraging positive digital interactions.

---

## 📖 Background  

Hate speech and abusive content on social media have been rising worldwide (2021–2025).  
Victims and bystanders often face **depression, anxiety, social fear, and polarization**.  
Inspired by the Buddhist tale of **Angulimala’s transformation**, this project aims to **reduce negativity online and help users rethink toxic behavior**.  

---

## ✨ Features  

- 🌐 **Web application + Chrome extension** for real-time moderation.  
- 🤖 **AI-powered hate speech detection** (HuggingFace, Meta Hate Detection).  
- 💬 **Chatbot for self-reflection**, prompting users to rethink harmful posts.  
- 🌱 **Positive environment design** — UI/UX inspired by mindfulness and ethics.  
- 📊 **Vector database (Chroma)** for fast and scalable content moderation.  

---

## 🛠️ Tech Stack  

**Frontend:** React  
**Backend:** Django + Django REST Framework  
**LLM APIs:** HuggingFace, Meta Hate Detection  
**Database:** Chroma Vector DB  

---

## ⚙️ How It Works  

1. User writes/post text.  
2. Chrome extension analyzes content in real time.  
3. If flagged as **hate speech**, the system prompts reflection and alternatives.  
4. Web app provides deeper insights, moderation logs, and psychological tools for positivity.  

---

## 🖼️ Screenshots  

| Mockup | Mobile View |
|--------|-------------|
| ![Mockup](ScreenShot/Mockup1.png) | ![Mobile View](ScreenShot/mobileview.png) |

| Dashboard / Analysis | Add Post |
|-----------------------|----------|
| ![Analysis](ScreenShot/Capture2.PNG) | ![Add Post](ScreenShot/add.png) |

| Chatbot Interaction |
|---------------------|
| ![Chatbot](ScreenShot/Capture3.PNG) |

---

## 🏗️ Architecture  

Angulimala-AI-moderator-/
│
├── backend/                         # Django backend (API + moderation logic)
│   ├── moderator/                   # Main app
│   │   ├── migrations/              # Django migrations
│   │   ├── chroma_client.py         # Retriever + ChromaDB connector
│   │   ├── hate_model.py            # Hate detection model wrapper
│   │   ├── models.py                # Database models
│   │   ├── serializers.py           # DRF serializers
│   │   ├── views.py                 # API views (moderation, chatbot, etc.)
│   │   └── urls.py                  # App routes
│   ├── backend/                     # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/                        # React frontend (user interface)
│   ├── public/
│   ├── src/
│   │   ├── components/              # React components (Chatbot, Dashboard, etc.)
│   │   ├── pages/                   # Page-level components
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── tailwind.config.js
│
├── extension/                       # Chrome Extension
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   └── popup.html
│
├── ScreenShot/                      # Screenshots for README
│   ├── Capture2.PNG
│   ├── Capture3.PNG
│   ├── Mockup1.png
│   ├── add.png
│   └── mobileview.png
│
├── docs/                            # Documentation, PDFs, diagrams
│   └── ANGULIMALA.pdf
│
├── README.md
└── LICENSE
-----------

## 🌍 Impact & Relevance to UNESCO  

- **Media and Information Literacy (MIL):** Helps users critically evaluate online information.  
- **Reducing hate speech:** Aims to regulate toxic speech at scale.  
- **Sustainability:** Planned integration with major social media platforms.  
- **Future scope:**  
  - Partnership with psychologists for better moderation.  
  - Expanded UI/UX tailored to mental well-being.  
  - Deployment as a **semi-profitable agency** for social good.  

---

## 👥 Team  

- **[Sahil Dinkar Katurde](https://github.com/SahilKaturde)** — Lead Developer, UI/UX, Full Stack  
- **[Omkar Amit Pardeshi](https://github.com/Omkar96-18)** — Full Stack Developer  
- **[Shardul](https://github.com/Luther-cpp)** — API Handler  
- **[Khetaram Sutar](https://github.com/Ksuthar99)** — Frontend Developer  

---

## 🚀 Demo  

📽️ [YouTube Demo Link](#) *(insert actual link)*  

---

## 📩 Contact  

- Repository: [GitHub - Angulimala AI Moderator](https://github.com/SahilKaturde/Angulimala-AI-moderator-)  
- Email: *(add your contact if needed)*  

---

## 📜 License  

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.  

---



