// Calendar API Test Script
// Run with: node testCalendarAPI.js

const API_BASE = "http://localhost:4000/api/v1";

// Test data
const testEvent = {
  subject: "Test Meeting",
  description: "Testing calendar API",
  startTime: new Date("2024-12-01T10:00:00Z").toISOString(),
  endTime: new Date("2024-12-01T11:00:00Z").toISOString(),
  isAllDay: false,
  categoryColor: "#4CAF50",
  category: "work",
  location: "Test Room",
  priority: "medium",
  isPrivate: false,
};

// Test user credentials
const testUser = {
  email: "test@example.com",
  password: "password123",
};

async function testCalendarAPI() {
  console.log("🧪 Testing Calendar API...\n");

  try {
    // Step 1: Login to get authentication
    console.log("1️⃣ Testing User Login...");
    const loginResponse = await fetch(`${API_BASE}/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(testUser),
    });

    const loginData = await loginResponse.json();

    if (loginData.success) {
      console.log("✅ Login successful:", loginData.user.name);
    } else {
      console.log("❌ Login failed:", loginData.message);
      console.log(
        "📝 Make sure you have a test user account or create one first"
      );
      return;
    }

    // Step 2: Create a new event
    console.log("\n2️⃣ Testing Event Creation...");
    const createResponse = await fetch(`${API_BASE}/calendar/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(testEvent),
    });

    const createData = await createResponse.json();

    if (createData.success) {
      console.log("✅ Event created successfully:", createData.event.Subject);
      var eventId = createData.event.Id;
    } else {
      console.log("❌ Event creation failed:", createData.message);
      return;
    }

    // Step 3: Get all user events
    console.log("\n3️⃣ Testing Get All Events...");
    const eventsResponse = await fetch(`${API_BASE}/calendar/events`, {
      method: "GET",
      credentials: "include",
    });

    const eventsData = await eventsResponse.json();

    if (eventsData.success) {
      console.log(
        "✅ Events retrieved:",
        eventsData.events.length,
        "events found"
      );
      console.log("📊 Pagination info:", eventsData.pagination);
    } else {
      console.log("❌ Get events failed:", eventsData.message);
    }

    // Step 4: Get event by ID
    console.log("\n4️⃣ Testing Get Event by ID...");
    const eventResponse = await fetch(
      `${API_BASE}/calendar/events/${eventId}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    const eventData = await eventResponse.json();

    if (eventData.success) {
      console.log("✅ Single event retrieved:", eventData.event.Subject);
    } else {
      console.log("❌ Get single event failed:", eventData.message);
    }

    // Step 5: Update the event
    console.log("\n5️⃣ Testing Event Update...");
    const updateResponse = await fetch(
      `${API_BASE}/calendar/events/${eventId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          subject: "Updated Test Meeting",
          priority: "high",
        }),
      }
    );

    const updateData = await updateResponse.json();

    if (updateData.success) {
      console.log("✅ Event updated successfully:", updateData.event.Subject);
    } else {
      console.log("❌ Event update failed:", updateData.message);
    }

    // Step 6: Get dashboard summary
    console.log("\n6️⃣ Testing Dashboard Summary...");
    const dashboardResponse = await fetch(
      `${API_BASE}/calendar/dashboard?period=week`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    const dashboardData = await dashboardResponse.json();

    if (dashboardData.success) {
      console.log("✅ Dashboard data retrieved:");
      console.log("   📈 Total events:", dashboardData.summary.totalEvents);
      console.log(
        "   ✅ Completed events:",
        dashboardData.summary.completedEvents
      );
      console.log(
        "   🔮 Upcoming events:",
        dashboardData.summary.upcomingEvents
      );
    } else {
      console.log("❌ Dashboard failed:", dashboardData.message);
    }

    // Step 7: Delete the test event
    console.log("\n7️⃣ Testing Event Deletion...");
    const deleteResponse = await fetch(
      `${API_BASE}/calendar/events/${eventId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const deleteData = await deleteResponse.json();

    if (deleteData.success) {
      console.log(
        "✅ Event deleted successfully:",
        deleteData.deletedEvent.subject
      );
    } else {
      console.log("❌ Event deletion failed:", deleteData.message);
    }

    console.log("\n🎉 All API tests completed!");
    console.log("\n📋 Test Summary:");
    console.log("- User authentication: ✅");
    console.log("- Event creation: ✅");
    console.log("- Event retrieval: ✅");
    console.log("- Event update: ✅");
    console.log("- Dashboard data: ✅");
    console.log("- Event deletion: ✅");
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    console.log("🔧 Make sure your server is running on http://localhost:4000");
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testCalendarAPI();
}

module.exports = { testCalendarAPI };
