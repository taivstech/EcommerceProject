import { Routes, Route, Outlet } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminLayout from '@/components/admin/AdminLayout'
import StoreLayout from '@/components/store/StoreLayout'
import WarehouseLayout from '@/components/warehouse/WarehouseLayout'

import Home from '@/pages/Home'
import Shop from '@/pages/Shop'
import StoreShop from '@/pages/StoreShop'
import Product from '@/pages/Product'
import Cart from '@/pages/Cart'
import Checkout from '@/pages/Checkout'
import PaymentCallback from '@/pages/PaymentCallback'
import Notifications from '@/pages/Notifications'
import Orders from '@/pages/Orders'
import LoadingPage from '@/pages/LoadingPage'
import CreateStore from '@/pages/CreateStore'
import Pricing from '@/pages/Pricing'

import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Authenticate from '@/pages/Authenticate'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import VerifyEmail from '@/pages/VerifyEmail'
import Profile from '@/pages/Profile'
import ProfileAddresses from '@/pages/ProfileAddresses'

import AdminDashboard from '@/pages/admin/AdminDashboard'
import Approve from '@/pages/admin/Approve'
import Categories from '@/pages/admin/Categories'
import Coupons from '@/pages/admin/Coupons'
import AdminStores from '@/pages/admin/Stores'
import Users from '@/pages/admin/Users'
import AdminChat from '@/pages/admin/AdminChat'
import AdminCashFlow from '@/pages/admin/AdminCashFlow'

import StoreDashboard from '@/pages/store/StoreDashboard'
import AddProduct from '@/pages/store/AddProduct'
import ManageProduct from '@/pages/store/ManageProduct'
import StoreOrders from '@/pages/store/StoreOrders'
import StoreChat from '@/pages/store/StoreChat'
import Vouchers from '@/pages/store/Vouchers'
import CashFlow from '@/pages/store/CashFlow'
import Settings from '@/pages/store/Settings'
import StoreWarehouseDashboard from '@/pages/store/WarehouseDashboard'
import Warehouses from '@/pages/store/Warehouses'
import WarehouseDetail from '@/pages/store/WarehouseDetail'
import WarehouseOrders from '@/pages/store/WarehouseOrders'
import WarehouseEmployees from '@/pages/store/WarehouseEmployees'
import WarehouseInventory from '@/pages/store/WarehouseInventory'
import WarehouseReports from '@/pages/store/WarehouseReports'

import WarehousePage from '@/pages/warehouse/WarehousePage'

function PublicLayoutRoute() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <HelmetProvider>
      <Routes>
        <Route element={<PublicLayoutRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:username" element={<StoreShop />} />
          <Route path="/product/:productId" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/callback" element={<PaymentCallback />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/loading" element={<LoadingPage />} />
          <Route path="/create-store" element={<CreateStore />} />
          <Route path="/pricing" element={<Pricing />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/authenticate" element={<Authenticate />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/addresses" element={<ProfileAddresses />} />

        <Route path="/admin" element={<AdminLayout><Outlet /></AdminLayout>}>
          <Route index element={<AdminDashboard />} />
          <Route path="approve" element={<Approve />} />
          <Route path="categories" element={<Categories />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="stores" element={<AdminStores />} />
          <Route path="users" element={<Users />} />
          <Route path="chat" element={<AdminChat />} />
          <Route path="cash-flow" element={<AdminCashFlow />} />
        </Route>

        {/* ── Store routes ─────────────────────────────────── */}
        <Route path="/store" element={<StoreLayout><Outlet /></StoreLayout>}>
          <Route index element={<StoreDashboard />} />
          <Route path="add-product" element={<AddProduct />} />
          <Route path="manage-product" element={<ManageProduct />} />
          <Route path="orders" element={<StoreOrders />} />
          <Route path="chat" element={<StoreChat />} />
          <Route path="vouchers" element={<Vouchers />} />
          <Route path="cash-flow" element={<CashFlow />} />
          <Route path="settings" element={<Settings />} />
          <Route path="warehouse-dashboard" element={<StoreWarehouseDashboard />} />
          <Route path="warehouses" element={<Warehouses />} />
          <Route path="warehouses/:id" element={<WarehouseDetail />} />
          <Route path="warehouses/:id/orders" element={<WarehouseOrders />} />
          <Route path="warehouses/:id/employees" element={<WarehouseEmployees />} />
          <Route path="warehouses/:id/inventory" element={<WarehouseInventory />} />
          <Route path="warehouses/:id/reports" element={<WarehouseReports />} />
        </Route>

        <Route path="/warehouse" element={<WarehouseLayout><Outlet /></WarehouseLayout>}>
          <Route index element={<WarehousePage />} />
        </Route>
      </Routes>
    </HelmetProvider>
  )
}
