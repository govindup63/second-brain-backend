This file details the API endpoints for the second brain application.

**Authentication**

*   **`POST /api/v1/signup`**
    *   **Description:** Registers a new user.
    *   **Request Body:**
        ```json
        {
          "username": "string",
          "password": "string"
        }
        ```
    *   **Response:**
        ```json
        {
          "message": "you are signed in as a user"
        }
        ```

*   **`POST /api/v1/signin`**
    *   **Description:** Logs in an existing user.
    *   **Request Body:**
        ```json
        {
          "username": "string",
          "password": "string"
        }
        ```
    *   **Response:**
        ```json
        {
          "token": "string"
        }
        ```

**Content Management**

*   **`POST /api/v1/content`**
    *   **Description:** Adds a new piece of content. Requires authentication.
    *   **Request Body:**
        ```json
        {
          "type": "string", // e.g., "link", "note"
          "link": "string", // URL for the content
          "title": "string",
          "tags": ["string"]
        }
        ```
    *   **Response:**
        ```json
        {
          "message": "your content is added succesfully"
        }
        ```

*   **`GET /api/v1/content`**
    *   **Description:** Retrieves all content for the authenticated user. Requires authentication.
    *   **Response:**
        ```json
        {
          "content": [
            {
              "_id": "string",
              "title": "string",
              "type": "string",
              "link": "string",
              "tags": ["string"],
              "userId": {
                "_id": "string",
                "username": "string"
              }
            }
          ]
        }
        ```

*   **`DELETE /api/v1/content`**
    *   **Description:** Deletes a specific piece of content. Requires authentication.
    *   **Request Body:**
        ```json
        {
          "contentId": "string"
        }
        ```
    *   **Response:**
        ```json
        {
          "message": "content with content id: <contentId> deleted",
          "status": {
            "acknowledged": true,
            "deletedCount": 1
          }
        }
        ```

**Brain Sharing and Querying**

*   **`POST /api/v1/brain/share`**
    *   **Description:** Creates or disables a shareable link to the user's brain. Requires authentication.
    *   **Request Body:**
        ```json
        {
          "status": boolean
        }
        ```
    *   **Response (creation):**
        ```json
        {
          "message": "Link Created successfully",
          "hash": "string"
        }
        ```
    *   **Response (disabling):**
        ```json
        {
          "message": "all links to your brain is disabled",
          "status": {
            "acknowledged": true,
            "deletedCount": 1
          }
        }
        ```

*   **`GET /api/v1/brain/:shareLink`**
    *   **Description:** Accesses a shared brain using a share link.
    *   **Response:**
        ```json
        {
          "content": [
            // ... (same as GET /api/v1/content)
          ]
        }
        ```

*   **`POST /api/v1/brain/ask`**
    *   **Description:** Asks a question to your brain, which returns the most relevant content. Requires authentication.
    *   **Request Body:**
        ```json
        {
          "query": "string"
        }
        ```
    *   **Response:**
        ```json
        {
          "topResults": [
            // ... (array of relevant content)
          ]
        }
        ```
