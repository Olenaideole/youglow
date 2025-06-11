**Test Plan: GlowBot Enhanced Functionality**

**Objective**: To ensure GlowBot correctly integrates with the xAI API, utilizes skin analysis data, handles missing data, and provides appropriate error messages.

**Prerequisites**:
1.  The application is running locally or on a test environment.
2.  Developer console is accessible in the browser.
3.  Access to `localStorage` modification (e.g., via browser developer tools).
4.  A valid `NEXT_PUBLIC_XAI_API_KEY` is set in the environment.

**Test Scenarios**:

**Scenario 1: API Key Not Configured**
1.  **Setup**: Temporarily unset or incorrectly set the `NEXT_PUBLIC_XAI_API_KEY` environment variable. Rebuild/restart the application if necessary.
2.  **Action**: Navigate to the dashboard page where GlowBot is located.
3.  **Expected Results**:
    *   A warning message is logged to the developer console indicating the API key is missing.
    *   The chat input field is disabled.
    *   The placeholder text in the input field reads "GlowBot is currently unavailable." or similar.
    *   No messages can be sent.

**Scenario 2: Chat Interaction - No Skin Analysis Data**
1.  **Setup**:
    *   Ensure `NEXT_PUBLIC_XAI_API_KEY` is correctly configured.
    *   Clear any "skinReports" from `localStorage` (e.g., using browser dev tools: `localStorage.removeItem('skinReports')`).
2.  **Action**:
    *   Refresh the dashboard page.
    *   Type a skincare-related question (e.g., "What should I do for dry skin?") into GlowBot and send.
3.  **Expected Results**:
    *   The user's message appears in the chat.
    *   The bot responds with a message politely informing the user that no skin analysis data is available and suggests uploading a photo for analysis. (e.g., "I don't have your latest skin analysis. Please upload a photo in the Skin Reports section to get personalized advice!").
    *   No call to the xAI API should be made (verify in the network tab of dev tools if possible, or by the bot's specific response).
    *   The `isTyping` indicator shows and hides correctly.

**Scenario 3: Chat Interaction - With Skin Analysis Data**
1.  **Setup**:
    *   Ensure `NEXT_PUBLIC_XAI_API_KEY` is correctly configured.
    *   Manually add a mock skin report to `localStorage` under the key "skinReports". This report should be an array with at least one object matching the `SkinReport` interface structure.
        Example mock data (ensure this is stringified when adding to localStorage: `localStorage.setItem('skinReports', JSON.stringify(mockReportArray))`):
        ```json
        [
          {
            "date": "2023-10-26",
            "scores": { "acne": 2, "dryness": 7, "oiliness": 3, "redness": 2, "dark_circles": 4, "texture": 3 },
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
    *   A call to the xAI API (`https://api.x.ai/v1/chat/completions`) is made.
        *   Verify in the network tab that the request payload includes:
            *   The system prompt.
            *   A user message containing a summary of the skin analysis data from `localStorage`.
            *   The user's actual question.
    *   The bot responds with advice that seems to consider the mock skin analysis data (e.g., mentions "dry skin" or specific recommendations from the mock report).
    *   The response is polite, informative, concise, supportive, and actionable, adhering to the system prompt.
    *   The `isTyping` indicator hides correctly.

**Scenario 4: API Call Failure**
1.  **Setup**:
    *   Ensure `NEXT_PUBLIC_XAI_API_KEY` is correctly configured.
    *   Have skin analysis data in `localStorage` (as per Scenario 3).
    *   Simulate an API failure. This can be done by:
        *   Temporarily blocking the `https://api.x.ai` domain using browser dev tools or a firewall.
        *   Or, if possible, modifying the code to force an error in the `fetch` call for testing purposes (less ideal for a tester).
2.  **Action**:
    *   Refresh the dashboard page.
    *   Type a question and send it.
3.  **Expected Results**:
    *   The user's message appears in the chat.
    *   The `isTyping` indicator shows.
    *   After a short delay (API timeout or error), the bot responds with a user-friendly error message (e.g., "Sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment.").
    *   The `isTyping` indicator hides correctly.

**Scenario 5: General Chat Flow and UI**
1.  **Action**:
    *   Send multiple messages.
    *   Observe the chat scrolling.
    *   Clear the chat using the "Trash" icon.
2.  **Expected Results**:
    *   Chat scrolls smoothly to the latest message.
    *   Clearing the chat removes all messages except the initial bot greeting and clears `localStorage` for chat history (input value might persist based on current implementation, which is fine).
