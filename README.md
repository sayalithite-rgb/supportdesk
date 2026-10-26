# SupportDesk Monorepo

SupportDesk web application combining Frontend UI, Mobile client, and Backend API services in a unified repository.

## Directory Structure
- `apps/api/`: Express API server and backend logic
- `apps/web/`: React + Vite web application
- `apps/mobile/`: Expo mobile application
- `agents/`: AI agents configuration
- `automation/n8n/`: Workflow JSON exports
- `postman/`: API collections and environments
- `infra/`: Docker and deployment files
- `docs/`: Project documentation and Prompt Journal
- `.github/workflows/`: CI/CD automation pipelines

## Setup Instructions
1. Copy `.env.example` to `.env` in respective directories.
2. Install dependencies and run development servers as instructed in module readmes.