# stage0_runbook_spa

This repository contains a Vue 3 single-page application (SPA) for the [Stage0 Runbook Runner](https://github.com/agile-learning-institute/stageZero/stage0_runner). The SPA is backed by the RESTful [stage0_runbook_api](https://github.com/agile-learning-institute/stageZero/stage0_runbook_api) following a GET / POST / PATCH pattern. API contracts are defined in [This OpenAPI document](https://github.com/agile-learning-institute/stageZero/stage0_runbook_api/blob/main/docs/openapi.yaml). When the API is running, you can access an API Explorer at [/docs/explorer.html](http://localhost:8083/docs/explorer.html)

## Prerequisites
- Creator Dashboard [Developers Edition](https://github.com/agile-crafts-people/CreatorDashboard/blob/main/DeveloperEdition/README.md)
- Developer [SPA Standard Prerequisites](https://github.com/agile-crafts-people/CreatorDashboard/blob/main/DeveloperEdition/standards/spa_standards.md)

## Developer Commands

```sh
## install dependencies
npm install 

## package code for deployment
npm run build 

## run dev server - captures command line
npm run dev 

## de down and start api container
npm run api 

## de down and start api + spa containers
npm run service 

## Build SPA docker container locally
npm run container 
```

## Architecture Overview

```
src/
  api/              # API client layer (types.ts, client.ts)
  components/       # Reusable UI components
  pages/            # Route-level components (RunbooksListPage, RunbookViewerPage)
  composables/      # Reusable logic
  stores/           # Pinia stores (UI state only)
  router/           # Vue Router configuration
  plugins/          # Vuetify plugin configuration
```

## Key Implementation Patterns

### API Client
- Located in `src/api/client.ts`
- All API calls go through centralized client
- Error handling via `ApiError` class
- Type-safe with TypeScript interfaces in `src/api/types.ts`

### Data Fetching
- Uses TanStack Query (Vue Query) for server state management
- Query keys follow pattern: `['resource', id]` or `['resources']`
- Mutations invalidate related queries on success
- Example: `useQuery({ queryKey: ['runbook', filename], queryFn: () => api.getRunbook(filename) })`

### Runbook Execution
- Runbook viewer page displays markdown content
- Execute button opens dialog prompting for required environment variables
- Environment variables are extracted from runbook's "Environment Requirements" section
- After execution, runbook content is refreshed to show updated history

### Routing Pattern
1. **List Page** (`/runbooks`) - Data table listing all available runbooks
2. **Viewer Page** (`/runbook/:filename`) - Markdown viewer with execute functionality

### Component Architecture
- **Pages**: Own routing, data fetching, and mutations. Pass data + callbacks to components.
- **Components**: Stateless where possible. Receive values via props, emit updates via callbacks.
- **Composables**: Reusable logic (queries, etc.)
- **Stores**: UI-only state (loading, error messages, etc.)

## Adding New Features

When adding a new feature:

1. **Add API Types**: Extend `src/api/types.ts` with new interfaces
2. **Add API Methods**: Add methods to `src/api/client.ts`
3. **Create Pages**: Add pages in `src/pages/`
4. **Add Routes**: Register routes in `src/router/index.ts`
5. **Query Management**: Use Vue Query for data fetching with appropriate query keys
6. **Cache Invalidation**: Invalidate related queries in mutation `onSuccess` callbacks

## Technology Stack
- Vue 3 with Composition API
- TypeScript 5.9
- Vite 7.2
- Vuetify 3.11
- Vue Router 4
- Pinia 3
- TanStack Query (Vue Query) v5

## Configuration
- Docker container uses `API_HOST` and `API_PORT` environment variables for API proxy configuration
