# SupportDesk ERD

Entity Relationship Diagram for the SupportDesk database.
Source of truth: `apps/api/prisma/schema.prisma`.

```mermaid
erDiagram
    User ||--o{ Ticket : "creates (createdById)"
    User |o--o{ Ticket : "assigned (assigneeId)"
    User ||--o{ Comment : "writes (authorId)"
    User |o--o{ AuditLog : "acts (actorId)"
    Ticket ||--o{ Comment : has
    Ticket ||--o{ Attachment : has
    Ticket ||--o{ TicketTag : has
    Tag ||--o{ TicketTag : labels

    User {
        string id PK
        string name
        string email UK
        string passwordHash
        Role role
        datetime createdAt
        datetime updatedAt
    }

    Ticket {
        string id PK
        string title
        string description
        TicketStatus status
        TicketPriority priority
        string category
        datetime slaDueAt
        string createdById FK
        string assigneeId FK
        datetime createdAt
        datetime updatedAt
    }

    Comment {
        string id PK
        string ticketId FK
        string authorId FK
        string body
        boolean isInternal
        datetime createdAt
    }

    Tag {
        string id PK
        string name UK
    }

    TicketTag {
        string ticketId PK, FK
        string tagId PK, FK
    }

    Attachment {
        string id PK
        string ticketId FK
        string fileName
        string storageKey
        datetime createdAt
    }

    AuditLog {
        string id PK
        string actorId FK
        string action
        string entityType
        string entityId
        json details
        datetime createdAt
    }
```

## Relationships

| Relationship | Cardinality | Delete behaviour |
|---|---|---|
| User creates Ticket (`createdById`) | 1 : N, required | Restrict |
| User is assigned Ticket (`assigneeId`) | 1 : N, optional | Set null |
| Ticket has Comment | 1 : N | Cascade |
| User writes Comment (`authorId`) | 1 : N | Restrict |
| Ticket has Attachment | 1 : N | Cascade |
| Ticket and Tag | M : N through `TicketTag` | Cascade on the join rows |
| User acts in AuditLog (`actorId`) | 1 : N, optional | Set null |

## Enums

| Enum | Values |
|---|---|
| Role | customer, agent, admin |
| TicketStatus | open, in_progress, waiting_on_customer, resolved, closed |
| TicketPriority | P1, P2, P3, P4 |

## Indexes

| Model | Index |
|---|---|
| Ticket | `status`; `assigneeId, status`; `createdById` |
| Comment | `ticketId, createdAt` |
| TicketTag | `tagId` (the primary key already covers `ticketId`) |
| Attachment | `ticketId` |
| AuditLog | `entityType, entityId` |
