import { unstable_cache } from "next/cache";

interface MinecraftProfile {
  id: string;
  name: string;
  properties?: Array<{ name: string; value: string }>;
}

async function fetchMojangSkinUrl(identifier: string): Promise<string | null> {
  try {
    let uuid = identifier;
    
    // If it's not a UUID, resolve username to UUID first
    if (!/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(identifier)) {
      const res = await fetch(
        `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(identifier)}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      uuid = data.id;
    }

    // Strip hyphens for session server
    const cleanUuid = uuid.replace(/-/g, "");

    const profileRes = await fetch(
      `https://sessionserver.mojang.com/session/minecraft/profile/${cleanUuid}`
    );
    if (!profileRes.ok) return null;
    
    const profile: MinecraftProfile = await profileRes.json();
    const textureProp = profile.properties?.find((p) => p.name === "textures");
    if (!textureProp) return null;

    const decoded = JSON.parse(
      Buffer.from(textureProp.value, "base64").toString("utf-8")
    );
    return decoded.textures?.SKIN?.url || null;
  } catch (error) {
    console.error(`[mojang] Failed to fetch skin for ${identifier}:`, error);
    return null;
  }
}

/**
 * Fetches the raw Mojang skin URL for a given username.
 * Cached for 1 hour to prevent rate limiting from Mojang API.
 */
export const getMojangSkinUrl = unstable_cache(
  fetchMojangSkinUrl,
  ["mojang-skin"],
  { revalidate: 3600 }
);
