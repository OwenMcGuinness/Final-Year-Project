import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebService } from '../web.service';

@Component({
  selector: 'app-campus',
  templateUrl: './campus.component.html',
  styleUrls: ['./campus.component.css']
})
export class CampusComponent implements OnInit {
  campus: any;
  updatedCampus: any = {
    name: '',
    location: '',
    established_year: null,
    undergraduate_population: null,
    graduate_population: null,
    faculties: [],
    sports_facilities: [],
    student_clubs: [],
    library: false,
    cafeteria: false,
    dormitories: false
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private webService: WebService
  ) { }

  ngOnInit(): void {
    this.getCampus();
  }

  getCampus() {
    const campusId = this.route.snapshot.params['_id'];
    this.webService.getCampus(campusId).subscribe(
      (response: any) => {
        this.campus = response;
        this.updatedCampus = { ...this.campus };
      },
      (error: any) => {
        console.error('Error fetching campus:', error);
      }
    );
  }

  updateCampus() {
    const campusId = this.route.snapshot.params['_id'];
    this.webService.updateCampus(campusId, this.updatedCampus).subscribe(
      (response: any) => {
        console.log('Campus updated successfully:', response);
        this.router.navigate(['/campuses']);
        this.closeUpdateCampusModal();
      },
      (error: any) => {
        console.error('Error updating campus:', error);
      }
    );
  }

  deleteCampus() {
    const confirmDelete = confirm('Are you sure you want to delete this campus?');
    if (confirmDelete) {
      const campusId = this.route.snapshot.params['_id'];
      this.webService.deleteCampus(campusId).subscribe(
        (response: any) => {
          console.log('Campus deleted successfully:', response);
          this.router.navigate(['/campuses']);
        },
        (error: any) => {
          console.error('Error deleting campus:', error);
        }
      );
    }
  }

  openUpdateCampusModal() {
    const modal = document.getElementById('updateCampusModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
  }

  closeUpdateCampusModal() {
    const modal = document.getElementById('updateCampusModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }
}
