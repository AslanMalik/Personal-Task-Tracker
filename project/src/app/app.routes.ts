import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Tasks } from './pages/tasks/tasks';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Profile } from './pages/profile/profile';

import { Calendar } from './pages/calendar/calendar';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'dashboard', component:  Dashboard },
    { path: 'tasks', component:  Tasks },
    { path: 'calendar', component: Calendar },
    { path: 'login', component:  Login },
    { path: 'register', component: Register },
    { path: 'profile', component:  Profile },
];
