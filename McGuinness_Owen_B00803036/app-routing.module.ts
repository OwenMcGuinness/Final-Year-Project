import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NavComponent} from './nav/nav.component';
import { IntentsComponent } from './intents/intents.component';
import { IntentComponent } from './intent/intent.component';
import { CampusesComponent } from './campuses/campuses.component';
import { CampusComponent } from './campus/campus.component';
import { ProfileComponent } from './profile/profile.component';

const routes: Routes = [
  { path: 'nav', component: NavComponent }, 
  { path: 'intents', component: IntentsComponent },
  { path: 'intents/:_id', component: IntentComponent },
  { path: 'campuses', component: CampusesComponent },
  { path: 'campuses/:_id', component: CampusComponent }, 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
