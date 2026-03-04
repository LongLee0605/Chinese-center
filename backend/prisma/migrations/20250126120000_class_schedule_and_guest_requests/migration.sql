-- AlterTable: add schedule fields to classes
ALTER TABLE "classes" ADD COLUMN "scheduleDayOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "classes" ADD COLUMN "scheduleStartTime" TEXT;
ALTER TABLE "classes" ADD COLUMN "scheduleEndTime" TEXT;
ALTER TABLE "classes" ADD COLUMN "room" TEXT;
ALTER TABLE "classes" ADD COLUMN "maxMembers" INTEGER;

-- CreateTable: class_registration_requests (guest sign-up for a class)
CREATE TABLE "class_registration_requests" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_registration_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "class_registration_requests_classId_idx" ON "class_registration_requests"("classId");
CREATE INDEX IF NOT EXISTS "class_registration_requests_status_idx" ON "class_registration_requests"("status");

ALTER TABLE "class_registration_requests" DROP CONSTRAINT IF EXISTS "class_registration_requests_classId_fkey";
ALTER TABLE "class_registration_requests" ADD CONSTRAINT "class_registration_requests_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
