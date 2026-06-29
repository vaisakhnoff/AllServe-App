# Provider Order Components - Usage Guide

This is a comprehensive reusable component library for the provider portal's bookings and requests pages. All components share the same configuration, styling, and messaging for consistency.

---

## 📦 Components Overview

### 1. **OrderStatusConfig**
Centralized configuration for all statuses, actions, messages, and warnings.

**Usage:**
```typescript
import { ORDER_STATUS_CONFIG, ORDER_ACTION_CONFIG, DELIVERY_MODEL_BADGES } from "@/components/provider/orders";

// Get status configuration
const statusCfg = ORDER_STATUS_CONFIG["in_progress"];
console.log(statusCfg.label); // "Work In Progress"

// Get action configuration
const actionCfg = ORDER_ACTION_CONFIG["start_work"];
console.log(actionCfg.successMessage); // "Work started successfully"

// Get delivery model badge
const badge = DELIVERY_MODEL_BADGES["direct_instant"];
console.log(badge.emoji); // "🚀"
```

---

### 2. **OrderStatusBadge**
Displays order type and status with icons and colors.

**Props:**
```typescript
interface OrderStatusBadgeProps {
  order: ServiceOrder;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
}
```

**Usage:**
```typescript
import { OrderStatusBadge } from "@/components/provider/orders";

<OrderStatusBadge 
  order={order} 
  size="md" 
  showDescription={true}
/>
```

**Output:**
- Shows delivery model badge (🚀 Instant, 🔍 Inspection, etc.)
- Shows status badge (Awaiting, In Progress, etc.)
- Optional: Description of status

---

### 3. **WarningAlert**
Shows contextual warnings, info, errors, or success messages.

**Props:**
```typescript
interface WarningAlertProps {
  type?: "info" | "warning" | "error" | "success";
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}
```

**Usage:**
```typescript
import { WarningAlert } from "@/components/provider/orders";

// Response deadline warning
<WarningAlert 
  type="warning"
  title="Response Deadline"
  message="⏰ Respond within 30 minutes to avoid auto-rejection"
  dismissible={true}
/>

// Success message
<WarningAlert 
  type="success"
  message="✓ Order accepted successfully"
/>
```

---

### 4. **OrderActionButton**
Unified button for all order actions with confirmation dialogs.

**Props:**
```typescript
interface OrderActionButtonProps {
  actionKey: string; // Key from ORDER_ACTION_CONFIG
  orderId: string;
  onAction: (actionKey: string, orderId: string) => Promise<void>;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "danger";
}
```

**Supported Actions:**
- `accept` - Accept order
- `reject` - Reject order
- `start_work` - Begin work
- `complete_work` - Mark complete
- `complete_inspection` - Inspection done
- `submit_quotation` - Submit quote
- `cancel` - Cancel order
- `create_invoice` - Generate invoice
- `message` - Send message

**Usage:**
```typescript
import { OrderActionButton } from "@/components/provider/orders";

const handleAction = async (actionKey: string, orderId: string) => {
  // Call API
  await orderService.customStartWork(orderId);
};

<div className="flex gap-2">
  <OrderActionButton
    actionKey="start_work"
    orderId={order._id}
    onAction={handleAction}
    fullWidth
  />
  <OrderActionButton
    actionKey="cancel"
    orderId={order._id}
    onAction={handleAction}
    variant="danger"
  />
</div>
```

**Features:**
- Automatic confirmation dialog
- Loading state
- Error handling with toast
- Pre-configured messages
- Danger/success variant detection

---

### 5. **ConfirmationDialog**
Confirmation dialog for critical actions.

**Props:**
```typescript
interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  actionKey: string; // For getting pre-configured message
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isDangerous?: boolean;
}
```

**Usage:**
```typescript
import { ConfirmationDialog } from "@/components/provider/orders";

const [showConfirm, setShowConfirm] = useState(false);

<ConfirmationDialog
  isOpen={showConfirm}
  title="Start Work"
  message="Begin working on this order?"
  actionKey="start_work"
  onConfirm={async () => {
    await orderService.customStartWork(order._id);
  }}
  onCancel={() => setShowConfirm(false)}
  isDangerous={false}
/>
```

---

### 6. **QuotationForm**
Form for submitting quotations in requests.

**Props:**
```typescript
interface QuotationFormProps {
  isOpen: boolean;
  orderId: string;
  onSubmit: (data: QuotationData) => Promise<void>;
  onClose: () => void;
  title?: string;
  description?: string;
}

interface QuotationData {
  price: number;
  message: string;
  estimatedDuration: string;
  availabilityNote?: string;
}
```

**Usage:**
```typescript
import { QuotationForm } from "@/components/provider/orders";

const [showQuoteForm, setShowQuoteForm] = useState(false);

<QuotationForm
  isOpen={showQuoteForm}
  orderId={request._id}
  onSubmit={async (data) => {
    await providerQuoteService.submit({
      serviceRequestId: request._id,
      ...data,
    });
  }}
  onClose={() => setShowQuoteForm(false)}
/>
```

**Features:**
- Price validation
- Message validation (min 5 chars)
- Duration input
- Optional availability note
- Automatic error handling

---

### 7. **InvoiceCard**
Display invoice with payment status and details.

**Props:**
```typescript
interface InvoiceCardProps {
  invoice: Invoice;
  onViewDetails?: () => void;
  onPaymentAction?: () => void;
  compact?: boolean;
}
```

**Usage:**
```typescript
import { InvoiceCard } from "@/components/provider/orders";

// Full view
<InvoiceCard
  invoice={invoice}
  compact={false}
  onViewDetails={() => navigateTo(invoice._id)}
  onPaymentAction={() => openPaymentModal()}
/>

// Compact view (inline)
<InvoiceCard invoice={invoice} compact={true} />
```

**Shows:**
- Labour, material, additional charges
- Discounts
- Total amount
- Payment status
- Platform commission
- Action buttons

---

### 8. **OrderDetailsCard**
Display order information, location, customer, images.

**Props:**
```typescript
interface OrderDetailsCardProps {
  order: ServiceOrder;
  showCustomer?: boolean;
  showProvider?: boolean;
}
```

**Usage:**
```typescript
import { OrderDetailsCard } from "@/components/provider/orders";

<OrderDetailsCard
  order={order}
  showCustomer={true}
  showProvider={false}
/>
```

**Shows:**
- Order title & description
- Budget
- Location & address
- Preferred date/time
- Customer contact info
- Images gallery

---

## 🎨 Complete Example

### Bookings Page Order Card:

```typescript
"use client";

import { useState } from "react";
import {
  OrderStatusBadge,
  WarningAlert,
  OrderActionButton,
  WARNING_MESSAGES,
  ORDER_STATUS_CONFIG,
} from "@/components/provider/orders";
import { ServiceOrder } from "@/types/order.types";

interface BookingCardProps {
  order: ServiceOrder;
}

export function BookingCard({ order }: BookingCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const statusCfg = ORDER_STATUS_CONFIG[order.status];

  const handleAction = async (actionKey: string) => {
    setIsLoading(true);
    try {
      if (actionKey === "start_work") {
        await orderService.customStartWork(order._id);
      } else if (actionKey === "complete_work") {
        await orderService.customCompleteWork(order._id);
      }
      // ... more actions
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      {/* Status Badge */}
      <div className="mb-4">
        <OrderStatusBadge order={order} size="md" />
      </div>

      {/* Warning if applicable */}
      {order.status === "awaiting_provider_response" && (
        <div className="mb-4">
          <WarningAlert
            type="warning"
            message={WARNING_MESSAGES.response_deadline}
            dismissible={false}
          />
        </div>
      )}

      {/* Order Info */}
      <div className="mb-4">
        <h3 className="font-bold text-slate-900">{order.title}</h3>
        <p className="text-sm text-slate-600 mt-1">{order.description}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {statusCfg?.actions.includes("start_work") && (
          <OrderActionButton
            actionKey="start_work"
            orderId={order._id}
            onAction={handleAction}
            fullWidth
          />
        )}
        {statusCfg?.actions.includes("cancel") && (
          <OrderActionButton
            actionKey="cancel"
            orderId={order._id}
            onAction={handleAction}
            variant="danger"
          />
        )}
      </div>
    </div>
  );
}
```

---

## 📋 Configuration Reference

### Status Values:
```typescript
// Direct Orders
"awaiting_provider_response"
"accepted"
"in_progress"
"work_completed"
"completed"

// Inspection Orders
"inspection_accepted"
"inspection_completed"
"quotation_accepted"

// Custom/Service Request Orders
"quotation_accepted_custom" // After quote accepted
```

### Delivery Models:
```typescript
"direct" (subMode: "instant" | "scheduled")
"inspection_required"
"custom"
```

### Actions:
```typescript
"accept" | "reject" | "start_work" | "complete_work"
| "complete_inspection" | "submit_quotation" | "cancel"
| "create_invoice" | "message"
```

---

## 🔌 Integration Checklist

When building pages using these components:

1. ✅ Import components from `@/components/provider/orders`
2. ✅ Use `ORDER_STATUS_CONFIG` for status-dependent logic
3. ✅ Wrap actions in `OrderActionButton` for consistency
4. ✅ Show warnings using `WarningAlert` component
5. ✅ Use `QuotationForm` for quote submission
6. ✅ Display invoices with `InvoiceCard`
7. ✅ Show details with `OrderDetailsCard`
8. ✅ Call order service methods from `onAction` handlers
9. ✅ Handle errors with toast notifications
10. ✅ Keep loading states during API calls

---

## 💡 Best Practices

1. **Always use OrderActionButton** instead of custom buttons for consistency
2. **Show relevant warnings** based on order status from `WARNING_MESSAGES`
3. **Use compact mode** for inline displays (lists)
4. **Use full mode** for detail pages
5. **Handle errors gracefully** with try-catch in action handlers
6. **Show success messages** from `SUCCESS_MESSAGES`
7. **Reuse InvoiceCard** across all pages showing invoices
8. **Keep configuration centralized** in OrderStatusConfig

---

## 🚀 What's Included

- **Unified Status Display**: Same badges across all pages
- **Consistent Actions**: Same buttons, messages, and behavior
- **Message Management**: Centralized warnings, confirmations, errors
- **Form Components**: Pre-built quotation and action forms
- **Invoice Display**: Reusable invoice card with payment tracking
- **Type Safety**: Full TypeScript support
- **Accessibility**: ARIA labels, keyboard navigation
- **Responsive**: Works on mobile, tablet, desktop

---

## 📝 Files

```
src/components/provider/orders/
├── OrderStatusConfig.ts     (Configuration)
├── OrderStatusBadge.tsx     (Badge display)
├── WarningAlert.tsx         (Alert messages)
├── ConfirmationDialog.tsx   (Confirmation)
├── OrderActionButton.tsx    (Action button)
├── QuotationForm.tsx        (Quote form)
├── InvoiceCard.tsx          (Invoice display)
├── OrderDetailsCard.tsx     (Order info)
├── index.ts                 (Exports)
└── USAGE.md                 (This file)
```
