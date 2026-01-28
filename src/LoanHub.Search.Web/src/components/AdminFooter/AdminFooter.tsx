import './AdminFooter.css';

/**
 * Simplified footer for admin dashboard.
 * Does not include product/company links that are irrelevant for admins.
 */
export function AdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="admin-footer">
      <div className="admin-footer-container">
        <p className="admin-copyright">
          © {currentYear} LoanHub Admin Panel. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
