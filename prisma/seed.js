"use strict";

// prisma/seed.ts
var import_client = require("@prisma/client");
var import_crypto = require("crypto");
var prisma = new import_client.PrismaClient();
function getHashedPassword(password) {
  const salt = (0, import_crypto.randomBytes)(16);
  const hash = (0, import_crypto.pbkdf2Sync)(password, salt, 1e5, 32, "sha256");
  const hexSalt = salt.toString("hex");
  const hexKey = hash.toString("hex");
  return `${hexSalt}:${hexKey}`;
}
async function main() {
  console.log("\u{1F331} Seeding Courses and users using idempotent upsert patterns...");
  const defaultPassword = getHashedPassword("password");
  console.log("\u{1F465} Seeding administrator and student profiles...");
  await prisma.user.upsert({
    where: { email: "admin@learnerspoint.com" },
    update: { passwordHash: defaultPassword, role: "ADMIN" },
    create: {
      name: "Lead Instructor",
      email: "admin@learnerspoint.com",
      phone: "111-222-3333",
      passwordHash: defaultPassword,
      role: "ADMIN"
    }
  });
  const studentsData = [
    { name: "student_0x5c", email: "student1@learnerspoint.com", phone: "100-001-0001", xp: 750, rank: 1 },
    { name: "developer_args", email: "student2@learnerspoint.com", phone: "100-001-0002", xp: 520, rank: 2 },
    { name: "rust_coder", email: "student3@learnerspoint.com", phone: "100-001-0003", xp: 360, rank: 3 },
    { name: "noob_hacker", email: "student4@learnerspoint.com", phone: "100-001-0004", xp: 180, rank: 4 }
  ];
  for (const s of studentsData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { name: s.name, phone: s.phone },
      create: {
        name: s.name,
        email: s.email,
        phone: s.phone,
        passwordHash: defaultPassword,
        role: "STUDENT"
      }
    });
    await prisma.userXP.upsert({
      where: { userId: user.id },
      update: { currentXp: s.xp, globalRank: s.rank },
      create: {
        userId: user.id,
        currentXp: s.xp,
        globalRank: s.rank
      }
    });
  }
  const coursesCatalog = [
    // 1. NextJS Enterprise Architecture
    {
      id: "nextjs-enterprise-architecture",
      title: "Enterprise Next.js & React Core Architecture",
      slug: "nextjs-enterprise-architecture",
      description: "Master React Server Components vs Client Components, HTML streaming pipelines, Server Actions, data caching, and Edge routing security.",
      price: 4999,
      modules: [
        {
          id: "next-m1",
          title: "The App Router Paradigm Shift",
          xpReward: 150,
          content: "# Server Components vs Client Components\nBy default, components in the app directory are React Server Components (RSC) that render on the server, minimizing browser client-side JS bundle overhead.",
          questions: [
            { text: "Which file convention represents visual fallback screens during react streaming events?", options: ["layout.tsx", "template.tsx", "loading.tsx", "error.tsx"], correct: 2 },
            { text: "What happens during client-side hydration?", options: ["Static HTML is generated on the server", "JavaScript mounts event listeners to server-rendered markup", "All databases are wiped out", "Server components are re-run on the browser"], correct: 1 },
            { text: "Which keyword directive marks a component file as client-side rendering boundary?", options: ["'use client'", "'use client-side'", "'use state'", "'browser-only'"], correct: 0 }
          ]
        },
        {
          id: "next-m2",
          title: "Advanced Data Mutation & Cache Orchestration",
          xpReward: 100,
          content: "# Advanced Data Mutation & Cache Orchestration\nMutate data statelessly using Server Actions, and orchestrate cache purging across CDN edge endpoints using revalidateTag().",
          questions: [
            { text: "Which utility is used to clear cached data segments associated with specific tags?", options: ["clearCache()", "revalidatePath()", "revalidateTag()", "deleteTag()"], correct: 2 },
            { text: "What does stale-while-revalidate fetch logic do?", options: ["Returns a 404 immediately", "Serves cached data instantly while fetching updates in the background", "Locks browser inputs during fetch", "Clears browser cookies"], correct: 1 },
            { text: "Which hook provides optimistic UI updates before Server Action responses return?", options: ["useState", "useOptimistic", "useActionState", "useEffect"], correct: 1 }
          ]
        },
        {
          id: "next-m3",
          title: "Production Security Hardening",
          xpReward: 100,
          content: "# Production Security Hardening\nSecure your application against security leaks, authenticate microservice queries, and validate session hashes inside middleware.",
          questions: [
            { text: "Where should session tokens be stored to protect them from XSS?", options: ["LocalStorage", "SessionStorage", "HttpOnly Cookies with Secure/SameSite flags", "State variables"], correct: 2 },
            { text: "Which directive tells the compiler that a module cannot be imported client-side?", options: ["'server-only'", "'use server'", "'private'", "'use isolate'"], correct: 0 },
            { text: "How should API route inputs be validated?", options: ["Using client-side HTML checks only", "Using runtime schema validation (like Zod) on the server", "Relying on database key errors", "Inputs do not need validation"], correct: 1 }
          ]
        }
      ]
    },
    // 2. Machine Learning Anomaly Detection
    {
      id: "advanced-ml-anomaly-detection",
      title: "Advanced Machine Learning & Behavioral Anomaly Detection",
      slug: "advanced-ml-anomaly-detection",
      description: "Deep dive into multi-dimensional feature spaces, Euclidean vs Mahalanobis distance equations, Isolation Forest splitting algorithms, and explainability maps.",
      price: 6499,
      modules: [
        {
          id: "ml-m1",
          title: "Mathematical Foundations of Outlier Analysis",
          xpReward: 100,
          content: "# Euclidean vs Mahalanobis Distance\nMahalanobis distance accounts for covariance patterns between multi-dimensional vector features.",
          questions: [
            { text: "Why is Mahalanobis distance preferred over Euclidean distance for correlated features?", options: ["It is computationally cheaper", "It accounts for feature covariances and scaling", "It is linear by default", "It does not require variance statistics"], correct: 1 },
            { text: "What does dataset profiling do in outlier analysis?", options: ["Optimizes neural learning rates", "Exposes normal cluster borders and standard deviations", "Caches database search indices", "Validates JWT session signatures"], correct: 1 },
            { text: "What is a multi-dimensional feature space?", options: ["A single column database index", "A mathematical coordinate system spanning all input feature dimensions", "A nested json structure", "An memory cache map"], correct: 1 }
          ]
        },
        {
          id: "ml-m2",
          title: "Isolation Forests at Scale",
          xpReward: 100,
          content: "# Isolation Forests\nIsolation Forests isolate anomalous points instead of profiling normal clusters by recursively partitioning input features.",
          questions: [
            { text: "How does an Isolation Forest isolate outlier vectors?", options: ["By fitting support vectors", "By recursively partitioning features, yielding shorter paths for anomalies", "By calculating centroid averages", "By maximizing gradient steps"], correct: 1 },
            { text: "What does the contamination parameter control?", options: ["Database size limits", "Expected ratio of anomalous records in the training set", "Model tree maximum depth parameters", "Parallel processor allocation parameters"], correct: 1 },
            { text: "What is the complexity of isolation forest trees splitting?", options: ["Exponential", "Linear", "Logarithmic", "Quadratic"], correct: 2 }
          ]
        },
        {
          id: "ml-m3",
          title: "Explainable AI (XAI) Frameworks",
          xpReward: 100,
          content: "# Explainable AI (XAI)\nLearn explainability metrics and local prediction features using SHAP values and LIME surrogate frameworks.",
          questions: [
            { text: "What do SHAP values identify?", options: ["Global database latencies", "The contribution of each individual feature to a prediction instance", "CPU execution profiles", "Training validation errors"], correct: 1 },
            { text: "What is the difference between SHAP and LIME?", options: ["SHAP is local, LIME is global", "SHAP guarantees consistency, LIME builds local surrogate models", "SHAP is fast, LIME requires GPUs", "There is no difference"], correct: 1 },
            { text: "What mathematical theory underlies SHAP values?", options: ["Game Theory (Shapley values)", "Central Limit Theorem", "Bayesian Networks", "Graph Theory"], correct: 0 }
          ]
        }
      ]
    },
    // 3. Cyber Security Zero Trust
    {
      id: "zero-trust-cybersecurity",
      title: "Modern Cyber Security & Perimeterless Zero Trust Architecture",
      slug: "zero-trust-cybersecurity",
      description: "Transitioning to explicit session verification, NIST SP 800-207 standards, custom JWT lifespan, httpOnly secure cookie rotation, and Redis token blacklists.",
      price: 5999,
      modules: [
        {
          id: "cyber-m1",
          title: "Core Tenets of NIST SP 800-207 Standards",
          xpReward: 100,
          content: "# NIST SP 800-207 Standards\nZero Trust assumes the network perimeter is compromised. Every single connection request must be explicitly validated.",
          questions: [
            { text: "What is the core premise of NIST SP 800-207 Zero Trust?", options: ["Castle-and-moat security", "Trust but verify intranet connections", "Assume all networks are hostile; authenticate every session", "Encrypt offline data disks"], correct: 2 },
            { text: "Which component makes the final policy validation decision?", options: ["Policy Decision Point (PDP)", "Firewall Router", "Intrusion Detection sensor", "Client Proxy Browser"], correct: 0 },
            { text: "What is micro-segmentation?", options: ["Sorting database index partitions", "Splitting networks into isolated, secure segments to restrict lateral movement", "Configuring multiple web servers", "Running background workers"], correct: 1 }
          ]
        },
        {
          id: "cyber-m2",
          title: "Identity Token Control & Continuous Session Auditing",
          xpReward: 100,
          content: "# Identity Token Control\nManage custom JWT token lifespans, configure httpOnly cookie rotations, and deploy revocation lists inside memory pools.",
          questions: [
            { text: "Why are HTTP-only cookie parameters preferred for storing access tokens?", options: ["They speed up request times", "They protect tokens from being accessed by client-side scripts (XSS)", "They encrypt database rows", "They automate browser routing"], correct: 1 },
            { text: "How does token rotation protect sessions?", options: ["It resets user password hashes on every page visit", "It issues a new refresh token whenever an access token is updated", "It invalidates all inactive users immediately", "It limits CPU process queues"], correct: 1 },
            { text: "Where should revoked token signatures be cached for low latency verification?", options: ["In a hard disk storage system", "In an in-memory store (e.g. Redis)", "In the browser's LocalStorage", "In public environment assets"], correct: 1 }
          ]
        }
      ]
    },
    // 4. Keen Full Stack Web Development
    {
      id: "full-stack-web-development-keen",
      title: "Full Stack Web Development (PHP / MERN / Python)",
      slug: "full-stack-web-development-keen",
      description: "Comprehensive developer track covering HTML5/CSS3, frontend client grids, responsive Bootstrap canvas, node backends, PHP engines, and RESTful database endpoints.",
      price: 8500,
      modules: [
        {
          id: "fs-m1",
          title: "Frontend Technologies (HTML5, CSS3, JS, Bootstrap)",
          xpReward: 100,
          content: "# HTML5 & Responsive Design\nMaster semantic HTML layouts, CSS layout flexbox grids, and mobile-first container configurations using Bootstrap utilities.",
          questions: [
            { text: "Which HTML5 tag defines a self-contained content card?", options: ["<article>", "<div>", "<section>", "<aside>"], correct: 0 },
            { text: "How does Bootstrap 5 apply responsive column sizing?", options: ["Flexbox layout grid classes", "CSS grids only", "Float metrics", "JavaScript event handlers"], correct: 0 },
            { text: "Which keyword represents a lexical execution binding context in JavaScript?", options: ["this", "function", "let", "var"], correct: 0 }
          ]
        },
        {
          id: "fs-m2",
          title: "Backend Engines & Frameworks",
          xpReward: 100,
          content: "# Node.js & Express.js Backends\nConfigure event loop request flows in Node, build routing controllers in Express, or parse backend requests in PHP engines.",
          questions: [
            { text: "What is the primary thread runtime architecture of Node.js?", options: ["Single-threaded event loop", "Multi-threaded pool", "Blocked I/O threads", "Coroutines"], correct: 0 },
            { text: "In Express.js, what does the next() callback do?", options: ["Passes execution to the next middleware", "Resolves the HTTP response", "Closes the server socket", "Redirects the client"], correct: 0 },
            { text: "What is the purpose of PHP Composer?", options: ["Package dependency manager", "PHP script interpreter", "Web server engine", "Database migration utility"], correct: 0 }
          ]
        },
        {
          id: "fs-m3",
          title: "Database Integrations & REST APIs",
          xpReward: 100,
          content: "# Databse Schemas and APIs\nBuild transactional APIs, map schema models using ODM/ORM parameters, and configure secure CORS domain request access headers.",
          questions: [
            { text: "Which HTTP method is designed to apply partial updates to a resource?", options: ["PATCH", "POST", "PUT", "DELETE"], correct: 0 },
            { text: "What does MongoDB use to store database collections?", options: ["BSON documents", "Relational tables", "Graph nodes", "CSV text logs"], correct: 0 },
            { text: "What is the purpose of CORS headers?", options: ["Restrict client cross-origin resource queries in the browser", "Compress web assets", "Encrypt password hashes", "Manage session cookies"], correct: 0 }
          ]
        }
      ]
    },
    // 5. Keen Core & Advanced Java Programming
    {
      id: "core-advanced-java-programming",
      title: "Core & Advanced Java Programming",
      slug: "core-advanced-java-programming",
      description: "Master Java OOP concepts, exception chains, memory collection management, multi-threaded pipelines, JDBC database layers, Spring MVC, and Spring Boot microservices.",
      price: 6e3,
      modules: [
        {
          id: "java-m1",
          title: "Java Basics & OOPS Concepts",
          xpReward: 100,
          content: "# Java OOP Architecture\nUnderstand class inheritances, abstract templates, polymorphism, encapsulation, and garbage collection behaviors inside the JVM.",
          questions: [
            { text: "Which OOP concept describes shielding structural variable attributes from direct external changes?", options: ["Encapsulation", "Polymorphism", "Abstraction", "Inheritance"], correct: 0 },
            { text: "What is the default parent class of every custom class in Java?", options: ["java.lang.Object", "java.lang.Class", "java.lang.System", "None"], correct: 0 },
            { text: "Which keyword prevents a class method from being overridden by subclasses?", options: ["final", "static", "private", "abstract"], correct: 0 }
          ]
        },
        {
          id: "java-m2",
          title: "Exception Handling & Multithreading",
          xpReward: 100,
          content: "# Multi-Threaded Pipelines\nOrchestrate parallel thread executions, handle race conditions, and implement try-catch-finally exception structures.",
          questions: [
            { text: "Which interface must be implemented to declare a class execution thread task?", options: ["java.lang.Runnable", "java.lang.Thread", "java.lang.Process", "java.lang.Executor"], correct: 0 },
            { text: "What does the synchronized keyword do?", options: ["Locks access to a resource, allowing only one thread to execute it at a time", "Speeds up data structures", "Automates thread sleep periods", "Closes database pools"], correct: 0 },
            { text: "Which exceptions are checked at compile time?", options: ["Checked Exceptions", "Unchecked Exceptions", "Runtime Exceptions", "Errors"], correct: 0 }
          ]
        },
        {
          id: "java-m3",
          title: "Advanced Java (Servlets, JSP, Hibernate & Spring Boot)",
          xpReward: 100,
          content: "# Modern Spring Boot Services\nConfigure dependency injection, construct REST endpoints with Spring MVC, and map data entities via Hibernate JPA schemas.",
          questions: [
            { text: "Which annotation registers a class as an entry web controller in Spring Boot?", options: ["@RestController", "@Service", "@Repository", "@Entity"], correct: 0 },
            { text: "What is Dependency Injection (DI) designed to solve?", options: ["Decouples object instantiation, letting the framework manage dependency setups", "Speeds up CPU garbage runs", "Connects to databases", "Validates security tokens"], correct: 0 },
            { text: "Which component represents the primary session manager in Hibernate JPA?", options: ["SessionFactory", "EntityManagerFactory", "ConnectionPool", "DriverManager"], correct: 0 }
          ]
        }
      ]
    },
    // 6. Keen Python Programming & Django Framework
    {
      id: "python-django-development",
      title: "Python Programming & Django Framework",
      slug: "python-django-development",
      description: "Learn Python script architecture, standard data structures, advanced file parsing operations, and build multi-page database websites using Django MVC model logic.",
      price: 5500,
      modules: [
        {
          id: "python-m1",
          title: "Python Core Syntax & Data Structures",
          xpReward: 100,
          content: "# Python Data Collections\nLearn key data types: mutable lists, immutable tuples, key-value dictionaries, unique element sets, and conditional flows.",
          questions: [
            { text: "Which collection data type is designated by brackets, mutable, and ordered?", options: ["List", "Tuple", "Dictionary", "Set"], correct: 0 },
            { text: "How do you check if a key exists in a Python dictionary?", options: ["'key' in dict", "dict.contains('key')", "dict.has_key('key')", "dict.find('key')"], correct: 0 },
            { text: "What is the difference between a list and a tuple?", options: ["Lists are mutable, tuples are immutable", "Lists are faster than tuples", "Tuples cannot store integers", "Lists cannot be nested"], correct: 0 }
          ]
        },
        {
          id: "python-m2",
          title: "Advanced Scripting & File I/O",
          xpReward: 100,
          content: "# Exception Handling & File Handlers\nUtilize 'with open()' file statements, parse JSON data streams, and write error handling blocks using try-except syntax.",
          questions: [
            { text: "Why is the 'with' statement preferred for opening file handlers?", options: ["It automatically closes the file context, even if exceptions occur", "It speeds up read time", "It encrypts file data", "It does not require permissions"], correct: 0 },
            { text: "Which exception class catches general runtime errors in python blocks?", options: ["Exception", "ValueError", "TypeError", "RuntimeError"], correct: 0 },
            { text: "What does json.loads() do?", options: ["Parses a JSON string into a Python dictionary", "Saves a dictionary to a JSON file", "Downloads JSON data from url", "Compiles python script parameters"], correct: 0 }
          ]
        },
        {
          id: "python-m3",
          title: "Building Web Applications with Django",
          xpReward: 100,
          content: "# Django Web Applications\nConfigure URL dispatchers, create templates, construct models, and run migrations to map models to SQL databases.",
          questions: [
            { text: "Which command generates SQL migration scripts in Django?", options: ["python manage.py makemigrations", "python manage.py migrate", "python manage.py runserver", "python manage.py check"], correct: 0 },
            { text: "What does the ORM do in Django?", options: ["Maps python class models directly to database tables and SQL statements", "Serves template HTML structures", "Validates JWT user sessions", "Manages route paths"], correct: 0 },
            { text: "What is the default administrator dashboard URL in Django configurations?", options: ["/admin", "/dashboard", "/login", "/settings"], correct: 0 }
          ]
        }
      ]
    },
    // 7. Keen Oracle SQL & PL/SQL Developer
    {
      id: "oracle-sql-plsql-developer",
      title: "Oracle SQL & PL/SQL Developer Track",
      slug: "oracle-sql-plsql-developer",
      description: "Master relational models, construct nested SQL joins, compile PL/SQL execution blocks, define database triggers, and build custom cursors.",
      price: 7e3,
      modules: [
        {
          id: "oracle-m1",
          title: "Relational Database Fundamentals & SQL Queries",
          xpReward: 100,
          content: "# SQL Query Architecture\nUnderstand database tables, select statement operators, filter constraints, and row ordering syntax.",
          questions: [
            { text: "Which SQL clause is used to filter records returned by SELECT commands?", options: ["WHERE", "GROUP BY", "HAVING", "ORDER BY"], correct: 0 },
            { text: "What does SELECT DISTINCT do?", options: ["Filters out duplicate rows from query results", "Returns all table columns", "Enforces foreign keys", "Checks database connections"], correct: 0 },
            { text: "Which keyword orders database results in descending format?", options: ["DESC", "ASC", "SORT", "ORDER"], correct: 0 }
          ]
        },
        {
          id: "oracle-m2",
          title: "Subqueries, Joins & Views",
          xpReward: 100,
          content: "# Nested SQL Joins\nCreate inner joins, outer joins, subqueries, and declare database views to encapsulate queries.",
          questions: [
            { text: "Which join returns all matching rows and all non-matching rows from both tables?", options: ["FULL OUTER JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN"], correct: 0 },
            { text: "What is a database VIEW?", options: ["A virtual table representing the compiled output of a saved SELECT query", "A database index file", "A connection string parameter", "A memory cache block"], correct: 0 },
            { text: "How do you filter aggregate groups in SELECT queries?", options: ["HAVING", "WHERE", "ORDER BY", "GROUP BY"], correct: 0 }
          ]
        },
        {
          id: "oracle-m3",
          title: "PL/SQL Blocks, Triggers, and Procedures",
          xpReward: 100,
          content: "# Procedural PL/SQL Blocks\nWrite named procedures, configure execution triggers, handle cursors, and catch PL/SQL exception states.",
          questions: [
            { text: "Which section in PL/SQL block structures is mandatory?", options: ["BEGIN", "DECLARE", "EXCEPTION", "CURSOR"], correct: 0 },
            { text: "What is a database TRIGGER?", options: ["A PL/SQL block that executes automatically when a DML event occurs on a table", "A query helper", "A table primary key", "A database connection pool"], correct: 0 },
            { text: "Which loop cursor construct handles opening, fetching, and closing statements automatically?", options: ["Cursor FOR Loop", "Basic LOOP", "WHILE Loop", "None"], correct: 0 }
          ]
        }
      ]
    },
    // 8. Keen Linux Administration & Cloud Infrastructure
    {
      id: "linux-administration-cloud",
      title: "Linux Administration & Cloud Infrastructure",
      slug: "linux-administration-cloud",
      description: "Master Linux terminal commands, configure user permission levels, secure server SSH ports, deploy virtualized instances, and set up Cloud architectures.",
      price: 6500,
      modules: [
        {
          id: "linux-m1",
          title: "Linux Commands & File Systems",
          xpReward: 100,
          content: "# Linux Commands & File Systems\nLearn root navigation commands, understand file system hierarchies, edit file descriptors, and configure permission bits.",
          questions: [
            { text: "Which command alters ownership assignments for files or directories?", options: ["chown", "chmod", "mv", "cp"], correct: 0 },
            { text: "What chmod octal value grants read, write, and execute rights to owner, and read-only to others?", options: ["744", "777", "644", "755"], correct: 0 },
            { text: "Which command displays active system processes in real time?", options: ["top", "ps", "grep", "ls"], correct: 0 }
          ]
        },
        {
          id: "linux-m2",
          title: "User Management & Network Security",
          xpReward: 100,
          content: "# SSH and User Groups\nConfigure user accounts, control group permissions, configure firewalls (iptables/ufw), and secure SSH servers.",
          questions: [
            { text: "Where are user account details stored in Linux systems?", options: ["/etc/passwd", "/etc/shadow", "/etc/users", "/etc/group"], correct: 0 },
            { text: "Which port does the SSH daemon listen to by default?", options: ["22", "80", "443", "8080"], correct: 0 },
            { text: "Which command elevates shell rights to executive user status?", options: ["sudo", "pwd", "mkdir", "cat"], correct: 0 }
          ]
        },
        {
          id: "linux-m3",
          title: "Virtualization & Cloud Deployment Fundamentals",
          xpReward: 100,
          content: "# Cloud Networking Fundamentals\nDeploy virtual machines, build container images with Docker, configure reverse proxies with Nginx, and review cloud scaling metrics.",
          questions: [
            { text: "Which Docker command runs a container instance from an image template?", options: ["docker run", "docker build", "docker push", "docker images"], correct: 0 },
            { text: "What does an Nginx reverse proxy do?", options: ["Forwards client requests to backend server instances", "Encrypts database data disks", "Acts as a firewall system", "Compiles JavaScript files"], correct: 0 },
            { text: "What is elastic cloud scaling?", options: ["Dynamically adjusts cloud instances based on traffic volumes", "Deletes databases", "Encrypts SSH ports", "Compresses web assets"], correct: 0 }
          ]
        }
      ]
    },
    // 9. Keen UI/UX & Responsive Web Designing
    {
      id: "web-designing-responsive",
      title: "UI/UX & Responsive Web Designing",
      slug: "web-designing-responsive",
      description: "Learn core design rules, typography hierarchies, wireframe interfaces inside Figma, and translate mockups to fully responsive HTML/CSS structures.",
      price: 4500,
      modules: [
        {
          id: "design-m1",
          title: "Core Design Theory & Typography",
          xpReward: 100,
          content: "# Visual Hierarchy Theory\nUnderstand color contrasts, visual focus nodes, line-height grid systems, and typography ratios for modern layouts.",
          questions: [
            { text: "What is the primary role of visual hierarchy in UI design?", options: ["Guides the user's attention to key elements first", "Adds custom decorations", "Compresses image weights", "Speeds up loading times"], correct: 0 },
            { text: "Which contrast ratio is minimum for standard text under WCAG guidelines?", options: ["4.5:1", "3:1", "10:1", "1:1"], correct: 0 },
            { text: "What is sans-serif typography characterized by?", options: ["Clean, simple stroke ends without small details", "Small projecting strokes at the end of letters", "Fixed width characters", "Italic styling only"], correct: 0 }
          ]
        },
        {
          id: "design-m2",
          title: "Figma Wireframing & Prototyping",
          xpReward: 100,
          content: "# Figma Interface Mockups\nBuild component kits, configure auto-layout constraints, create interactive page transition animations, and map user flows.",
          questions: [
            { text: "Which Figma feature automatically adjusts sizes and paddings when content changes?", options: ["Auto Layout", "Components Group", "Smart Animate", "Grid System"], correct: 0 },
            { text: "What is a Figma prototype trigger?", options: ["An event (like click or hover) that fires a page transition or state change", "A database query", "An image layout", "A system token"], correct: 0 },
            { text: "What are reusable elements in Figma called?", options: ["Components", "Groups", "Layers", "Vectors"], correct: 0 }
          ]
        },
        {
          id: "design-m3",
          title: "Translating Designs to Fluid Responsive HTML/CSS Canvas",
          xpReward: 100,
          content: "# Responsive HTML/CSS Canvas\nTranslate design wireframes to clean CSS layouts using media queries, viewport units, and flexbox configurations.",
          questions: [
            { text: "Which CSS parameter sets media break points dynamically?", options: ["@media", "@theme", "@import", "@keyframes"], correct: 0 },
            { text: "What does 'box-sizing: border-box' ensure?", options: ["Paddings and borders are included in the element's total width and height", "Sets border colors", "Aligns items centrally", "Makes elements rounded"], correct: 0 },
            { text: "Which CSS viewport unit represents 1% of the viewport width?", options: ["vw", "vh", "px", "em"], correct: 0 }
          ]
        }
      ]
    },
    // 10. Keen Digital Marketing & SEO Architecture
    {
      id: "digital-marketing-seo-keen",
      title: "Digital Marketing & SEO Architecture",
      slug: "digital-marketing-seo-keen",
      description: "Learn search engine indexing algorithms, configure keyword strategies, optimize meta attributes, run social campaigns, and map lead conversion funnels.",
      price: 4e3,
      modules: [
        {
          id: "dm-m1",
          title: "Search Engine Optimization (On-Page & Off-Page)",
          xpReward: 100,
          content: "# Search Optimization Architecture\nOptimize schema tag markup, structure headers, map keyword distributions, and configure high-authority backlink channels.",
          questions: [
            { text: "Which HTML meta tag controls page snippet summaries displayed on search pages?", options: ["meta name='description'", "meta name='keywords'", "meta name='author'", "title"], correct: 0 },
            { text: "What is off-page SEO primarily focused on?", options: ["Acquiring authoritative backlinks to build site trust and credibility", "Formatting site CSS files", "Optimizing image weights", "Structuring database queries"], correct: 0 },
            { text: "What is the purpose of robots.txt?", options: ["Instructs search engine web crawlers which pages or folders to index or skip", "Secures user sessions", "Redirects page queries", "Compresses web scripts"], correct: 0 }
          ]
        },
        {
          id: "dm-m2",
          title: "Social Media Marketing & Analytics",
          xpReward: 100,
          content: "# Marketing Campaigns and Analytics\nRun segment-targeted ad campaigns, configure conversion tracking pixels, and measure user acquisition costs (CAC).",
          questions: [
            { text: "What does CAC stand for in marketing analytics?", options: ["Customer Acquisition Cost", "Client Action Count", "Campaign Active Cost", "None"], correct: 0 },
            { text: "What does a tracking pixel do?", options: ["Triggers server analytics callbacks when user events occur on the page", "Displays visual images", "Secures server ports", "Caches system pages"], correct: 0 },
            { text: "Which metric measures the percentage of visitors who perform a desired action?", options: ["Conversion Rate", "Click-Through Rate", "Bounce Rate", "Impressions"], correct: 0 }
          ]
        },
        {
          id: "dm-m3",
          title: "Inbound Lead Generation Funnels",
          xpReward: 100,
          content: "# Lead Conversion Funnels\nBuild responsive landing pages, hook lead collection forms, and implement drip email marketing campaigns.",
          questions: [
            { text: "What is a lead magnet?", options: ["A free offer (like an ebook) given in exchange for contact information", "A database index helper", "An tracking cookie identifier", "A search keyword script"], correct: 0 },
            { text: "What is the goal of a landing page lead form?", options: ["Capture visitor contact credentials with minimum friction", "Serve video streams", "Validate payment cards", "Show company profiles"], correct: 0 },
            { text: "What is a drip email campaign?", options: ["A series of automated emails sent to subscribers on a set schedule", "A search crawler task", "A database backup script", "An analytics callback API"], correct: 0 }
          ]
        }
      ]
    }
  ];
  for (const courseData of coursesCatalog) {
    console.log(`\u{1F4DA} Seeding Course: ${courseData.title} (${courseData.slug})...`);
    const course = await prisma.course.upsert({
      where: { slug: courseData.slug },
      update: {
        title: courseData.title,
        description: courseData.description,
        price: courseData.price,
        isPublished: true
      },
      create: {
        id: courseData.id,
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description,
        price: courseData.price,
        isPublished: true
      }
    });
    for (let orderIdx = 0; orderIdx < courseData.modules.length; orderIdx++) {
      const m = courseData.modules[orderIdx];
      const quizId = `quiz-${m.id}`;
      const mod = await prisma.module.upsert({
        where: { courseId_order: { courseId: course.id, order: orderIdx } },
        update: { title: m.title, content: m.content },
        create: { id: m.id, courseId: course.id, title: m.title, order: orderIdx, content: m.content }
      });
      const quiz = await prisma.quiz.upsert({
        where: { id: quizId },
        update: { title: `${m.title} Quiz`, xpReward: m.xpReward },
        create: { id: quizId, moduleId: mod.id, title: `${m.title} Quiz`, xpReward: m.xpReward }
      });
      await prisma.question.deleteMany({ where: { quizId: quiz.id } });
      for (const q of m.questions) {
        await prisma.question.create({
          data: {
            quizId: quiz.id,
            questionText: q.text,
            options: q.options,
            correctOption: q.correct
          }
        });
      }
    }
    const slotDates = [
      /* @__PURE__ */ new Date("2026-07-15T00:00:00Z"),
      /* @__PURE__ */ new Date("2026-07-16T00:00:00Z"),
      /* @__PURE__ */ new Date("2026-07-17T00:00:00Z"),
      /* @__PURE__ */ new Date("2026-07-18T00:00:00Z")
    ];
    for (let idx = 0; idx < slotDates.length; idx++) {
      const timeWindow = idx % 2 === 0 ? "8:00 AM - 10:00 AM" : "5:00 PM - 7:00 PM";
      await prisma.courseSlot.upsert({
        where: {
          courseId_date_timeWindow: {
            courseId: course.id,
            date: slotDates[idx],
            timeWindow
          }
        },
        update: { capacity: 30 },
        create: {
          courseId: course.id,
          date: slotDates[idx],
          timeWindow,
          capacity: 30,
          bookedCount: 0
        }
      });
    }
    const now = /* @__PURE__ */ new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1e3);
    const oneHourHence = new Date(now.getTime() + 60 * 60 * 1e3);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1e3);
    await prisma.liveSlot.create({
      data: {
        title: `Active Live Session: ${course.title}`,
        startTime: oneHourAgo,
        endTime: oneHourHence,
        isLive: true,
        courseId: course.id
      }
    });
    await prisma.liveSlot.create({
      data: {
        title: `Scheduled Lecture: ${course.title} (Part 2)`,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1e3),
        isLive: false,
        courseId: course.id
      }
    });
    await prisma.recordedSession.create({
      data: {
        title: `Session 1: Introduction to ${course.title}`,
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        // Mock MP4 video file
        courseId: course.id
      }
    });
    await prisma.recordedSession.create({
      data: {
        title: `Session 2: Deep Dive into ${course.title} Concepts`,
        videoUrl: "https://www.w3schools.com/html/movie.mp4",
        // Mock MP4 video file
        courseId: course.id
      }
    });
  }
  console.log("\u2705 Successfully Seeded Complete Platform Database with Keen Infotech Catalog");
}
main().catch((e) => {
  console.error("\u274C Seeding transaction aborted due to error:", e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
