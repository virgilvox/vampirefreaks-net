import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"

// better-auth core tables. Field names match what the drizzle adapter expects,
// so the auth library reads and writes these directly. The indexes and the
// updatedAt $onUpdate match what `npm run auth:schema` generates; regenerate and
// compare after changing auth plugins.
//
// The admin plugin adds role, banned, banReason, banExpires to user, and
// impersonatedBy to session. Those carry staff roles and the ban state that
// moderation (section 12 of the PRD) builds on. There are no member tiers and
// no billing: every account has the same capabilities, moderation included.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    activeOrganizationId: text("active_organization_id"),
    impersonatedBy: text("impersonated_by"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("session_user_id_idx").on(table.userId),
    // The shell's online count filters sessions by expiry on every page load.
    index("session_expires_idx").on(table.expiresAt),
  ],
)

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
)

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
)

// Multi-tenant primitives for the organization plugin. Kept from the template
// so the auth schema stays whole, unused by the social domain for now.
export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    metadata: text("metadata"),
  },
  (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
)

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("member_organization_id_idx").on(table.organizationId),
    index("member_user_id_idx").on(table.userId),
  ],
)

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organization_id_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
)

export const passkey = pgTable(
  "passkey",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    credentialID: text("credential_id").notNull(),
    counter: integer("counter").notNull(),
    deviceType: text("device_type").notNull(),
    backedUp: boolean("backed_up").notNull(),
    transports: text("transports"),
    createdAt: timestamp("created_at"),
    aaguid: text("aaguid"),
  },
  (table) => [
    index("passkey_user_id_idx").on(table.userId),
    index("passkey_credential_id_idx").on(table.credentialID),
  ],
)

// ----------------------------------------------------------------------------
// Social domain. The VampireFreaks era rebuilt on the auth tables above.
// Text UUID primary keys, an index on every foreign key and hot query path,
// onDelete set on every reference, updatedAt with $onUpdate where rows mutate.
// ----------------------------------------------------------------------------

// One row per member, 1:1 with the auth user. Rating aggregates are
// denormalized here so the leaderboards are a cheap ordered read. Structured
// customization (colors, font, background) renders inline; the bounded
// customCss is sanitized on write; customHtml is reserved for the Phase 5
// sandboxed freeform layout and unused until then.
export const profiles = pgTable(
  "profiles",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    username: text("username").notNull().unique(),
    displayName: text("display_name"),
    tagline: text("tagline"),
    bio: text("bio").notNull().default(""),
    location: text("location"),
    genderLabel: text("gender_label"),
    // boys | girls | everyone | none. Self-selected, opt out with none, which
    // also hides the numeric rating from others.
    leaderboardBucket: text("leaderboard_bucket").notNull().default("none"),
    birthdate: timestamp("birthdate"),
    // Single adult-or-not gate decided at onboarding (PRD section 16).
    isAdult: boolean("is_adult").notNull().default(false),
    // Structured customization, the safe default. All optional.
    bgColor: text("bg_color"),
    accentColor: text("accent_color"),
    textColor: text("text_color"),
    linkColor: text("link_color"),
    bgImageUrl: text("bg_image_url"),
    fontChoice: text("font_choice"),
    customCss: text("custom_css"),
    customHtml: text("custom_html"),
    avatarPhotoId: text("avatar_photo_id"),
    bannerPhotoId: text("banner_photo_id"),
    profileSongId: text("profile_song_id"),
    // SEO opt-out. When false, the public page asks not to be indexed.
    indexable: boolean("indexable").notNull().default(true),
    ratingSum: integer("rating_sum").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("profiles_username_uidx").on(t.username),
    index("profiles_bucket_idx").on(t.leaderboardBucket),
    index("profiles_created_idx").on(t.createdAt),
  ],
)

// One rating per rater per target. Re-rating overwrites in a transaction that
// also adjusts the target profile's ratingSum and ratingCount.
export const profileRatings = pgTable(
  "profile_ratings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    raterId: text("rater_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetUserId: text("target_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    score: integer("score").notNull(), // 1..10, validated in the handler
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("profile_ratings_rater_target_uidx").on(t.raterId, t.targetUserId),
    index("profile_ratings_target_idx").on(t.targetUserId),
  ],
)

// Friend connections. Stored once per pair, queried both directions. status is
// pending until the addressee accepts.
export const friendships = pgTable(
  "friendships",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    requesterId: text("requester_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    addresseeId: text("addressee_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // pending | accepted
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("friendships_pair_uidx").on(t.requesterId, t.addresseeId),
    index("friendships_addressee_idx").on(t.addresseeId),
    index("friendships_requester_idx").on(t.requesterId),
  ],
)

// Private inbox. A member reads only rows where they are sender or recipient.
export const messages = pgTable(
  "messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    subject: text("subject"),
    body: text("body").notNull(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("messages_recipient_idx").on(t.recipientId),
    index("messages_sender_idx").on(t.senderId),
  ],
)

// Members block other members. Cuts messages and hides activity both ways.
export const blocks = pgTable(
  "blocks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    blockerId: text("blocker_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    blockedId: text("blocked_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("blocks_pair_uidx").on(t.blockerId, t.blockedId),
    index("blocks_blocked_idx").on(t.blockedId),
  ],
)

// Optional gallery grouping. Reserved: the schema and the photos.albumId
// reference exist, but albums have no API or UI in v1.
export const albums = pgTable(
  "albums",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("albums_user_id_idx").on(t.userId)],
)

// Gallery images. Bytes live in Spaces; only the object key and public URL are
// stored here. The ratingSum, ratingCount, and thumbnailUrl columns and the
// photoRatings table below are reserved: photo rating and thumbnails are not
// built in v1.
export const photos = pgTable(
  "photos",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    albumId: text("album_id").references(() => albums.id, { onDelete: "set null" }),
    objectKey: text("object_key").notNull(),
    url: text("url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    caption: text("caption"),
    isPrimary: boolean("is_primary").notNull().default(false),
    ratingSum: integer("rating_sum").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("photos_user_id_idx").on(t.userId), index("photos_album_id_idx").on(t.albumId)],
)

export const photoRatings = pgTable(
  "photo_ratings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    raterId: text("rater_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    photoId: text("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("photo_ratings_rater_photo_uidx").on(t.raterId, t.photoId),
    index("photo_ratings_photo_idx").on(t.photoId),
  ],
)

// Blog and diary entries. visibility gates who can read.
export const journals = pgTable(
  "journals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    mood: text("mood"),
    visibility: text("visibility").notNull().default("public"), // public | friends | private
    commentCount: integer("comment_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("journals_user_id_idx").on(t.userId),
    index("journals_created_idx").on(t.createdAt),
  ],
)

export const journalComments = pgTable(
  "journal_comments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    journalId: text("journal_id")
      .notNull()
      .references(() => journals.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("journal_comments_journal_idx").on(t.journalId)],
)

// User-created groups. Each has its own page and forum boards. customCss is
// sanitized on write like a profile's.
export const cults = pgTable(
  "cults",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    iconPhotoId: text("icon_photo_id"),
    joinPolicy: text("join_policy").notNull().default("open"), // open | approval | closed
    customCss: text("custom_css"),
    memberCount: integer("member_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("cults_slug_uidx").on(t.slug), index("cults_owner_idx").on(t.ownerId)],
)

export const cultMembers = pgTable(
  "cult_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    cultId: text("cult_id")
      .notNull()
      .references(() => cults.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // owner | moderator | member
    status: text("status").notNull().default("active"), // active | pending
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("cult_members_cult_user_uidx").on(t.cultId, t.userId),
    index("cult_members_user_idx").on(t.userId),
  ],
)

// Forum boards unify site-wide boards and per-cult boards. A site board has
// cultId null; a cult board references the cult. Threads and posts hang off
// boards either way, so one mechanism serves both.
export const boards = pgTable(
  "boards",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    scope: text("scope").notNull().default("site"), // site | cult
    cultId: text("cult_id").references(() => cults.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("boards_scope_slug_uidx").on(t.scope, t.slug),
    index("boards_cult_id_idx").on(t.cultId),
  ],
)

export const threads = pgTable(
  "threads",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    boardId: text("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    pinned: boolean("pinned").notNull().default(false),
    locked: boolean("locked").notNull().default(false),
    postCount: integer("post_count").notNull().default(0),
    lastPostAt: timestamp("last_post_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("threads_board_id_idx").on(t.boardId),
    index("threads_last_post_idx").on(t.lastPostAt),
  ],
)

export const posts = pgTable(
  "posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    threadId: text("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    editedAt: timestamp("edited_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("posts_thread_id_idx").on(t.threadId)],
)

// The box members post short updates into. Feeds the activity stream.
export const statusUpdates = pgTable(
  "status_updates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("status_updates_user_idx").on(t.userId),
    index("status_updates_created_idx").on(t.createdAt),
  ],
)

// Band pages. ownerUserId is the member who manages it, set on approval.
export const bands = pgTable(
  "bands",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    ownerUserId: text("owner_user_id").references(() => user.id, { onDelete: "set null" }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    genre: text("genre"),
    bio: text("bio").notNull().default(""),
    location: text("location"),
    approved: boolean("approved").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("bands_slug_uidx").on(t.slug), index("bands_owner_idx").on(t.ownerUserId)],
)

// Audio tracks for profiles and bands. Bytes live in Spaces.
export const songs = pgTable(
  "songs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    uploaderId: text("uploader_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bandId: text("band_id").references(() => bands.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    objectKey: text("object_key").notNull(),
    url: text("url").notNull(),
    durationSec: integer("duration_sec"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("songs_uploader_idx").on(t.uploaderId), index("songs_band_idx").on(t.bandId)],
)

export const events = pgTable(
  "events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    venue: text("venue"),
    city: text("city"),
    startsAt: timestamp("starts_at").notNull(),
    endsAt: timestamp("ends_at"),
    url: text("url"),
    flyerPhotoId: text("flyer_photo_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("events_starts_idx").on(t.startsAt), index("events_city_idx").on(t.city)],
)

export const eventRsvps = pgTable(
  "event_rsvps",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("going"), // going | interested
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("event_rsvps_event_user_uidx").on(t.eventId, t.userId),
    index("event_rsvps_user_idx").on(t.userId),
  ],
)

// Moderation queue. Members flag content; staff resolve.
export const reports = pgTable(
  "reports",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull(), // profile | photo | journal | post | message | cult | event
    targetId: text("target_id").notNull(),
    // A snapshot label and link captured when the report is filed, so the queue
    // stays readable and linkable even after the content is removed.
    targetLabel: text("target_label"),
    targetHref: text("target_href"),
    reason: text("reason").notNull(),
    status: text("status").notNull().default("open"), // open | resolved | dismissed
    handledBy: text("handled_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("reports_status_idx").on(t.status),
    index("reports_target_idx").on(t.targetType, t.targetId),
  ],
)

// Staff action log for accountability.
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    detail: text("detail"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("audit_log_actor_idx").on(t.actorId),
    index("audit_log_created_idx").on(t.createdAt),
  ],
)

// Staff-set homepage featured slots. One row per slot key (member, cult).
export const featuredSlots = pgTable("featured_slots", {
  slotKey: text("slot_key").primaryKey(), // member | cult
  refId: text("ref_id"),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

// Materialized feed rows. Reserved for when the query-based feed gets slow
// (PRD section 16). Unused in v1.
export const activity = pgTable(
  "activity",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    verb: text("verb").notNull(),
    objectType: text("object_type").notNull(),
    objectId: text("object_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("activity_actor_idx").on(t.actorId), index("activity_created_idx").on(t.createdAt)],
)

export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
export type ProfileRating = typeof profileRatings.$inferSelect
export type Friendship = typeof friendships.$inferSelect
export type Message = typeof messages.$inferSelect
export type Block = typeof blocks.$inferSelect
export type Photo = typeof photos.$inferSelect
export type Album = typeof albums.$inferSelect
export type Journal = typeof journals.$inferSelect
export type JournalComment = typeof journalComments.$inferSelect
export type Cult = typeof cults.$inferSelect
export type CultMember = typeof cultMembers.$inferSelect
export type Board = typeof boards.$inferSelect
export type Thread = typeof threads.$inferSelect
export type Post = typeof posts.$inferSelect
export type StatusUpdate = typeof statusUpdates.$inferSelect
export type Band = typeof bands.$inferSelect
export type Song = typeof songs.$inferSelect
export type Event = typeof events.$inferSelect
export type EventRsvp = typeof eventRsvps.$inferSelect
export type Report = typeof reports.$inferSelect
export type AuditLogEntry = typeof auditLog.$inferSelect
export type FeaturedSlot = typeof featuredSlots.$inferSelect
