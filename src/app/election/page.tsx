import ElectionGallery from "./ElectionGallery";
import VoteCountdown from "./VoteCountdown";
import { getElectionData } from "./data";
export default async function ElectionPage() {
    const { data, error } = await getElectionData();
    if (error) {
        if (error.kind === "vote-status")
            return <p>{error.message}</p>;
        if (error.kind === "votes")
            return <p role="alert">{error.message}</p>;
        return (<main className="min-h-screen bg-orange-50 px-6 py-20">
        <p role="alert" className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          {error.message}
        </p>
      </main>);
    }
    const { period, ...gallery } = data;
    const nextResetAt = period.nextReset.toISOString();
    return (<main className="min-h-screen bg-[#faf7f2] px-5 py-12 text-stone-900 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <VoteCountdown key={nextResetAt} nextResetAt={nextResetAt}/>
        <ElectionGallery {...gallery} publicationStart={period.start} publicationEnd={period.end}/>
      </div>
    </main>);
}
