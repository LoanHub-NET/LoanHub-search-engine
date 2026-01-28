# LoanHub Search Engine

Backend (Search Engine / Aggregator) for the LoanHub project.

## Table of Contents
- [Project Overview](#project-overview)
- [Repository Structure](#repository-structure)
- [Branching Strategy (Gitflow)](#branching-strategy-gitflow)
- [Branch Policies](#branch-policies)
- [Pull Requests & Code Review](#pull-requests--code-review)
- [Commit Messages](#commit-messages)
- [Getting Started](#getting-started)

---

## Project Overview
This repository contains the **Search Engine** backend service responsible for:
- collecting loan offers from multiple providers (APIs),
- normalizing responses into a common format,
- returning results to the web UI.

It also now includes a lightweight **frontend shell** under `src/LoanHub.Search.Web` to
demonstrate the LoanHub user flows (anonymous search, extended search, offers, statuses).

---

## Database Tables
EF Core creates a small set of tables that map directly to required flows:
- `Applications` + `ApplicationStatusHistory` track loan requests and status timelines.
- `Users` stores registered accounts and profile data.
- `ExternalIdentities` supports OpenID Connect logins by mapping external subjects.
- `OfferSelections` captures the offer-selection + recalculation step before an application is submitted.

## Repository Structure
> (will evolve during the project)

Example structure:
/src
LoanHub.Search.Api
LoanHub.Search.Core
LoanHub.Search.Infrastructure
LoanHub.Search.Web
/tests
LoanHub.Search.UnitTests
LoanHub.Search.IntegrationTests


---

## Branching Strategy (Gitflow)
We use a simplified **Gitflow** workflow:

- `main` – stable release branch (production-ready code)
- `develop` – integration branch (latest merged features)
- `feature/*` – feature branches (work in progress)
- `hotfix/*` – urgent fixes for `main` (if needed)

**Typical flow**
1. Create a feature branch from `develop`
2. Open a Pull Request into `develop`
3. After the sprint/release is ready, merge `develop` into `main` via Pull Request

---

## Branch Policies
To ensure code quality and traceability, we enforce the following policies:

### Protected branches
- `main` is **protected** and cannot be pushed to directly.
- Changes to `main` must be merged through Pull Requests.

### Required reviews
- Each Pull Request to protected branches requires **at least 1 approval**.

### Additional rules
- Force pushes to protected branches are blocked.
- Deleting protected branches is restricted.
- Pull Requests should resolve all review conversations before merge (if enabled in repository settings).

> Note: Status checks (CI) will be required once the CI pipeline is configured.

---

## Pull Requests & Code Review
- All meaningful changes should go through a **Pull Request** (even if the branch is not protected yet).
- PR title should be short and descriptive, e.g.:
  - `feat: parallel offer aggregation`
  - `docs: update branch policies`
  - `fix: timeout handling for external providers`
- At least one teammate must review and approve the PR before merge.

---

## Commit Messages
We follow a simple convention inspired by Conventional Commits:
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `refactor:` refactoring without behavior change
- `test:` tests only
- `chore:` build / tooling / non-code changes

Examples:
- `docs: add branching strategy and policies`
- `feat: implement offer aggregation endpoint`
- `fix: handle provider timeout correctly`

---

## Getting Started
(placeholder – will be filled once the first API skeleton is added)

### Frontend (React + Vite)
The frontend lives in `src/LoanHub.Search.Web` and is kept alongside backend services so
the team can iterate on UI and API integration in one repo.

Common scripts (run inside `src/LoanHub.Search.Web`):
- `npm install`
- `npm run dev`

### Docker (API + Web)
To build and run the backend and frontend containers together:
```bash
docker compose up --build
```

Services:
- API: http://localhost:8080
- Web: http://localhost:5173
- Postgres: localhost:5432 (database: `loanhub`, user: `loanhub`)
