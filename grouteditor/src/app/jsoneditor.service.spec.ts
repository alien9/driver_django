import { TestBed } from '@angular/core/testing';

import { JsoneditorService } from './jsoneditor.service';

describe('JsoneditorService', () => {
  let service: JsoneditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsoneditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
