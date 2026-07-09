export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  order: number;
  content: string; // Markdown content
}

export interface Course {
   id: string;
   title: string;
   slug: string;
   description: string;
   price: number;
   isPublished: boolean;
   modules: CourseModule[];
   slots?: any[];
 }

export const COURSES: Course[] = [
  {
    id: "nextjs-enterprise-architecture",
    title: "Enterprise Next.js & React Core Architecture",
    slug: "nextjs-enterprise-architecture",
    description: "Master React Server Components vs Client Components, HTML streaming pipelines, Server Actions, data caching (revalidateTag), and Edge routing security.",
    price: 4999.00,
    isPublished: true,
    modules: [
      {
        id: "next-m1",
        courseId: "nextjs-enterprise-architecture",
        title: "The App Router Paradigm Shift",
        order: 0,
        content: `
# The App Router Paradigm Shift

Next.js App Router shifts data fetching and UI rendering back to server runtimes.

## Server Components vs Client Components
By default, components in the app directory are React Server Components (RSC):
- Fetch resources close to your data source.
- Reduce browser JavaScript bundle payload.
- Stream HTML parts dynamically.

\`\`\`typescript
// Server Component default example
export default async function Page() {
  const items = await db.items.findMany();
  return <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}
\`\`\`
        `
      },
      {
        id: "next-m2",
        courseId: "nextjs-enterprise-architecture",
        title: "Advanced Data Mutation & Cache Orchestration",
        order: 1,
        content: `
# Advanced Data Mutation & Cache Orchestration

Mutate data statelessly using Server Actions, and orchestrate cache purging across CDN edge endpoints.

## Server Actions
Invoked inside forms or event actions, running securely on Node/Edge servers:
\`\`\`typescript
export async function updateProfile(formData: FormData) {
  "use server";
  const name = formData.get("name");
  await db.user.update({ data: { name } });
  revalidateTag("profile");
}
\`\`\`
        `
      },
      {
        id: "next-m3",
        courseId: "nextjs-enterprise-architecture",
        title: "Production Security Hardening",
        order: 2,
        content: `
# Production Security Hardening

Secure your application against security leaks, authenticate microservice queries, and validate session hashes inside middlewares.
        `
      }
    ]
  },
  {
    id: "advanced-ml-anomaly-detection",
    title: "Advanced Machine Learning & Behavioral Anomaly Detection",
    slug: "advanced-ml-anomaly-detection",
    description: "Deep dive into multi-dimensional feature spaces, Euclidean vs Mahalanobis distance equations, Isolation Forest splitting algorithms, and SHAP/LIME explainability maps.",
    price: 6499.00,
    isPublished: true,
    modules: [
      {
        id: "ml-m1",
        courseId: "advanced-ml-anomaly-detection",
        title: "Mathematical Foundations of Outlier Analysis",
        order: 0,
        content: `
# Mathematical Foundations of Outlier Analysis

Anomaly profiling requires mapping feature coordinates in multi-dimensional vector spaces.
        `
      },
      {
        id: "ml-m2",
        courseId: "advanced-ml-anomaly-detection",
        title: "Isolation Forests at Scale",
        order: 1,
        content: `
# Isolation Forests at Scale

Isolation Forests isolate anomalous points instead of profiling normal clusters.
        `
      },
      {
        id: "ml-m3",
        courseId: "advanced-ml-anomaly-detection",
        title: "Explainable AI (XAI) Frameworks",
        order: 2,
        content: `
# Explainable AI (XAI) Frameworks

Explain explainability metrics and prediction features using SHAP values and LIME frameworks.
        `
      }
    ]
  },
  {
    id: "zero-trust-cybersecurity",
    title: "Modern Cyber Security & Perimeterless Zero Trust Architecture",
    slug: "zero-trust-cybersecurity",
    description: "Transitioning to explicit session verification, NIST SP 800-207 standards, custom JWT lifespan, httpOnly secure cookie rotation, and Redis token blacklists.",
    price: 5999.00,
    isPublished: true,
    modules: [
      {
        id: "cyber-m1",
        courseId: "zero-trust-cybersecurity",
        title: "Core Tenets of NIST SP 800-207 Standards",
        order: 0,
        content: `
# Core Tenets of NIST SP 800-207 Standards

Zero Trust assumes the network perimeter is compromised. Every request must be explicitly verified.
        `
      },
      {
        id: "cyber-m2",
        courseId: "zero-trust-cybersecurity",
        title: "Identity Token Control & Continuous Session Auditing",
        order: 1,
        content: `
# Identity Token Control & Continuous Session Auditing

Manage custom JWT tokens lifetime, configure httpOnly cookie rotations, and deploy revocation list keys inside memory pools.
        `
      }
    ]
  }
];
