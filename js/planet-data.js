/**
 * planet-data.js
 * ─────────────────────────────────────────────────────────────────────────────
 * THE ONLY FILE YOU NEED TO EDIT to update portfolio content.
 * All planet, moon, and personal info lives here.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PORTFOLIO_DATA = {

  /* ── SUN ─────────────────────────────────────────────────────────────── */
  sun: {
    name:     "Aaron",
    fullName: "Aaron Lad",
    tagline:  "CS @ University of Alberta | Edmonton, Alberta, Canada",
    email:    "ladaaron15@gmail.com",
    phone:    "(825) 343-2012",
    linkedin: "https://linkedin.com/in/aaron-lad",
    github:   "https://github.com/amlad15",
    about: [
      "Born in India and raised across Oman, Bahrain, and Dubai, I've had the privilege of experiencing diverse cultures and perspectives early in life, shaping my adaptable and inclusive worldview.",
      "Currently pursuing a BSc in Computing Science at the University of Alberta, I've always been drawn to logic-driven problem-solving, which has naturally fueled my passion for working with data. I enjoy uncovering insights and solving complex problems — a skillset I'm eager to apply in the fields of data science and analytics.",
      "My academic journey has also been complemented by a range of experiences and interests. Whether delving into the nuances of politics and economics, or honing technical skills like scientific computing and programming, I bring a multi-faceted approach to challenges. Strong skills in teamwork, time management, and thriving under high-pressure environments have further enhanced my ability to deliver high-quality results.",
      "Beyond academics, I'm passionate about cooking, gaming, health, and discovering niche facts and theories about the world. I enjoy traveling and exploring India's diverse landscapes, which have been a source of inspiration and learning for me.",
      "Fluent in English, Hindi, Marathi, and a little French, I value meaningful connections and collaborations. If we share similar interests or you'd like to discuss opportunities in data science, programming, or business analytics, feel free to connect!"
    ]
  },

  /* ── PLANETS ─────────────────────────────────────────────────────────── */
  planets: [

    /* ── PLANET 1: NEXUS — Experience ──────────────────────────────────── */
    {
      id:          "nexus",
      label:       "NEXUS",
      category:    "Experience",
      color:       0xcc2200,
      orbitRadius: 120,
      orbitSpeed:  0.25,
      size:        9,
      tilt:        0.2,
      moons: [
        {
          id:          "nexus-moon-1",
          title:       "Partner & Head of Web Development",
          subtitle:    "Unconventional Media Canada",
          duration:    "Dec 2024 – Aug 2025",
          location:    "Canada",
          description: "Led full-stack web development for 12+ client businesses across 5 industries, delivering responsive accessible websites averaging 2-week turnaround per project. Managed and mentored a team of 3 developers, enforcing code quality standards and WCAG accessibility compliance across 100% of client deadlines. Drove 30%+ revenue growth through targeted outreach strategy and long-term client relationship management, helping guide the company to profitability within 6 months.",
          tags:        ["Full-Stack", "Team Lead", "Web Development", "Client Management"]
        },
        {
          id:          "nexus-moon-2",
          title:       "Administrative Associate",
          subtitle:    "Hydrotec International L.L.C.",
          duration:    "May 2022",
          location:    "Oman",
          description: "Organized a corporate event for 100+ attendees, coordinating all logistics, invitations, scheduling, and post-event documentation with zero day-of issues. Maintained and updated a CRM database of 200+ contacts ensuring data accuracy and timely follow-up communications.",
          tags:        ["Operations", "CRM", "Event Management"]
        },
        {
          id:          "nexus-moon-3",
          title:       "Associate – Customer Acquisition",
          subtitle:    "Hydrotec International L.L.C.",
          duration:    "Jan 2021 – Mar 2021",
          location:    "Oman",
          description: "Researched and qualified 50+ business leads across target verticals, improving sales team outreach efficiency by an estimated 40%. Built and maintained a prospect database of 120+ companies directly supporting 3 closed deals in Q1 2021. Drafted 10+ outreach email templates adopted company-wide, reducing prospecting time per rep by approximately 25%.",
          tags:        ["Sales", "Lead Generation", "Outreach", "CRM"]
        }
      ]
    },

    /* ── PLANET 2: FORGE — Projects ─────────────────────────────────────── */
    {
      id:          "forge",
      label:       "FORGE",
      category:    "Projects",
      color:       0x0066ff,
      orbitRadius: 195,
      orbitSpeed:  0.18,
      size:        10,
      tilt:        0.15,
      moons: [
        {
          id:         "forge-moon-1",
          title:      "Global Conflict Intelligence Dashboard",
          subtitle:   "GCID — Real-time OSINT Platform",
          duration:   "Jan 2026 – Mar 2026",
          description:"Production-ready real-time OSINT platform tracking live aircraft, maritime vessels, conflict events, and breaking news on a full-screen interactive geospatial map. Integrated 4 external APIs (OpenSky, AISStream, ACLED, GDELT) with WebSocket streaming for sub-second live updates. Implemented PostGIS spatial queries and anomaly detection across 200+ daily events. Embedded local Ollama LLM for real-time geopolitical intelligence summaries with zero API cost.",
          tags:       ["Next.js", "TypeScript", "Node.js", "PostgreSQL", "PostGIS", "Socket.IO", "Leaflet.js", "Ollama", "Docker", "WebSockets"],
          github_url: "https://github.com/amlad15/Global-Conflict-Intelligence-Dashboard",
          live_url:   ""
        },
        {
          id:         "forge-moon-2",
          title:      "YT-Spotify Playlist Converter",
          subtitle:   "Full-Stack Web App — Live on Vercel",
          duration:   "Mar 2026",
          description:"Full-stack web app enabling seamless YouTube ↔ Spotify playlist transfer. Paste a URL, authenticate, and playlists are recreated in under 30 seconds. Engineered dual OAuth session management via NextAuth.js maintaining simultaneous Spotify and Google tokens without session conflicts. Developed fuzzy title-matching logic achieving 85%+ song match accuracy across varied playlist types.",
          tags:       ["Next.js 14", "TypeScript", "Spotify API", "YouTube API", "NextAuth.js", "OAuth", "Vercel"],
          github_url: "https://github.com/amlad15/yt-spotify-converter",
          live_url:   "https://yt-spotify-converter-3mm8d4vhl-amlad15s-projects.vercel.app/"
        },
        {
          id:         "forge-moon-3",
          title:      "DeepForge",
          subtitle:   "Multi-Agent AI Software Development System",
          duration:   "Feb 2026",
          description:"Multi-agent AI workflow simulating a full software engineering team across 4 specialized agents: Planner, Coder, Reviewer, and Builder. Each agent handles a specific stage of development. Runs fully locally using Ollama with DeepSeek Coder — zero external API dependency. Explores prompt engineering, agent coordination, and fully automated development pipelines end-to-end.",
          tags:       ["Python", "Ollama", "DeepSeek Coder", "AI Agents", "Prompt Engineering", "LLM"],
          github_url: "https://github.com/amlad15/DeepForge",
          live_url:   ""
        },
        {
          id:         "forge-moon-4",
          title:      "Algorithm Visual Playground",
          subtitle:   "Interactive Algorithm Visualizer",
          duration:   "Aug 2025",
          description:"Interactive app where you can watch sorting and pathfinding algorithms in action. Features sorting visualizer (Bubble, Merge, Quick Sort), pathfinding playground (BFS, DFS, A*, Dijkstra with walls), and graph exploration with nodes lighting up as search unfolds. Built because algorithms are easier to understand when you can see them.",
          tags:       ["Python", "Streamlit", "Matplotlib", "NumPy", "Algorithms"],
          github_url: "https://github.com/amlad15/Algorithm-Visual-Playground",
          live_url:   ""
        },
        {
          id:         "forge-moon-5",
          title:      "Gitabot",
          subtitle:   "Bhagavad Gita AI Chatbot",
          duration:   "Dec 2024 – Jan 2025",
          description:"AI chatbot grounded in Bhagavad Gita knowledge, handling 700+ verse-based Q&A pairs across philosophical and real-world topics. Built a custom NLP dataset with semantic structuring and preprocessing for accurate query retrieval across all 18 chapters. Integrated into a mobile application delivering conversational Gita-based insights to 50+ beta users.",
          tags:       ["Python", "NLP", "Mobile App", "AI", "Dataset Curation"],
          github_url: "https://github.com/amlad15/Gitabot",
          live_url:   ""
        },
        {
          id:         "forge-moon-6",
          title:      "AI Video Streaming Experiment",
          subtitle:   "Infodumper — YouTube Automation",
          duration:   "Mar 2025 – Apr 2025",
          description:"Experimental YouTube channel using AI to generate engaging short videos on historical, religious, and conspiracy topics. Crossed 30,000 organic views in just a few weeks. Explored AI for content creation, automation, audience engagement, and the balance between human creativity and AI tools.",
          tags:       ["AI", "Content Creation", "Automation", "Prompt Engineering", "Video Production"],
          github_url: "",
          live_url:   "https://www.youtube.com/@infodumperca"
        }
      ]
    },

    /* ── PLANET 3: MATRIX — Technical Skills ────────────────────────────── */
    {
      id:          "matrix",
      label:       "MATRIX",
      category:    "Technical Skills",
      color:       0x00ff41,
      orbitRadius: 265,
      orbitSpeed:  0.13,
      size:        10,
      tilt:        0.3,
      moons: [
        {
          id:     "matrix-moon-1",
          title:  "Languages",
          note:   "Primary: Python & TypeScript",
          skills: ["Python", "JavaScript", "TypeScript", "HTML", "CSS", "Bash", "YAML", "SQL"],
          tags:   ["Python", "JavaScript", "TypeScript", "HTML", "CSS", "Bash", "YAML", "SQL"]
        },
        {
          id:     "matrix-moon-2",
          title:  "Frameworks & Libraries",
          note:   "Full-stack web & real-time apps",
          skills: ["React.js", "Next.js 14", "Node.js", "Express", "Streamlit", "Socket.IO", "Leaflet.js", "TailwindCSS", "NextAuth.js"],
          tags:   ["React.js", "Next.js 14", "Node.js", "Express", "Streamlit", "Socket.IO", "Leaflet.js", "TailwindCSS", "NextAuth.js"]
        },
        {
          id:     "matrix-moon-3",
          title:  "AI & Machine Learning",
          note:   "Local LLM workflows & agent systems",
          skills: ["LLM Integration", "Ollama", "AI Agents", "NLP", "Prompt Engineering", "DeepSeek", "Llama3", "Mistral", "Multi-Agent Systems", "AI/ML Prototyping"],
          tags:   ["LLM Integration", "Ollama", "AI Agents", "NLP", "Prompt Engineering", "DeepSeek", "Llama3", "Mistral", "Multi-Agent Systems", "AI/ML Prototyping"]
        },
        {
          id:     "matrix-moon-4",
          title:  "Data & Databases",
          note:   "Spatial databases & real-time pipelines",
          skills: ["PostgreSQL", "PostGIS", "MongoDB", "REST APIs", "WebSockets", "Data Engineering", "Power BI", "Data Visualization", "pgvector"],
          tags:   ["PostgreSQL", "PostGIS", "MongoDB", "REST APIs", "WebSockets", "Data Engineering", "Power BI", "Data Visualization", "pgvector"]
        },
        {
          id:     "matrix-moon-5",
          title:  "DevOps & Cloud",
          note:   "Containerization & deployment",
          skills: ["Docker", "Kubernetes", "GitHub Actions", "CI/CD", "AWS", "Linux", "Vercel", "Git", "GitHub"],
          tags:   ["Docker", "Kubernetes", "GitHub Actions", "CI/CD", "AWS", "Linux", "Vercel", "Git", "GitHub"]
        }
      ]
    },

    /* ── PLANET 4: CITADEL — Education ──────────────────────────────────── */
    {
      id:          "citadel",
      label:       "CITADEL",
      category:    "Education",
      color:       0x00c853,
      orbitRadius: 335,
      orbitSpeed:  0.10,
      size:        9,
      tilt:        0.1,
      moons: [
        {
          id:          "ualberta",
          title:       "BSc Computing Science",
          subtitle:    "University of Alberta",
          duration:    "2022 – Expected May 2026",
          location:    "Edmonton, AB, Canada",
          description: "Bachelor of Science in Computing Science with a Minor in Economics. Awarded Regional Excellence Scholarship ($5,000 CAD, 2023) and International Admission Scholarship ($5,000 CAD, 2022).",
          tags:        ["Computer Science", "Economics Minor", "Scholarship", "UAlberta"],
          link:        "https://www.ualberta.ca"
        },
        {
          id:          "highschool",
          title:       "High School Diploma",
          subtitle:    "ADD YOUR HIGH SCHOOL NAME HERE",
          duration:    "ADD YEARS HERE",
          location:    "ADD LOCATION HERE",
          description: "ADD DESCRIPTION HERE — subjects, achievements, activities, awards.",
          tags:        ["High School", "ADD TAGS"],
          link:        ""
        }
      ]
    },

    /* ── PLANET 5: PULSE — Interests & Extracurriculars ─────────────────── */
    {
      id:          "pulse",
      label:       "PULSE",
      category:    "Interests & Extracurriculars",
      color:       0x7c3aed,
      orbitRadius: 405,
      orbitSpeed:  0.07,
      size:        8,
      tilt:        0.25,
      moons: [
        {
          id:          "pulse-gaming",
          title:       "Gaming",
          subtitle:    "Competitive & Casual",
          description: "Active gamer across multiple titles spanning tactical shooters, battle royales, simulators, and sandbox games. Current rotation: CS2, Valorant, Apex Legends, Call of Duty, War Thunder, Marvel Rivals, Minecraft.",
          tags:        ["CS2", "Valorant", "Apex Legends", "CoD", "War Thunder", "Marvel Rivals", "Minecraft"],
          link:        ""
        },
        {
          id:          "pulse-cinema",
          title:       "Cinema",
          subtitle:    "Cinephile",
          description: "Passionate film enthusiast with a love for storytelling, cinematography, and score. All-time favourites: The Godfather Part II, Interstellar, and Whiplash. Personal favourites that hit differently: Tron, Frankenstein, and Top Gun: Maverick.",
          tags:        ["Godfather II", "Interstellar", "Whiplash", "Tron", "Top Gun: Maverick"],
          link:        ""
        },
        {
          id:          "pulse-ai",
          title:       "AI & Automation",
          subtitle:    "Passion & Research Interest",
          description: "Deeply interested in how AI systems can automate creative and technical workflows. Actively experiments with local LLMs, multi-agent systems, and AI-assisted content creation. Built multiple projects exploring the boundary of what AI can do autonomously.",
          tags:        ["LLMs", "AI Agents", "Automation", "Prompt Engineering"],
          link:        ""
        },
        {
          id:          "pulse-finance",
          title:       "Economics, Finance & Trading",
          subtitle:    "Academic & Personal Interest",
          description: "Pursuing a Minor in Economics at UAlberta. Interested in financial markets, trading strategies, algorithmic trading, and macroeconomic trends. Follows world politics and geopolitics closely — reflected in building the GCID dashboard.",
          tags:        ["Economics", "Finance", "Trading", "Markets", "Stocks"],
          link:        ""
        },
        {
          id:          "pulse-sports",
          title:       "Football & Formula 1",
          subtitle:    "Sports Passion",
          description: "Avid football fan and Formula 1 follower. Enjoys the strategy and engineering behind F1 as much as the racing itself. Football is a shared passion connecting back to roots and friendships.",
          tags:        ["Football", "Formula 1", "F1", "Sports"],
          link:        ""
        },
        {
          id:          "pulse-content",
          title:       "Content Creation",
          subtitle:    "AI-Assisted Media",
          description: "Co-launched Infodumper, an experimental AI-driven YouTube channel covering historical, religious, and conspiracy topics. Reached 30,000+ organic views. Interested in the intersection of AI tools and media storytelling.",
          tags:        ["YouTube", "Content Creation", "AI Media", "Storytelling"],
          link:        "https://www.youtube.com/@infodumperca"
        }
      ]
    },

    /* ── PLANET 6: SIGNAL — Contact & Links ─────────────────────────────── */
    {
      id:          "signal",
      label:       "SIGNAL",
      category:    "Contact & Links",
      color:       0x06b6d4,
      orbitRadius: 475,
      orbitSpeed:  0.05,
      size:        9,
      tilt:        0.2,
      moons: [
        {
          id:       "signal-email",
          title:    "Email",
          subtitle: "ladaaron15@gmail.com",
          link:     "mailto:ladaaron15@gmail.com"
        },
        {
          id:       "signal-linkedin",
          title:    "LinkedIn",
          subtitle: "linkedin.com/in/aaron-lad",
          link:     "https://linkedin.com/in/aaron-lad"
        },
        {
          id:       "signal-github",
          title:    "GitHub",
          subtitle: "github.com/amlad15",
          link:     "https://github.com/amlad15"
        },
        {
          id:       "signal-resume",
          title:    "Resume",
          subtitle: "Download CV",
          link:     "assets/AaronCV.pdf"
        }
      ]
    },

    /* ── PLANET 7: VAULT — Certificates ──────────────────────────────────── */
    {
      id:          "vault",
      label:       "VAULT",
      category:    "Certificates",
      color:       0xf59e0b,
      orbitRadius: 560,
      orbitSpeed:  0.035,
      size:        11,
      tilt:        0.35,
      moons: [
        {
          id:          "cert-aws",
          title:       "AWS for Developers",
          subtitle:    "LinkedIn Learning — Mar 2026",
          description: "Amazon Web Services fundamentals for developers. Core AWS services, deployment patterns, and cloud architecture.",
          tags:        ["AWS", "Cloud", "LinkedIn Learning"],
          cert_pdf:    "assets/certificates/aws-developer.pdf",
          link:        "assets/certificates/aws-developer.pdf"
        },
        {
          id:          "cert-data-eng",
          title:       "Data Engineering Foundations",
          subtitle:    "LinkedIn Learning — Mar 2026",
          description: "Foundations of data engineering pipelines, ETL processes, and data architecture.",
          tags:        ["Data Engineering", "ETL", "LinkedIn Learning"],
          cert_pdf:    "assets/certificates/data-engineering.pdf",
          link:        "assets/certificates/data-engineering.pdf"
        },
        {
          id:          "cert-rest",
          title:       "Learning REST APIs",
          subtitle:    "LinkedIn Learning — Feb 2026",
          description: "REST API design principles, HTTP methods, authentication patterns, and best practices.",
          tags:        ["REST API", "API Design", "LinkedIn Learning"],
          cert_pdf:    "assets/certificates/rest-apis.pdf",
          link:        "assets/certificates/rest-apis.pdf"
        },
        {
          id:          "cert-python-rice",
          title:       "Python Programming Essentials",
          subtitle:    "Rice University — Jul 2021",
          description: "Core Python programming concepts, functions, and problem solving.",
          tags:        ["Python", "Coursera", "Rice University"],
          cert_pdf:    "assets/certificates/python-rice.pdf",
          link:        "assets/certificates/python-rice.pdf"
        },
        {
          id:          "cert-python-michigan",
          title:       "Python Data Structures",
          subtitle:    "University of Michigan — Aug 2021",
          description: "Lists, dictionaries, tuples and advanced Python data structure manipulation.",
          tags:        ["Python", "Data Structures", "Coursera"],
          cert_pdf:    "assets/certificates/python-michigan.pdf",
          link:        "assets/certificates/python-michigan.pdf"
        },
        {
          id:          "cert-strategy",
          title:       "Strategic Management",
          subtitle:    "Copenhagen Business School — Aug 2021",
          description: "Strategy frameworks, competitive advantage, and long-term business planning.",
          tags:        ["Strategy", "Business", "Coursera"],
          cert_pdf:    "assets/certificates/strategic-management.pdf",
          link:        "assets/certificates/strategic-management.pdf"
        },
        {
          id:          "cert-google-data",
          title:       "Foundations: Data, Data, Everywhere",
          subtitle:    "Google — Aug 2021",
          description: "Introduction to data analytics, data-driven decision making across industries.",
          tags:        ["Data Analytics", "Google", "Coursera"],
          cert_pdf:    "assets/certificates/google-data.pdf",
          link:        "assets/certificates/google-data.pdf"
        },
        {
          id:          "cert-marketing",
          title:       "Marketing Mix Fundamentals",
          subtitle:    "IE Business School — Aug 2021",
          description: "The 4Ps of marketing and how businesses connect products with customers.",
          tags:        ["Marketing", "Business", "Coursera"],
          cert_pdf:    "assets/certificates/marketing-mix.pdf",
          link:        "assets/certificates/marketing-mix.pdf"
        },
        {
          id:          "cert-management",
          title:       "Management Skills for International Business",
          subtitle:    "University of London — Aug 2021",
          description: "International team management, cross-cultural decision making, and global business operations.",
          tags:        ["Management", "International Business", "Coursera"],
          cert_pdf:    "assets/certificates/management-international.pdf",
          link:        "assets/certificates/management-international.pdf"
        }
      ]
    }

  ] // end planets

}; // end PORTFOLIO_DATA
