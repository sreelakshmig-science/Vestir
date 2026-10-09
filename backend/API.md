# Vestir Backend API Documentation

## Base URL

```text
http://localhost:3000
```

For a physical mobile device, replace `localhost` with your computer's local IP address.

---

## Authentication

Vestir uses JWT authentication.

After a successful login, the backend returns a JWT token.

For protected endpoints, send the token using:

```text
Authorization: Bearer <JWT_TOKEN>
```

Protected endpoints:

* `GET /profile`
* `POST /favourites`
* `GET /favourites`
* `DELETE /favourites/:id`

---

# 1. User Authentication

## Signup

### Request

```text
POST /signup
```

### Body

```json
{
  "name": "Test User",
  "email": "user@example.com",
  "password": "Test@123"
}
```

### Success Response

```json
{
  "message": "User created successfully!"
}
```

### Duplicate Email

```json
{
  "message": "Email already exists!"
}
```

---

## Login

### Request

```text
POST /login
```

### Body

```json
{
  "email": "user@example.com",
  "password": "Test@123"
}
```

### Success Response

```json
{
  "message": "User logged in successfully!",
  "token": "<JWT_TOKEN>"
}
```

Store the returned token on the frontend and send it with protected requests.

---

## Get Profile

### Request

```text
GET /profile
```

### Authentication

Required.

```text
Authorization: Bearer <JWT_TOKEN>
```

### Success Response

```json
{
  "name": "Test User",
  "email": "user@example.com"
}
```

---

# 2. Dresses

## Get All Dresses

### Request

```text
GET /dresses
```

### Authentication

Not required.

### Success Response

```json
[
  {
    "_id": "dress_id",
    "name": "Black Evening Dress",
    "size": "L",
    "description": "Black dress for evening wear",
    "image": "https://res.cloudinary.com/..."
  }
]
```

---

## Get One Dress

### Request

```text
GET /dresses/:id
```

Example:

```text
GET /dresses/6ac536b084554510cf20e288
```

### Authentication

Not required.

### Success Response

```json
{
  "_id": "dress_id",
  "name": "Test Dress",
  "size": "M",
  "description": "Dress created for API testing",
  "image": "https://res.cloudinary.com/..."
}
```

### Dress Not Found

```json
{
  "message": "Dress not found!"
}
```

---

## Add Dress

### Request

```text
POST /dresses
```

### Authentication

Not required currently.

### Body

```json
{
  "name": "Test Dress",
  "size": "M",
  "description": "Dress created for API testing",
  "image": "https://res.cloudinary.com/..."
}
```

### Success Response

```json
{
  "message": "Dress added successfully!",
  "dress": {
    "_id": "dress_id",
    "name": "Test Dress",
    "size": "M",
    "description": "Dress created for API testing",
    "image": "https://res.cloudinary.com/..."
  }
}
```

---

## Update Dress

### Request

```text
PUT /dresses/:id
```

Example:

```text
PUT /dresses/6ac536b084554510cf20e288
```

### Authentication

Not required currently.

### Body

Send the fields that need to be updated.

Example:

```json
{
  "name": "Updated Dress",
  "size": "L",
  "description": "Updated description",
  "image": "https://res.cloudinary.com/..."
}
```

### Success Response

Returns the updated dress object.

---

## Delete Dress

### Request

```text
DELETE /dresses/:id
```

Example:

```text
DELETE /dresses/6ac536b084554510cf20e288
```

### Authentication

Not required currently.

### Success Response

```json
{
  "message": "Dress deleted successfully!"
}
```

---

## Image Upload

### Request

```text
POST /upload
```

Uploads an image to Cloudinary.

### Request Content-Type

```text
multipart/form-data
```

### Body

Send one form-data field:

| Key     | Type | Required |
| ------- | ---- | -------- |
| `image` | File | Yes      |

Maximum file size: **5 MB**.

The current middleware accepts files whose MIME type begins with `image/`.

### Success Response

Status: `200 OK`

```json
{
  "message": "Image uploaded successfully!",
  "image": "https://res.cloudinary.com/...",
  "public_id": "vestir/..."
}
```

* `image`: Secure URL of the uploaded image.
* `public_id`: Cloudinary identifier for the image.

### Error Responses

* `400 Bad Request`: No image supplied.
* `500 Internal Server Error`: Upload to Cloudinary failed.

Invalid file types and files larger than 5 MB may be rejected by Multer before the route handler runs.

### Usage Flow

1. Send the image using `POST /upload` as `multipart/form-data`, with the file field named `image`.
2. Copy the returned `image` URL.
3. Send that URL in the `image` field when creating or updating a dress.
4. MongoDB stores the URL, while Cloudinary stores the image.

---

# 3. Favourites

Favourites are associated with the currently authenticated user.

## Add Favourite

### Request

```text
POST /favourites
```

### Authentication

Required.

```text
Authorization: Bearer <JWT_TOKEN>
```

### Body

Send the MongoDB ID of the dress:

```json
{
  "dress": "dress_id"
}
```

Example:

```json
{
  "dress": "6ac536b084554510cf20e288"
}
```

### Success Response

```json
{
  "message": "Dress added to favourites!",
  "favourite": {
    "_id": "favourite_id",
    "user": "user_id",
    "dress": "dress_id"
  }
}
```

---

## Get My Favourites

### Request

```text
GET /favourites
```

### Authentication

Required.

```text
Authorization: Bearer <JWT_TOKEN>
```

### Success Response

```json
[
  {
    "_id": "favourite_id",
    "user": "user_id",
    "dress": {
      "_id": "dress_id",
      "name": "Test Dress",
      "size": "M",
      "description": "Dress created for API testing",
      "image": "https://res.cloudinary.com/..."
    }
  }
]
```

The `dress` field is populated with the complete dress information.

---

## Remove Favourite

### Request

```text
DELETE /favourites/:id
```

Example:

```text
DELETE /favourites/favourite_id
```

### Authentication

Required.

```text
Authorization: Bearer <JWT_TOKEN>
```

### Success Response

```json
{
  "message": "Favourite removed!"
}
```

---

# Frontend Integration Flow

## Login Flow

```text
POST /login
      ↓
Receive JWT token
      ↓
Store token
      ↓
Use token for protected requests
```

Example header:

```text
Authorization: Bearer <JWT_TOKEN>
```

## Dress and Image Flow

```text
POST /upload
      ↓
Receive Cloudinary image URL
      ↓
POST /dresses with the image URL
      ↓
GET /dresses
      ↓
Display dresses in Home screen
      ↓
Use dress._id when adding a favourite
```

## Favourite Flow

```text
POST /favourites
      ↓
GET /favourites
      ↓
Display user's favourites
      ↓
DELETE /favourites/:id
```

---

# Important Notes

### API Base URL

Do not hard-code `http://localhost:3000` throughout the frontend.

Use one central API base URL so it can be changed easily.

### Physical Android Device

If the frontend is running on a physical phone, `localhost` refers to the phone itself.

Use the computer's local network IP address instead, for example:

```text
http://192.168.1.10:3000
```

The phone and computer must be connected to the same network.

### Image Storage

Dress images are stored in Cloudinary. MongoDB stores the secure Cloudinary URL in the `image` field of each dress document.

Use `POST /upload` to upload an image and obtain its URL before creating or updating a dress.

Keep Cloudinary credentials in the backend `.env` file. Do not commit `.env` to GitHub.

### 3D Garment Generation (Hunyuan3D-2)

The backend provides a proxy to a local or remote Hunyuan3D-2 instance for generating 3D `.glb` meshes from 2D images.

#### 1. Check Server Status
```text
GET /api/hunyuan/status
```
**Response:**
```json
{
  "ok": true,
  "base": "http://127.0.0.1:8080"
}
```

#### 2. Generate 3D Garment GLB
```text
POST /api/hunyuan/generate
Content-Type: multipart/form-data
```
**Form Data:**
- `image`: Garment photo file (PNG / JPEG)

**Response:**
- Binary `model/gltf-binary` stream (`.glb` file).

