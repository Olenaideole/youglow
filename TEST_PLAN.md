**Test Plan: GlowBot Enhanced Functionality (Backend API)**

**Objective**: To ensure GlowBot correctly interacts with the `/api/glowbot-chat` backend route, which then utilizes skin analysis data, handles missing data, and that client-side correctly displays responses and error messages from the backend.

**Prerequisites**:
1.  The application is running locally or on a test environment (both frontend and backend).
2.  Developer console is accessible in the browser (for client-side checks).
3.  Server logs are accessible (for backend checks).
4.  Access to `localStorage` modification (e.g., via browser developer tools).
5.  A valid `XAI_API_KEY` is intended to be set in the server's environment for most tests (except Scenario 1).

**Test Scenarios**:

**Scenario 1: Server-Side API Key Not Configured**
1.  **Setup**:
    *   Temporarily unset or incorrectly set the `XAI_API_KEY` environment variable on the *server* environment.
    *   Rebuild/restart the application (especially the backend server).
2.  **Action**:
    *   Navigate to the dashboard page where GlowBot is located.
    *   Type a message in GlowBot (e.g., "Hello") and send it.
3.  **Expected Results**:
    *   The GlowBot UI (input field, send button) remains active and usable.
    *   The user's message appears in the chat.
    *   The `isTyping` indicator shows.
    *   A `POST` request is made to `/api/glowbot-chat`.
    *   The server console logs an error indicating the `XAI_API_KEY` is not configured.
    *   The `/api/glowbot-chat` route returns an error response to the client (e.g., status 500 with JSON `{"error": "AI service not configured on server..."}` or similar).
    *   GlowBot displays a user-friendly error message in the chat interface (e.g., "Sorry, I couldn't get a response. Please try again." or the specific error from the backend if it's user-friendly).
    *   The `isTyping` indicator hides correctly.

**Scenario 2: Chat Interaction - No Skin Analysis Data**
1.  **Setup**:
    *   Ensure `XAI_API_KEY` is correctly configured on the server.
    *   Clear any "skinReports" from `localStorage` (e.g., using browser dev tools: `localStorage.removeItem('skinReports')`).
2.  **Action**:
    *   Refresh the dashboard page.
    *   Type a skincare-related question (e.g., "What should I do for dry skin?") into GlowBot and send.
3.  **Expected Results**:
    *   The user's message appears in the chat.
    *   The `isTyping` indicator shows.
    *   A `POST` request is made to `/api/glowbot-chat`. The `latestSkinReport` field in the request body should be `null` or not present.
    *   The backend API `/api/glowbot-chat` processes this request. It should instruct the xAI API (or decide by itself) that no skin data is available.
    *   The backend returns a JSON response like `{"botMessage": "I don't have any skin analysis data for you yet..."}`.
    *   The bot's message politely informs the user that no skin analysis data is available and suggests uploading a photo.
    *   The `isTyping` indicator shows and hides correctly.

**Scenario 3: Chat Interaction - With Skin Analysis Data**
1.  **Setup**:
    *   Ensure `XAI_API_KEY` is correctly configured on the server.
    *   Manually add a mock skin report to `localStorage` under the key "skinReports". This report should be an array with at least one object matching the `SkinReport` interface structure.
        Example mock data (ensure this is stringified when adding to localStorage: `localStorage.setItem('skinReports', JSON.stringify(mockReportArray))`):
        ```json
        [
          {
            "date": "2023-10-26",
            "scores": { "acne": 2, "dryness": 7, "oiliness": 3, "redness": 2, "darkCircles": 4, "texture": 3 },
            "image": "mock_image_url.jpg",
            "overall_score": 78,
            "skin_type": "dry",
            "recommendations": {
              "skincare": ["Use a hydrating cleanser", "Apply hyaluronic acid serum", "Use a rich moisturizer"],
              "diet": ["Drink plenty of water", "Eat avocados and nuts"],
              "lifestyle": ["Avoid long hot showers"]
            }
          }
        ]
        ```
2.  **Action**:
    *   Refresh the dashboard page.
    *   Type a skincare-related question that could benefit from the analysis data (e.g., "What moisturizer is good for me?", "How can I improve my skin texture based on my report?").
3.  **Expected Results**:
    *   The user's message appears in the chat.
    *   The `isTyping` indicator shows.
    *   A `POST` request is made to the internal API route (`/api/glowbot-chat`).
        *   Verify in the browser's network tab that the request payload to `/api/glowbot-chat` is a JSON object containing the `userMessage` and the `latestSkinReport` (matching the mock data).
    *   The backend API `/api/glowbot-chat` receives this data, formats it, and makes a call to the xAI API.
    *   The backend returns a successful JSON response like `{"botMessage": "..."}`.
    *   The bot responds with advice that seems to consider the mock skin analysis data (e.g., mentions "dry skin" or specific recommendations from the mock report).
    *   The response is polite, informative, concise, supportive, and actionable, adhering to the system prompt used by the backend.
    *   The `isTyping` indicator hides correctly.

**Scenario 4: API Call Failure (Error from Backend Route)**
1.  **Setup**:
    *   Ensure `XAI_API_KEY` is (initially) correctly configured on the server.
    *   Have skin analysis data in `localStorage` (as per Scenario 3).
    *   Simulate an error from the `/api/glowbot-chat` route. This can be done by:
        *   Temporarily modifying `app/api/glowbot-chat/route.ts` to force an error response before the xAI call (e.g., `return NextResponse.json({ error: "Simulated backend logic error" }, { status: 500 });`).
        *   Or, to test xAI call failure specifically from backend: temporarily use an invalid xAI API key *on the server* within `route.ts` or an invalid xAI model name, so the `fetch` to xAI fails.
2.  **Action**:
    *   Refresh the dashboard page if backend code was changed.
    *   Type a question and send it.
3.  **Expected Results**:
    *   The user's message appears in the chat.
    *   The `isTyping` indicator shows.
    *   A `POST` request is made to `/api/glowbot-chat`.
    *   The `/api/glowbot-chat` route encounters an error (either simulated or from a failed xAI call) and returns a JSON error response (e.g., `{"error": "Failed to get response from AI service"}` or `"Simulated backend logic error"`).
    *   GlowBot displays a user-friendly error message in the chat interface based on the error received from the backend.
    *   The `isTyping` indicator hides correctly.

**Scenario 5: General Chat Flow and UI**
1.  **Action**:
    *   Send multiple messages (ensure some with skin data, some without, if not covered already).
    *   Observe the chat scrolling.
    *   Clear the chat using the "Trash" icon.
2.  **Expected Results**:
    *   Chat scrolls smoothly to the latest message.
    *   Clearing the chat removes all messages except the initial bot greeting and clears `localStorage` for chat history (`glowbotChatHistory`) and potentially the last user input (`glowbotInputValue`).

**Note on Prerequisites**: The prerequisite "A valid `NEXT_PUBLIC_XAI_API_KEY` is set in the environment" is no longer directly relevant for the client. The crucial part is the `XAI_API_KEY` on the server environment.
