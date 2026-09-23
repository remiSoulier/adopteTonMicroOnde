"use client";

import { useId, useState } from "react";

export type Winner = { rank: string; name: string; dish: string; votes: string; color: string };

const defaultWinners: Winner[] = [
    { rank: "1", name: "Marion B.", dish: "gamelle vengeance parmentier", votes: "428", color: "#FFD84D" },
    { rank: "2", name: "Sofiane", dish: "pâtes en mode chat perché", votes: "311", color: "#C9F2E3" },
    { rank: "3", name: "Lucie & Tom", dish: "la soupe qu'on n'ose plus regarder", votes: "287", color: "#F7C9D9" },
    { rank: "4", name: "Karim", dish: "riz-ketchup, zéro remords", votes: "190", color: "#E8E0FA" },
];

export default function MicrowaveHero({
    winners = defaultWinners,
}: {
    winners?: Winner[];
}) {
    const [open, setOpen] = useState(false);
    const cavityId = useId();
    const toggle = () => setOpen((v) => !v);

    return (
        <div
            style={{
                position: "relative",
                width: 520,
                maxWidth: "100%",
                background: "#E8431A",
                border: "6px solid #111",
                borderRadius: 24,
                padding: 16,
                fontFamily: "var(--font-archivo), system-ui, sans-serif",
            }}
        >
            <div
                style={{
                    background: "#fff",
                    border: "5px solid #111",
                    borderRadius: 12,
                    textAlign: "center",
                    fontWeight: 900,
                    fontSize: 13,
                    letterSpacing: 1,
                    padding: "7px 0",
                    marginBottom: 14,
                    color: "#111",
                }}
            >
                MY DIGITAL MICRO-ONDES
            </div>

            <div className="flex flex-col sm:flex-row" style={{ gap: 14, alignItems: "stretch" }}>
                {/* porte / cavité */}
                <div
                    className="h-55 sm:h-65"
                    style={{ flex: 1, minWidth: 0, position: "relative", perspective: 3000, perspectiveOrigin: "20% 50%" }}
                >
                    <div
                        id={cavityId}
                        style={{
                            position: "absolute",
                            inset: 0,
                            border: "5px solid #111",
                            borderRadius: 18,
                            background: open ? "#FFF3B8" : "#2B2A24",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            gap: 7,
                            padding: 12,
                            transition: "background .4s ease",
                            transitionDelay: open ? "0.2s" : "0s",
                        }}
                    >
                        {winners.slice(0, 4).map((w) => (
                            <div
                                key={w.rank}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 9,
                                    background: "#fff",
                                    border: "3px solid #111",
                                    borderRadius: 10,
                                    padding: "6px 9px",
                                }}
                            >
                                <div
                                    style={{
                                        width: 28,
                                        height: 28,
                                        flexShrink: 0,
                                        border: "3px solid #111",
                                        borderRadius: "50%",
                                        background: w.color,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 900,
                                        fontSize: 13,
                                    }}
                                >
                                    {w.rank}
                                </div>
                                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontWeight: 900, fontSize: 12, color: "#111" }}>{w.name}</span>
                                    <span style={{ fontFamily: "var(--font-marker), cursive", fontSize: 11, color: "#4a463a" }}>
                                        {w.dish}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        flexShrink: 0,
                                        background: "#E8431A",
                                        color: "#fff",
                                        border: "3px solid #111",
                                        borderRadius: 999,
                                        padding: "3px 8px",
                                        fontWeight: 900,
                                        fontSize: 10,
                                    }}
                                >
                                    {w.votes}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div
                        className="mw-door"
                        style={{
                            position: "absolute",
                            inset: 0,
                            border: "5px solid #111",
                            borderRadius: 18,
                            background: "#C9F2E3",
                            transformOrigin: "left center",
                            transform: open ? "rotateY(-104deg)" : "rotateY(0deg)",
                            backfaceVisibility: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 28px",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                right: -3,
                                top: "50%",
                                width: 12,
                                height: 68,
                                marginTop: -34,
                                background: "#111",
                                borderRadius: 6,
                            }}
                        />
                    </div>
                </div>

                {/* panneau de commande */}
                <div
                    className="w-full sm:w-30"
                    style={{
                        flexShrink: 0,
                        background: "#E8E0FA",
                        border: "5px solid #111",
                        borderRadius: 14,
                        padding: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            background: "#111",
                            color: "#3DE0A0",
                            borderRadius: 8,
                            fontFamily: "var(--font-marker), cursive",
                            fontSize: 19,
                            letterSpacing: 1.5,
                            textAlign: "center",
                            padding: "4px 0",
                        }}
                    >
                        {open ? "00:00" : "10:00"}
                    </div>
                    <div style={{ width: 32, height: 32, flexShrink: 0, border: "3px solid #111", borderRadius: "50%", background: "#12C98C" }} />
                    <button
                        type="button"
                        onClick={toggle}
                        aria-label="Ouvrir la porte du micro-ondes"
                        aria-expanded={open}
                        aria-controls={cavityId}
                        style={{
                            width: 32,
                            height: 32,
                            flexShrink: 0,
                            border: "3px solid #111",
                            borderRadius: "50%",
                            background: "#F7C9D9",
                            cursor: "pointer",
                            padding: 0,
                            boxShadow: open ? "0 0 0 4px rgba(232,67,26,.35)" : "0 0 0 0 rgba(0,0,0,0)",
                            transition: "box-shadow .3s ease",
                        }}
                    />
                    <div style={{ width: 32, height: 32, flexShrink: 0, border: "3px solid #111", borderRadius: "50%", background: "#3DE0A0" }} />
                    <button
                        type="button"
                        onClick={toggle}
                        aria-expanded={open}
                        aria-controls={cavityId}
                        className="mw-primary-btn"
                        style={{
                            marginTop: "auto",
                            width: "100%",
                            border: "4px solid #111",
                            borderRadius: 10,
                            background: open ? "#111" : "#FFD84D",
                            color: open ? "#FAF0CD" : "#111",
                            fontFamily: "var(--font-archivo), sans-serif",
                            fontWeight: 900,
                            fontSize: 12,
                            letterSpacing: 1,
                            padding: "8px 0",
                            cursor: "pointer",
                        }}
                    >
                        {open ? "FERMER" : "OUVRIR"}
                    </button>
                </div>
            </div>

            {/* pieds */}
            <div style={{ position: "absolute", left: 0, right: 0, top: "100%", display: "flex", justifyContent: "space-between", padding: "0 40px" }}>
                <div style={{ width: 78, height: 16, background: "#111", borderRadius: "0 0 6px 6px" }} />
                <div style={{ width: 78, height: 16, background: "#111", borderRadius: "0 0 6px 6px" }} />
            </div>
        </div>
    );
}
