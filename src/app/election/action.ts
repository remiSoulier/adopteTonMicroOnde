"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";


export async function vote(photoId: string) {
    const supabase = createClient(await cookies());

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Connecte-toi pour voter.");
    }

    const { error } = await supabase.from("votes").insert({
        photo_id: photoId,
        voter_id: user.id,
    });

    if (error) {
        console.error("Erreur Supabase lors du vote:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
        });
        throw new Error("Impossible d'enregistrer le vote.");
    }

    revalidatePath("/election");
}