import { Component, OnInit } from '@angular/core';
import { GeminiService } from '../../../services/util/gemini.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-gemini-assistant',
  standalone: false,
  templateUrl: './gemini-assistant.component.html',
  styleUrl: './gemini-assistant.component.css'
})
export class GeminiAssistantComponent implements OnInit {
  isModalOpen = false;
  userPrompt = '';
  aiResponse = '';
  formattedResponse: SafeHtml = '';
  isLoading = false;
  samplePrompts = [
    'What gifts would be suitable for a 12-year-old?',
    'I need a laptop for video editing, what should I buy?',
    'Suggest some products for home office setup',
    'What are the best tech gadgets under ₹5000?'
  ];

  constructor(
    private geminiService: GeminiService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
  }

  toggleModal(): void {
    this.isModalOpen = !this.isModalOpen;
    if (!this.isModalOpen) {
      this.resetChat();
    }
  }

  resetChat(): void {
    this.userPrompt = '';
    this.aiResponse = '';
    this.formattedResponse = '';
  }

  async sendPrompt(): Promise<void> {
    if (!this.userPrompt.trim()) return;
    
    this.isLoading = true;
    try {
      this.aiResponse = await this.geminiService.getAiResponse(this.userPrompt);
      this.formatResponse();
    } catch (error) {
      console.error('Error getting AI response:', error);
      this.aiResponse = 'Sorry, I encountered an error. Please try again later.';
      this.formattedResponse = this.sanitizer.bypassSecurityTrustHtml(this.aiResponse);
    } finally {
      this.isLoading = false;
    }
  }

  useSamplePrompt(prompt: string): void {
    this.userPrompt = prompt;
    this.sendPrompt();
  }

  formatResponse(): void {
    if (!this.aiResponse) return;

    let formatted = this.aiResponse
      .replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold text-indigo-700">$1</span>')
      .replace(/\*(.*?)\*/g, '<span class="italic text-indigo-600">$1</span>')
      .replace(/\n/g, '<br>')
      .replace(/- (.*?)(?=<br>|$)/g, '<div class="flex"><span class="mr-2">•</span><span>$1</span></div>')
      .replace(/#{3} (.*?)(?=<br>|$)/g, '<h3 class="text-lg font-semibold text-indigo-900 mt-4 mb-2">$1</h3>')
      .replace(/#{2} (.*?)(?=<br>|$)/g, '<h2 class="text-xl font-semibold text-indigo-900 mt-5 mb-2">$1</h2>')
      .replace(/# (.*?)(?=<br>|$)/g, '<h1 class="text-2xl font-bold text-indigo-900 mt-6 mb-3">$1</h1>');
    
    this.formattedResponse = this.sanitizer.bypassSecurityTrustHtml(formatted);
  }
}
