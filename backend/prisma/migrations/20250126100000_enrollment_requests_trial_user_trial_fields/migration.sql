-- CreateEnum
CREATE TYPE "EnrollmentRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "course_enrollment_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "EnrollmentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "course_enrollment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trial_registrations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "courseId" TEXT NOT NULL,
    "message" TEXT,
    "status" "EnrollmentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdUserId" TEXT,

    CONSTRAINT "trial_registrations_pkey" PRIMARY KEY ("id")
);

-- AlterTable (Prisma default table name for model User is "User", not "users")
ALTER TABLE "User" ADD COLUMN "isTrial" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "trialExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollment_requests_userId_courseId_key" ON "course_enrollment_requests"("userId", "courseId");
CREATE INDEX "course_enrollment_requests_courseId_idx" ON "course_enrollment_requests"("courseId");
CREATE INDEX "course_enrollment_requests_status_idx" ON "course_enrollment_requests"("status");
CREATE INDEX "trial_registrations_courseId_idx" ON "trial_registrations"("courseId");
CREATE INDEX "trial_registrations_status_idx" ON "trial_registrations"("status");

-- AddForeignKey
ALTER TABLE "course_enrollment_requests" ADD CONSTRAINT "course_enrollment_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_enrollment_requests" ADD CONSTRAINT "course_enrollment_requests_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trial_registrations" ADD CONSTRAINT "trial_registrations_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
