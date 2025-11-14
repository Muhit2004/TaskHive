# UML Diagrams for the Authentication Project

This file contains the visual UML diagrams for the project, generated using Mermaid syntax. To view them, open the command palette (`Ctrl+Shift+P`) and select **Markdown: Open Preview to the Side**.

## 1. Use Case Diagram

This diagram shows the interactions between the user (Actor) and the main features of the system.

```mermaid
graph TD
    A[User] --> B{Login/Register};
    A --> C{Manage Profile};
    A --> D{Create/Manage Groups};
    A --> E{Manage Tasks};
    A --> F{View Calendar};
    A --> G{Interact with AI Assistant};
    A --> H{Logout};

    subgraph "Task Management"
        E --> E1(Create Task);
        E --> E2(Update Task Status);
        E --> E3(Assign Task to Group Member);
        E --> E4(Delete Task);
    end

    subgraph "Group Management"
        D --> D1(Create Group);
        D --> D2(Invite Member);
        D --> D3(Assign Admin Role);
        D --> D4(View Group Tasks);
    end

    B --> I((Extend: Forgot Password));
    G --> J((Include: Get Task Suggestions));
```

## 2. Activity Diagrams

### User Authentication Flow

This diagram illustrates the step-by-step process for user login and registration.

```mermaid
graph TD
    start([Start]) --> check_auth{Is User Authenticated?};
    check_auth -- Yes --> show_dashboard[Display Dashboard];
    check_auth -- No --> show_login[Display Login/Register Page];
    show_login --> user_action{User Action};
    user_action -- Clicks Login --> provide_creds[Provide Credentials];
    provide_creds --> validate_creds{Validate Credentials};
    validate_creds -- Valid --> create_session[Create Session/Token];
    create_session --> show_dashboard;
    validate_creds -- Invalid --> show_error[Show Error Message];
    show_error --> provide_creds;
    user_action -- Clicks Register --> provide_details[Provide Registration Details];
    provide_details --> validate_details{Validate Details};
    validate_details -- Valid --> create_user[Create New User in DB];
    create_user --> create_session;
    validate_details -- Invalid --> show_reg_error[Show Registration Error];
    show_reg_error --> provide_details;
    show_dashboard --> stop([End]);
```

### AI Task Suggestion Flow

This diagram shows the logic for fetching AI-powered task suggestions, including caching and error handling.

```mermaid
graph TD
    start([Start]) --> user_typing[User types in task title];
    user_typing --> debounce{Debounce Input (300ms)};
    debounce --> check_cache{Check In-Memory Cache for Title};
    check_cache -- Found --> get_from_cache[Get Suggestions from Cache];
    get_from_cache --> display_suggestions[Display AI Suggestions];
    check_cache -- Not Found --> call_api[Call Gemini API];
    call_api --> api_response{API Response};
    api_response -- Success (200) --> parse_response[Parse Suggestions];
    parse_response --> store_in_cache[Store in Cache];
    store_in_cache --> display_suggestions;
    api_response -- Overloaded (503) --> retry_logic{Initiate Exponential Backoff};
    retry_logic --> wait_1s[Wait 1s];
    wait_1s --> call_api_again[Call API (Attempt 2)];
    call_api_again -- Still 503 --> wait_2s[Wait 2s];
    wait_2s --> call_api_final[Call API (Attempt 3)];
    call_api_final -- Failure --> show_error[Show Network Error to User];
    show_error --> stop([End]);
    display_suggestions --> stop;
```

## 3. Class Diagram

This diagram represents the main data models (classes) and their relationships.

```mermaid
classDiagram
    class User {
        +String name
        +String email
        +String password
        +String avatar
        +login()
        +register()
        +logout()
        +updateProfile()
    }

    class Group {
        +String name
        +User admin
        +User[] members
        +createGroup()
        +addMember(User)
        +removeMember(User)
    }

    class CalendarTask {
        +String title
        +String description
        +String status
        +Date dueDate
        +User assignedTo
        +createTask()
        +updateStatus(String)
        +assignTo(User)
    }

    class AI_Service {
        -String apiKey
        -Map cache
        +getTaskSuggestions(String title)
        +retryWithBackoff(Function apiCall)
    }

    User "1" -- "0..*" Group : "is admin of"
    User "1" -- "0..*" Group : "is member of"
    User "1" -- "0..*" CalendarTask : "is assigned"
    Group "1" -- "0..*" CalendarTask : "has"
    CalendarTask "1" -- "1" AI_Service : "uses"
```

## 4. Sequence Diagrams

### User Login Sequence

This diagram shows the sequence of interactions when a user logs in.

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant Database

    Client->>Server: POST /api/v1/login (email, password)
    Server->>Database: Find user by email
    Database-->>Server: User record (with hashed password)
    alt User Found
        Server->>Server: Compare provided password with hash
        alt Password Matches
            Server->>Server: Generate JWT Token
            Server-->>Client: 200 OK (token, user data)
        else Password Mismatch
            Server-->>Client: 401 Unauthorized (Invalid credentials)
        end
    else User Not Found
        Server-->>Client: 401 Unauthorized (Invalid credentials)
    end
```

### Create Group Task Sequence

This diagram illustrates the process of a user creating a new task within a group.

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant Database

    Client->>Server: POST /api/v1/calendar/task/new (authToken, {title, description, groupId})
    Server->>Server: Middleware: Verify authToken
    alt Token Valid
        Server->>Database: Find Group by groupId
        Database-->>Server: Group record
        Server->>Database: Create new CalendarTask record
        Database-->>Server: New Task record
        Server-->>Client: 201 Created (newTask)
    else Token Invalid
        Server-->>Client: 401 Unauthorized
    end
```
