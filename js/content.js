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
 *   1. profile.resume: AaronCV.pdf is from Mar 2026, before GuidePost and Aerocool
 *   2. projects yt-spotify: repo is private/404 (repoPublic: false hides the button)
 *   3. projects yt-spotify: live demo is behind Vercel login (liveReady: false hides it)
 *   4. projects gitabot: github.com/amlad15/gita_bot is private/404 (repoPublic: false)
 *   5. projects admin-crm, cultural-archive: dates unknown (null hides them)
 *   6. projects gcid, deepforge, yt-spotify, admin-crm, cultural-archive, gitabot + aerocool case study: screenshots still needed
 *   7. certificates: all 9 PDFs are placeholders, so they stay hidden until replaced
 *
 * Privacy: never name GuidePost's clients anywhere (text, alt text, filenames, meta).
 */

var SITE = {                                                  // var so Node's vm context sees it as a global

  profile: {
    name:     "Aaron Lad",
    pitch:    "Full-stack developer with hands-on IT and sysadmin experience, open to new-grad roles and freelance web projects.",
    status:   ["Open to new-grad roles", "Taking freelance web projects", "Edmonton, AB"],   // hero status line, one fact per item
    location: "Edmonton, Alberta, Canada",
    email:    "ladaaron15@gmail.com",
    phone:    "(825) 343-2012",
    phoneE164: "+18253432012",                                // tel: links need the bare international form
    github:   "https://github.com/amlad15",
    linkedin: "https://www.linkedin.com/in/aaron-lad-80070625b",
    resume:   "assets/AaronCV.pdf"                            // TODO: replace; current PDF predates Apr 2026
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
      bullets: [                                            // client names deliberately omitted
        "Provisioned and managed Microsoft 365 accounts, licensing and access across multiple client tenants.",
        "Deployed and configured hardware for client environments, including laptop imaging and asset setup.",
        "Resolved MSP support tickets spanning Intune compliance, firewall SSL inspection errors, Windows configuration issues and VM provisioning.",
        "Configured an internal Certificate Authority (AD CS) for HTTPS on internal domains; performed Wi-Fi site surveys and network troubleshooting with Wireshark.",
        "Wrote PowerShell automation for Azure AD/AD administration, including one-click device provisioning (domain disjoin, RMM agent install, user creation, restart).",
        "Managed IAM access and Proofpoint email security configuration across client accounts.",
        "Supported marketing operations: SEO content, Google Ads and client communications."
      ],
      tags: ["Microsoft 365", "Intune", "PowerShell", "Azure AD", "AD CS", "Proofpoint", "Wireshark", "IAM"]
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

  /* Mission log. featured: true = lead missions; result = the collapsed row's outcome line (facts only).
     image: path under assets/projects/ or null for a placeholder. */
  projects: [
    {
      id:       "gcid",
      launch:   "2026-01",               // YYYY-MM; drives the row date
      result:   "4 external APIs, sub-second updates",
      title:    "Global Conflict Intelligence Dashboard",
      summary:  "Real-time OSINT map of live aircraft, ships, conflict events and breaking news.",
      dates:    "Jan – Mar 2026",
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
      launch:   "2026-02",               // YYYY-MM; drives the row date
      result:   "4-agent dev pipeline, fully local",
      title:    "DeepForge",
      summary:  "Multi-agent AI system that simulates a small software engineering team.",
      dates:    "Feb 2026",
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
      launch:   "2026-03",               // YYYY-MM; drives the row date
      result:   "85%+ song match accuracy",
      title:    "YT-Spotify Playlist Converter",
      summary:  "Paste a playlist URL, sign in, and it's recreated on the other service in under 30 seconds.",
      dates:    "Mar 2026",
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
      launch:   "2025-08",               // YYYY-MM; drives the row date
      result:   "3 sorts, 4 pathfinding algorithms",
      title:    "Algorithm Visual Playground",
      summary:  "Watch sorting and pathfinding algorithms run step by step.",
      dates:    "Aug 2025",
      bullets: [
        "Sorting visualizer: Bubble, Merge and Quick Sort.",
        "Pathfinding playground with walls: BFS, DFS, A* and Dijkstra.",
        "Graph exploration where nodes light up as the search unfolds."
      ],
      tags:  ["Python", "Streamlit", "Matplotlib", "NumPy", "Algorithms"],
      repo:  "https://github.com/amlad15/Algorithm-Visual-Playground",
      image: "assets/projects/algo-playground.webp",
      imageAlt: "Algorithm Visual Playground sorting tab mid-run: a bar chart of 30 values with Bubble Sort comparing two highlighted bars",
    },
    {
      id:       "admin-crm",
      launch:   null,                       // TODO: launch month unknown
      result:   "Self-hosted, no external APIs",
      title:    "Admin/CRM Tracking Tool",
      summary:  "Locally hosted admin tracking and CRM tool built for internal MSP use.",
      dates:    null,                                       // TODO: add dates
      bullets: [
        "Customer flowcharts, task tracking, asset and server inventories, and due-date reminders.",
        "Unified command system (natural language plus slash commands with autocomplete) to add, update and query records, with the UI jumping to the affected record.",
        "Structured asset naming and bulk range logic integrated with RMM tool exports.",
        "Fully self-hosted for data security, with no external API dependencies."
      ],                                                    // not AI-powered: keep it out of the copy
      tags:  ["Node.js", "Express", "PostgreSQL", "Docker"],
      image: null                                           // no public repo, so no GitHub button
    },
    {
      id:       "cultural-archive",
      launch:   null,                       // TODO: launch month unknown
      result:   "Archive, records site and intranet",
      title:    "Cultural Archive & Intranet Infrastructure",
      summary:  "Archive sites and an internal intranet, deployed and maintained for a client.",
      dates:    null,                                       // TODO: add dates
      bullets: [
        "Mukurtu CMS for a client's cultural archive site: taxonomy configuration and custom theming.",
        "AtoM archival records site on an Ubuntu VPS.",
        "Internal Hyper-V-hosted intranet behind an IIS reverse proxy with SSL."
      ],
      tags:  ["Mukurtu", "AtoM", "Drupal", "Hyper-V", "IIS"],
      image: null                                           // no links: client is never named
    },
    {
      id:       "gitabot",
      minor:    true,                                     // side mission: smaller row under the main log
      launch:   "2024-12",               // YYYY-MM; drives the row date
      result:   "700+ Q&A pairs, 50+ beta users",
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
      minor:    true,                                     // side mission: smaller row under the main log
      launch:   "2025-03",               // YYYY-MM; drives the row date
      result:   "30,000+ organic views",
      title:    "Infodumper",
      summary:  "Experimental AI-generated YouTube channel that passed 30,000 organic views in a few weeks.",
      dates:    "Mar – Apr 2025",
      bullets: [
        "Short videos on historical, religious and conspiracy topics, exploring AI for content creation and automation."
      ],
      tags:  ["AI", "Content Creation", "Automation", "Video"],
      live:  "https://www.youtube.com/@infodumperca",
      liveLabel: "Watch on YouTube",
      image: "assets/projects/infodumper.webp",
      imageAlt: "The Infodumper YouTube channel page showing its logo and a grid of illustrated Shorts thumbnails",
    }
  ],

  skills: [
    { title: "Languages",              note: "Primary: Python & TypeScript",
      items: ["Python", "TypeScript", "JavaScript", "SQL", "HTML", "CSS", "Bash", "YAML"] },
    { title: "Frameworks & Libraries", note: "Full-stack web & real-time apps",
      items: ["React", "Next.js 14", "Node.js", "Express", "Socket.IO", "Leaflet.js", "TailwindCSS", "NextAuth.js", "Streamlit"] },
    { title: "AI & Machine Learning",  note: "Local LLM workflows & agent systems",
      items: ["LLM Integration", "Ollama", "CrewAI", "Multi-Agent Systems", "Prompt Engineering", "NLP", "DeepSeek", "Llama 3", "Mistral"] },
    { title: "Data & Databases",       note: "Spatial databases & real-time pipelines",
      items: ["PostgreSQL", "PostGIS", "pgvector", "MongoDB", "REST APIs", "WebSockets", "Data Engineering", "Power BI", "Data Visualization"] },
    { title: "DevOps & Cloud",         note: "Containers & deployment",
      items: ["Docker", "Kubernetes", "GitHub Actions", "CI/CD", "AWS", "Vercel", "Linux", "Git"] },
    { title: "IT & Systems",           note: "From MSP sysadmin work",
      items: ["Microsoft 365 / Intune", "Active Directory / Azure AD", "AD CS (internal PKI)", "IAM", "Proofpoint", "PowerShell", "Microsoft Graph", "Wireshark", "VLANs / DHCP / firewall fundamentals", "Wi-Fi site surveys (NetSpot)"] },
    { title: "Web & Marketing",        note: "From freelance and client work",
      items: ["WordPress / Elementor", "Google Ads", "Google Business Profile", "Meta Ads", "SEO"] }
  ],

  education: [
    {
      id:      "ualberta",
      degree:  "BSc Computing Science",
      minor:   "Minor in Economics",
      school:  "University of Alberta",
      location: "Edmonton, AB",
      start:   "2022",
      end:     "Expected Dec 2026",
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
