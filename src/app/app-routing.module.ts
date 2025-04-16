import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProductsComponent } from './components/user/products/products.component';
import { ProductDetailComponent } from './components/user/product-detail/product-detail.component';
import { CartComponent } from './components/user/cart-items/cart-items.component';
import { OrdersComponent } from './components/user/orders/orders.component';
import { ProfileComponent } from './components/user/profile/profile.component';
import { AuthGuard } from './auth.guard';
import { ViewUsersComponent } from './components/admin/view-users/view-users.component';
import { AdminGuard } from './admin.guard';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { ViewAdminsComponent } from './components/admin/view-admins/view-admins.component';
import { ViewProductsComponent } from './components/admin/view-products/view-products.component';
import { EditProductsComponent } from './components/admin/edit-products/edit-products.component';
import { OrderManageComponent } from './components/admin/order-manage/order-manage.component';
import { OrderDetailComponent } from './components/admin/order-detail/order-detail.component';
import { WishlistComponent } from './components/user/wishlist/wishlist.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'register', component: RegisterComponent,},
  { path: 'products', component: ProductsComponent, canActivate: [AuthGuard]},
  { path: 'product/:id', component: ProductDetailComponent, canActivate: [AuthGuard] },
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard] },
  { path: 'orders', component: OrdersComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'wishlist', component: WishlistComponent, canActivate: [AuthGuard] },
  
  // Admin route
  {
    path: 'admin',
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'viewusers', component: ViewUsersComponent },
      { path: 'viewadmins', component: ViewAdminsComponent },
      { path: 'viewproducts', component: ViewProductsComponent },
      { path: 'viewproducts/edit/:id', component: EditProductsComponent },
      { path: 'viewproducts/add', component: EditProductsComponent },
      { path: 'vieworders', component: OrderManageComponent  },
      { path: 'vieworders/:id', component: OrderDetailComponent },
      // { path: 'settings', component: AdminSettingsComponent }
    ]
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
