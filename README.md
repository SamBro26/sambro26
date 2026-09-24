# Find My Home DZ

Build a complete real estate platform for the Algerian market named 'FindMeDZ دبرلي' supporting a polished Web interface and responsive Mobile layouts. I want you to construct the frontend screens (Home with tabs for supply/demand, filters for Wilaya/Baladiya, Ad creation wizard, role-based contact options, and user messages) using the exact database logic provided below. Please adapt this Prisma Schema and Constants setup directly into your backend architecture so the system remains modular and easily editable:

constants-package/

├── src/

│   ├── property-types.ts      # Apartment, House, Shop, Building/Agri Land

│   ├── transaction-types.ts   # Sale, Purchase, Rent (+ valid ad-kind mapping)

│   ├── ad-status.ts           # Ad lifecycle + Supply/Demand tab labels

│   ├── account-tier.ts        # Free/Premium feature flags

│   ├── payment-methods.ts     # Chargily + BaridiMob labels

│   ├── locations/

│   │   ├── wilayas.ts         # all 58, hand-maintained

│   │   ├── baladiyas.ts       # loader over data/baladiyas.json

│   │   └── data/baladiyas.json # sample data (2 wilayas) — swap for full official list

│   └── index.ts

├── scripts/generate-baladiyas.ts  # regenerates baladiyas.json from an official CSV

├── package.json / tsconfig.json / README.md

// =========================================================================
// FindMeDZ (ط¯ط¨ط±ظ„ظٹ) â€” Prisma Schema
// PostgreSQL datasource. Run `npx prisma generate` after any change.
// =========================================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =========================================================================
// ENUMS  (small, fixed sets â€” not user-editable, so plain enums)
// =========================================================================

enum UserRole {
  INDIVIDUAL
  AGENCY
  ADMIN
}

enum AccountTier {
  FREE
  PREMIUM
}

enum AdKind {
  SUPPLY // Offered property (ط§ظ„ط¹ط±ط¶)
  DEMAND // Search request (ط§ظ„ط·ظ„ط¨)
}

enum AdStatus {
  PENDING_REVIEW
  ACTIVE
  REJECTED
  EXPIRED
  SOLD_RENTED
}

enum ReactionType {
  LIKE
  LOVE
}

enum PaymentMethod {
  CHARGILY_EDAHABIA
  CHARGILY_CIB
  BARIDIMOB_MANUAL
}

enum PaymentStatus {
  PENDING
  APPROVED
  REJECTED
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  CANCELLED
}

enum ReportStatus {
  OPEN
  REVIEWED
  DISMISSED
}

// =========================================================================
// REFERENCE / LOOKUP TABLES
// These are DB-backed (not enums) because they are admin-editable and
// multilingual â€” they map 1:1 to the shared `constants` package at the
// application layer, which caches/mirrors them for fast client-side filters.
// =========================================================================

model Wilaya {
  id         Int        @id @default(autoincrement())
  code       String     @unique // "01".."58"
  nameAr     String     @map("name_ar")
  nameFr     String     @map("name_fr")
  nameEn     String?    @map("name_en")
  baladiyas  Baladiya[]
  ads        Ad[]

  @@map("wilayas")
}

model Baladiya {
  id        Int     @id @default(autoincrement())
  wilayaId  Int     @map("wilaya_id")
  wilaya    Wilaya  @relation(fields: [wilayaId], references: [id], onDelete: Restrict)
  code      String
  nameAr    String  @map("name_ar")
  nameFr    String  @map("name_fr")
  nameEn    String? @map("name_en")
  ads       Ad[]

  @@unique([wilayaId, code])
  @@index([wilayaId])
  @@map("baladiyas")
}

model PropertyType {
  id       Int    @id @default(autoincrement())
  key      String @unique // apartment | house | shop | building_land | agricultural_land
  labelAr  String @map("label_ar")
  labelFr  String @map("label_fr")
  labelEn  String? @map("label_en")
  sortOrder Int   @default(0) @map("sort_order")
  ads      Ad[]

  @@map("property_types")
}

model TransactionType {
  id       Int    @id @default(autoincrement())
  key      String @unique // sale | purchase | rent
  labelAr  String @map("label_ar")
  labelFr  String @map("label_fr")
  labelEn  String? @map("label_en")
  sortOrder Int   @default(0) @map("sort_order")
  ads      Ad[]

  @@map("transaction_types")
}

// =========================================================================
// USERS & ACCOUNTS
// =========================================================================

model User {
  id                String      @id @default(uuid())
  fullName          String      @map("full_name")
  phone             String      @unique
  phoneVerifiedAt   DateTime?   @map("phone_verified_at")
  email             String?     @unique
  passwordHash      String      @map("password_hash")
  role              UserRole    @default(INDIVIDUAL)
  accountTier       AccountTier @default(FREE) @map("account_tier")
  premiumExpiresAt  DateTime?   @map("premium_expires_at")
  avatarUrl         String?     @map("avatar_url")
  isBanned          Boolean     @default(false) @map("is_banned")
  createdAt         DateTime    @default(now()) @map("created_at")
  updatedAt         DateTime    @updatedAt @map("updated_at")

  agency            Agency?
  devices           UserDevice[]
  ads               Ad[]
  reactions         AdReaction[]
  ratingsGiven      UserRating[]      @relation("RatingsGiven")
  ratingsReceived   UserRating[]      @relation("RatingsReceived")
  conversations     ConversationParticipant[]
  messagesSent      Message[]
  subscriptions     Subscription[]
  payments          Payment[]
  reportsFiled      AdReport[]        @relation("ReportsFiled")
  auditLogs         AuditLog[]        @relation("AdminAuditLogs")
  paymentsReviewed  Payment[]         @relation("PaymentsReviewed")

  @@index([role])
  @@index([accountTier])
  @@map("users")
}

model Agency {
  id                 String   @id @default(uuid())
  userId             String   @unique @map("user_id")
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  agencyName         String   @map("agency_name")
  registrationNumber String?  @map("registration_number") // RC number
  verified           Boolean  @default(false)
  createdAt          DateTime @default(now()) @map("created_at")

  @@map("agencies")
}

model UserDevice {
  id             String   @id @default(uuid())
  userId         String   @map("user_id")
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expoPushToken  String   @map("expo_push_token")
  platform       String   // ios | android | web
  createdAt      DateTime @default(now()) @map("created_at")

  @@unique([userId, expoPushToken])
  @@map("user_devices")
}

// =========================================================================
// ADS (Supply & Demand share one table, differentiated by adKind)
// =========================================================================

model Ad {
  id                 String    @id @default(uuid())
  userId             String    @map("user_id")
  user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  adKind             AdKind    @map("ad_kind")

  propertyTypeId     Int       @map("property_type_id")
  propertyType       PropertyType @relation(fields: [propertyTypeId], references: [id])

  transactionTypeId  Int       @map("transaction_type_id")
  transactionType    TransactionType @relation(fields: [transactionTypeId], references: [id])

  wilayaId           Int       @map("wilaya_id")
  wilaya             Wilaya    @relation(fields: [wilayaId], references: [id])

  baladiyaId         Int       @map("baladiya_id")
  baladiya           Baladiya  @relation(fields: [baladiyaId], references: [id])

  exactAddress       String?   @map("exact_address")
  price              Decimal?  @db.Decimal(14, 2)
  advancePayment     Decimal?  @map("advance_payment") @db.Decimal(14, 2)
  description        String?

  status             AdStatus  @default(PENDING_REVIEW)
  isFeatured         Boolean   @default(false) @map("is_featured")
  featuredUntil      DateTime? @map("featured_until")
  viewsCount         Int       @default(0) @map("views_count")

  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")
  expiresAt          DateTime? @map("expires_at")

  images             AdImage[]
  keywords           AdKeyword[]
  reactions          AdReaction[]
  ratings            UserRating[]
  conversations      Conversation[]
  reports            AdReport[]

  // Composite index accelerates the core filter combo used by the search bar
  @@index([wilayaId, baladiyaId, propertyTypeId, transactionTypeId, status])
  @@index([adKind, status])
  @@index([isFeatured, featuredUntil])
  @@map("ads")
}

model AdImage {
  id        String   @id @default(uuid())
  adId      String   @map("ad_id")
  ad        Ad       @relation(fields: [adId], references: [id], onDelete: Cascade)
  url       String
  sortOrder Int      @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([adId])
  @@map("ad_images")
}

model AdKeyword {
  id      String @id @default(uuid())
  adId    String @map("ad_id")
  ad      Ad     @relation(fields: [adId], references: [id], onDelete: Cascade)
  keyword String

  @@index([adId])
  @@index([keyword])
  @@map("ad_keywords")
}

// =========================================================================
// INTERACTIONS (Ratings & Likes)
// =========================================================================

model AdReaction {
  id        String       @id @default(uuid())
  adId      String       @map("ad_id")
  ad        Ad           @relation(fields: [adId], references: [id], onDelete: Cascade)
  userId    String       @map("user_id")
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      ReactionType
  createdAt DateTime     @default(now()) @map("created_at")

  @@unique([adId, userId, type])
  @@map("ad_reactions")
}

model UserRating {
  id            String   @id @default(uuid())
  ratedUserId   String   @map("rated_user_id")
  ratedUser     User     @relation("RatingsReceived", fields: [ratedUserId], references: [id], onDelete: Cascade)
  raterUserId   String   @map("rater_user_id")
  raterUser     User     @relation("RatingsGiven", fields: [raterUserId], references: [id], onDelete: Cascade)
  adId          String?  @map("ad_id")
  ad            Ad?      @relation(fields: [adId], references: [id], onDelete: SetNull)
  stars         Int      // 1-5, validated in application layer
  comment       String?
  createdAt     DateTime @default(now()) @map("created_at")

  @@unique([ratedUserId, raterUserId, adId])
  @@map("user_ratings")
}

// =========================================================================
// MESSAGING
// =========================================================================

model Conversation {
  id           String   @id @default(uuid())
  adId         String?  @map("ad_id")
  ad           Ad?      @relation(fields: [adId], references: [id], onDelete: SetNull)
  createdAt    DateTime @default(now()) @map("created_at")

  participants ConversationParticipant[]
  messages     Message[]

  @@index([adId])
  @@map("conversations")
}

model ConversationParticipant {
  id             String       @id @default(uuid())
  conversationId String       @map("conversation_id")
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  userId         String       @map("user_id")
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([conversationId, userId])
  @@map("conversation_participants")
}

model Message {
  id             String       @id @default(uuid())
  conversationId String       @map("conversation_id")
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId       String       @map("sender_id")
  sender         User         @relation(fields: [senderId], references: [id], onDelete: Cascade)
  content        String
  isRead         Boolean      @default(false) @map("is_read")
  createdAt      DateTime     @default(now()) @map("created_at")

  @@index([conversationId, createdAt])
  @@map("messages")
}

// =========================================================================
// SUBSCRIPTIONS & PAYMENTS
// =========================================================================

model SubscriptionPlan {
  id           String   @id @default(uuid())
  name         String
  durationDays Int      @map("duration_days")
  priceDzd     Decimal  @map("price_dzd") @db.Decimal(10, 2)
  features     Json     @default("{}")
  isActive     Boolean  @default(true) @map("is_active")

  subscriptions Subscription[]

  @@map("subscription_plans")
}

model Subscription {
  id        String              @id @default(uuid())
  userId    String              @map("user_id")
  user      User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  planId    String              @map("plan_id")
  plan      SubscriptionPlan    @relation(fields: [planId], references: [id])
  status    SubscriptionStatus  @default(ACTIVE)
  startsAt  DateTime            @map("starts_at")
  endsAt    DateTime            @map("ends_at")

  payments  Payment[]

  @@index([userId, status])
  @@map("subscriptions")
}

model Payment {
  id                     String        @id @default(uuid())
  userId                 String        @map("user_id")
  user                   User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscriptionId         String?       @map("subscription_id")
  subscription           Subscription? @relation(fields: [subscriptionId], references: [id], onDelete: SetNull)

  method                 PaymentMethod
  amountDzd              Decimal       @map("amount_dzd") @db.Decimal(10, 2)
  status                 PaymentStatus @default(PENDING)

  chargilyTransactionId  String?       @map("chargily_transaction_id") // automated gateway ref
  receiptImageUrl        String?       @map("receipt_image_url")       // manual BaridiMob/CCP slip

  reviewedByAdminId      String?       @map("reviewed_by_admin_id")
  reviewedByAdmin        User?         @relation("PaymentsReviewed", fields: [reviewedByAdminId], references: [id], onDelete: SetNull)

  createdAt              DateTime      @default(now()) @map("created_at")
  reviewedAt             DateTime?     @map("reviewed_at")

  @@index([status])
  @@index([method])
  @@map("payments")
}

// =========================================================================
// ADMIN / MODERATION
// =========================================================================

model AdReport {
  id         String       @id @default(uuid())
  adId       String       @map("ad_id")
  ad         Ad           @relation(fields: [adId], references: [id], onDelete: Cascade)
  reporterId String       @map("reporter_id")
  reporter   User         @relation("ReportsFiled", fields: [reporterId], references: [id], onDelete: Cascade)
  reason     String
  status     ReportStatus @default(OPEN)
  createdAt  DateTime     @default(now()) @map("created_at")

  @@index([adId])
  @@index([status])
  @@map("ad_reports")
}

model AuditLog {
  id         String   @id @default(uuid())
  adminId    String   @map("admin_id")
  admin      User     @relation("AdminAuditLogs", fields: [adminId], references: [id], onDelete: Cascade)
  action     String
  targetType String   @map("target_type")
  targetId   String   @map("target_id")
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([targetType, targetId])
  @@map("audit_logs")
}

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sambro26.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b189907a-354c-4304-b50b-6b34bb2b178d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
