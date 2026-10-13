import type { CommunitySummary } from "@shared/community";
import { communityLogo } from "@shared/communityLogos";
import type { ResourceCategory, ResourceOrg } from "./resourcesData";

type ResourceRow = {org: ResourceOrg; category: ResourceCategory; community?: CommunitySummary};
const normalized = (value: string) => value.trim().toLocaleLowerCase();
/** Uses the same live directory records; private memberships never become public discovery cards. */
export function mergeCommunityResources(rows: ResourceRow[], communities: CommunitySummary[], category: ResourceCategory): ResourceRow[] {
  const merged = rows.map(row => ({...row}));
  for (const community of communities) {
    if (community.visibility === "private") continue;
    const existing = merged.find(row => (!row.community || row.community.id === community.id) && [row.org.name, ...(row.org.aliases || [])].some(name => normalized(name) === normalized(community.name)));
    if (existing) {
      existing.community = community;
      existing.org = {...existing.org, categoryIds: [...new Set([...(existing.org.categoryIds || []), category.id])]};
    } else {
      merged.push({community, category, org: {name: community.name, desc: community.description, scope: community.neighborhood || "Local community", sub: `${community.memberCount} ${community.memberCount === 1 ? "member" : "members"}`, logo: communityLogo(community) || undefined, url: `/z/${community.slug}`, cta: "Explore community"}});
    }
  }
  return merged;
}
