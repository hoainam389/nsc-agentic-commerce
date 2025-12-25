export const NEXT_PUBLIC_NSC_API_BASE_URL = process.env.NEXT_PUBLIC_NSC_API_BASE_URL;

export async function getAuthorizeUrl() {
  const response = await fetch(`${NEXT_PUBLIC_NSC_API_BASE_URL}/oauth/authorizeUrl?provider=Google`);
  if (!response.ok) {
    throw new Error(`Failed to fetch authorize URL: ${response.statusText}`);
  }
  return await response.json();
}

