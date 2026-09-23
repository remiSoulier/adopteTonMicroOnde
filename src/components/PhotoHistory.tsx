export type HistoryEntry = {
    id: string;
    url: string;
    legende: string | null;
    created_at: string;
    election_day: string;
    votes_count: number;
    votes_closed: boolean;
    won: boolean;
};

const formatDay = (value: string) =>
    new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(new Date(value));

function statusLabel(entry: HistoryEntry) {
    if (!entry.votes_closed) return { label: "En attente du vote", className: "status-pending" };
    if (entry.won) return { label: "Gagnée", className: "status-won" };
    return { label: "Perdue", className: "status-lost" };
}

export default function PhotoHistory({ entries }: { entries: HistoryEntry[] }) {
    if (entries.length === 0) return null;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-baseline gap-3">
                <h2 className="note text-lg">Ton historique</h2>
            </div>
            <div className="flex flex-col gap-3">
                {entries.map((entry) => {
                    const status = statusLabel(entry);
                    return (
                        <div key={entry.id} className="history-row">
                            <div className="history-thumb">
                                <img src={entry.url} alt="" />
                            </div>
                            <div className="flex flex-1 flex-col gap-0.5">
                                <span className="font-bold">{entry.legende || "Sans légende"}</span>
                                <span className="text-sm opacity-70">
                                    {formatDay(entry.created_at)}
                                    {entry.votes_closed ? ` · ${entry.votes_count} vote${entry.votes_count > 1 ? "s" : ""}` : ""}
                                </span>
                            </div>
                            <span className={`status-badge ${status.className}`}>{status.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
