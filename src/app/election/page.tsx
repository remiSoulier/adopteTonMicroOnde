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
        return (<main className="page-main bg-grid-blue">
        <p role="alert" className="card card-pink page-container max-w-xl">
          {error.message}
        </p>
      </main>);
    }
    const { period, ...gallery } = data;
    const nextResetAt = period.nextReset.toISOString();
    return (<main className="page-main bg-grid-blue">
      <div className="page-container">
        <VoteCountdown key={nextResetAt} nextResetAt={nextResetAt}/>
        <ElectionGallery {...gallery} publicationStart={period.start} publicationEnd={period.end}/>
      </div>
    </main>);
}
