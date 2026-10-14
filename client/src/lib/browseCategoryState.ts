/** Public browse query categories: valid unique values, with legacy aliases retained. */
export function readBrowseCategories(params:URLSearchParams, key:string, valid:(value:string)=>boolean, alias?:string):string[] {
 const raw=params.get(key) ?? (alias ? params.get(alias) : null) ?? '';
 return [...new Set(raw.split(',').map(value=>value.trim()).filter(valid))];
}
