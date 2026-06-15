export const providerStats = [
  { label: "Total Bookings", value: "128", change: "+14 this month" },
  { label: "Earnings", value: "₹84,250", change: "+18% from April" },
  { label: "Active Jobs", value: "7", change: "3 due today" },
  { label: "Rating", value: "4.8", change: "92 reviews" },
];

export const bookings = [
  { customer: "Neha S.", service: "Deep Cleaning", date: "Today, 2:30 PM", status: "pending", amount: "₹1,899" },
  { customer: "Rahul M.", service: "Bathroom Plumbing", date: "May 6, 10:00 AM", status: "accepted", amount: "₹799" },
  { customer: "Anita K.", service: "AC Service", date: "May 8, 4:00 PM", status: "completed", amount: "₹1,299" },
  { customer: "Dev P.", service: "Wall Painting", date: "May 10, 11:30 AM", status: "pending", amount: "₹4,500" },
];

export const services = [
  { name: "Premium Home Deep Cleaning", price: "₹1,899", duration: "3 hours", category: "Cleaning", status: "active" },
  { name: "Bathroom Plumbing Repair", price: "₹799", duration: "90 mins", category: "Plumbing", status: "active" },
  { name: "Split AC General Service", price: "₹1,299", duration: "2 hours", category: "AC Repair", status: "active" },
  { name: "Interior Wall Painting", price: "₹4,500", duration: "1 day", category: "Painting", status: "inactive" },
];

export const conversations = [
  { name: "Neha S.", message: "Can you bring eco-friendly cleaning supplies?", time: "9:42 AM", active: true },
  { name: "Rahul M.", message: "Please confirm the pipe fitting size.", time: "Yesterday", active: false },
  { name: "Anita K.", message: "Thanks for the quick service.", time: "Mon", active: false },
];

export const transactions = [
  { id: "AS-2048", label: "Deep Cleaning completed", date: "May 3", amount: "+₹1,899", status: "Paid" },
  { id: "AS-2042", label: "AC Service completed", date: "May 1", amount: "+₹1,299", status: "Paid" },
  { id: "AS-2039", label: "Weekly withdrawal", date: "Apr 28", amount: "-₹12,000", status: "Processed" },
  { id: "AS-2031", label: "Plumbing repair completed", date: "Apr 26", amount: "+₹799", status: "Paid" },
];
