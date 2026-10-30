/**
 * content.js: the single source of portfolio content.
 * Read by the page (js/site.js), the 3D mode (js/3d/*) and tools/render.mjs,
 * which writes it into index.html so the content is there with JS off.
 *
 * After editing, run:  node tools/render.mjs
 * (If you forget, the page still re-renders from this file on load.)
 *
 * Conventions:
 *   null       = unknown / not ready; the field is hidden on the site
 *   "TODO: …"  = comment for you; never rendered
 *
 * OPEN TODOs
 *   1. profile.pitch: confirm the hero one-liner wording
 *   2. profile.resume: AaronCV.pdf is from Mar 2026, before GuidePost and Aerocool
 *   3. education[0].end: graduation date ("Expected May 2026" was outdated)
 *   4. projects yt-spotify: repo is private/404 (repoPublic: false hides the button)
 *   5. projects yt-spotify: live demo is behind Vercel login (liveReady: false hides it)
 *   6. projects gitabot: github.com/amlad15/gita_bot is private/404 (repoPublic: false)
 *   7. projects *: add screenshots to assets/projects/ and set `image`
 *   8. certificates: all 9 PDFs are placeholders, so they stay hidden until replaced
 */

var SITE = {                                                  // var so Node's vm context sees it as a global

  profile: {
    name:     "Aaron Lad",
    // TODO: confirm wording (drafted from existing facts only)
    pitch:    "Computing Science at the University of Alberta. I build full-stack web apps, AI tools, and websites for local businesses.",
    status:   "Open to new-grad roles and freelance web projects",
    location: "Edmonton, Alberta, Canada",
    email:    "ladaaron15@gmail.com",
    phone:    "(825) 343-2012",
    phoneE164: "+18253432012",                                // tel: links need the bare international form
    github:   "https://github.com/amlad15",
    linkedin: "https://www.linkedin.com/in/aaron-lad",
    resume:   "assets/AaronCV.pdf"                            // TODO: re-export; current PDF predates Apr 2026
  },

  /* Newest first. bullets render as a list; keep each one a single line of fact. */
  experience: [
    {
      id:       "aerocool",
      role:     "IT Consultant",
      type:     "Part-time contract",
      org:      "Aerocool System Air Solutions Ltd.",
      location: "Edmonton, AB",
      dates:    "Sep 2026 – Present",
      bullets: [
        "Sole technical contact for the company's web, email and marketing infrastructure.",
        "Built their Canadian website, aerocool.ca, with WordPress and Elementor.",
        "Manage their Google Business Profile and Google Ads, and set up their Meta Page and ads."
      ],
      tags:  ["WordPress", "Elementor", "Google Ads", "Google Business Profile", "Meta Ads"],
      links: [{ label: "aerocool.ca", href: "https://aerocool.ca" }]
    },
    {
      id:       "guidepost",
      role:     "Junior Sysadmin",
      type:     "Internship",
      org:      "GuidePost Technologies Inc.",
      orgNote:  "Managed IT services provider",
      location: "Edmonton, AB",
      dates:    "Apr 2026 – Aug 2026",
      bullets: [
        "Microsoft 365 provisioning and access management for client organizations.",
        "Automated admin work with PowerShell and Microsoft Graph across client tenants.",
        "Set up and deployed client hardware.",
        "Wrote SEO content, ran Google Ads and LinkedIn, and handled client communications."
      ],
      tags: ["Microsoft 365", "PowerShell", "Microsoft Graph", "Hardware", "SEO", "Google Ads"]
    },
    {
      id:       "unconventional",
      role:     "Partner & Head of Web Development",
      org:      "Unconventional Media Canada",
      location: "Canada",
      dates:    "Dec 2024 – Aug 2025",
      bullets: [
        "Led full-stack web development for 12+ client businesses across 5 industries, delivering responsive, accessible websites with a 2-week average turnaround.",
        "Managed and mentored a team of 3 developers, enforcing code quality standards and WCAG accessibility compliance across 100% of client deadlines.",
        "Drove 30%+ revenue growth through targeted outreach and long-term client relationships, helping the company reach profitability within 6 months."
      ],
      tags: ["Full-Stack", "Team Lead", "Web Development", "Client Management"]
    },
    {
      id:       "hydrotec",
      role:     "Administrative & Customer Acquisition Associate",
      org:      "Hydrotec International L.L.C.",
      location: "Oman",
      dates:    "Jan – Mar 2021 · May 2022",               // two short stints merged into one entry
      compact:  true,                                       // renders smaller: older, less relevant
      bullets: [
        "Qualified 50+ business leads and built a 120+ company prospect database that supported 3 closed deals; wrote 10+ outreach templates adopted company-wide.",
        "Ran logistics for a 100+ attendee corporate event and maintained a 200+ contact CRM."
      ],
      tags: ["Sales", "Lead Generation", "CRM", "Operations"]
    }
  ],

  services: {
    intro: "I build websites and set up digital marketing for small businesses in Edmonton and across Alberta.",
    offerings: [
      { title: "Websites",              text: "Responsive, accessible business websites in WordPress/Elementor or custom code." },
      { title: "Google presence",       text: "Google Business Profile setup and upkeep, plus Google Ads campaigns." },
      { title: "Social ads",            text: "Meta (Facebook/Instagram) Page setup and ad campaigns." },
      { title: "Ongoing tech support",  text: "One point of contact for your website, email and marketing tools." }
    ],
    caseStudy: {
      id:     "aerocool-case",
      client: "Aerocool System Air Solutions",
      sector: "HVAC · Edmonton",
      title:  "aerocool.ca",
      points: [
        "Built the Canadian website in WordPress with Elementor.",
        "Set up and manage the Google Business Profile and Google Ads.",
        "Set up the Meta Page and ads.",
        "Ongoing sole technical contact for web, email and marketing."
      ],
      href:  "https://aerocool.ca",
      image: null                                           // TODO (optional): add assets/projects/aerocool.webp
    },
    trackRecord: "As Partner & Head of Web Development at Unconventional Media Canada I led 12+ client websites across 5 industries, with a 2-week average turnaround and WCAG accessibility on every project.",
    cta: { label: "Start a project", subject: "Website project" }
  },

  /* featured: true = large card. image: path under assets/projects/ or null for a placeholder. */
  projects: [
    {
      id:       "gcid",
      title:    "Global Conflict Intelligence Dashboard",
      summary:  "Real-time OSINT map of live aircraft, ships, conflict events and breaking news.",
      dates:    "Jan – Mar 2026",
      featured: true,
      bullets: [
        "Integrated 4 external APIs (OpenSky, AISStream, ACLED, GDELT) with WebSocket streaming for sub-second live updates.",
        "PostGIS spatial queries and anomaly detection across 200+ daily events.",
        "Local Ollama LLM writes geopolitical intelligence summaries at zero API cost."
      ],
      tags:  ["Next.js", "TypeScript", "Node.js", "PostgreSQL", "PostGIS", "Socket.IO", "Leaflet.js", "Ollama", "Docker"],
      repo:  "https://github.com/amlad15/Global-Conflict-Intelligence-Dashboard",
      image: null                                           // TODO: screenshot
    },
    {
      id:       "deepforge",
      title:    "DeepForge",
      summary:  "Multi-agent AI system that simulates a small software engineering team.",
      dates:    "Feb 2026",
      featured: true,
      bullets: [
        "Four CrewAI agents (Planner, Coder, Reviewer, Builder) each own one stage of development.",
        "Runs fully locally on Ollama with DeepSeek Coder, with no external API dependency.",
        "Explores prompt engineering, agent coordination and end-to-end automated pipelines."
      ],
      tags:  ["Python", "CrewAI", "Ollama", "DeepSeek Coder", "AI Agents", "Prompt Engineering"],
      repo:  "https://github.com/amlad15/DeepForge",
      image: null                                           // TODO: screenshot
    },
    {
      id:       "yt-spotify",
      title:    "YT-Spotify Playlist Converter",
      summary:  "Paste a playlist URL, sign in, and it's recreated on the other service in under 30 seconds.",
      dates:    "Mar 2026",
      featured: true,
      bullets: [
        "Dual OAuth via NextAuth.js keeps Spotify and Google tokens live at the same time without session conflicts.",
        "Fuzzy title matching reaches 85%+ song match accuracy across varied playlists."
      ],
      tags:       ["Next.js 14", "TypeScript", "Spotify API", "YouTube API", "NextAuth.js", "OAuth", "Vercel"],
      repo:       "https://github.com/amlad15/yt-spotify-converter",
      repoPublic: false,                                    // TODO: repo 404s publicly; make it public, then set true
      live:       "https://yt-spotify-converter-3mm8d4vhl-amlad15s-projects.vercel.app/",
      liveReady:  false,                                    // TODO: preview URL hits Vercel login; turn off deployment protection, then set true
      image: null                                           // TODO: screenshot
    },
    {
      id:       "algo-playground",
      title:    "Algorithm Visual Playground",
      summary:  "Watch sorting and pathfinding algorithms run step by step.",
      dates:    "Aug 2025",
      featured: true,
      bullets: [
        "Sorting visualizer: Bubble, Merge and Quick Sort.",
        "Pathfinding playground with walls: BFS, DFS, A* and Dijkstra.",
        "Graph exploration where nodes light up as the search unfolds."
      ],
      tags:  ["Python", "Streamlit", "Matplotlib", "NumPy", "Algorithms"],
      repo:  "https://github.com/amlad15/Algorithm-Visual-Playground",
      image: null                                           // TODO: screenshot
    },
    {
      id:       "gitabot",
      title:    "Gitabot",
      summary:  "AI chatbot grounded in the Bhagavad Gita, used by 50+ beta users in a mobile app.",
      dates:    "Dec 2024 – Jan 2025",
      bullets: [
        "Custom NLP dataset of 700+ verse-based Q&A pairs across all 18 chapters."
      ],
      tags:       ["Python", "NLP", "Mobile App", "Dataset Curation"],
      repo:       "https://github.com/amlad15/gita_bot",
      repoPublic: false,                                    // TODO: repo 404s publicly; make it public, then set true
      image: null
    },
    {
      id:       "infodumper",
      title:    "Infodumper",
      summary:  "Experimental AI-generated YouTube channel that passed 30,000 organic views in a few weeks.",
      dates:    "Mar – Apr 2025",
      bullets: [
        "Short videos on historical, religious and conspiracy topics, exploring AI for content creation and automation."
      ],
      tags:  ["AI", "Content Creation", "Automation", "Video"],
      live:  "https://www.youtube.com/@infodumperca",
      liveLabel: "Watch on YouTube",
      image: null
    }
  ],

  skills: [
    { title: "Languages",              note: "Primary: Python & TypeScript",
      items: ["Python", "TypeScript", "JavaScript", "SQL", "HTML", "CSS", "Bash", "PowerShell", "YAML"] },
    { title: "Frameworks & Libraries", note: "Full-stack web & real-time apps",
      items: ["React", "Next.js 14", "Node.js", "Express", "Socket.IO", "Leaflet.js", "TailwindCSS", "NextAuth.js", "Streamlit"] },
    { title: "AI & Machine Learning",  note: "Local LLM workflows & agent systems",
      items: ["LLM Integration", "Ollama", "CrewAI", "Multi-Agent Systems", "Prompt Engineering", "NLP", "DeepSeek", "Llama 3", "Mistral"] },
    { title: "Data & Databases",       note: "Spatial databases & real-time pipelines",
      items: ["PostgreSQL", "PostGIS", "pgvector", "MongoDB", "REST APIs", "WebSockets", "Data Engineering", "Power BI", "Data Visualization"] },
    { title: "DevOps & Cloud",         note: "Containers & deployment",
      items: ["Docker", "Kubernetes", "GitHub Actions", "CI/CD", "AWS", "Vercel", "Linux", "Git"] },
    { title: "IT & Marketing",         note: "From sysadmin and client work",
      items: ["Microsoft 365", "Microsoft Graph", "WordPress", "Elementor", "Google Ads", "Google Business Profile", "Meta Ads", "SEO"] }
  ],

  education: [
    {
      id:      "ualberta",
      degree:  "BSc Computing Science",
      minor:   "Minor in Economics",
      school:  "University of Alberta",
      location: "Edmonton, AB",
      start:   "2022",
      end:     null,                                        // TODO: graduation date ("Expected May 2026" was outdated)
      awards: [
        "Regional Excellence Scholarship: $5,000 CAD (2023)",
        "International Admission Scholarship: $5,000 CAD (2022)"
      ],
      href: "https://www.ualberta.ca"
    }
  ],

  /* Shown only when the file is a real PDF (starts with %PDF). Drop the real file in to publish it. */
  certificates: [
    { id: "cert-aws",             title: "AWS for Developers",                          issuer: "LinkedIn Learning",            date: "Mar 2026", file: "assets/certificates/aws-developer.pdf" },
    { id: "cert-data-eng",        title: "Data Engineering Foundations",                issuer: "LinkedIn Learning",            date: "Mar 2026", file: "assets/certificates/data-engineering.pdf" },
    { id: "cert-rest",            title: "Learning REST APIs",                          issuer: "LinkedIn Learning",            date: "Feb 2026", file: "assets/certificates/rest-apis.pdf" },
    { id: "cert-python-rice",     title: "Python Programming Essentials",               issuer: "Rice University",              date: "Jul 2021", file: "assets/certificates/python-rice.pdf" },
    { id: "cert-python-michigan", title: "Python Data Structures",                      issuer: "University of Michigan",       date: "Aug 2021", file: "assets/certificates/python-michigan.pdf" },
    { id: "cert-strategy",        title: "Strategic Management",                        issuer: "Copenhagen Business School",   date: "Aug 2021", file: "assets/certificates/strategic-management.pdf" },
    { id: "cert-google-data",     title: "Foundations: Data, Data, Everywhere",         issuer: "Google",                       date: "Aug 2021", file: "assets/certificates/google-data.pdf" },
    { id: "cert-marketing",       title: "Marketing Mix Fundamentals",                  issuer: "IE Business School",           date: "Aug 2021", file: "assets/certificates/marketing-mix.pdf" },
    { id: "cert-management",      title: "Management Skills for International Business", issuer: "University of London",       date: "Aug 2021", file: "assets/certificates/management-international.pdf" }
  ],

  about: {
    paragraphs: [
      "I was born in India and grew up across Oman, Bahrain and Dubai. Moving between cultures early taught me to adapt quickly and work well with people from very different backgrounds.",
      "At the University of Alberta I've focused on Computing Science with a minor in Economics. I'm drawn to logic-driven problem solving and working with data, and I spend a lot of my spare time building full-stack apps and experimenting with local LLMs and AI agents.",
      "Outside of code I'm into cooking, gaming, film, football and Formula 1, markets and geopolitics, and travelling around India."
    ],
    languages:  ["English", "Hindi", "Marathi", "French (basic)"],
    background: "Born in India · raised in Oman, Bahrain and Dubai · based in Edmonton"
  },

  interests: [
    { id: "gaming",  title: "Gaming",                      text: "Tactical shooters, battle royales, sims and sandbox games: CS2, Valorant, Apex Legends, Call of Duty, War Thunder, Marvel Rivals, Minecraft." },
    { id: "cinema",  title: "Cinema",                      text: "All-time favourites: The Godfather Part II, Interstellar and Whiplash. Personal ones: Tron, Frankenstein and Top Gun: Maverick." },
    { id: "ai",      title: "AI & Automation",             text: "How AI can automate creative and technical work: local LLMs, multi-agent systems and AI-assisted content." },
    { id: "finance", title: "Economics, Finance & Trading", text: "Financial markets, algorithmic trading and macro trends. I follow geopolitics closely, which is what led to the GCID dashboard." },
    { id: "sports",  title: "Football & Formula 1",        text: "I enjoy the strategy and engineering behind F1 as much as the racing. Football connects me back to my roots and friendships." }
  ]
};

if (typeof module !== "undefined") module.exports = SITE;  // lets Node tooling require() it too
