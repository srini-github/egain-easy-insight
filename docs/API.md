# eGain Easy Insight - API Documentation

## Table of Contents

1. [Overview & Design Principles](#1-overview--design-principles)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Search Endpoints](#3-search-endpoints)
4. [Article CRUD Operations](#4-article-crud-operations)
5. [AI Answer Endpoints](#5-ai-answer-endpoints)
6. [Analytics Endpoints](#6-analytics-endpoints)
7. [Error Handling](#7-error-handling)
8. [Rate Limiting](#8-rate-limiting)
9. [Pagination](#9-pagination)
10. [Webhooks](#10-webhooks)

---

## 1. Overview & Design Principles

### Base URL

```
Production:  https://api.egain-insight.com/api/v1
Staging:     https://api.staging.egain-insight.com/api/v1
```

### API Versioning Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                 API VERSIONING APPROACH                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  URL Path Versioning (Chosen)                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  /api/v1/knowledge/search                           │    │
│  │  /api/v2/knowledge/search                           │    │
│  │                                                     │    │
│  │  Pros: Clear, cacheable, easy to route              │    │
│  │  Cons: URL pollution                                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Version Lifecycle:                                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Active   → Deprecated → Sunset → Removed           │    │
│  │  (current)  (6 months)   (warning)  (gone)          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **RESTful** | Resource-oriented URLs, proper HTTP methods |
| **JSON:API** | Consistent response envelope |
| **Idempotent** | Safe retries with idempotency keys |
| **HATEOAS** | Links for discoverability |
| **Tenant-Aware** | All requests scoped to tenant |

### Common Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Bearer token (JWT) |
| `X-Tenant-ID` | Yes | Tenant identifier |
| `X-Request-ID` | No | Client-generated UUID for tracing |
| `X-Idempotency-Key` | No* | Required for POST/PUT mutations |
| `Accept` | No | `application/json` (default) |
| `Content-Type` | Yes* | `application/json` for request body |

### Common Response Headers

| Header | Description |
|--------|-------------|
| `X-Request-ID` | Echo or server-generated request ID |
| `X-RateLimit-Limit` | Requests allowed per window |
| `X-RateLimit-Remaining` | Requests remaining |
| `X-RateLimit-Reset` | Unix timestamp when window resets |
| `Deprecation` | `true` if endpoint deprecated |
| `Sunset` | Date when endpoint will be removed |

### Standard Response Envelope

**Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_abc123def456",
    "timestamp": "2025-01-06T10:30:00Z",
    "version": "v1"
  },
  "links": {
    "self": "/api/v1/knowledge/search?cursor=abc",
    "next": "/api/v1/knowledge/search?cursor=def",
    "prev": null
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "query",
        "message": "Query must be at least 2 characters"
      }
    ],
    "requestId": "req_abc123def456"
  }
}
```

---

## 2. Authentication & Authorization

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 OAUTH 2.0 + JWT FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Client authenticates with Identity Provider (IdP)       │
│     ┌──────────┐         ┌──────────┐                       │
│     │  Client  │────────▶│   IdP    │                       │
│     │          │◀────────│ (Okta/   │                       │
│     └──────────┘  JWT    │  Azure)  │                       │
│                          └──────────┘                       │
│                                                             │
│  2. Client sends JWT to API Gateway                         │
│     ┌──────────┐         ┌──────────┐                       │
│     │  Client  │────────▶│   API    │                       │
│     │          │  Bearer │ Gateway  │                       │
│     └──────────┘  Token  └──────────┘                       │
│                                                             │
│  3. Gateway validates JWT + extracts claims                 │
│     ┌──────────────────────────────────────────────────┐    │
│     │  JWT Claims:                                     │    │
│     │  - sub: user_id                                  │    │
│     │  - tenant_id: acme_corp                          │    │
│     │  - roles: ["support_agent", "kb_viewer"]         │    │
│     │  - permissions: ["search", "view_articles"]      │    │
│     │  - exp: 1704540600 (15 min expiry)               │    │
│     └──────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### JWT Token Structure

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-2025-01"
  },
  "payload": {
    "iss": "https://auth.egain-insight.com",
    "sub": "user_12345",
    "aud": "egain-insight-api",
    "exp": 1704540600,
    "iat": 1704539700,
    "tenant_id": "acme_corp",
    "roles": ["support_agent"],
    "permissions": ["search", "view_articles", "ai_answers"],
    "category_access": ["billing", "technical", "general"]
  }
}
```

### Authorization Levels

| Role | Permissions | Article Access |
|------|-------------|----------------|
| `support_agent` | search, view_articles, ai_answers | public, internal |
| `senior_agent` | + view_restricted | + restricted |
| `kb_author` | + create, update articles | + draft |
| `kb_admin` | + delete, publish, manage_users | all |
| `api_service` | machine-to-machine, specific scopes | configured |

### Authentication Endpoints

#### Token Exchange (OAuth 2.0)

```http
POST /api/v1/auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTH_CODE_FROM_IDP
&redirect_uri=https://app.example.com/callback
&client_id=CLIENT_ID
&code_verifier=PKCE_VERIFIER
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g...",
  "scope": "search articles ai"
}
```

#### Token Refresh

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

#### Token Introspection (for services)

```http
POST /api/v1/auth/introspect
Authorization: Basic BASE64(client_id:client_secret)
Content-Type: application/json

{
  "token": "eyJhbGciOiJSUzI1NiIs..."
}
```

---

## 3. Search Endpoints

### POST /api/v1/knowledge/search

Full-text search across knowledge articles with filtering and AI-powered ranking.

**Request:**

```http
POST /api/v1/knowledge/search
Authorization: Bearer {token}
X-Tenant-ID: acme_corp
X-Request-ID: req_abc123
Content-Type: application/json

{
  "query": "how to reset customer password",
  "filters": {
    "categories": ["billing", "technical"],
    "tags": ["password", "security"],
    "access_level": ["public", "internal"],
    "status": "published",
    "date_range": {
      "field": "updated_at",
      "from": "2024-01-01T00:00:00Z",
      "to": "2025-01-06T23:59:59Z"
    }
  },
  "options": {
    "include_ai_answer": true,
    "highlight": true,
    "semantic_search": true,
    "limit": 20,
    "cursor": null
  },
  "context": {
    "customer_tier": "premium",
    "product": "enterprise_suite",
    "channel": "phone"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "art_789xyz",
        "title": "Password Reset Procedures for Enterprise Customers",
        "snippet": "To reset a <em>customer</em> <em>password</em> for Enterprise accounts...",
        "content_preview": "This article covers the secure password reset process...",
        "relevance_score": 0.94,
        "category": {
          "id": "cat_billing",
          "name": "Billing & Account"
        },
        "tags": ["password", "security", "enterprise"],
        "access_level": "internal",
        "metadata": {
          "author": "John Smith",
          "created_at": "2024-06-15T10:00:00Z",
          "updated_at": "2025-01-02T14:30:00Z",
          "version": 3,
          "view_count": 1250,
          "helpful_count": 890
        },
        "links": {
          "self": "/api/v1/articles/art_789xyz",
          "html": "https://kb.egain-insight.com/articles/art_789xyz"
        }
      }
    ],
    "ai_answer": {
      "content": "To reset a customer's password for Enterprise accounts:\n\n1. Navigate to Admin Portal > User Management\n2. Search for the customer by email or account ID\n3. Click 'Reset Password' and select 'Send Reset Link'\n4. For Premium customers, you can also use the expedited phone reset...",
      "confidence": 0.92,
      "citations": [
        {
          "article_id": "art_789xyz",
          "title": "Password Reset Procedures",
          "excerpt": "For Premium customers, expedited phone reset is available..."
        }
      ],
      "model": "gpt-4o",
      "generated_at": "2025-01-06T10:30:01Z"
    },
    "facets": {
      "categories": [
        { "id": "cat_billing", "name": "Billing", "count": 12 },
        { "id": "cat_technical", "name": "Technical", "count": 8 }
      ],
      "tags": [
        { "name": "password", "count": 15 },
        { "name": "security", "count": 10 }
      ]
    }
  },
  "meta": {
    "total_results": 45,
    "returned": 20,
    "search_time_ms": 145,
    "request_id": "req_abc123"
  },
  "pagination": {
    "cursor": "eyJpZCI6ImFydF8yMCIsInNjb3JlIjowLjc1fQ==",
    "has_more": true,
    "limit": 20
  },
  "links": {
    "self": "/api/v1/knowledge/search",
    "next": "/api/v1/knowledge/search?cursor=eyJpZCI6ImFydF8yMCIsInNjb3JlIjowLjc1fQ=="
  }
}
```

### GET /api/v1/knowledge/suggestions

Autocomplete suggestions for search queries (low latency).

**Request:**

```http
GET /api/v1/knowledge/suggestions?q=password%20res&limit=5
Authorization: Bearer {token}
X-Tenant-ID: acme_corp
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "text": "password reset",
        "type": "query",
        "frequency": 1250
      },
      {
        "text": "password reset enterprise",
        "type": "query",
        "frequency": 890
      },
      {
        "text": "Password Reset Procedures",
        "type": "article",
        "article_id": "art_789xyz"
      }
    ]
  },
  "meta": {
    "query": "password res",
    "response_time_ms": 23
  }
}
```

### Search Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_QUERY` | Query too short or contains invalid characters |
| 400 | `INVALID_FILTER` | Unknown filter field or invalid value |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | User lacks search permission |
| 429 | `RATE_LIMITED` | Too many requests |
| 503 | `SEARCH_UNAVAILABLE` | Elasticsearch temporarily unavailable |

---

## 4. Article CRUD Operations

### GET /api/v1/articles/{id}

Retrieve a single article by ID.

**Request:**

```http
GET /api/v1/articles/art_789xyz
Authorization: Bearer {token}
X-Tenant-ID: acme_corp
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "art_789xyz",
    "title": "Password Reset Procedures for Enterprise Customers",
    "content": "## Overview\n\nThis article covers the secure password reset process...\n\n## Steps\n\n1. Navigate to Admin Portal...",
    "content_format": "markdown",
    "summary": "Step-by-step guide for resetting enterprise customer passwords",
    "category": {
      "id": "cat_billing",
      "name": "Billing & Account",
      "path": ["Support", "Account Management", "Billing & Account"]
    },
    "tags": ["password", "security", "enterprise"],
    "access_level": "internal",
    "status": "published",
    "metadata": {
      "author": {
        "id": "user_456",
        "name": "John Smith"
      },
      "created_at": "2024-06-15T10:00:00Z",
      "updated_at": "2025-01-02T14:30:00Z",
      "published_at": "2024-06-15T12:00:00Z",
      "version": 3,
      "word_count": 450,
      "reading_time_minutes": 2
    },
    "stats": {
      "view_count": 1250,
      "helpful_count": 890,
      "not_helpful_count": 45,
      "share_count": 120
    },
    "related_articles": [
      {
        "id": "art_related1",
        "title": "Two-Factor Authentication Setup",
        "relevance": 0.85
      }
    ],
    "attachments": [
      {
        "id": "att_001",
        "filename": "password-reset-flow.png",
        "mime_type": "image/png",
        "size_bytes": 45000,
        "url": "/api/v1/attachments/att_001"
      }
    ]
  },
  "links": {
    "self": "/api/v1/articles/art_789xyz",
    "edit": "/api/v1/articles/art_789xyz",
    "versions": "/api/v1/articles/art_789xyz/versions",
    "html": "https://kb.egain-insight.com/articles/art_789xyz"
  }
}
```

### POST /api/v1/articles

Create a new article.

**Request:**

```http
POST /api/v1/articles
Authorization: Bearer {token}
X-Tenant-ID: acme_corp
X-Idempotency-Key: idem_create_art_20250106_001
Content-Type: application/json

{
  "title": "New Feature: Enhanced Search Filters",
  "content": "## Overview\n\nWe've introduced enhanced search filters...",
  "content_format": "markdown",
  "summary": "Guide to using the new enhanced search filter functionality",
  "category_id": "cat_technical",
  "tags": ["search", "filters", "new-feature"],
  "access_level": "public",
  "status": "draft",
  "metadata": {
    "internal_notes": "Reviewed by product team",
    "related_ticket": "JIRA-1234"
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "art_new123",
    "title": "New Feature: Enhanced Search Filters",
    "status": "draft",
    "version": 1,
    "created_at": "2025-01-06T10:35:00Z"
  },
  "links": {
    "self": "/api/v1/articles/art_new123",
    "edit": "/api/v1/articles/art_new123",
    "publish": "/api/v1/articles/art_new123/publish"
  }
}
```

### PUT /api/v1/articles/{id}

Update an existing article (creates new version).

**Request:**

```http
PUT /api/v1/articles/art_789xyz
Authorization: Bearer {token}
X-Tenant-ID: acme_corp
X-Idempotency-Key: idem_update_art_789xyz_v4
Content-Type: application/json
If-Match: "v3"

{
  "title": "Password Reset Procedures for Enterprise Customers (Updated)",
  "content": "## Overview\n\nUpdated content with new security requirements...",
  "tags": ["password", "security", "enterprise", "2025-update"],
  "change_summary": "Added new MFA requirements for password reset"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "art_789xyz",
    "title": "Password Reset Procedures for Enterprise Customers (Updated)",
    "version": 4,
    "previous_version": 3,
    "updated_at": "2025-01-06T10:40:00Z",
    "change_summary": "Added new MFA requirements for password reset"
  },
  "links": {
    "self": "/api/v1/articles/art_789xyz",
    "version_diff": "/api/v1/articles/art_789xyz/versions/3...4"
  }
}
```

### DELETE /api/v1/articles/{id}

Soft-delete an article (moves to trash, recoverable for 30 days).

**Request:**

```http
DELETE /api/v1/articles/art_789xyz
Authorization: Bearer {token}
X-Tenant-ID: acme_corp
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "art_789xyz",
    "status": "deleted",
    "deleted_at": "2025-01-06T10:45:00Z",
    "recoverable_until": "2025-02-05T10:45:00Z"
  },
  "links": {
    "restore": "/api/v1/articles/art_789xyz/restore"
  }
}
```

### Article Versioning

#### GET /api/v1/articles/{id}/versions

List all versions of an article.

**Response:**

```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "version": 4,
        "created_at": "2025-01-06T10:40:00Z",
        "author": "John Smith",
        "change_summary": "Added new MFA requirements",
        "is_current": true
      },
      {
        "version": 3,
        "created_at": "2025-01-02T14:30:00Z",
        "author": "Jane Doe",
        "change_summary": "Updated contact information",
        "is_current": false
      }
    ]
  }
}
```

#### GET /api/v1/articles/{id}/versions/{version}

Retrieve a specific version.

#### POST /api/v1/articles/{id}/restore

Restore a deleted article or revert to a previous version.

---

## 5. AI Answer Endpoints

### POST /api/v1/ai/answer

Generate an AI-powered answer based on search context.

**Request:**

```http
POST /api/v1/ai/answer
Authorization: Bearer {token}
X-Tenant-ID: acme_corp
X-Request-ID: req_ai_001
Content-Type: application/json

{
  "query": "How do I reset a customer's password for a Premium account?",
  "context": {
    "customer_tier": "premium",
    "product": "enterprise_suite",
    "channel": "phone",
    "previous_queries": [
      "customer locked out"
    ]
  },
  "options": {
    "max_tokens": 500,
    "temperature": 0.3,
    "include_citations": true,
    "streaming": false
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "answer": {
      "content": "To reset a Premium customer's password:\n\n1. **Verify Identity**: Confirm the customer's identity using their security questions or last 4 digits of payment method.\n\n2. **Access Admin Portal**: Navigate to Admin Portal > User Management > Premium Accounts\n\n3. **Initiate Reset**:\n   - Search for the customer by email or account ID\n   - Click 'Reset Password'\n   - Select 'Expedited Phone Reset' (available for Premium tier)\n\n4. **Generate Temporary Password**: The system will generate a one-time password valid for 15 minutes.\n\n5. **Communicate Securely**: Provide the temporary password verbally. Never send via email for Premium accounts.\n\n**Note**: Premium customers have priority support - if issues persist, escalate to Tier 2 within 10 minutes.",
      "confidence": 0.94,
      "confidence_level": "high"
    },
    "citations": [
      {
        "article_id": "art_789xyz",
        "title": "Password Reset Procedures for Enterprise Customers",
        "excerpt": "For Premium customers, expedited phone reset is available with a 15-minute temporary password...",
        "relevance": 0.96,
        "url": "/api/v1/articles/art_789xyz"
      },
      {
        "article_id": "art_456abc",
        "title": "Premium Customer Support Guidelines",
        "excerpt": "Premium customers have priority support - escalate to Tier 2 within 10 minutes...",
        "relevance": 0.88,
        "url": "/api/v1/articles/art_456abc"
      }
    ],
    "related_questions": [
      "How do I verify a Premium customer's identity?",
      "What is the escalation process for Premium accounts?",
      "How do I enable MFA for a customer account?"
    ],
    "metadata": {
      "model": "gpt-4o",
      "tokens_used": {
        "prompt": 1250,
        "completion": 380,
        "total": 1630
      },
      "latency_ms": 1850,
      "trace_id": "trace_ai_abc123"
    }
  },
  "meta": {
    "request_id": "req_ai_001",
    "timestamp": "2025-01-06T10:50:00Z"
  }
}
```

### POST /api/v1/ai/answer (Streaming)

For real-time token streaming via Server-Sent Events.

**Request:**

```http
POST /api/v1/ai/answer
Authorization: Bearer {token}
Accept: text/event-stream
Content-Type: application/json

{
  "query": "How do I reset a customer's password?",
  "options": {
    "streaming": true
  }
}
```

**Response (SSE Stream):**

```
event: start
data: {"trace_id": "trace_ai_abc123"}

event: token
data: {"content": "To"}

event: token
data: {"content": " reset"}

event: token
data: {"content": " a"}

...

event: citations
data: {"citations": [{"article_id": "art_789xyz", "title": "Password Reset..."}]}

event: done
data: {"tokens_used": 380, "latency_ms": 1850}
```

### POST /api/v1/ai/feedback

Submit feedback on AI-generated answers.

**Request:**

```http
POST /api/v1/ai/feedback
Authorization: Bearer {token}
X-Tenant-ID: acme_corp
Content-Type: application/json

{
  "trace_id": "trace_ai_abc123",
  "rating": "helpful",
  "feedback_type": "accuracy",
  "comment": "Answer was accurate but could include more details about MFA",
  "corrections": {
    "missing_info": "MFA setup steps",
    "incorrect_info": null
  },
  "resolution_status": "resolved_with_answer"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "feedback_id": "fb_001",
    "recorded_at": "2025-01-06T10:55:00Z",
    "impact": "Will improve future responses for similar queries"
  }
}
```

---

## 6. Analytics Endpoints

### High-Volume Write Strategy

```
┌─────────────────────────────────────────────────────────────┐
│              ANALYTICS INGESTION ARCHITECTURE               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Problem: 10,000+ concurrent users = ~1M events/hour        │
│  Solution: Async batch ingestion via Kafka                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  Client ──▶ API Gateway ──▶ Kafka ──▶ Analytics DB   │   │
│  │         (fire & forget)   (buffer)   (batch write)   │   │
│  │                                                      │   │
│  │  Guarantees:                                         │   │
│  │  - At-least-once delivery                            │   │
│  │  - <100ms API response (async)                       │   │
│  │  - Events processed within 5 seconds                 │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### POST /api/v1/analytics/events

Record a single analytics event (async).

**Request:**

```http
POST /api/v1/analytics/events
Authorization: Bearer {token}
X-Tenant-ID: acme_corp
Content-Type: application/json

{
  "event_type": "search_performed",
  "timestamp": "2025-01-06T10:30:00.123Z",
  "session_id": "sess_abc123",
  "properties": {
    "query": "password reset",
    "results_count": 15,
    "latency_ms": 145,
    "filters_applied": ["category:billing"],
    "ai_answer_shown": true,
    "ai_confidence": 0.92
  }
}
```

**Response (202 Accepted):**

```json
{
  "success": true,
  "data": {
    "event_id": "evt_123456",
    "status": "queued",
    "queued_at": "2025-01-06T10:30:00.150Z"
  }
}
```

### POST /api/v1/analytics/events/batch

Batch upload multiple events (recommended for high volume).

**Request:**

```http
POST /api/v1/analytics/events/batch
Authorization: Bearer {token}
X-Tenant-ID: acme_corp
Content-Type: application/json

{
  "events": [
    {
      "event_type": "search_performed",
      "timestamp": "2025-01-06T10:30:00.123Z",
      "session_id": "sess_abc123",
      "properties": { ... }
    },
    {
      "event_type": "article_viewed",
      "timestamp": "2025-01-06T10:30:05.456Z",
      "session_id": "sess_abc123",
      "properties": {
        "article_id": "art_789xyz",
        "source": "search_result",
        "position": 1,
        "time_to_click_ms": 2500
      }
    },
    {
      "event_type": "ai_feedback_submitted",
      "timestamp": "2025-01-06T10:31:00.789Z",
      "session_id": "sess_abc123",
      "properties": {
        "trace_id": "trace_ai_abc123",
        "rating": "helpful",
        "resolution": "resolved"
      }
    }
  ]
}
```

**Response (202 Accepted):**

```json
{
  "success": true,
  "data": {
    "batch_id": "batch_789",
    "events_accepted": 3,
    "events_rejected": 0,
    "status": "queued"
  }
}
```

### Event Types

| Event Type | Description | Key Properties |
|------------|-------------|----------------|
| `search_performed` | User executed a search | query, results_count, latency_ms |
| `article_viewed` | User opened an article | article_id, source, time_to_click_ms |
| `article_helpful` | User marked article helpful | article_id, rating |
| `ai_answer_shown` | AI answer displayed | trace_id, confidence, tokens_used |
| `ai_answer_copied` | User copied AI answer | trace_id, copy_length |
| `ai_feedback_submitted` | User submitted AI feedback | trace_id, rating, resolution |
| `session_started` | New session began | channel, device_type |
| `session_ended` | Session ended | duration_seconds, searches_count |

### GET /api/v1/analytics/reports

Query aggregated analytics data.

**Request:**

```http
GET /api/v1/analytics/reports?report_type=search_metrics&date_from=2025-01-01&date_to=2025-01-06&granularity=day
Authorization: Bearer {token}
X-Tenant-ID: acme_corp
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "report_type": "search_metrics",
    "period": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-01-06T23:59:59Z"
    },
    "metrics": {
      "total_searches": 45230,
      "unique_users": 2150,
      "avg_latency_ms": 142,
      "p95_latency_ms": 340,
      "ai_answer_rate": 0.78,
      "avg_ai_confidence": 0.89,
      "zero_results_rate": 0.03
    },
    "time_series": [
      {
        "date": "2025-01-01",
        "searches": 7500,
        "avg_latency_ms": 138
      },
      {
        "date": "2025-01-02",
        "searches": 8200,
        "avg_latency_ms": 145
      }
    ],
    "top_queries": [
      { "query": "password reset", "count": 1250, "avg_position_clicked": 1.2 },
      { "query": "billing inquiry", "count": 980, "avg_position_clicked": 1.5 }
    ],
    "top_articles": [
      { "article_id": "art_789xyz", "title": "Password Reset...", "views": 890 }
    ]
  },
  "meta": {
    "generated_at": "2025-01-06T11:00:00Z",
    "cache_hit": false
  }
}
```

### Available Report Types

| Report Type | Description | Granularity Options |
|-------------|-------------|---------------------|
| `search_metrics` | Search volume, latency, zero-results | hour, day, week |
| `ai_metrics` | AI answer rate, confidence, feedback | hour, day, week |
| `article_metrics` | Views, helpfulness, engagement | day, week, month |
| `agent_metrics` | Per-agent activity, turnaround time | day, week |
| `content_health` | Outdated articles, gaps, duplicates | week, month |

---

## 7. Error Handling

### Standard Error Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [ ... ],
    "request_id": "req_abc123",
    "documentation_url": "https://docs.egain-insight.com/errors/ERROR_CODE"
  }
}
```

### Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| **400** | `VALIDATION_ERROR` | Request body validation failed |
| **400** | `INVALID_QUERY` | Search query is invalid |
| **400** | `INVALID_FILTER` | Unknown or invalid filter |
| **400** | `INVALID_CURSOR` | Pagination cursor is malformed |
| **401** | `UNAUTHORIZED` | Missing or invalid authentication |
| **401** | `TOKEN_EXPIRED` | JWT has expired |
| **403** | `FORBIDDEN` | User lacks required permission |
| **403** | `TENANT_MISMATCH` | Token tenant doesn't match X-Tenant-ID |
| **404** | `NOT_FOUND` | Resource does not exist |
| **404** | `ARTICLE_NOT_FOUND` | Article ID not found |
| **409** | `CONFLICT` | Resource version conflict (use If-Match) |
| **409** | `DUPLICATE_IDEMPOTENCY_KEY` | Idempotency key already used |
| **422** | `UNPROCESSABLE_ENTITY` | Request understood but cannot process |
| **429** | `RATE_LIMITED` | Too many requests |
| **500** | `INTERNAL_ERROR` | Unexpected server error |
| **502** | `UPSTREAM_ERROR` | Dependency (LLM, ES) failed |
| **503** | `SERVICE_UNAVAILABLE` | Service temporarily down |
| **503** | `AI_UNAVAILABLE` | AI service unavailable, fallback active |

### Error Examples

**Validation Error (400):**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "query",
        "code": "min_length",
        "message": "Query must be at least 2 characters",
        "received": "a"
      },
      {
        "field": "filters.date_range.from",
        "code": "invalid_format",
        "message": "Must be ISO 8601 format",
        "received": "01-01-2025"
      }
    ],
    "request_id": "req_abc123"
  }
}
```

**Rate Limited (429):**

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Retry after 45 seconds.",
    "details": {
      "limit": 100,
      "window": "1 minute",
      "retry_after": 45
    },
    "request_id": "req_abc123"
  }
}
```

---

## 8. Rate Limiting

### Rate Limiting Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                 RATE LIMITING TIERS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tier          Per User/Min    Per Tenant/Min    Burst      │
│  ──────────    ────────────    ──────────────    ─────      │
│  Standard      100             5,000             150        │
│  Professional  200             10,000            300        │
│  Enterprise    500             50,000            750        │
│  Unlimited*    No limit        No limit          N/A        │
│                                                             │
│  * Requires dedicated infrastructure contract               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Endpoint-Specific Limits

| Endpoint | Limit | Window | Rationale |
|----------|-------|--------|-----------|
| `POST /knowledge/search` | 100/min | Per user | Normal search activity |
| `GET /knowledge/suggestions` | 300/min | Per user | Autocomplete is rapid |
| `POST /ai/answer` | 30/min | Per user | LLM costs, prevent abuse |
| `POST /analytics/events` | 1000/min | Per user | High-volume allowed |
| `POST /articles` | 20/min | Per user | Prevent spam creation |

### Rate Limit Headers

Every response includes rate limit information:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1704540660
X-RateLimit-Policy: "100;w=60"
```

### Handling Rate Limits

```
┌─────────────────────────────────────────────────────────────┐
│                 CLIENT RATE LIMIT HANDLING                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Check X-RateLimit-Remaining before requests             │
│  2. If 429 received:                                        │
│     - Read Retry-After header                               │
│     - Implement exponential backoff                         │
│     - Queue requests for batch retry                        │
│                                                             │
│  Backoff Strategy:                                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Attempt 1: Wait Retry-After seconds                │    │
│  │  Attempt 2: Wait Retry-After × 2                    │    │
│  │  Attempt 3: Wait Retry-After × 4                    │    │
│  │  Max wait: 5 minutes                                │    │
│  │  Max attempts: 5                                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Pagination

### Cursor-Based Pagination (Default)

Used for large result sets where consistency matters.

```
┌─────────────────────────────────────────────────────────────┐
│                 CURSOR-BASED PAGINATION                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Advantages:                                                │
│  ✓ Consistent results (no duplicates/skips)                 │
│  ✓ O(1) performance regardless of offset                    │
│  ✓ Works with real-time data changes                        │
│                                                             │
│  How it works:                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Cursor = Base64({ last_id, last_score, filters })  │    │
│  │                                                     │    │
│  │  Request 1: /search (no cursor)                     │    │
│  │  Response: results 1-20, cursor="eyJpZCI6MjB9"      │    │
│  │                                                     │    │
│  │  Request 2: /search?cursor=eyJpZCI6MjB9             │    │
│  │  Response: results 21-40, cursor="eyJpZCI6NDB9"     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Request:**

```http
GET /api/v1/knowledge/search?cursor=eyJpZCI6ImFydF8yMCIsInNjb3JlIjowLjc1fQ==&limit=20
```

**Response:**

```json
{
  "data": { ... },
  "pagination": {
    "cursor": "eyJpZCI6ImFydF80MCIsInNjb3JlIjowLjY1fQ==",
    "has_more": true,
    "limit": 20
  },
  "links": {
    "self": "/api/v1/knowledge/search?cursor=eyJpZCI6ImFydF8yMCJ9",
    "next": "/api/v1/knowledge/search?cursor=eyJpZCI6ImFydF80MCJ9",
    "prev": "/api/v1/knowledge/search?cursor=eyJpZCI6ImFydF8wIn0="
  }
}
```

### Offset-Based Pagination (Legacy)

Available for backward compatibility and admin interfaces.

```http
GET /api/v1/articles?page=2&limit=50
```

```json
{
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 500,
    "total_pages": 10
  }
}
```

**Warning:** Offset pagination has O(n) performance and may skip/duplicate items if data changes between requests.

---

## 10. Webhooks

### Webhook Configuration

Register webhooks to receive real-time notifications.

**POST /api/v1/webhooks:**

```json
{
  "url": "https://your-app.com/webhooks/egain",
  "events": [
    "article.published",
    "article.updated",
    "ai.feedback.negative"
  ],
  "secret": "whsec_your_signing_secret",
  "active": true
}
```

### Webhook Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `article.created` | New article created | Article summary |
| `article.published` | Article published | Article ID, URL |
| `article.updated` | Article content changed | Article ID, version, changes |
| `article.deleted` | Article deleted | Article ID |
| `ai.feedback.negative` | User marked AI answer unhelpful | Trace ID, query, feedback |
| `search.zero_results` | Search returned no results | Query, filters |

### Webhook Payload Format

```json
{
  "id": "evt_webhook_123",
  "type": "article.published",
  "timestamp": "2025-01-06T12:00:00Z",
  "tenant_id": "acme_corp",
  "data": {
    "article_id": "art_789xyz",
    "title": "Password Reset Procedures",
    "url": "https://kb.egain-insight.com/articles/art_789xyz",
    "author": "John Smith"
  }
}
```

### Webhook Security

```
┌─────────────────────────────────────────────────────────────┐
│                 WEBHOOK SIGNATURE VERIFICATION              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Headers sent with each webhook:                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  X-EGain-Signature: sha256=abc123...                │    │
│  │  X-EGain-Timestamp: 1704540600                      │    │
│  │  X-EGain-Event: article.published                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Verification (Node.js example):                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  const signature = crypto                           │    │
│  │    .createHmac('sha256', webhookSecret)             │    │
│  │    .update(timestamp + '.' + rawBody)               │    │
│  │    .digest('hex');                                  │    │
│  │                                                     │    │
│  │  if (signature !== receivedSignature) {             │    │
│  │    return res.status(401).send('Invalid signature');│    │
│  │  }                                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Webhook Retry Policy

| Attempt | Delay | Max Time |
|---------|-------|----------|
| 1 | Immediate | 0 |
| 2 | 1 minute | 1 min |
| 3 | 5 minutes | 6 min |
| 4 | 30 minutes | 36 min |
| 5 | 2 hours | 2h 36m |
| 6 | 12 hours | 14h 36m |

After 6 failed attempts, the webhook is marked as failing and admin is notified.

---

## Appendix: Quick Reference

### Endpoint Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/token` | Exchange code for token | Public |
| POST | `/auth/refresh` | Refresh access token | Refresh token |
| POST | `/knowledge/search` | Search articles | Bearer |
| GET | `/knowledge/suggestions` | Autocomplete | Bearer |
| GET | `/articles/{id}` | Get article | Bearer |
| POST | `/articles` | Create article | Bearer + Author |
| PUT | `/articles/{id}` | Update article | Bearer + Author |
| DELETE | `/articles/{id}` | Delete article | Bearer + Admin |
| POST | `/ai/answer` | Generate AI answer | Bearer |
| POST | `/ai/feedback` | Submit AI feedback | Bearer |
| POST | `/analytics/events` | Record event | Bearer |
| POST | `/analytics/events/batch` | Batch record events | Bearer |
| GET | `/analytics/reports` | Query reports | Bearer + Analytics |
| POST | `/webhooks` | Create webhook | Bearer + Admin |

### HTTP Status Codes Used

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted (async) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable |
| 429 | Rate Limited |
| 500 | Server Error |
| 502 | Bad Gateway |
| 503 | Service Unavailable |

---

*API Version: 1.0*
*Last Updated: January 2025*
*OpenAPI Spec: [openapi.yaml](./openapi.yaml)*
