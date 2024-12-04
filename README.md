# Second Brain API

Second Brain API is a backend service for managing and querying a personal content repository. It supports user authentication, content management, and content querying using embeddings for personalized searches.

## Features

- **User Authentication**: Sign up, sign in, and secure access using JWT.
- **Content Management**: Add, view, delete, and tag content with associated links and metadata.
- **Embeddings and Search**: Leverages embeddings for advanced querying.
- **Shareable Links**: Create and manage shareable links for public content access.
- **Robust Validation**: Ensures input data integrity using Zod schema validation.

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Validation**: Zod
- **Embedding Queries**: Pinecone API


## API Endpoints

### User Authentication

#### Sign Up
- **Endpoint**: `POST /api/v1/signup`
- **Description**: Creates a new user.
- **Request Body**:
  ```json
  {
    "username": "<username>",
    "password": "<password>"
  }
  ```

#### Sign In
- **Endpoint**: `POST /api/v1/signin`
- **Description**: Authenticates a user and returns a JWT.
- **Request Body**:
  ```json
  {
    "username": "<username>",
    "password": "<password>"
  }
  ```

### Content Management

#### Add Content
- **Endpoint**: `POST /api/v1/content`
- **Middleware**: Requires authentication (`userMiddleware`).
- **Request Body**:
  ```json
  {
    "type": "<content_type>",
    "link": "<content_link>",
    "title": "<content_title>",
    "tags": ["<tag1>", "<tag2>"]
  }
  ```

#### Get Content
- **Endpoint**: `GET /api/v1/content`
- **Middleware**: Requires authentication (`userMiddleware`).
- **Description**: Retrieves all content for the authenticated user.

#### Delete Content
- **Endpoint**: `DELETE /api/v1/content`
- **Middleware**: Requires authentication (`userMiddleware`).
- **Request Body**:
  ```json
  {
    "contentId": "<content_id>"
  }
  ```

### Shareable Links

#### Create/Disable Link
- **Endpoint**: `POST /api/v1/brain/share`
- **Middleware**: Requires authentication (`userMiddleware`).
- **Request Body**:
  ```json
  {
    "status": true|false
  }
  ```
  
#### Access Shared Content
- **Endpoint**: `GET /api/v1/brain/:shareLink`
- **Middleware**: Requires authentication (`userMiddleware`).

### Query Embeddings

#### Ask a Question
- **Endpoint**: `POST /api/v1/brain/ask`
- **Middleware**: Requires authentication (`userMiddleware`).
- **Request Body**:
  ```json
  {
    "query": "<search_query>"
  }
  ```

## Development

### Requirements
- **Node.js**: v18+
- **MongoDB**: v5+

### Commands
- **Start the server**:
  ```bash
  npm start
  ```
- **Run in development mode**:
  ```bash
  npm run dev
  ```


