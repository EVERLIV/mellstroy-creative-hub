# Setup Instructions for Trainer Documents Feature

## 1. Run Database Migration

Execute the SQL migration file in Supabase SQL Editor:
- File: `supabase/migrations/20251113000000_create_trainer_documents.sql`

This will create:
- `trainer_documents` table
- Indexes for performance
- Row Level Security (RLS) policies

## 2. Create Storage Bucket

In Supabase Dashboard → Storage:

1. Click "New bucket"
2. Name: `trainer-documents`
3. Public bucket: **Yes** (so documents can be viewed)
4. File size limit: 5MB (or as needed)
5. Allowed MIME types: `image/*`

## 3. Set Storage Policies

In Supabase Dashboard → Storage → `trainer-documents` → Policies:

### Policy 1: Trainers can upload their own documents
```sql
CREATE POLICY "Trainers can upload own documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'trainer-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Policy 2: Trainers can view their own documents
```sql
CREATE POLICY "Trainers can view own documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'trainer-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Policy 3: Trainers can delete their own documents
```sql
CREATE POLICY "Trainers can delete own documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'trainer-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Policy 4: Public can view documents (for verified documents)
```sql
CREATE POLICY "Public can view verified documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'trainer-documents');
```

## 4. Features

### For Trainers:
- Upload certificates, awards, and other documents (image format)
- All documents appear in profile with "Not Verified" status
- View all documents in "My Documents" page
- Delete documents

### For Admins:
- View all pending documents in Admin Dashboard → Documents tab
- Premium users' documents are prioritized (shown first with crown icon)
- Approve or reject documents
- Add rejection reason when rejecting

### Priority System:
- Premium users get `priority = 10`
- Regular users get `priority = 0`
- Documents are sorted by priority (descending), then by creation date (ascending)

## 5. Usage

1. Trainer goes to Profile → "My Documents" section
2. Clicks "View All" or "Upload Documents"
3. Uploads document with title and type
4. Document appears in profile with "Not Verified" badge
5. Admin reviews in Admin Dashboard → Documents tab
6. Admin approves/rejects with optional reason
7. Status updates automatically in trainer's profile

