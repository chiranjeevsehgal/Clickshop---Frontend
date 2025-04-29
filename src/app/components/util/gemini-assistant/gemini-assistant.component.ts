import { Component, OnInit } from '@angular/core';
import { GeminiService } from '../../../services/util/gemini.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProductServiceService } from '../../../services/productService/product-service.service';
import { Product } from '../../../models/Product';
import { forkJoin } from 'rxjs';

interface ChatMessage {
  sender: 'user' | 'ai';
  content: string;
  formattedContent?: SafeHtml;
  timestamp: Date;
  products?: Product[]
}

@Component({
  selector: 'app-gemini-assistant',
  standalone: false,
  templateUrl: './gemini-assistant.component.html',
  styleUrl: './gemini-assistant.component.css'
})
export class GeminiAssistantComponent implements OnInit {
  isModalOpen = false;
  products: Product[] = [];
  userPrompt = '';
  chatHistory: ChatMessage[] = [];
  isLoading = false;
  samplePrompts = [
    'What gifts would be suitable for a 12-year-old?',
    'I need a laptop for video editing, what should I buy?',
    'Suggest some products for home office setup',
    'What are the best tech gadgets under ₹5000?'
  ];

  constructor(
    private geminiService: GeminiService,
    private productService: ProductServiceService,
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
    this.chatHistory = [];
  }

  loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (data) => {
        this.products = data;
      },
      error: (error) => {
        console.error('Error fetching products:', error);
      }
    });
  }

  async sendPrompt(): Promise<void> {
    if (!this.userPrompt.trim()) return;
    
    this.addUserMessage(this.userPrompt);
    const currentPrompt = this.userPrompt;
    this.userPrompt = '';
    this.isLoading = true;
    
    try {
      const aiResponse = await this.geminiService.getAiResponse_Agent(currentPrompt);
      const productIds = this.extractProductIds(aiResponse);
      
      if (productIds.length > 0) {
        this.fetchAndDisplayProducts(productIds, aiResponse);
      } else {
        this.addAiMessage(aiResponse);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      this.addAiMessage('Sorry, I encountered an error. Please try again later.');
    } finally {
      this.isLoading = false;
    }
  }

  addUserMessage(content: string): void {
    this.chatHistory.push({
      sender: 'user',
      content: content,
      timestamp: new Date()
    });
  }

 addAiMessage(content: string, products?: Product[]): void {
    const formatted = this.formatResponse(content);
    console.log(content);
    
    const message: ChatMessage = {
      sender: 'ai',
      content: content,
      formattedContent: formatted,
      timestamp: new Date()
    };
    console.log(message);
    
    // Only add products if they exist
    if (products && products.length > 0) {
      message.products = products;
    }
    console.log(message);
    console.log(message.products);
    
    this.chatHistory.push(message);
    console.log(this.chatHistory);
    
  }

  extractProductIds(response: string): number[] {
    // This regex matches numbers in the response that look like product IDs
    const idMatches = response.match(/\b\d{1,5}\b/g);
    if (!idMatches) return [];
    
    // Convert to numbers and filter out any unlikely IDs (assuming your IDs are within a certain range)
    return idMatches.map(Number).filter(id => id > 0 && id < 10000);
  }

  fetchAndDisplayProducts(ids: number[], originalResponse: string): void {
    const productRequests = ids.map(id => 
      this.productService.getProductById(id)
    );
    console.log(productRequests);
    
    
    forkJoin(productRequests).subscribe({
      next: (products) => {
        const validProducts = products.filter(p => p != null) as Product[];
        const uniqueProducts = this.removeDuplicateProducts(validProducts);
        this.addAiMessage(originalResponse, uniqueProducts);
        console.log(uniqueProducts);
      },
      error: (error) => {
        console.error('Error fetching products:', error);
        this.addAiMessage(originalResponse);
      }
    });
  }

  // Helper to remove duplicate products
  removeDuplicateProducts(products: Product[]): Product[] {
    const uniqueIds = new Set<number>();
    return products.filter(product => {
      if (uniqueIds.has(product.id)) {
        return false;
      }
      uniqueIds.add(product.id);
      return true;
    });
  }


  useSamplePrompt(prompt: string): void {
    this.userPrompt = prompt;
    this.sendPrompt();
  }

  formatResponse(content: string): SafeHtml {
    if (!content) return this.sanitizer.bypassSecurityTrustHtml('');

    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold text-indigo-700">$1</span>')
      .replace(/\*(.*?)\*/g, '<span class="italic text-indigo-600">$1</span>')
      .replace(/\n/g, '<br>')
      .replace(/- (.*?)(?=<br>|$)/g, '<div class="flex"><span class="mr-2">•</span><span>$1</span></div>')
      .replace(/#{3} (.*?)(?=<br>|$)/g, '<h3 class="text-lg font-semibold text-indigo-900 mt-4 mb-2">$1</h3>')
      .replace(/#{2} (.*?)(?=<br>|$)/g, '<h2 class="text-xl font-semibold text-indigo-900 mt-5 mb-2">$1</h2>')
      .replace(/# (.*?)(?=<br>|$)/g, '<h1 class="text-2xl font-bold text-indigo-900 mt-6 mb-3">$1</h1>');
    
    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }
}