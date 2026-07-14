import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 text-sm text-muted-foreground md:flex-row md:items-center">
        <div>
          <p className="font-display text-base font-bold text-foreground">YojanaMitra</p>
          <p className="mt-1 max-w-md">
            An independent tool to help Indian citizens discover Central & State
            government welfare schemes. Not affiliated with the Government of India.
          </p>
        </div>
        <div className="flex flex-wrap gap-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <Link to="/schemes" className="hover:text-foreground">Schemes</Link>
          <Link to="/questionnaire" className="hover:text-foreground">Check Eligibility</Link>
          <Link to="/about" className="hover:text-foreground">About</Link>
        </div>
      </div>
      <p className="pb-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} YojanaMitra · Scheme data is indicative — always verify on official portals.
      </p>
    </footer>
  );
}
