export default function MicrowaveIllustration({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 520 420" role="img" aria-label="Un micro-ondes de la marque My Digital Micro-ondes" className={className}>
            {/* corps */}
            <rect x="14" y="30" width="492" height="340" rx="40" fill="var(--bg-orange-600)" stroke="var(--foreground)" strokeWidth="8" />

            {/* plaque de marque */}
            <rect x="44" y="48" width="300" height="28" rx="8" fill="#fff" stroke="var(--foreground)" strokeWidth="3" />
            <text x="194" y="68" textAnchor="middle" fontSize="12.5" fontWeight="800" letterSpacing="0.4" fill="var(--foreground)">
                MY DIGITAL MICRO-ONDES
            </text>

            {/* fenêtre */}
            <rect x="44" y="90" width="300" height="248" rx="22" fill="#CFF7EA" stroke="var(--foreground)" strokeWidth="7" />
            <path d="M84 190 q30 -26 60 0 t60 0 t60 0 t56 0" stroke="var(--foreground)" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M84 232 q30 -26 60 0 t60 0 t60 0 t56 0" stroke="var(--foreground)" strokeWidth="5" fill="none" strokeLinecap="round" />

            {/* panneau de contrôle */}
            <rect x="368" y="90" width="112" height="248" rx="18" fill="#ECE6FF" stroke="var(--foreground)" strokeWidth="7" />
            <rect x="380" y="104" width="88" height="44" rx="8" fill="var(--foreground)" />
            <text x="424" y="134" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="22" fontWeight="700" fill="var(--bg-turquoise)">
                10:00
            </text>
            <circle cx="424" cy="176" r="17" fill="var(--bg-turquoise)" stroke="var(--foreground)" strokeWidth="6" />
            <circle cx="424" cy="220" r="17" fill="var(--bg-pink)" stroke="var(--foreground)" strokeWidth="6" />
            <circle cx="424" cy="264" r="17" fill="var(--bg-green)" stroke="var(--foreground)" strokeWidth="6" />

            {/* pieds */}
            <rect x="100" y="368" width="70" height="20" rx="8" fill="var(--foreground)" />
            <rect x="350" y="368" width="70" height="20" rx="8" fill="var(--foreground)" />
        </svg>
    );
}
