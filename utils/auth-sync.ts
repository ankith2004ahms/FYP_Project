import { auth } from '@clerk/nextjs/server';

interface ClerkUser {
  id: string;
  emailAddresses: Array<{
    emailAddress: string;
  }>;
  firstName?: string;
  lastName?: string;
  username?: string;
  imageUrl?: string;
}

export async function getCurrentUser() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkId: userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync user');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error syncing user:', error);
    return null;
  }
}

export async function syncUserWithDatabase(clerkUser: ClerkUser) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        username: clerkUser.username,
        profileImageUrl: clerkUser.imageUrl,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync user');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error syncing user with database:', error);
    throw error;
  }
}
