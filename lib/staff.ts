/**
 * Staff roles and what each can do. Imported by both server code and admin UI,
 * so it holds no secrets.
 */
export const ROLES = ["owner", "manager", "fulfilment"] as const;
export type Role = (typeof ROLES)[number];

export type Permission =
  | "dashboard" // revenue and stock overview
  | "orders" // view orders, update status and tracking
  | "products" // create and edit products, prices, stock and photos
  | "reviews"
  | "messages"
  | "subscribers" // includes the email export
  | "staff" // add, change and remove staff accounts
  | "activity"; // the activity log

const GRANTS: Record<Role, Permission[]> = {
  owner: ["dashboard", "orders", "products", "reviews", "messages", "subscribers", "staff", "activity"],
  manager: ["dashboard", "orders", "products", "reviews", "messages", "subscribers"],
  fulfilment: ["orders", "messages"],
};

export const ROLE_INFO: Record<Role, { name: string; blurb: string }> = {
  owner: { name: "Owner", blurb: "Everything, including staff accounts and the activity log." },
  manager: { name: "Manager", blurb: "Products, prices, stock, orders, reviews, messages and subscribers. Can't manage staff." },
  fulfilment: { name: "Fulfilment", blurb: "Orders and customer messages only. Can't see revenue or change products and prices." },
};

export const isRole = (r: string): r is Role => (ROLES as readonly string[]).includes(r);

export function can(role: string, permission: Permission) {
  return isRole(role) && GRANTS[role].includes(permission);
}

/** Where someone lands after logging in: the dashboard if they can see it, otherwise orders. */
export const homeFor = (role: string) => (can(role, "dashboard") ? "/admin" : "/admin/orders");
