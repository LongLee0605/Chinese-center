-- AlterTable: TrialRegistration - support class registration (đăng ký lớp)
ALTER TABLE "trial_registrations" ADD COLUMN "classId" TEXT;
ALTER TABLE "trial_registrations" ADD COLUMN "className" TEXT;
ALTER TABLE "trial_registrations" ADD COLUMN "classDate" TIMESTAMP(3);
ALTER TABLE "trial_registrations" ALTER COLUMN "courseId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "trial_registrations_classId_idx" ON "trial_registrations"("classId");

-- AddForeignKey
ALTER TABLE "trial_registrations" ADD CONSTRAINT "trial_registrations_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
