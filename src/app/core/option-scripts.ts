/** A parsed random/extra-option entry: a single `{ attr: value }` bonus script. */
export type OptionScript = Record<string, number>;

/**
 * Parse the raw random-option / extra-option strings (`"attr:value"`) the UI
 * stores into bonus-script objects the engine understands. Empty / malformed
 * entries are dropped. Pure — no component state.
 */
export function parseOptionScripts(rawOptionTxts: string[]): OptionScript[] {
  return (rawOptionTxts || [])
    .map((a) => {
      if (typeof a !== 'string' || a === '') return '';

      const [, attr, value] = a.match(/(.+):(\d+)/) ?? [];
      if (attr) return { [attr]: Number(value) };

      return '';
    })
    .filter(Boolean) as OptionScript[];
}
