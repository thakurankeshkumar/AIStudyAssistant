import { NextResponse } from "next/server";

const encoder = new TextEncoder();

function base64UrlToUint8Array(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function isTokenValid(token) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return false;
  }

  try {
    const [, payload] = parts;
    const payloadJson = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));

    if (typeof payloadJson.exp === "number" && Date.now() >= payloadJson.exp * 1000) {
      return false;
    }

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    return crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToUint8Array(parts[2]),
      encoder.encode(`${parts[0]}.${parts[1]}`)
    );
  } catch {
    return false;
  }
}

export async function middleware(req) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  // Public routes
  const isAuthPage = pathname === "/" || pathname === "/login" || pathname === "/signup";
  const isHomePage = pathname.startsWith("/home");

  // If user is NOT logged in and tries to access protected page
  if (!token && isHomePage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token) {
    const validToken = await isTokenValid(token);

    if (!validToken) {
      const res = NextResponse.redirect(new URL("/", req.url));
      res.cookies.set("token", "", { maxAge: 0, path: "/" });
      return res;
    }

    // If user IS logged in and tries to access landing/login/signup
    if (isAuthPage) {
      return NextResponse.redirect(new URL("/home", req.url));
    }
  }

  return NextResponse.next();
}

// Apply to all routes except static files
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};