import { NextResponse } from "next/server";
import { getToken, verifyToken } from "../../../../utils/token";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = global._mongoClientPromise;
}

async function getDatabase() {
  const client = await clientPromise;
  return client.db("team_manager_db");
}

export async function POST(req: Request) {
  try {
    const token = getToken(req); // Extract token from cookies

    if (!token) {
      return NextResponse.json({
        success: false,
        message: "No token provided",
      });
    }

    // Verify the token using the verifyToken function
    const decodedUser = verifyToken(token);

    if (!decodedUser) {
      return NextResponse.json({ success: false, message: "Invalid token" });
    }

    // Fetch user data from MongoDB to get the latest profilePic
    const db = await getDatabase();
    const collection = db.collection("register_user");
    const user = await collection.findOne({ email: decodedUser.email });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" });
    }

    return NextResponse.json({
      success: true,
      message: "Token valid",
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePic: user.profilePic, // Ensure consistency across APIs
        contact: user.contact,
      },
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    return NextResponse.json({
      success: false,
      message: "Error verifying token",
    });
  }
}
