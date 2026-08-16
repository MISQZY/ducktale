/**
 * Fixed catalog of atomic site permissions — "resource-action" pairs like
 * "tickets-edit". Not admin-authored: a resource-role only matters if some
 * code path actually checks for it (src/lib/admin.ts's requireResourceRole /
 * requireResourceRoleId), so this list IS the set of things that exist to
 * grant, not a suggestion.
 *
 * These are never assigned to a user directly — an admin bundles them into
 * a named Role (DB-backed, /admin/roles, src/lib/actions/admin-roles.ts),
 * and it's the Role that gets assigned to a user. session.user.roles
 * (populated in auth.ts) is the flattened union of resource-roles across
 * every Role a user holds; every -edit/-view check in the app still checks
 * that flat list, same as before — only how it gets populated changed.
 * /admin/resource-roles is a read-only reference view of this catalog (who
 * uses which resource-role in which Role), not an assignment UI.
 *
 * `content` has no "view" action — the content workspace (/admin/content)
 * has no separate read-only mode, editing it IS viewing it. `resource-roles`
 * has no "edit"/"delete" action — it's a fixed, code-defined catalog,
 * nothing here is ever edited or removed through the admin panel.
 *
 * `delete` is a third, independent action alongside `view`/`edit` — holding
 * `-edit` does **not** imply `-delete` (or vice versa): editing a record and
 * permanently removing one are different levels of trust, and bundling them
 * meant any editor could also delete, whether that was intended or not. Only
 * `-delete` satisfies `-view` for the same resource for free (see
 * hasResourceRole below) — being able to delete something implies being
 * able to see it. `-edit` does **not** — an editor who also needs to browse
 * the resource (reach its list/page in the first place) needs `-view`
 * granted explicitly alongside `-edit`, same as anyone else; bundling "can
 * edit" with "can therefore also always view" turned out to be its own kind
 * of implicit privilege stacking, the same problem `-edit`/`-delete`
 * independence above was fixing. Only resources with a real delete
 * operation in code have the action at all: `users` (deleteUser), `tickets`
 * (deleteTicket), `badges` (deleteBadge), `content` (deleteContentFile),
 * `ranks` (deleteRank), `role` (deleteRole), `threads` (deleteThread),
 * `row-level-roles` (deleteRowLevelRole), `maps` (deleteServerMap) —
 * `resource-roles`, `docs`, `leaderboard`, `profiles`, `server-status`,
 * `maps-page` have nothing to delete.
 *
 * `row-level-roles` (RowLevelRole, /admin/row-level-roles) is a resource
 * like any other here — its own resource-role gates that admin page — but
 * it's also a *composition* layer for the rest of this catalog: an admin
 * bundles resource-roles into a named, reusable RowLevelRole (e.g.
 * "Управление тредами" = `threads-edit` + `threads-view`), and a Role pulls
 * that bundle in as a unit (RoleRowLevelRole) instead of re-picking the same
 * resource-roles directly. See RowLevelRole's doc comment in the schema for
 * why the name refers to bundling one row of the admin grid, not database
 * row-level security.
 *
 * Not every resource here has an /admin page — `threads` gates baseline
 * participation (viewing the list, opening/creating/replying to a thread)
 * on `threads-view`, and moderation (closing someone else's thread, deleting
 * one) on `threads-edit`, all on the public /threads feature, not an
 * admin-panel surface. `threads-view` is seeded onto the built-in "user"
 * Role (src/config/roles.ts) — every registered account holds it by
 * default, matching the site's pre-existing "any logged-in user can
 * participate" behavior — so revoking it from a specific Role is now a real
 * lever an admin has, instead of that baseline being hardcoded to "has a
 * session" with no resource-role backing it at all. Their resourceLabels
 * (src/i18n/messages/*.json, Admin.resourceRoles.resourceLabels) are
 * prefixed "[Админ]" for the ones that DO correspond to an /admin page, to
 * keep the two kinds visually distinct in the /admin/roles Role-builder
 * picker and the /admin/resource-roles reference list.
 *
 * `docs`/`leaderboard`/`profiles`/`server-status`/`maps-page` are the
 * public, no-admin-page side of the same idea, one step further: view-only
 * gates on site sections that don't require login at all today.
 * Unauthenticated visitors resolve these through the built-in "guest" Role
 * instead of being rejected outright (src/lib/public-access.ts's
 * requirePublicResourceRole/requirePublicResourceRoleApi — deliberately
 * separate from requireResourceRole(Id) in src/lib/admin.ts, which every
 * existing authenticated-only surface keeps using unchanged). Guest is
 * seeded with all five (src/config/roles.ts) so nothing about current
 * public access changes unless an admin later revokes one.
 *
 * `maps`/`maps-page` are the same `content`/`docs` split, for the same
 * reason: `maps` (view/edit/delete) gates /admin/maps, where a server's
 * named maps actually get created/edited/removed
 * (src/lib/actions/admin-maps.ts); `maps-page` (view only, guest-inclusive)
 * gates the public /maps section that displays them. Two different resource
 * keys rather than one combined one — same as `content`/`docs` — since an
 * admin-only "can manage map records" grant and a public "can browse the
 * map section at all" grant are genuinely different levers an admin should
 * be able to hand out independently, not one permission wearing two hats.
 */
export const RESOURCE_ROLE_ACTIONS = {
  users: ["view", "edit", "delete"],
  tickets: ["view", "edit", "delete"],
  badges: ["view", "edit", "delete"],
  content: ["edit", "delete"],
  ranks: ["view", "edit", "delete"],
  "resource-roles": ["view", "edit"],
  role: ["view", "edit", "delete"],
  "row-level-roles": ["view", "edit", "delete"],
  threads: ["view", "edit", "delete"],
  docs: ["view"],
  leaderboard: ["view"],
  profiles: ["view"],
  "server-status": ["view"],
  maps: ["view", "edit", "delete"],
  "maps-page": ["view"],
} as const;

export type Resource = keyof typeof RESOURCE_ROLE_ACTIONS;

// Object.entries() widens keys back to `string`, so ResourceRole is built as
// a mapped type over the literal RESOURCE_ROLE_ACTIONS instead — the runtime
// array below is then just cast to that type, not the source of it.
export type ResourceRole = {
  [R in Resource]: `${R}-${(typeof RESOURCE_ROLE_ACTIONS)[R][number]}`;
}[Resource];

export const RESOURCE_ROLES = (
  Object.entries(RESOURCE_ROLE_ACTIONS) as [Resource, readonly string[]][]
).flatMap(([resource, actions]) => actions.map((action) => `${resource}-${action}` as ResourceRole));

export function isResourceRole(value: string): value is ResourceRole {
  return (RESOURCE_ROLES as readonly string[]).includes(value);
}

export function isResource(value: string): value is Resource {
  return value in RESOURCE_ROLE_ACTIONS;
}

/**
 * True if `held` (a viewer's resource-role keys) satisfies `required` —
 * either directly, or via the matching "-delete" role when `required` is a
 * "-view" role for the same resource (a deleter doesn't also need the view
 * role separately — being able to delete something implies being able to
 * see it). "-edit" does **not** satisfy "-view" — an editor needs `-view`
 * granted explicitly too if they need to browse the resource, same as
 * "-edit" and "-delete" don't satisfy each other (see RESOURCE_ROLE_ACTIONS's
 * doc comment for why). Superadmin (isAdmin) bypass is the caller's
 * responsibility — this only reasons about explicit resource-role grants.
 */
export function hasResourceRole(held: string[], required: ResourceRole): boolean {
  if (held.includes(required)) return true;
  if (required.endsWith("-view")) {
    const resource = required.slice(0, -"-view".length);
    if (held.includes(`${resource}-delete`)) return true;
  }
  return false;
}
