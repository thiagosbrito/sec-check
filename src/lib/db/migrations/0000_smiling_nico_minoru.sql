CREATE TYPE "public"."owasp_category" AS ENUM('A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10');--> statement-breakpoint
CREATE TYPE "public"."scan_status" AS ENUM('pending', 'running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_plan" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."vulnerability_severity" AS ENUM('critical', 'high', 'medium', 'low', 'info');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key_id" varchar(50) NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"rate_limit" integer DEFAULT 60,
	"last_used_at" timestamp,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	CONSTRAINT "api_keys_key_id_unique" UNIQUE("key_id")
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_method" varchar(50),
	"verification_token" varchar(255),
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "domains_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" uuid NOT NULL,
	"format" varchar(20) DEFAULT 'json' NOT NULL,
	"summary" jsonb,
	"content" jsonb,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"version" varchar(10) DEFAULT '1.0',
	"file_url" varchar(500),
	"file_size" integer,
	"is_custom_branded" boolean DEFAULT false,
	"branding_config" jsonb
);
--> statement-breakpoint
CREATE TABLE "scan_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" uuid NOT NULL,
	"test_name" varchar(100) NOT NULL,
	"owasp_category" "owasp_category" NOT NULL,
	"severity" "vulnerability_severity" NOT NULL,
	"status" varchar(20) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"impact" text,
	"recommendation" text,
	"evidence" jsonb,
	"technical_details" jsonb,
	"references" jsonb,
	"confidence" integer DEFAULT 100,
	"false_positive" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" varchar(2048) NOT NULL,
	"domain" varchar(255) NOT NULL,
	"user_id" uuid,
	"status" "scan_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_public_scan" boolean DEFAULT true NOT NULL,
	"scan_config" jsonb,
	"user_agent" varchar(500),
	"ip_address" varchar(45),
	"total_vulnerabilities" integer DEFAULT 0,
	"critical_count" integer DEFAULT 0,
	"high_count" integer DEFAULT 0,
	"medium_count" integer DEFAULT 0,
	"low_count" integer DEFAULT 0,
	"info_count" integer DEFAULT 0,
	"error_message" text,
	"retry_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "usage_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"date" timestamp NOT NULL,
	"scans_count" integer DEFAULT 0,
	"api_calls_count" integer DEFAULT 0,
	"plan_at_time" "user_plan" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"plan" "user_plan" DEFAULT 'free' NOT NULL,
	"scan_limit" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_results" ADD CONSTRAINT "scan_results_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scans" ADD CONSTRAINT "scans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_stats" ADD CONSTRAINT "usage_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_user_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_keys_key_id_idx" ON "api_keys" USING btree ("key_id");--> statement-breakpoint
CREATE INDEX "api_keys_active_idx" ON "api_keys" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "domains_domain_idx" ON "domains" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "domains_user_idx" ON "domains" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "domains_verified_idx" ON "domains" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "reports_scan_idx" ON "reports" USING btree ("scan_id");--> statement-breakpoint
CREATE INDEX "reports_format_idx" ON "reports" USING btree ("format");--> statement-breakpoint
CREATE INDEX "reports_generated_at_idx" ON "reports" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "scan_results_scan_idx" ON "scan_results" USING btree ("scan_id");--> statement-breakpoint
CREATE INDEX "scan_results_test_idx" ON "scan_results" USING btree ("test_name");--> statement-breakpoint
CREATE INDEX "scan_results_owasp_idx" ON "scan_results" USING btree ("owasp_category");--> statement-breakpoint
CREATE INDEX "scan_results_severity_idx" ON "scan_results" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "scan_results_status_idx" ON "scan_results" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scans_url_idx" ON "scans" USING btree ("url");--> statement-breakpoint
CREATE INDEX "scans_domain_idx" ON "scans" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "scans_user_idx" ON "scans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scans_status_idx" ON "scans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scans_created_at_idx" ON "scans" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "scans_public_idx" ON "scans" USING btree ("is_public_scan");--> statement-breakpoint
CREATE INDEX "usage_stats_user_date_idx" ON "usage_stats" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "usage_stats_date_idx" ON "usage_stats" USING btree ("date");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_plan_idx" ON "users" USING btree ("plan");