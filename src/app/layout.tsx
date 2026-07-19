import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getSafeToken } from "@/lib/cookieHelper";
import { verifyJWT } from "@/lib/auth";
import AiChatWidget from "@/components/AiChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LearnersPoint | E-Learning & Practical Internships",
  description: "A clean, high-contrast, text-first platform for web development and software engineering training, heavily inspired by Full Stack Open.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me-in-production-123456789";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getSafeToken();
  
  let user = null;
  if (token) {
    const payload = await verifyJWT(token, JWT_SECRET);
    if (payload) {
      user = {
        id: payload.userId,
        name: payload.name || payload.email.split("@")[0],
        email: payload.email,
        role: payload.role,
      };
    }
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var isCapacitor = window.location.origin.indexOf('capacitor://') === 0 || 
                                  (window.location.origin.indexOf('localhost') !== -1 && window.location.port !== '3000' && window.location.port !== '3001');
                if (isCapacitor) {
                  var backend = 'http://192.168.1.102:3000';
                  var ua = window.navigator.userAgent.toLowerCase();
                  if (ua.indexOf('android') !== -1 && (ua.indexOf('sdk') !== -1 || ua.indexOf('google') !== -1 || ua.indexOf('emulator') !== -1)) {
                    backend = 'http://10.0.2.2:3000';
                  }
                  var oldFetch = window.fetch;
                  window.fetch = function(url, init) {
                    init = init || {};
                    init.credentials = 'include';
                    if (typeof url === 'string' && url.indexOf('/') === 0) {
                      url = backend + url;
                    }
                    return oldFetch(url, init);
                  };
                  console.log('[LearnersPoint Mobile Bridge] Redirecting API requests to:', backend);
                }
              })();
            `
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground transition-colors w-full max-w-full overflow-x-hidden selection:bg-[#3DBFF2]/30">
        <Navbar user={user} />
        <main className="flex-grow w-full">
          {children}
        </main>
        <footer className="border-t border-border-main py-6 text-center text-xs font-mono text-zinc-500 bg-card-bg mt-auto transition-colors">
          <p>© {new Date().getFullYear()} [LEARNERS_POINT]. inspired by fullstackopen.com.</p>
        </footer>
        <AiChatWidget />
      </body>
    </html>
  );
}
