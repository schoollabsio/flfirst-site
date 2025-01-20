import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";

import "./tailwind.css";
import useFeatureFlag from "./hooks/useFeatureFlag";
import { Hide, Show } from "./components/conditionals";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const videosEnabled = useFeatureFlag("videos");
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-100 flex flex-col min-h-screen pt-16 pb-20 bg-cover bg-fixed">
        <nav className="bg-white shadow-md w-full fixed top-0 z-10">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="relative flex items-center justify-between h-16">
              <div className="flex-1 flex items-center">
                <a href="/" className="flex-shrink-0">
                  <img
                    className="h-8 w-auto"
                    src="FIRSTTech_iconHorz_RGB.png"
                    alt="Logo"
                  />
                </a>
              </div>
              <div className="flex-1 flex items-center justify-end">
                <div className="hidden sm:block">
                  <div className="flex space-x-4">
                    <a
                      id="newsletter"
                      href="/newsletter"
                      className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Newsletter
                    </a>
                    <a
                      id="leagues"
                      href="/leagues"
                      className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Leagues
                    </a>
                    <a
                      id="events"
                      href="/events"
                      className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Events
                    </a>
                    <a
                      id="teams"
                      href="/teams"
                      className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Teams
                    </a>
                    <a
                      id="gallery"
                      href="/gallery"
                      className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Gallery
                    </a>
                    <Show when={videosEnabled}>
                      <a
                        id="videos"
                        href="/videos"
                        className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Videos
                      </a>
                    </Show>
                  </div>
                </div>
              </div>
              <div
                id="menu-button"
                className="absolute inset-y-0 right-0 flex items-center sm:hidden"
                onClick={() => {
                  const mobileMenu = document.getElementById("mobile-menu");
                  if (mobileMenu) {
                    mobileMenu.classList.toggle("hidden");
                  }
                }}
              >
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  aria-controls="mobile-menu"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open main menu</span>
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  </svg>
                  <svg
                    className="hidden h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a
                id="newsletter-mobile"
                href="/newsletter"
                className="text-gray-700 hover:bg-gray-200 block px-3 py-2 rounded-md text-base font-medium"
              >
                Newsletter
              </a>
              <a
                id="leagues-mobile"
                href="/leagues"
                className="text-gray-700 hover:bg-gray-200 block px-3 py-2 rounded-md text-base font-medium"
              >
                Leagues
              </a>
              <a
                id="events-mobile"
                href="/events"
                className="text-gray-700 hover:bg-gray-200 block px-3 py-2 rounded-md text-base font-medium"
              >
                Events
              </a>
              <a
                id="events-mobile"
                href="/teams"
                className="text-gray-700 hover:bg-gray-200 block px-3 py-2 rounded-md text-base font-medium"
              >
                Teams
              </a>
              <a
                id="gallery-mobile"
                href="/gallery"
                className="text-gray-700 hover:bg-gray-200 block px-3 py-2 rounded-md text-base font-medium"
              >
                Gallery
              </a>
              <Show when={videosEnabled}>
                <a
                  id="videos-mobile"
                  href="/videos"
                  className="text-gray-700 hover:bg-gray-200 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Videos
                </a>
              </Show>
            </div>
          </div>
        </nav>
        <div className="flex items-center justify-center pt-5 px-5 text-black">
          {children}

          <div className="w-full flex justify-center items-center py-4 px-6 fixed bottom-0 bg-white drop-shadow-[0_35px_35px_rgba(0,0,0,0.25)]">
            <div className="flex-1"></div>
            <div className="flex-1">
              <a
                className="block w-full text-center"
                href="https://visitcentralflorida.org/"
                target="_blank"
              >
                <img
                  className="h-8 w-auto inline-block"
                  src="VisitCF_4cHorLogo-png.png"
                  alt="Visit Central Florida"
                />
              </a>
            </div>
            <div className="flex-1 text-right">
              <a href="/about" className="text-gray-400 hover:text-blue-500">
                About this site
              </a>
            </div>
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
