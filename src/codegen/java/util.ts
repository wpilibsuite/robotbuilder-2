import parsers from "prettier-plugin-java"
import prettier from "prettier";

/**
 * Removes punctuation from a string, replacing them with the given replacement string (defaults to a single space char)
 *
 * @param string the string to remove punctuation from
 * @param replacement the string to use to replace the punctuation character with
 *
 * @return the cleaned up string without punctuation
 */
export function removePunctuation(string: string, replacement: string = ' '): string {
  return string.replaceAll(/[^a-zA-Z0-9_]/ig, replacement);
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
  const lines = string.split("\n");

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
  if (/^(Get |get[A-Z])/.test(name)) {
    // Remove leading "Get" from fields if the input is the name of a getter method
    name = name.substring(3);
  }
  return camelCase(name);
}

export function objectName(name: string): string {
  if (name === null || name === undefined || name === '') {
    return '<unknown>';
  } else {
    return variableName(name);
  }
}

export function fieldDeclaration(type: string, name: string): string {
  return unindent(`
    @Logged(name = "${name}")
    private final ${ type } ${ objectName(name) }
  `).trim();
}

export function parameterDeclaration(type: string, name: string): string {
  return `final ${ type } ${ objectName(name) }`;
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

/**
 * Attempts to prettify the given generated Java code.
 * If the code is not valid Java, returns the original code, unmodified.
 * 
 * @param code the code to format
 * @returns the prettified code
 */
export function prettify(code: string): string {
  try {
    return prettier.format(
      code,
      {
        plugins: [parsers],
        parser: 'java',
        tabWidth: 2,
        printWidth: 100,
        useTabs: false,
      }
    );
  } catch (e) {
    // Couldn't prettify - return the unprettified contents
    // This can happen if the code is invalid Java and the parser barfs
    console.error('Encountered an error while prettifying generated code', e);
    return code;
  }
}

export function prettifySnippet(code: string): string {
  // Awkwardly, prettifying only works on fully defined classes or interfaces; it won't work on method snippets
  // So we wrap the snippet in a class declaration, prettify THAT, and then remove the declaration at the end
  const wrapperStart = 'interface $$$$ {\n'
  const wrapperEnd = '}';

  const prettified = prettify(unindent(
    `
    ${ wrapperStart } ${ code } ${ wrapperEnd }
    `
    ).trim()
  )

  if (prettified.startsWith(wrapperStart)) {
    return unindent(prettified.replace(wrapperStart, '').replace(/\}\n*$/, '')).trim();
  } else {
    return code;
  }
}
