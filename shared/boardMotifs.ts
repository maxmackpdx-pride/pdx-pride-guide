/** Serializable, board-scoped motif choices shared by composers and cards. */
export type BoardMotifCategory = "housing" | "gigz" | "giftz" | "sellz" | "mizzed";
export type BoardMotifOption = { id: string; label: string; main: string; support: string };
export const boardMotifOptions: Record<BoardMotifCategory, readonly BoardMotifOption[]> = {
  housing: [
    { id: "default", label: "Automatic", main: "boardStJohns", support: "boardMountHood" },
    { id: "st-johns-bridge", label: "St. Johns Bridge", main: "boardStJohns", support: "boardMountHood" },
    { id: "mount-hood", label: "Mount Hood", main: "boardMountHood", support: "boardStJohns" },
    { id: "portland-sign", label: "Portland sign", main: "boardPortlandSign", support: "boardSteelBridge" },
    { id: "steel-bridge", label: "Steel Bridge", main: "boardSteelBridge", support: "boardMountHood" },
    { id: "pioneer-courthouse", label: "Pioneer Courthouse", main: "boardCourthouse", support: "boardStJohns" },
    { id: "pet", label: "Pet", main: "boardPet", support: "keysHome" },
  ],
  gigz: [
    { id: "default", label: "Automatic", main: "webConsole", support: "designPlanes" },
    { id: "dj", label: "DJ", main: "boardTurntable", support: "soundRoom" },
    { id: "photographer", label: "Photographer", main: "boardCamera", support: "designPlanes" },
    { id: "coat-check", label: "Coat check", main: "boardCoatCheck", support: "garment" },
    { id: "bartender", label: "Bartender", main: "ringCocktail", support: "wineRoom" },
    { id: "designer", label: "Designer", main: "designPlanes", support: "webConsole" },
  ],
  giftz: [
    { id: "default", label: "Gift", main: "boardParcel", support: "plantHouse" },
    { id: "plants", label: "Plants", main: "plantHouse", support: "boardParcel" },
    { id: "books", label: "Books", main: "books", support: "boardParcel" },
    { id: "clothing", label: "Clothing", main: "garment", support: "boardParcel" },
    { id: "kitchenware", label: "Kitchenware", main: "coffeeMix", support: "boardParcel" },
    { id: "music", label: "Music gear", main: "soundRoom", support: "boardParcel" },
  ],
  sellz: [
    { id: "default", label: "Automatic", main: "lounge", support: "boardTag" },
    { id: "electronics", label: "Electronics", main: "webConsole", support: "boardTag" },
    { id: "clothing", label: "Clothing", main: "garment", support: "boardTag" },
    { id: "books", label: "Books", main: "books", support: "boardTag" },
    { id: "camera", label: "Camera gear", main: "boardCamera", support: "boardTag" },
    { id: "music", label: "Music gear", main: "soundRoom", support: "boardTag" },
  ],
  mizzed: [{ id: "default", label: "Speech bubbles", main: "boardMessages", support: "boardMessages" }],
};

export function resolveBoardMotif(category: BoardMotifCategory, choice?: string | null, subject = ""): BoardMotifOption {
  const options = boardMotifOptions[category];
  const selected = options.find(option => option.id === choice);
  if (selected && selected.id !== "default") return selected;
  const fallback = options[0];
  if (category === "gigz" && /dj|music|sound|perform/i.test(subject)) return { ...fallback, main: "karaoke", support: "soundRoom" };
  if (category === "sellz" && /cloth|shirt|jacket|wear/i.test(subject)) return { ...fallback, main: "garment" };
  return fallback;
}

export type HousingMotifType = "LOOKING" | "OFFERING" | "FORMING" | "MANAGED";
export function hasHousingPets(tags: readonly string[] = [], household: readonly { kind: string }[] = []): boolean {
  return tags.some(tag => tag === "existing-dog" || tag === "existing-cat") || household.some(member => member.kind === "PET");
}
export function housingMotifOptions(type: HousingMotifType, hasPets: boolean): readonly BoardMotifOption[] {
  const automatic = { id: "default", label: "Automatic", main: type === "FORMING" ? "boardHouseBlueprint" : "keysHome", support: "keysHome" };
  if (type === "MANAGED" || type === "FORMING") return [automatic];
  const options = type === "LOOKING" ? boardMotifOptions.housing.filter(option => option.id !== "pet") : [automatic];
  return hasPets ? [...options, boardMotifOptions.housing.find(option => option.id === "pet")!] : options;
}
export function normalizeHousingMotif(type: HousingMotifType, choice: string | null | undefined, hasPets: boolean): string {
  return housingMotifOptions(type, hasPets).some(option => option.id === choice) ? choice! : "default";
}
export function resolveHousingMotif(type: HousingMotifType, choice: string | null | undefined, hasPets: boolean, postId = 0): BoardMotifOption {
  const options = housingMotifOptions(type, hasPets);
  const id = normalizeHousingMotif(type, choice, hasPets);
  if (type === "LOOKING" && id === "default") return options[1 + (Math.abs(postId) % 5)];
  return options.find(option => option.id === id)!;
}
