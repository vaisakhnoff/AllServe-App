import "./admin.css";

export const metadata = {
  title: "AllServe Admin Control Panel",
  description: "High-level control dashboard for AllServe.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-root">
      {children}
    </div>
  );
}
