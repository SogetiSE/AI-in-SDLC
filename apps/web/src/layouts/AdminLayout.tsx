import { Link, Outlet } from 'react-router-dom';

export function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__title">ZAVA Admin</div>
        <nav className="admin-sidebar__nav">
          <Link to="/admin" className="admin-sidebar__link">
            Dashboard
          </Link>
          <Link to="/admin/reviews" className="admin-sidebar__link">
            Reviews
          </Link>
        </nav>
      </aside>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
