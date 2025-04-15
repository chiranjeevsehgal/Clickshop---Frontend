import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProductsComponent } from './components/user/products/products.component';
import { FormsModule } from '@angular/forms';
import { ProductDetailComponent } from './components/user/product-detail/product-detail.component';
import { CartComponent } from './components/user/cart-items/cart-items.component';
import { NavbarComponent } from './components/reusable/navbar/navbar.component';
import { OrdersComponent } from './components/user/orders/orders.component';
import { ProfileComponent } from './components/user/profile/profile.component';
import { AuthInterceptor } from './auth.interceptor';
import { ViewUsersComponent } from './components/admin/view-users/view-users.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminSidebarComponent } from './components/reusable/admin-sidebar/admin-sidebar.component';
import { AdminHeaderComponent } from './components/reusable/admin-header/admin-header.component';
import { AdminLayoutComponent } from './components/reusable/admin-layout/admin-layout.component';
import { ViewAdminsComponent } from './components/admin/view-admins/view-admins.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    ProductsComponent,
    ProductDetailComponent,
    CartComponent,
    NavbarComponent,
    OrdersComponent,
    ProfileComponent,
    ViewUsersComponent,
    AdminDashboardComponent,
    AdminSidebarComponent,
    AdminHeaderComponent,
    AdminLayoutComponent,
    ViewAdminsComponent,

  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
