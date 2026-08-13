# HeritageHub

**A full-stack community heritage resource sharing and curation platform built with Spring Boot, React, and MySQL.**

HeritageHub is a university software-engineering team project that models the complete lifecycle of community heritage resources: drafting, submission, review, publication, search, commenting, correction, and archiving.

The repository is presented here as an engineering portfolio project, with particular emphasis on **workflow design, role-based access control, backend state transitions, auditability, and safe runtime configuration**.

## Project at a Glance

```text
React + Vite frontend
        ↓ REST API
Spring Boot backend
        ↓
Controller → Service → Repository
        ↓
Spring Security / JWT / RBAC
        ↓
MySQL
```

Core technologies:

- Java 17
- Spring Boot 3.5
- Spring Web
- Spring Security
- Spring Data JPA
- JWT authentication
- MySQL 8
- React + Vite

## Team Project and My Contribution

This was a **team project**. Different members owned different functional modules.

My primary responsibility was the **Resource Review Workflow**.

I worked on the reviewer-facing flow that allows authorized reviewers to:

- inspect resources waiting for review;
- view metadata and supporting links / attachments;
- approve or reject a submission;
- persist reviewer identity, feedback, and timestamps;
- expose rejection feedback to contributors;
- support modification and resubmission so rejected resources can re-enter the review queue.

The contribution is centered on enforcing valid state transitions and keeping the review cycle traceable rather than treating approval as a single CRUD update.

## Resource Lifecycle

The central workflow is modeled as a state machine:

```text
DRAFT
  ↓ submit
PENDING_REVIEW
  ├── approve ──→ APPROVED
  └── reject  ──→ REJECTED
                    ↓ revise + resubmit
              PENDING_REVIEW

APPROVED ──→ ARCHIVED
```

| State | Meaning |
| --- | --- |
| `DRAFT` | Contributor is still editing the resource |
| `PENDING_REVIEW` | Submitted and waiting for reviewer action |
| `APPROVED` | Published and visible to public discovery |
| `REJECTED` | Returned with reviewer feedback |
| `ARCHIVED` | Removed from normal public discovery |

## Core Platform Features

### Authentication and authorization

- user registration and login;
- JWT-based authentication;
- role-based access control (**RBAC**);
- separate permissions for viewers, contributors, and administrators / reviewers.

### Contributor workflow

- create and update resource drafts;
- validate required metadata before submission;
- submit resources for review;
- read rejection feedback;
- revise and resubmit rejected resources.

### Review workflow

- list pending resources;
- inspect resource metadata;
- approve or reject submissions;
- record feedback, reviewer, and timestamp;
- support a traceable review cycle.

### Public discovery

- browse approved resources;
- keyword search;
- category / tag filtering;
- pagination;
- resource-detail pages.

### Administration and auditability

- contributor approval;
- category and tag management;
- resource archiving;
- administrative operations;
- audit-log-oriented tracking of sensitive actions.

## Backend Design

```text
HTTP Request
    ↓
Controller
    ↓
Service
    ↓
Repository
    ↓
JPA / MySQL
```

Key responsibilities:

- **Controller** — request parsing and API routing;
- **Service** — business rules, permission checks, state transitions, DTO conversion;
- **Repository** — database access through Spring Data JPA;
- **DTOs** — request / response boundaries instead of exposing persistence entities directly;
- **Security** — JWT validation and role-aware access control.

## Repository Layout

```text
CPT202_GroupProject/
├── SECURITY.md
├── backend/
│   ├── .env.example
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/
│       │   └── resources/
│       └── test/
└── frontend/
    └── src/
```

## Quick Start

### Backend

Requirements:

- JDK 17
- MySQL 8+

First provide runtime configuration through your shell, IDE, container platform, or secret manager. [`backend/.env.example`](backend/.env.example) documents the expected variable names; it is a template only and does not contain real credentials.

```bash
cd backend
./mvnw spring-boot:run
```

On Windows:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Secure Configuration

Production credentials are **not supposed to live in Git**. The backend reads secrets and environment-specific values from runtime configuration.

Main variables:

```text
DB_URL
DB_USER
DB_PASSWORD

JWT_SECRET
JWT_EXPIRATION_MS

MAIL_HOST
MAIL_PORT
MAIL_USERNAME
MAIL_PASSWORD
MAIL_SMTP_AUTH
MAIL_SMTP_SSL
```

`JWT_SECRET` is required and the application fails fast when the supplied key material is too short for HMAC-SHA signing.

### Administrator bootstrap

Predictable automatic administrator creation is disabled by default. Initial bootstrap is explicitly opt-in:

```text
BOOTSTRAP_ADMIN_ENABLED=false
BOOTSTRAP_ADMIN_USERNAME=
BOOTSTRAP_ADMIN_PASSWORD=
BOOTSTRAP_ADMIN_EMAIL=
```

If bootstrap is intentionally enabled, the application requires an explicit username/email and a non-trivial password, encodes the password through the configured `PasswordEncoder`, and creates the account only when it does not already exist. Bootstrap should be disabled again after initialization.

See [`SECURITY.md`](SECURITY.md) for the security checklist and credential-rotation guidance.

For a local MySQL database, create the project database before starting the backend:

```sql
CREATE DATABASE CPT202_Project_DB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

## Engineering Concepts Demonstrated

- REST API design;
- Spring Boot backend development;
- Spring Security and JWT authentication;
- RBAC authorization;
- relational data modeling with JPA / MySQL;
- workflow and state-machine reasoning;
- validation and exception handling;
- frontend-backend integration;
- auditability and content lifecycle management;
- runtime-secret management and secure bootstrap defaults;
- collaborative development in a multi-member team.

## Scope Note

This repository is a course team project, not a solo product. The README therefore distinguishes the overall system from my individual contribution instead of presenting all modules as individually authored.
