This project is a "second brain" application. It allows users to store, manage, and retrieve information.

**Core Functionalities:**

*   **User Authentication:** Users can sign up and sign in to the application. Authentication is handled using JWT (JSON Web Tokens).
*   **Content Management:**
    *   Users can add content, which includes a title, a type (e.g., "link", "note"), a URL, and tags.
    *   Users can view all the content they have added.
    *   Users can delete their content.
*   **Information Retrieval (AI-Powered Search):**
    *   The application uses an embedding model (`multilingual-e5-large`) to understand the semantic meaning of the stored content.
    *   Users can "ask" their brain a question (a query). The system will find and return the most relevant pieces of content based on the query. This is likely done by comparing the query's embedding with the embeddings of the stored content.
*   **Sharing:**
    *   Users can generate a unique, shareable link to their "brain".
    *   Anyone with the link can view the user's content.
    *   Users can disable all active share links.

**Technical Stack:**

*   **Backend:** Node.js with Express.js
*   **Database:** MongoDB (with Mongoose for object modeling)
*   **Authentication:** JWT and bcrypt for password hashing
*   **Data Validation:** Zod for schema validation of API request bodies.
*   **AI/ML:** An embedding model (likely from a service like Hugging Face or a local model) is used for the "ask" feature. Pinecone is also used, which is a vector database for storing and querying embeddings.
*   **Language:** TypeScript
