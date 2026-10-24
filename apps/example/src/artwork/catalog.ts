type Entry = {
  /** One line about the icon, under its title. */
  description: string
  title: string
}

/** What each icon is called on screen, and what it is. The names are the API's. */
export const CATALOG: Record<string, Entry> = {
  clover: {description: 'Material’s clover, on Android alone.', title: 'Clover'},
  default: {description: 'The sun coming up out of the water.', title: 'Sunrise'},
  glass: {description: 'Liquid Glass from Icon Composer, on iOS alone.', title: 'Glass'},
  midnight: {description: 'A crescent and a star on navy.', title: 'Midnight'},
  mint: {description: 'A sprout on mint.', title: 'Mint'},
  mono: {description: 'A switch, in black and white.', title: 'Mono'},
}

/** An icon's title, or its name for one the catalog does not know. */
export const titleOf = (name: string) => CATALOG[name]?.title ?? name
