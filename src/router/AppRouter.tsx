import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PosLayout } from '../components/templates/PosLayout'
import { CashClosePage } from '../pages/CashClosePage'
import { LoginPage } from '../pages/LoginPage'
import { PickupPage } from '../pages/PickupPage'
import { PosPage } from '../pages/PosPage'
import { ReceiptPage } from '../pages/ReceiptPage'
import { ROLES_POR_RUTA } from '../lib/permisos'
import { RequireAuth } from './RequireAuth'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <PosLayout />
            </RequireAuth>
          }
        >
          <Route path="/pos" element={<RequireAuth roles={ROLES_POR_RUTA['/pos']}><PosPage /></RequireAuth>} />
          <Route path="/pos/comprobante" element={<RequireAuth roles={ROLES_POR_RUTA['/pos']}><ReceiptPage /></RequireAuth>} />
          <Route path="/pickup" element={<RequireAuth roles={ROLES_POR_RUTA['/pickup']}><PickupPage /></RequireAuth>} />
          <Route path="/caja/cierre" element={<RequireAuth roles={ROLES_POR_RUTA['/caja/cierre']}><CashClosePage /></RequireAuth>} />
        </Route>
        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
