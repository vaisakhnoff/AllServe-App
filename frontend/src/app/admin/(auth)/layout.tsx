export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-auth-shell">
      {children}
    </div>
  );
}
