import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getVotePeriod } from "./vote-period";
import type { ElectionPhoto } from "./types";
type ElectionData = {
    photos: ElectionPhoto[];
    period: ReturnType<typeof getVotePeriod>;
    votedPhotoIds: Set<string>;
    isLoggedIn: boolean;
    hasVoted: boolean;
    canSimulate: boolean;
};
type ElectionResult = {
    data: ElectionData;
    error?: never;
} | {
    data?: never;
    error: {
        kind: "vote-status" | "votes" | "photos";
        message: string;
    };
};
export async function getElectionData(): Promise<ElectionResult> {
    const supabase = createClient(await cookies());
    const { data: { user } } = await supabase.auth.getUser();
    const { data: role } = user ? await supabase.rpc("get_my_role") : { data: null };
    // Photos come from the previous period; votes belong to the current one.
    const period = getVotePeriod();
    const votedPhotoIds = new Set<string>();
    if (user) {
        const { data: votes, error } = await supabase.from("votes")
            .select("photo_id")
            .eq("voter_id", user.id)
            .gte("created_at", period.end.toISOString())
            .lt("created_at", period.nextReset.toISOString());
        if (error) {
            console.error("Impossible de récupérer la photo votée:", error.message);
            return { error: { kind: "votes", message: "Impossible de récupérer ton vote. Réessaie plus tard." } };
        }
        votes?.forEach((vote) => votedPhotoIds.add(vote.photo_id));
    }
    const { data: photos, error } = await supabase.from("photos")
        .select("id, url, legende")
        .gte("created_at", period.start.toISOString())
        .lt("created_at", period.end.toISOString());
    if (error) {
        console.error(error.message);
        return { error: { kind: "photos", message: "Impossible de charger les photos. Réessaie un peu plus tard." } };
    }
    return { data: {
            photos: photos ?? [], period, votedPhotoIds,
            isLoggedIn: Boolean(user),
            canSimulate: role === 3,
            hasVoted: votedPhotoIds.size > 0,
        } };
}
