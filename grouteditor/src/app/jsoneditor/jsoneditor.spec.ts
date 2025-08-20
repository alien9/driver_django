import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Jsoneditor } from './jsoneditor';

describe('Jsoneditor', () => {
  let component: Jsoneditor;
  let fixture: ComponentFixture<Jsoneditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Jsoneditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Jsoneditor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
