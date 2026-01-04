# Auth & Routing Architecture (READ BEFORE CHANGING)

## Purpose

This document explains **how authentication, routing, and layouts work** in this app and **what must NEVER be changed** to avoid redirect loops, blank pages, or hydration bugs.

---

## Core Principles (Non-Negotiable)

1. **Server is authoritative for auth**

   * Client auth state is eventually consistent
   * Server cookies are the source of truth

2. **Layouts must NEVER block rendering**

   * No loaders
   * No `return null`
   * No waiting for auth state

3. **Only ONE place decides where a user goes**

   * `/auth/resolve`

4. **Layouts enforce access — they do NOT route**

   * Layouts only deny access when explicitly wrong
   * Layouts never redirect to `/login`

---

## High-Level Flow

```
Login Page
  ↓
POST /api/auth/login
  ↓ (server sets cookie)
Redirect → /auth/resolve
  ↓
GET /api/auth/me (server truth)
  ↓
resolveRedirect()
  ↓
(admin | tenant | mechanic)
  ↓
Layout enforces role/tenant
```

---

## Responsibilities by Layer

### `/api/auth/login`

* Authenticates credentials
* Sets session cookie
* Never redirects UI

---

### `/api/auth/me`

* Returns authenticated user from cookies
* Server-only truth
* Used by `/auth/resolve`

---

### `AuthProvider`

* Holds:

  * `session`
  * `userRole`
  * `tenantId`
* Listens to `onAuthStateChange`
* **Never redirects**
* **Never decides routing**

---

### `/auth/resolve`

**The ONLY routing decision point**

Rules:

* Uses `/api/auth/me`
* Decides destination once
* Prevents double redirects
* Never depends on client auth state

---

### Route Layouts (`(admin)`, `(tenant)`, `(mechanic)`)

Rules:

* ALWAYS render UI shell
* NEVER block rendering
* NEVER redirect to `/login`
* ONLY redirect to `/auth/no-access` when access is explicitly invalid

Example rule:

```ts
if (session && role !== requiredRole) {
  redirect("/auth/no-access")
}
```

---

### Login Page

Rules:

* Handles form submission only
* Redirects ONCE to `/auth/resolve`
* Does NOT react to auth state
* UI loading state is form-only

---

## What MUST NOT Be Done

❌ Redirect to `/login` from layouts
❌ Use `loading` to block layouts
❌ `return null` in layouts based on auth
❌ Decide routing in AuthProvider
❌ Depend on `user` immediately after login
❌ Call `getSession()` in pages for routing

---

## Why This Architecture Exists

* Supabase auth hydrates asynchronously
* Next.js App Router renders layouts before auth settles
* Blocking or waiting causes:

  * Infinite loaders
  * Redirect loops
  * Blank pages

This design avoids all of that by:

* Trusting the server once
* Letting the client catch up naturally
* Keeping responsibilities strict

---

## If Something Breaks

Ask **only these questions**, in order:

1. Is `/api/auth/me` returning the correct user?
2. Is `/auth/resolve` routing correctly?
3. Is a layout blocking or returning `null`?
4. Is a layout redirecting to `/login`?

If yes → **that is the bug**.

---

## Final Reminder

> **Auth routing is solved.
> Do not “improve” it.**

Every previous bug came from breaking one of the rules above.

If changes are needed:

* Re-read this document
* Modify ONE layer only
* Never mix responsibilities

