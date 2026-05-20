/**
 * ESLint rule: no-hardcoded-colors
 *
 * Prevents hardcoded Tailwind color utility classes (e.g. bg-red-500, text-blue-300)
 * and encourages the use of semantic CSS tokens (bg-primary, text-foreground, etc.).
 *
 * Allowed patterns:
 *   - Semantic shadcn tokens: bg-primary, text-muted, border-accent, etc.
 *   - Custom semantic tokens: bg-success-muted, text-danger-muted, etc.
 *   - CSS variable usage: bg-[var(--my-color)]
 *   - Opacity modifiers on semantic tokens: bg-primary/90, bg-secondary/50
 *
 * Flagged patterns:
 *   - bg-{named-color}-{shade}  (e.g. bg-green-500, text-red-700, border-gray-200)
 *   - Named colors: red, green, blue, yellow, orange, purple, pink, indigo,
 *     gray, slate, zinc, neutral, stone, amber, emerald, teal, cyan, violet,
 *     fuchsia, rose, lime, sky
 */

const NAMED_COLORS = [
  "red", "green", "blue", "yellow", "orange", "purple", "pink", "indigo",
  "gray", "slate", "zinc", "neutral", "stone", "amber", "emerald", "teal",
  "cyan", "violet", "fuchsia", "rose", "lime", "sky",
];

const SEMANTIC_TOKENS = new Set([
  "primary", "secondary", "muted", "accent", "destructive",
  "background", "card", "popover",
]);

const CUSTOM_SEMANTIC_TOKENS = new Set([
  "success-muted", "warning-muted", "danger-muted", "info-muted",
]);

const COLOR_PREFIXES = ["bg-", "text-", "border-"];

function isHardcodedColorClass(cls) {
  // Allow CSS variable usage
  if (cls.includes("var(--")) return false;

  for (const prefix of COLOR_PREFIXES) {
    if (!cls.startsWith(prefix)) continue;

    const rest = cls.slice(prefix.length);

    // Strip opacity modifier (e.g. "primary/90" -> "primary")
    const base = rest.split("/")[0];

    // Check custom semantic tokens first (multi-word)
    if (CUSTOM_SEMANTIC_TOKENS.has(base)) return false;

    // Check single-word semantic tokens
    if (SEMANTIC_TOKENS.has(base)) return false;

    // Check if it matches a named color with a numeric shade
    for (const color of NAMED_COLORS) {
      const regex = new RegExp(`^${color}-\\d{3}$`);
      if (regex.test(base)) return true;
    }
  }

  return false;
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow hardcoded Tailwind color classes; use semantic tokens instead",
      recommended: true,
    },
    schema: [],
    messages: {
      noHardcodedColors:
        "Hardcoded color class '{{class}}' detected. Use semantic tokens instead (e.g. bg-primary, text-foreground, bg-success-muted). See AGENTS.md for allowed patterns.",
    },
  },
  create(context) {
    function checkClassName(node, value) {
      if (!value || typeof value !== "string") return;

      const classes = value.split(/\s+/);
      for (const cls of classes) {
        if (isHardcodedColorClass(cls)) {
          context.report({
            node,
            messageId: "noHardcodedColors",
            data: { class: cls },
          });
        }
      }
    }

    return {
      // JSX className attribute: <div className="bg-red-500" />
      JSXAttribute(node) {
        if (node.name.name !== "className") return;
        const value = node.value;

        if (value?.type === "Literal" && typeof value.value === "string") {
          checkClassName(node, value.value);
        }

        // Handle template literals: className={`bg-red-500 ${foo}`}
        if (value?.type === "JSXExpressionContainer") {
          const expr = value.expression;
          if (expr?.type === "TemplateLiteral") {
            for (const quasi of expr.quasis) {
              checkClassName(node, quasi.value.raw);
            }
          }
          // Handle string concatenation: className="bg-red-500 " + foo
          if (expr?.type === "BinaryExpression") {
            // Traverse binary expression tree for string literals
            function traverseBinary(exp) {
              if (exp.left?.type === "Literal" && typeof exp.left.value === "string") {
                checkClassName(node, exp.left.value);
              }
              if (exp.right?.type === "Literal" && typeof exp.right.value === "string") {
                checkClassName(node, exp.right.value);
              }
              if (exp.left?.type === "BinaryExpression") traverseBinary(exp.left);
              if (exp.right?.type === "BinaryExpression") traverseBinary(exp.right);
            }
            traverseBinary(expr);
          }
        }
      },

      // className prop on components: <Component className="bg-red-500" />
      // (already covered by JSXAttribute above)
    };
  },
};
