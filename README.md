# TaskTracker

> Personal Task Management Web Application  
> KBTU — Web Development Course Project  
> Stack: **Angular 17+** (Frontend) + **Django + DRF** (Backend)

---

## Group Members

| Name | Responsibilities |
|------|-----------------|
| Aslan Malik | Backend — Django + DRF (models, views, serializers, JWT auth, REST API) |
| Сания | Frontend — Dashboard, Calendar, Notifications |
| Тимур | Frontend — Login, Register, Tasks, Profile |

---

## Project Description

TaskTracker is a full-stack personal productivity app that lets users create and manage tasks, organize them by categories, track progress through a live dashboard, and collaborate through task comments.

**Key features:**
- Register / Login / Logout with JWT authentication
- Full CRUD for tasks (create, view, edit, delete)
- Task categories (personal + global)
- Subtasks — auto-updates parent task status when all subtasks are done
- Task comments
- Dashboard with weekly activity chart, completion rate, today's tasks, and upcoming deadlines
- Calendar view with tasks by deadline
- Browser push notifications for upcoming deadlines
- Edit profile and change password
- Streak tracking (gamification)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17+, TypeScript, CSS |
| Backend | Django 6, Django REST Framework |
| Auth | JWT via djangorestframework-simplejwt |
| Database | SQLite |
| CORS | django-cors-headers |

---

## Project Structure

```
web-dev-project/
├── task_tracker/               # Django backend
│   ├── config/                 # Settings, URLs
│   ├── tracker/                # Models, views, serializers, urls
│   └── db.sqlite3
├── project/                    # Angular frontend
│   └── src/app/
│       ├── pages/              # dashboard, tasks, login, register, profile, calendar
│       ├── services/           # task-service, dashboard.service
│       ├── models/             # task.ts interfaces
│       └── app.routes.ts
└── TaskTracker_Postman_Collection.json
```

---

## What Each Member Built

### Aslan Malik — Backend (Django + DRF)
- Defined 6 models: `User`, `Category`, `Task`, `TaskComment`, `SubTask`, `UserProfile`
- Wrote all serializers: `LoginSerializer`, `RegisterSerializer` (Serializer), `TaskSerializer`, `CategorySerializer`, `TaskCommentSerializer`, `SubTaskSerializer` (ModelSerializer)
- Implemented FBVs: `register_view`, `login_view`, `logout_view`, `task_comments_view`
- Implemented CBVs: `TaskListCreateView`, `TaskDetailView`, `CategoryListCreateView`, `CategoryDetailView`, `DashboardView`, `ProfileUpdateView`, `ChangePasswordView`, `SubTaskListCreateView`, `SubTaskDetailView`
- Configured JWT auth with token blacklist on logout
- Configured CORS for Angular dev server
- Subtask auto-updates parent task status; completing tasks updates streak in `UserProfile`

### Сания — Frontend: Dashboard, Calendar, Notifications
- **Dashboard** — Angular Signals: `computed()` for reactive stats (`totalTasks`, `completedTasks`). Weekly chart and analytics using deadline filtering. `CommonModule` for `@for`, `DatePipe`, `RouterLink`.
- **Calendar** — Custom `CalendarDay` interface. `computed()` recalculates 42 cells on month change. Tasks filtered from `TaskService` by matching deadline date.
- **Notifications** — Native browser Web Notifications API (no libraries). RxJS `interval(60000)` checks deadlines every minute. `Set` of already-notified task IDs prevents spam.

### Тимур — Frontend: Login, Register, Tasks, Profile
- **Login / Register** — `FormsModule` for `[(ngModel)]`, `HttpClient` for requests, `inject()` for modern DI, JWT tokens saved to `localStorage`, errors via `signal()`.
- **Tasks** — `TaskService` with `HttpClient`, RxJS `Observable` + `tap()` for state updates after requests, `signal<Task[]>` for state, HTTP Interceptor adds Bearer token automatically.
- **Profile** — `isPlatformBrowser()` for SSR compatibility, `signal()` + `computed()` for reactive data, edit profile and change password forms.

---

## Backend Requirements Coverage

### Models — 6 (requirement: 4+)

| Model | Description |
|-------|-------------|
| `User` | Custom user extending AbstractUser |
| `Category` | Task category, personal or global (user=null) |
| `Task` | Main task with status, deadline, category |
| `TaskComment` | Comment on a task |
| `SubTask` | Subtask, auto-updates parent status |
| `UserProfile` | Streak and completion stats |

### ForeignKey Relationships — 6 (requirement: 2+)
`Category→User`, `Task→User`, `Task→Category`, `TaskComment→Task`, `TaskComment→User`, `SubTask→Task`

### Serializers

| Type | Classes |
|------|---------|
| `serializers.Serializer` | `LoginSerializer`, `RegisterSerializer` |
| `serializers.ModelSerializer` | `TaskSerializer`, `CategorySerializer`, `TaskCommentSerializer`, `SubTaskSerializer` |

### Views

| Type | Functions / Classes |
|------|-------------------|
| FBV `@api_view` | `register_view`, `login_view`, `logout_view`, `task_comments_view` |
| CBV `APIView` | `TaskListCreateView`, `TaskDetailView`, `CategoryListCreateView`, `CategoryDetailView`, `DashboardView`, `ProfileUpdateView`, `ChangePasswordView`, `SubTaskListCreateView`, `SubTaskDetailView` |

- JWT auth with login + logout (token blacklist)
- Full CRUD on Task model
- All objects linked to `request.user`
- CORS configured for `http://localhost:4200`
- Postman collection committed to repo

---

## Frontend Requirements Coverage

### Routes — 6 (requirement: 3+)

| Path | Page |
|------|------|
| `/login` | Login |
| `/register` | Register |
| `/dashboard` | Dashboard |
| `/tasks` | Task workspace |
| `/calendar` | Calendar |
| `/profile` | Profile |

| Requirement | Implementation |
|-------------|---------------|
| Interfaces & Services | `Task`, `Category` interfaces; `TaskService`, `DashboardService` |
| 4+ click events → API | Add task, delete task, toggle subtask, add comment, update profile, change password |
| 4+ `[(ngModel)]` | Login, Register, Task form, Edit Profile, Change Password |
| CSS Styling | Per-component CSS, bento-grid dashboard, responsive |
| Routing | 6 named routes with navigation |
| `@for` / `@if` | Task lists, subtasks, comments, conditional panels |
| JWT Auth | Bearer token in `localStorage`, HTTP Interceptor |
| HttpClient Service | `TaskService`, `DashboardService` |
| Error handling | Error messages on all forms |

---

## Setup & Run

### Backend

```bash
cd task_tracker
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

API: `http://127.0.0.1:8000/api/`

### Frontend

```bash
cd project
npm install
ng serve
```

App: `http://localhost:4200`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register/` | Register |
| POST | `/api/login/` | Login, returns JWT |
| POST | `/api/logout/` | Logout, blacklists token |
| GET / POST | `/api/tasks/` | List / Create task |
| GET / PUT / PATCH / DELETE | `/api/tasks/:id/` | Task CRUD |
| GET / POST | `/api/tasks/:id/comments/` | Comments |
| POST | `/api/tasks/:id/subtasks/` | Create subtask |
| PATCH / DELETE | `/api/subtasks/:id/` | Subtask update/delete |
| GET / POST | `/api/categories/` | Categories |
| GET / PUT / DELETE | `/api/categories/:id/` | Category CRUD |
| GET | `/api/dashboard-data/` | Dashboard data |
| GET / PATCH | `/api/profile/` | Profile |
| POST | `/api/change-password/` | Change password |

Full examples: **`TaskTracker_Postman_Collection.json`**
