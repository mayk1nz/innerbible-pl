// Prints the exact UBG18 text of one or more references:
//   node content-src/planes/verse.mjs "Jana 3,16" "Psalm 23,1-2"
import { official } from './verify-verses.mjs'

for (const ref of process.argv.slice(2)) {
  console.log(`${ref} → ${(await official(ref)) ?? 'NIE ZNALEZIONO (sprawdź nazwę księgi i format "Jana 3,16")'}`)
}
