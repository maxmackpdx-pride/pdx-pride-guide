import { Link } from "wouter";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ds";

export default function NotFound() {
  return (
    <div className="zine-page board-page">
      <PageHeader
        section="NOT FOUND"
        title="404"
        titleAccent="magenta"
        lede="This page is not on the Zaylist map. Head back to EVENTZ, GIFTZ, or GIGZ."
        actions={(
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/"><Button as="span" variant="solid">HOME</Button></Link>
            <Link href="/events"><Button as="span" accent="cyan">EVENTS</Button></Link>
          </div>
        )}
      />
    </div>
  );
}
