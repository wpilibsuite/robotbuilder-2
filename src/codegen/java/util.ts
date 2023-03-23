/**
 * Removes punctuation from a string, replacing them with the given replacement string (defaults to a single space char)
 *
 * @param string the string to remove punctuation from
 * @param replacement the string to use to replace the punctuation character with
 *
 * @return the cleaned up string without punctuation
 */
export function removePunctuation(string: string, replacement: string = ' '): string {
  return string.replaceAll(/[^a-zA-Z0-9]/ig, replacement);
}

/**
 * Converts a string in an arbitrary format to camelCase. All punctuation marks will be removed.
 *
 * @param string the string to convert
 * @param upper whether or not to convert to UpperCamelCase or to lowerCamelCase (defaults to false)
 *
 * @return the camelcased string
 */
export function camelCase(string: string, upper: boolean = false): string {
  if (!string) return null;

  string = removePunctuation(string);
  return string.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index === 0 && !upper ? match.toLowerCase() : match.toUpperCase();
  });
}

export function isBlank(string: string): boolean {
  return string.length === 0 || !!string.match(/^\s+$/);
}

export function codeBlock(block: string): string {
  return unindent(block).trimStart().trimEnd();
}

export function unindent(string: string): string {
  let lines = string.split("\n");

  if (lines.length === 0) {
    return "";
  }

  const indentationLevel = Math.min(...lines.map(line => isBlank(line) ? 999 : line.match(/(^\s*?)\S/)[1].length));
  const unindentedLines = lines.map(line => line.substring(indentationLevel, line.length));

  return unindentedLines.join("\n");
}

export function indent(string: string, indentation: number): string {
  const padding = " ".repeat(indentation);
  if (!string || string.length === 0) return padding;

  const lines = string.split("\n");
  return lines.map(line => isBlank(line) ? line : `${ padding }${ line }`).join("\n");
}

export function className(name: string): string {
  return camelCase(name, true);
}

export function methodName(name: string): string {
  return camelCase(name);
}

export function variableName(name: string): string {
  return camelCase(name);
}

export function fieldDeclaration(type: string, name: string): string {
  return `private final ${ type } ${ variableName(name) }`
}

export function parameterDeclaration(type: string, name: string): string {
  return `final ${ type } ${ variableName(name) }`;
}

export function constantDeclaration(type: string, name: string): string {
  return `public static final ${ type } ${ constantName(name) }`
}

export function constantName(name: string): string {
  return removePunctuation(name)
    .split(/ +/)
    .map(word => word.toUpperCase())
    .join("_");
}

type FullyQualifiedName = string;
type Type =
  "boolean" |
  "int" |
  "long" |
  "double" |
  FullyQualifiedName;

export function typeDeclaration(type: Type): string {
  return type;
}

export function importFor(type: Type): string | null {
  switch (type) {
    case "boolean":
    case "int":
    case "long":
    case "double":
      return null;
    default:
      return type; // FQN
  }
}

export function supplierFunctionType(type: Type): string {
  switch(type) {
    case "boolean":
      return "BooleanSupplier";
    case "int":
      return "IntSupplier";
    case "long":
      return "LongSupplier";
    case "double":
      return "DoubleSupplier";
    default:
      return `Supplier<${ type }>`; // NOTE: this is generic. Angle brackets and everything between them should be stripped when importing
  }
}

