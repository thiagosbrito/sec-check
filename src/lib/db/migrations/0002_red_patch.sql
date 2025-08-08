CREATE TYPE "public"."billing_interval" AS ENUM('month', 'year');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid');--> statement-breakpoint
CREATE TABLE "billing_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid,
	"stripe_invoice_id" varchar(255),
	"stripe_charge_id" varchar(255),
	"stripe_payment_intent_id" varchar(255),
	"event_type" varchar(100) NOT NULL,
	"status" varchar(50) NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'usd' NOT NULL,
	"description" text,
	"period_start" timestamp,
	"period_end" timestamp,
	"failure_code" varchar(100),
	"failure_message" varchar(500),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	CONSTRAINT "billing_history_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id"),
	CONSTRAINT "billing_history_stripe_charge_id_unique" UNIQUE("stripe_charge_id"),
	CONSTRAINT "billing_history_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "plan_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan" "user_plan" NOT NULL,
	"scans_per_day" integer NOT NULL,
	"scans_per_month" integer NOT NULL,
	"domain_verification" boolean DEFAULT false NOT NULL,
	"api_access" boolean DEFAULT false NOT NULL,
	"advanced_reports" boolean DEFAULT false NOT NULL,
	"custom_branding" boolean DEFAULT false NOT NULL,
	"priority_support" boolean DEFAULT false NOT NULL,
	"api_calls_per_hour" integer DEFAULT 0,
	"max_api_keys" integer DEFAULT 0,
	"webhook_support" boolean DEFAULT false NOT NULL,
	"team_access" boolean DEFAULT false NOT NULL,
	"sso_support" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plan_features_plan_unique" UNIQUE("plan")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_customer_id" varchar(255) NOT NULL,
	"stripe_subscription_id" varchar(255),
	"stripe_price_id" varchar(255),
	"status" "subscription_status" DEFAULT 'incomplete' NOT NULL,
	"plan" "user_plan" NOT NULL,
	"billing_interval" "billing_interval" NOT NULL,
	"price_per_month" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'usd' NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp,
	"cancel_reason" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "subscriptions_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "usage_stats" ADD COLUMN "subscription_id" uuid;--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "billing_history_user_idx" ON "billing_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "billing_history_subscription_idx" ON "billing_history" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "billing_history_stripe_invoice_idx" ON "billing_history" USING btree ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX "billing_history_event_type_idx" ON "billing_history" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "billing_history_status_idx" ON "billing_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "billing_history_created_at_idx" ON "billing_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "plan_features_plan_idx" ON "plan_features" USING btree ("plan");--> statement-breakpoint
CREATE INDEX "subscriptions_user_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_stripe_customer_idx" ON "subscriptions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "subscriptions_stripe_subscription_idx" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_plan_idx" ON "subscriptions" USING btree ("plan");--> statement-breakpoint
ALTER TABLE "usage_stats" ADD CONSTRAINT "usage_stats_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "usage_stats_subscription_idx" ON "usage_stats" USING btree ("subscription_id");