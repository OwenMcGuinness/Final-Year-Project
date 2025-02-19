import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntentComponent } from './intent.component';

describe('IntentComponent', () => {
  let component: IntentComponent;
  let fixture: ComponentFixture<IntentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IntentComponent]
    });
    fixture = TestBed.createComponent(IntentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
