import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeminiAssistantComponent } from './gemini-assistant.component';

describe('GeminiAssistantComponent', () => {
  let component: GeminiAssistantComponent;
  let fixture: ComponentFixture<GeminiAssistantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GeminiAssistantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeminiAssistantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
