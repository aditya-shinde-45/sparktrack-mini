# Document Upload Feature - Setup Checklist

## ✅ Completed Tasks

### Backend Implementation
- [x] Created `documentModel.js` for database operations
- [x] Created `s3Service.js` for AWS S3 integration
- [x] Created `documentController.js` with CRUD operations
- [x] Created `documentRoutes.js` with authentication
- [x] Registered routes in `server.js`
- [x] Installed `aws-sdk` package
- [x] Configured S3 bucket name: `mit-adt-student-documents`

### Frontend Implementation
- [x] Updated Documentation page with upload modal
- [x] Added document type dropdown
- [x] Implemented file upload form
- [x] Connected to backend APIs
- [x] Added View/Download/Delete functionality
- [x] Updated document display for database schema

### Database
- [x] Created SQL migration file
- [ ] **ACTION NEEDED**: Run migration in Supabase

### Configuration
- [x] AWS S3 credentials configured
- [x] Bucket name set to `mit-adt-student-documents`

## 📋 Next Steps

### 1. Run Database Migration
```sql
-- Go to Supabase SQL Editor and run:
-- File: reviewpanel-backend/migrations/create_documents_table.sql
```

### 2. Verify S3 Bucket Settings
- Bucket: `mit-adt-student-documents`
- Region: `ap-south-1`
- Permissions: Ensure bucket allows uploads and public-read access

### 3. Test the Feature
```bash
# Terminal 1 - Backend
cd reviewpanel-backend
npm run dev

# Terminal 2 - Frontend
cd reviewpannel-frontend
npm run dev
```

### 4. Access & Test
1. Navigate to: `http://localhost:5173/documentation`
2. Login as a student (must have group_id assigned)
3. Click "Upload Document"
4. Select document type from dropdown
5. Choose a file
6. Add description (optional)
7. Submit upload
8. Verify document appears in list
9. Test View, Download, Delete buttons

## 🔧 API Endpoints Available

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/student/documents/upload` | Upload new document |
| GET | `/api/student/documents` | Get all documents for group |
| GET | `/api/student/documents/:id` | Get specific document |
| DELETE | `/api/student/documents/:id` | Delete document |

## 📁 Files Created/Modified

### Created Files:
- `reviewpanel-backend/src/models/documentModel.js`
- `reviewpanel-backend/src/services/s3Service.js`
- `reviewpanel-backend/src/controllers/students/documentController.js`
- `reviewpanel-backend/src/routes/students/documentRoutes.js`
- `reviewpanel-backend/migrations/create_documents_table.sql`
- `DOCUMENT_UPLOAD_FEATURE.md`
- `SETUP_CHECKLIST.md` (this file)

### Modified Files:
- `reviewpanel-backend/server.js` (added document routes)
- `reviewpannel-frontend/src/Pages/students/documentation.jsx` (complete rewrite)
- `reviewpannel-frontend/src/Components/Student/sidebar.jsx` (unlocked documentation)

## 🎯 Features Implemented

✅ **Upload Management**
- Document type selection (Reports, Presentations, Code, Videos)
- File upload to AWS S3
- Optional description field
- File type validation
- 50MB size limit

✅ **Document Display**
- Category filtering
- Search functionality
- Document cards with metadata
- Status badges (pending/approved/rejected)

✅ **Actions**
- View document (opens in new tab)
- Download document
- Delete document (with confirmation)

✅ **Security**
- Student authentication required
- Group-based access control
- Secure S3 file storage

## ⚠️ Important Notes

1. **Student Group Requirement**: Students must be assigned to a group (`group_id`) to upload documents
2. **S3 Bucket**: Ensure the bucket `mit-adt-student-documents` exists and has proper permissions
3. **Database Table**: Must run the SQL migration before using the feature
4. **File Storage**: Files are stored permanently in S3 until manually deleted

## 🐛 Troubleshooting

**Upload fails:**
- Check S3 credentials in .env
- Verify bucket permissions
- Check file size < 50MB
- Ensure student has group_id

**Documents not showing:**
- Verify database table exists
- Check student authentication
- Confirm group_id is set

**S3 errors:**
- Verify AWS credentials
- Check bucket name and region
- Ensure bucket ACL allows public-read

## 📚 Documentation

For detailed documentation, see:
- `DOCUMENT_UPLOAD_FEATURE.md` - Complete feature documentation
- `reviewpanel-backend/migrations/create_documents_table.sql` - Database schema
