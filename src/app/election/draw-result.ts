import type { ActionResult } from "./types";
const closingDate = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long", timeZone: "Europe/Paris",
});
export function formatDrawResult(result: unknown): ActionResult {
    if (!result || typeof result !== "object" || !("closing_day" in result) || typeof result.closing_day !== "string") {
        return { error: "Réponse du classement inattendue. Vérifie les attributions avant de réessayer." };
    }
    const response = result as {
        closing_day: string;
        status?: string;
        assigned_count?: number;
    };
    const date = closingDate.format(new Date(`${response.closing_day}T12:00:00Z`));
    switch (response.status) {
        case "cancelled":
            return { error: `L’élection clôturée le ${date} a été annulée. Aucune attribution ne sera effectuée.` };
        case "already_done":
            return { success: `Les attributions du ${date} ont déjà été enregistrées.` };
        case "no_devices":
            return { error: `Aucun micro-ondes actif disponible pour le ${date}.` };
        case "no_candidates":
            return { error: `Aucun participant avec des votes et sans attribution pour le ${date}.` };
        case "completed":
            return { success: `${response.assigned_count} attribution(s) enregistrée(s) pour le ${date}, selon le classement par votes.` };
        default:
            return { error: "Réponse du classement inattendue. Vérifie les attributions." };
    }
}
