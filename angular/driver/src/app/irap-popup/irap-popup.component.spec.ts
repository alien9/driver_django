import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IrapPopupComponent } from './irap-popup.component';

describe('IrapPopupComponent', () => {
  let component: IrapPopupComponent;
  let fixture: ComponentFixture<IrapPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IrapPopupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IrapPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
