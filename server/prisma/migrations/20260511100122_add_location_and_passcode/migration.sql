/*
  Warnings:

  - Added the required column `passcodeHash` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "passcodeHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "location" TEXT NOT NULL;
