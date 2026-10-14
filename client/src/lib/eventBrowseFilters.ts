import { admissionFromFilterTag } from '../../../shared/admission';
import { isEventTypeFilterLabel } from '../../../shared/eventTypeTags';
import type { EventListing } from '../../../shared/multiDayEvents';

/** The same normalization on initial entry and browser Back/Forward. */
export function readEventTypeFilters(raw:string):string[]{
 return [...new Set(raw.split('|').map(value=>value.trim().toUpperCase()).filter(isEventTypeFilterLabel))];
}
/** Alternative values within admission/age groups are OR; independent groups
 * combine with AND, matching the existing admission multi-select behavior. */
export function matchesEventTypeFilters(event:EventListing,filters:string[]):boolean {
 const admissions=filters.map(admissionFromFilterTag).filter(value=>value!=null);
 if(admissions.length&&!admissions.some(value=>event.admission===value))return false;
 const ages=filters.filter(value=>value==='21+'||value==='ALL AGES');
 if(ages.length&&!ages.some(value=>event.ageRequirement===(value==='21+'?'21_PLUS':'ALL_AGES')))return false;
 if(filters.includes('PUBLIC')&&!event.isPublic)return false;
 if(filters.includes('HOUSE PARTY')&&!event.isHouseParty)return false;
 if(filters.includes('SEX POSITIVE')&&!event.isSexPositive)return false;
 if(filters.includes('NUDITY OK')&&!event.nudityOk)return false;
 return true;
}
