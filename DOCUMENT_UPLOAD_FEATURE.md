# Document Upload Feature

## Overview
This feature allows students to upload, manage, and organize project documents with AWS S3 storage integration and database persistence.

## Features
- ✅ Upload documents to AWS S3
- ✅ Store document metadata in database
- ✅ Document categorization (Reports, Presentations, Code, Videos)
- ✅ View and download documents
- ✅ Delete documents
- ✅ Document status tracking (pending, approved, rejected)
- ✅ File type validation
- ✅ 50MB file size limit

## Setup Instructions

### 1. Database Setup
Run the SQL migration in your Supabase SQL editor:
```bash
/reviewpanel-backend/migrations/create_documents_table.sql
```

### 2. AWS S3 Configuration
Ensure these environment variables are set in `.env`:
```env
S3_ACCESS_KEY_ID=AKIAUZAXTVUVRCTZDX4A
S3_SECRET_ACCESS=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
S3_BUCKET_NAME=mit-adt-student-documents
S3_REGION=ap-south-1
```

### 3. Install Dependencies
```bash
cd reviewpanel-backend
npm install aws-sdk
```

### 4. Start the Server
```bash
cd reviewpanel-backend
npm run dev
```

### 5. Access the Feature
Navigate to: `http://localhost:5173/documentation`

## API Endpoints

### Upload Document
```
POST /api/student/documents/upload
Headers: Authorization: Bearer <student_token>
Body: FormData
  - file: File
  - category: string (reports|presentations|code|videos)
  - description: string (optional)
```

### Get Documents
```
GET /api/student/documents
Headers: Authorization: Bearer <student_token>
Query Parameters:
  - category: string (optional) - Filter by category
```

### Get Single Document
```
GET /api/student/documents/:id
Headers: Authorization: Bearer <student_token>
```

### Delete Document
```
DELETE /api/student/documents/:id
Headers: Authorization: Bearer <student_token>
```

## File Structure

### Backend
```
reviewpanel-backend/
├── src/
│   ├── models/
│   │   └── documentModel.js           # Database operations
│   ├── controllers/
│   │   └── students/
│   │       └── documentController.js  # Request handlers
│   ├── routes/
│   │   └── students/
│   │       └── documentRoutes.js      # Route definitions
│   └── services/
│       └── s3Service.js               # S3 upload/delete logic
└── migrations/
    └── create_documents_table.sql     # Database schema
```

### Frontend
```
reviewpannel-frontend/
└── src/
    └── Pages/
        └── students/
            └── documentation.jsx      # Document management UI
```

## Document Categories
- **Reports**: PDF, Word documents
- **Presentations**: PowerPoint, slides
- **Code/Repository**: Source code, links
- **Videos/Demos**: Video files, demonstrations

## Supported File Types
- Documents: PDF, DOC, DOCX, TXT
- Presentations: PPT, PPTX
- Spreadsheets: XLS, XLSX
- Images: JPG, PNG, GIF
- Videos: MP4, MPEG
- Archives: ZIP

## Security Features
- Student authentication required
- Group-based access control
- File type validation
- File size limits (50MB)
- S3 key extraction for secure deletion

## Database Schema
```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_url TEXT NOT NULL,
    category VARCHAR(50),
    description TEXT,
    uploaded_by INT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Testing
1. Login as a student with group assignment
2. Navigate to Documentation page
3. Click "Upload Document"
4. Select document type and file
5. Add description (optional)
6. Submit upload
7. Verify document appears in list
8. Test View, Download, and Delete actions

## Troubleshooting

### Upload Fails
- Check S3 credentials in `.env`
- Verify S3 bucket exists and has correct permissions
- Check file size (must be < 50MB)
- Verify student has group assignment

### Documents Not Displaying
- Check database table exists
- Verify student authentication token
- Check console for API errors
- Verify group_id is set for student

### S3 Connection Issues
- Verify AWS credentials
- Check bucket name matches `.env`
- Ensure bucket region is correct
- Verify bucket has public-read ACL enabled (or adjust ACL in s3Service.js)

## Future Enhancements
- [ ] Admin document approval workflow
- [ ] Bulk document upload
- [ ] Document versioning
- [ ] File preview for common formats
- [ ] Document sharing between groups
- [ ] Advanced search and filtering
- [ ] Document tags and metadata
