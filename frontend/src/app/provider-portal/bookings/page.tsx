// This page has been consolidated into a unified bookings page
// See /provider-portal/bookings-unified/page.tsx

import { redirect } from "next/navigation";

export default function ProviderBookingsPage() {
  // Redirect to unified bookings page
  redirect("/provider-portal/bookings-unified");
}
