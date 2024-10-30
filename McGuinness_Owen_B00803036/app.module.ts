import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavComponent } from './nav/nav.component';
import { HomeComponent } from './home/home.component';
import { IntentComponent } from './intent/intent.component';
import { IntentsComponent } from './intents/intents.component';
import { UsersComponent } from './users/users.component';
import { UserComponent } from './user/user.component';
import { ChatbotComponent } from './chatbot/chatbot.component';
import { ProfileComponent } from './profile/profile.component';
import { CampusesComponent } from './campuses/campuses.component';
import { CoursesComponent } from './courses/courses.component';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CourseComponent } from './course/course.component';
import { CampusComponent } from './campus/campus.component';
import { LoginComponent } from './login/login.component';

var routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'intents/:_id', component: IntentComponent },
  { path: 'intents', component: IntentsComponent },
  { path: 'users/:username', component: UserComponent },
  { path: 'users', component: UsersComponent },
  { path: 'nav', component: NavComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'chatbot', component: ChatbotComponent },
  { path: 'campuses', component: CampusesComponent },
  { path: 'campuses/:_id', component: CampusComponent },
  { path: 'courses', component: CoursesComponent },
  { path: 'courses/:_id', component: CourseComponent },
  { path: '**', redirectTo: '/', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    HomeComponent,
    IntentComponent,
    IntentsComponent,
    UsersComponent,
    UserComponent,
    ChatbotComponent,
    ProfileComponent,
    CampusesComponent,
    CoursesComponent,
    CourseComponent,
    CampusComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    ButtonModule,
    DialogModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
