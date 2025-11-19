const axios = require("axios");

const API_URL = "http://localhost:5000/api/rooms";

async function verifyPrivateRooms() {
    try {
        console.log("1. Creating a private room...");
        const createRes = await axios.post(API_URL, {
            name: "Secret Base",
            topic: "Top Secret",
            password: "supersecretpassword"
        });
        const room = createRes.data;
        console.log("   Room created:", room.roomId, "Is Private:", room.isPrivate);

        if (!room.isPrivate) throw new Error("Room should be private!");

        console.log("2. Trying to join without password...");
        try {
            await axios.post(`${API_URL}/${room.roomId}/join`, {});
            throw new Error("Should have failed!");
        } catch (err) {
            if (err.response && err.response.status === 401) {
                console.log("   Success: Access denied as expected.");
            } else {
                throw err;
            }
        }

        console.log("3. Trying to join with WRONG password...");
        try {
            await axios.post(`${API_URL}/${room.roomId}/join`, { password: "wrong" });
            throw new Error("Should have failed!");
        } catch (err) {
            if (err.response && err.response.status === 401) {
                console.log("   Success: Access denied as expected.");
            } else {
                throw err;
            }
        }

        console.log("4. Trying to join with CORRECT password...");
        const joinRes = await axios.post(`${API_URL}/${room.roomId}/join`, { password: "supersecretpassword" });
        if (joinRes.status === 200) {
            console.log("   Success: Access granted!");
        }

        console.log("\nVerification Complete: Private Rooms working correctly!");

    } catch (error) {
        console.error("Verification Failed:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

verifyPrivateRooms();
