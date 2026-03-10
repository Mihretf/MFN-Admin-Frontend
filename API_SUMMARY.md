# Church Admin Dashboard - API Integration Summary

## Base Configuration
- **API Base URL**: `http://localhost:4000`
- **Auth Header**: `Authorization: Bearer <jwt_token>`
- **Roles**: `super`, `regional_admin`, `user`

## Endpoints

### 1. Authentication & Invitations

#### Auth
- `POST /auth/login` - Login
  - Body: `{ email, password }`
  - Returns: `{ token }`

- `POST /auth/accept-invite` - Accept invitation and create account
  - Body: `{ token, email, password }`
  - Returns: `{ token }`

- `POST /auth/forgot-password` - Request password reset
  - Body: `{ email }`

- `POST /auth/reset-password` - Reset password
  - Body: `{ token, password }`

#### Invitations
- `POST /invite/send` (Super Admin only)
  - Body: `{ email, role: "regional_admin", region_id }`
  - Sends email + returns invite token/url

- `GET /invite/validate?token=...` - Validate invitation token
  - Frontend checks before showing accept page

### 2. Regions & Churches

#### Regions
- `POST /api/regions` (Super Admin only)
  - Body: `{ name }`
  - Creates a new region

- `GET /api/regions` (Authenticated)
  - Returns list of all regions

#### Churches
- `POST /api/churches` (Super Admin only)
  - Body: `{ name, region_id, location_link? }`
  - Adds church to a region

- `GET /api/churches?region_id=...` (Authenticated)
  - Returns churches in specified region (optional filter)

### 3. Media Upload (Cloudinary)

- `POST /api/upload/image` (Super/Regional Admin)
  - Content-Type: `multipart/form-data`
  - File field: `file`
  - Optional metadata fields: `title`, `type`, `description`, `region_id` (as query param)
  - Returns: `{ asset: { secure_url } }`

- `POST /api/upload/video` (Super/Regional Admin)
  - Content-Type: `multipart/form-data`
  - File field: any key name works
  - Returns: `{ asset: { secure_url } }`

### 4. Homepage Blogs (Super Admin Only)

- `POST /api/blogs`
  - Body: `{ text, image_url?, expires_in_days? }`
  - Creates homepage blog post

- `GET /api/blogs?search=&sort=newest|oldest&include_expired=false`
  - Public endpoint
  - Used for homepage blog section
  - Default: newest first, exclude expired

### 5. Regional Services/Posts

- `POST /api/posts` (Super/Regional Admin)
  - Body:
    ```json
    {
      "region_id": "string",
      "content": "string",
      "category": "special_program|mission|program_sunday",
      "title?": "string",
      "type?": "string",
      "image_url?": "string",
      "video_url?": "string",
      "location_link?": "string",
      "church_ids?": ["string"],
      "expires_in_days?": number
    }
    ```
  - Regional admin can only post in assigned region
  - Super admin can post anywhere

- `GET /api/posts?region_id=...&search=&category=&sort=newest|oldest&include_expired=false`
  - Requires authentication
  - Required param: `region_id`
  - Optional filters: search, category, sort, include_expired

### 6. Regional Gallery

- `POST /api/galleries` (Super/Regional Admin)
  - Body:
    ```json
    {
      "region_id": "string",
      "image_url": "string",
      "caption?": "string",
      "title?": "string",
      "type?": "string",
      "description?": "string",
      "church_id?": "string",
      "location_link?": "string",
      "expires_in_days?": number
    }
    ```

- `GET /api/galleries?region_id=...&search=&sort=newest|oldest&include_expired=false`
  - Separate gallery section for regional photos
  - Same filtering as posts

## Frontend Pages

### Super Admin Only
1. **Regions** (`/dashboard/regions`) - Create and manage regions
2. **Churches** (`/dashboard/churches`) - Add churches to regions
3. **Invitations** (`/dashboard/invitations`) - Invite regional admins
4. **Blogs** (`/dashboard/blogs`) - Homepage blog posts

### Both Roles
1. **Dashboard** (`/dashboard`) - Overview and quick actions
2. **Services/Posts** (`/dashboard/posts`) - Regional programs and services
3. **Gallery** (`/dashboard/gallery`) - Regional photo gallery

### Public/Auth Only
1. **Login** (`/login`)
2. **Register** (`/register?token=...`) - Accept invitation
3. **Forgot Password** (`/forgot-password`)
4. **Reset Password** (`/reset-password`)

## Permission Model

### Super Admin (`role: "super"`)
- Full access to all features
- Can create regions and churches
- Can invite regional admins
- Can post to any region
- Can create homepage blogs

### Regional Admin (`role: "regional_admin"`)
- Assigned to specific region (`region_id`)
- Can only post to assigned region
- Can manage regional gallery
- Cannot access region/church/invitation management
- Cannot create homepage blogs

## Notes
- All user data, roles, and permissions come from backend
- No hard-coded credentials in frontend
- Token stored in localStorage
- JWT token automatically attached to all authenticated requests
- Regional admins auto-restricted to their assigned region
