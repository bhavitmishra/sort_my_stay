-- CreateTable
CREATE TABLE "Manager" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "gst" TEXT NOT NULL,
    "phone" TEXT,
    "bankIfsc" TEXT,
    "accountNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "city" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "googleMapLink" TEXT,
    "address" TEXT,
    "posterUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "galleryImages" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Manager_email_key" ON "Manager"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Manager_phone_key" ON "Manager"("phone");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
